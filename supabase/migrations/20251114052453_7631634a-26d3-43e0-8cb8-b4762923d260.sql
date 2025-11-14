-- ============================================
-- CRITICAL FIX: Atomic Credit Deduction System
-- ============================================

-- 1. Add unique constraint on order_number to prevent duplicates at DB level
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_orders_order_number 
ON public.product_orders(order_number);

-- 2. Create atomic place_order function (replaces client-side order creation)
CREATE OR REPLACE FUNCTION public.place_order(
  p_product_category product_category,
  p_product_name text,
  p_package_name text,
  p_quantity numeric,
  p_price numeric,
  p_product_details jsonb,
  p_payment_method text DEFAULT 'credit'
)
RETURNS public.product_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile record;
  v_username text;
  v_order product_orders%rowtype;
  v_attempts int := 0;
  v_order_number text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock user profile and get balance
  SELECT p.id, p.username, p.email, p.balance
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check sufficient balance
  IF v_profile.balance < p_price THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits, but need % credits. Please top up your account.',
      v_profile.balance, p_price;
  END IF;

  -- Get username for order number
  v_username := COALESCE(v_profile.username, SPLIT_PART(v_profile.email, '@', 1), 'user');

  -- Generate unique order number with retry logic
  LOOP
    v_attempts := v_attempts + 1;
    v_order_number := LOWER(v_username) || '-' || SUBSTR(MD5(gen_random_uuid()::text), 1, 3);

    BEGIN
      -- Insert order with credits already deducted
      INSERT INTO public.product_orders (
        user_id, user_email, user_name, order_number,
        product_category, product_name, package_name,
        quantity, price, product_details, status, payment_method, credits_deducted
      )
      VALUES (
        v_user_id, v_profile.email, v_username, v_order_number,
        p_product_category, p_product_name, p_package_name,
        p_quantity, p_price, COALESCE(p_product_details, '{}'::jsonb), 
        'pending', COALESCE(p_payment_method, 'credit'), p_price
      )
      RETURNING * INTO v_order;

      -- Deduct balance AFTER successful order insert (atomic transaction)
      UPDATE public.profiles
      SET balance = balance - p_price
      WHERE id = v_user_id;

      -- Log activity
      INSERT INTO public.activity_logs (
        actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
      )
      VALUES (
        v_user_id, v_profile.email, 'order_created', 'Order Placed',
        FORMAT('Order %s placed. %s credits deducted.', v_order_number, p_price),
        'order', v_order.id,
        jsonb_build_object('order_number', v_order_number, 'price', p_price, 'product', p_product_name)
      );

      RETURN v_order;
      
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempts < 5 THEN
          CONTINUE;
        ELSE
          RAISE EXCEPTION 'Failed to create order after 5 attempts due to duplicate order number.';
        END IF;
    END;
  END LOOP;
END;
$$;

-- 3. Update confirm_order to avoid double-deduction
CREATE OR REPLACE FUNCTION public.confirm_order(order_id uuid, admin_remarks_text text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
  user_balance numeric;
  credits_to_deduct numeric := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm orders';
  END IF;
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Order is not pending (current status: %)', order_record.status;
  END IF;
  
  -- Check if credits already deducted (new model)
  IF order_record.credits_deducted >= order_record.price THEN
    credits_to_deduct := 0;
  ELSE
    -- Old model: deduct now (backward compatibility)
    credits_to_deduct := order_record.price;
    
    SELECT balance INTO user_balance
    FROM profiles
    WHERE id = order_record.user_id;
    
    IF user_balance < credits_to_deduct THEN
      RAISE EXCEPTION 'Insufficient balance. User has % credits, order requires %', user_balance, credits_to_deduct;
    END IF;
    
    UPDATE profiles
    SET balance = balance - credits_to_deduct
    WHERE id = order_record.user_id;
  END IF;
  
  -- Mark order as confirmed
  UPDATE product_orders
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    confirmed_at = NOW(),
    updated_at = NOW(),
    admin_remarks = admin_remarks_text,
    credits_deducted = order_record.price
  WHERE id = order_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_confirmed',
    'Order Confirmed',
    FORMAT('Order %s confirmed. %s credits deducted from user %s', 
           order_record.order_number, credits_to_deduct, order_record.user_email),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'credits_deducted', credits_to_deduct,
      'product', order_record.product_name
    )
  );
  
  SELECT balance INTO user_balance FROM profiles WHERE id = order_record.user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order confirmed',
    'order_number', order_record.order_number,
    'credits_deducted', credits_to_deduct,
    'new_balance', user_balance
  );
END;
$$;

-- 4. Update cancel_order to refund credits for new model orders
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel orders';
  END IF;
  
  IF cancellation_reason_text IS NULL OR cancellation_reason_text = '' THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be canceled (current status: %)', order_record.status;
  END IF;
  
  -- Refund credits if they were already deducted at placement
  IF order_record.credits_deducted > 0 THEN
    UPDATE profiles
    SET balance = balance + order_record.credits_deducted
    WHERE id = order_record.user_id;
  END IF;
  
  -- Mark order as canceled
  UPDATE product_orders
  SET 
    status = 'canceled',
    reviewed_by = auth.uid(),
    canceled_at = NOW(),
    updated_at = NOW(),
    cancellation_reason = cancellation_reason_text,
    credits_deducted = 0
  WHERE id = order_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_canceled',
    'Order Canceled',
    FORMAT('Order %s canceled. %s credits refunded. Reason: %s', 
           order_record.order_number, order_record.credits_deducted, cancellation_reason_text),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'credits_refunded', order_record.credits_deducted,
      'reason', cancellation_reason_text,
      'product', order_record.product_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order canceled and credits refunded',
    'order_number', order_record.order_number,
    'credits_refunded', order_record.credits_deducted
  );
END;
$$;

-- ============================================
-- ADMIN PANEL FIXES
-- ============================================

-- 5. RLS policies for payment_requests (admin read all)
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 6. RLS policies for payment_request_history (admin read all)
CREATE POLICY "Admins can view all payment request history"
ON public.payment_request_history
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 7. Ensure trigger exists for auto-creating profiles
-- (Already exists: public.handle_new_user)

-- 8. Backfill missing profiles for existing users
INSERT INTO public.profiles (id, email, username, full_name, avatar_url, provider, balance)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  CASE WHEN u.raw_user_meta_data->>'provider' = 'google' THEN 'google' ELSE 'email' END,
  0
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. RLS policies for profiles (admin view and update all)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());