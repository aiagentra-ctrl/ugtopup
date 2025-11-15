-- CRITICAL FIX: Prevent users from bypassing credit checks
-- This migration stops the revenue loss issue where users could place orders without credit deduction

-- 1. Drop the INSERT policy that allows direct order creation (force use of place_order function)
DROP POLICY IF EXISTS "Users can create orders" ON public.product_orders;

-- 2. Update place_order function with strict atomic guarantees
CREATE OR REPLACE FUNCTION public.place_order(
  p_product_category product_category,
  p_product_name text,
  p_package_name text,
  p_quantity numeric,
  p_price numeric,
  p_product_details jsonb,
  p_payment_method text DEFAULT 'credit'
)
RETURNS product_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile record;
  v_username text;
  v_order product_orders%rowtype;
  v_attempts int := 0;
  v_order_number text;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock user profile row and get current balance (prevents race conditions)
  SELECT p.id, p.username, p.email, p.balance
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- CRITICAL: Check sufficient balance BEFORE any insert
  IF v_profile.balance < p_price THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits, but need % credits. Please top up your account.',
      v_profile.balance, p_price;
  END IF;

  -- Get username for order number
  v_username := COALESCE(v_profile.username, SPLIT_PART(v_profile.email, '@', 1), 'user');

  -- Generate unique order number with retry logic (up to 5 attempts)
  LOOP
    v_attempts := v_attempts + 1;
    v_order_number := LOWER(v_username) || '-' || SUBSTR(MD5(gen_random_uuid()::text), 1, 3);

    BEGIN
      -- Insert order with credits_deducted set to price (mandatory for credit orders)
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
$function$;

-- 3. Add validation trigger to prevent any malformed credit orders
CREATE OR REPLACE FUNCTION public.validate_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Enforce that credit-based orders must have credits_deducted >= price
  IF NEW.payment_method = 'credit' THEN
    IF NEW.credits_deducted IS NULL OR NEW.credits_deducted < NEW.price THEN
      RAISE EXCEPTION 'Invalid order: credits_deducted (%) must be >= price (%)', 
        NEW.credits_deducted, NEW.price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_validate_order_insert ON public.product_orders;
CREATE TRIGGER trg_validate_order_insert
  BEFORE INSERT ON public.product_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_insert();