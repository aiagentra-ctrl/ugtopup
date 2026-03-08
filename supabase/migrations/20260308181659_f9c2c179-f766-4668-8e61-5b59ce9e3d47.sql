
-- 1. Upgrade coupons table with new columns
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_uses integer NOT NULL DEFAULT 1;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount_amount numeric;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_products text[];
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_categories text[];

-- Migrate existing data
UPDATE coupons SET discount_value = discount_percent WHERE discount_value = 0 AND discount_percent > 0;

-- 2. Create coupon_rules table
CREATE TABLE IF NOT EXISTS coupon_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL DEFAULT 'auto_generate',
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount_amount numeric,
  max_uses_per_user integer DEFAULT 1,
  max_total_uses integer,
  total_used integer DEFAULT 0,
  coupon_code text,
  applicable_products text[],
  applicable_categories text[],
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE coupon_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage coupon rules" ON coupon_rules FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can view active rules" ON coupon_rules FOR SELECT USING (is_active = true);

-- 3. Create promotion_analytics table
CREATE TABLE IF NOT EXISTS promotion_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_rule_id uuid REFERENCES coupon_rules(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES offers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES product_orders(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  original_price numeric,
  final_price numeric,
  event_type text NOT NULL DEFAULT 'coupon_used',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE promotion_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view analytics" ON promotion_analytics FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. Update place_order function with coupon support
CREATE OR REPLACE FUNCTION public.place_order(
  p_product_category product_category,
  p_product_name text,
  p_package_name text,
  p_quantity numeric,
  p_price numeric,
  p_product_details jsonb,
  p_payment_method text DEFAULT 'credit',
  p_coupon_code text DEFAULT NULL
)
RETURNS product_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile record;
  v_username text;
  v_order product_orders%rowtype;
  v_attempts int := 0;
  v_order_number text;
  v_coupon record;
  v_discount numeric := 0;
  v_final_price numeric;
  v_coupon_metadata jsonb := '{}'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.id, p.username, p.email, p.balance
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  v_final_price := p_price;

  -- Validate and apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    -- Try user-specific coupon first
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_coupon_code
      AND (user_id = v_user_id OR user_id IS NULL)
      AND is_used = false
      AND use_count < max_uses
      AND expires_at > NOW()
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Try global coupon rule
      SELECT cr.id, cr.discount_type, cr.discount_value, cr.max_discount_amount,
             cr.min_order_amount, cr.max_uses_per_user, cr.max_total_uses, cr.total_used,
             cr.applicable_categories, cr.coupon_code as code
      INTO v_coupon
      FROM coupon_rules cr
      WHERE cr.coupon_code = p_coupon_code
        AND cr.is_active = true
        AND cr.rule_type = 'global_code'
        AND (cr.starts_at IS NULL OR cr.starts_at <= NOW())
        AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
        AND (cr.max_total_uses IS NULL OR cr.total_used < cr.max_total_uses)
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired coupon code';
      END IF;

      -- Check per-user usage for global codes
      IF v_coupon.max_uses_per_user IS NOT NULL THEN
        IF (SELECT COUNT(*) FROM promotion_analytics
            WHERE coupon_rule_id = v_coupon.id AND user_id = v_user_id) >= v_coupon.max_uses_per_user THEN
          RAISE EXCEPTION 'You have already used this coupon the maximum number of times';
        END IF;
      END IF;

      -- Check min order amount
      IF v_coupon.min_order_amount IS NOT NULL AND p_price < v_coupon.min_order_amount THEN
        RAISE EXCEPTION 'Minimum order amount of % is required for this coupon', v_coupon.min_order_amount;
      END IF;

      -- Check category restriction
      IF v_coupon.applicable_categories IS NOT NULL AND array_length(v_coupon.applicable_categories, 1) > 0 THEN
        IF NOT (p_product_category::text = ANY(v_coupon.applicable_categories)) THEN
          RAISE EXCEPTION 'This coupon is not valid for this product category';
        END IF;
      END IF;

      -- Calculate discount for global rule
      IF v_coupon.discount_type = 'percent' THEN
        v_discount := ROUND(p_price * v_coupon.discount_value / 100, 2);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
          v_discount := v_coupon.max_discount_amount;
        END IF;
      ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount := LEAST(v_coupon.discount_value, p_price);
      END IF;

      v_final_price := GREATEST(p_price - v_discount, 0);

      -- Increment global rule usage
      UPDATE coupon_rules SET total_used = total_used + 1, updated_at = NOW() WHERE id = v_coupon.id;

      v_coupon_metadata := jsonb_build_object(
        'coupon_code', p_coupon_code,
        'coupon_rule_id', v_coupon.id,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'discount_amount', v_discount,
        'original_price', p_price
      );

    ELSE
      -- User-specific coupon found - validate
      IF v_coupon.min_order_amount > 0 AND p_price < v_coupon.min_order_amount THEN
        RAISE EXCEPTION 'Minimum order amount of % is required for this coupon', v_coupon.min_order_amount;
      END IF;

      IF v_coupon.applicable_categories IS NOT NULL AND array_length(v_coupon.applicable_categories, 1) > 0 THEN
        IF NOT (p_product_category::text = ANY(v_coupon.applicable_categories)) THEN
          RAISE EXCEPTION 'This coupon is not valid for this product category';
        END IF;
      END IF;

      -- Calculate discount for user coupon
      IF v_coupon.discount_type = 'percent' THEN
        v_discount := ROUND(p_price * v_coupon.discount_value / 100, 2);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
          v_discount := v_coupon.max_discount_amount;
        END IF;
      ELSIF v_coupon.discount_type = 'fixed' THEN
        v_discount := LEAST(v_coupon.discount_value, p_price);
      ELSE
        -- fallback to discount_percent for legacy coupons
        v_discount := ROUND(p_price * v_coupon.discount_percent / 100, 2);
      END IF;

      v_final_price := GREATEST(p_price - v_discount, 0);

      -- Mark coupon as used
      UPDATE coupons SET is_used = true, used_at = NOW(), use_count = use_count + 1 WHERE id = v_coupon.id;

      v_coupon_metadata := jsonb_build_object(
        'coupon_code', p_coupon_code,
        'coupon_id', v_coupon.id,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'discount_amount', v_discount,
        'original_price', p_price
      );
    END IF;
  END IF;

  -- Check sufficient balance
  IF v_profile.balance < v_final_price THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits, but need % credits. Please top up your account.',
      v_profile.balance, v_final_price;
  END IF;

  v_username := COALESCE(v_profile.username, SPLIT_PART(v_profile.email, '@', 1), 'user');

  LOOP
    v_attempts := v_attempts + 1;
    v_order_number := LOWER(v_username) || '-' || SUBSTR(MD5(gen_random_uuid()::text), 1, 3);

    BEGIN
      INSERT INTO public.product_orders (
        user_id, user_email, user_name, order_number,
        product_category, product_name, package_name,
        quantity, price, product_details, status, payment_method, credits_deducted,
        metadata
      )
      VALUES (
        v_user_id, v_profile.email, v_username, v_order_number,
        p_product_category, p_product_name, p_package_name,
        p_quantity, v_final_price, COALESCE(p_product_details, '{}'::jsonb),
        'pending', COALESCE(p_payment_method, 'credit'), v_final_price,
        CASE WHEN v_discount > 0 THEN v_coupon_metadata ELSE '{}'::jsonb END
      )
      RETURNING * INTO v_order;

      UPDATE public.profiles
      SET balance = balance - v_final_price
      WHERE id = v_user_id;

      -- Log promotion analytics if coupon was used
      IF v_discount > 0 THEN
        INSERT INTO promotion_analytics (
          coupon_id, coupon_rule_id, user_id, order_id,
          discount_amount, original_price, final_price, event_type
        ) VALUES (
          (v_coupon_metadata->>'coupon_id')::uuid,
          (v_coupon_metadata->>'coupon_rule_id')::uuid,
          v_user_id, v_order.id,
          v_discount, p_price, v_final_price, 'coupon_used'
        );

        -- Update coupon used_on_order_id if user coupon
        IF v_coupon_metadata->>'coupon_id' IS NOT NULL THEN
          UPDATE coupons SET used_on_order_id = v_order.id WHERE id = (v_coupon_metadata->>'coupon_id')::uuid;
        END IF;
      END IF;

      INSERT INTO public.activity_logs (
        actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
      )
      VALUES (
        v_user_id, v_profile.email, 'order_created', 'Order Placed',
        FORMAT('Order %s placed. %s credits deducted.%s', v_order_number, v_final_price,
          CASE WHEN v_discount > 0 THEN FORMAT(' Coupon %s applied, saved %s.', p_coupon_code, v_discount) ELSE '' END),
        'order', v_order.id,
        jsonb_build_object('order_number', v_order_number, 'price', v_final_price, 'product', p_product_name,
          'coupon_code', p_coupon_code, 'discount', v_discount, 'original_price', p_price)
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

-- 5. Create validate_coupon RPC for client-side preview
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code text,
  p_order_amount numeric,
  p_product_category text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_coupon record;
  v_discount numeric := 0;
  v_final_price numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('valid', false, 'message', 'Not authenticated');
  END IF;

  -- Try user-specific coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
    AND (user_id = v_user_id)
    AND is_used = false
    AND use_count < max_uses
    AND expires_at > NOW();

  IF FOUND THEN
    IF v_coupon.min_order_amount > 0 AND p_order_amount < v_coupon.min_order_amount THEN
      RETURN json_build_object('valid', false, 'message', FORMAT('Minimum order amount: ₹%s', v_coupon.min_order_amount));
    END IF;

    IF v_coupon.applicable_categories IS NOT NULL AND array_length(v_coupon.applicable_categories, 1) > 0 THEN
      IF p_product_category IS NOT NULL AND NOT (p_product_category = ANY(v_coupon.applicable_categories)) THEN
        RETURN json_build_object('valid', false, 'message', 'Coupon not valid for this category');
      END IF;
    END IF;

    IF v_coupon.discount_type = 'percent' THEN
      v_discount := ROUND(p_order_amount * v_coupon.discount_value / 100, 2);
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSIF v_coupon.discount_type = 'fixed' THEN
      v_discount := LEAST(v_coupon.discount_value, p_order_amount);
    ELSE
      v_discount := ROUND(p_order_amount * v_coupon.discount_percent / 100, 2);
    END IF;

    v_final_price := GREATEST(p_order_amount - v_discount, 0);

    RETURN json_build_object(
      'valid', true,
      'discount_type', v_coupon.discount_type,
      'discount_value', v_coupon.discount_value,
      'discount_amount', v_discount,
      'final_price', v_final_price,
      'message', FORMAT('%s%s OFF applied! You save ₹%s',
        CASE WHEN v_coupon.discount_type = 'percent' THEN v_coupon.discount_value || '%'
             ELSE '₹' || v_coupon.discount_value END,
        '', v_discount)
    );
  END IF;

  -- Try global coupon rule
  SELECT * INTO v_coupon
  FROM coupon_rules
  WHERE coupon_code = p_coupon_code
    AND is_active = true
    AND rule_type = 'global_code'
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_total_uses IS NULL OR total_used < max_total_uses);

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'message', 'Invalid or expired coupon code');
  END IF;

  IF v_coupon.max_uses_per_user IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM promotion_analytics WHERE coupon_rule_id = v_coupon.id AND user_id = v_user_id) >= v_coupon.max_uses_per_user THEN
      RETURN json_build_object('valid', false, 'message', 'You have already used this coupon');
    END IF;
  END IF;

  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN json_build_object('valid', false, 'message', FORMAT('Minimum order: ₹%s', v_coupon.min_order_amount));
  END IF;

  IF v_coupon.applicable_categories IS NOT NULL AND array_length(v_coupon.applicable_categories, 1) > 0 THEN
    IF p_product_category IS NOT NULL AND NOT (p_product_category = ANY(v_coupon.applicable_categories)) THEN
      RETURN json_build_object('valid', false, 'message', 'Coupon not valid for this category');
    END IF;
  END IF;

  IF v_coupon.discount_type = 'percent' THEN
    v_discount := ROUND(p_order_amount * v_coupon.discount_value / 100, 2);
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
      v_discount := v_coupon.max_discount_amount;
    END IF;
  ELSIF v_coupon.discount_type = 'fixed' THEN
    v_discount := LEAST(v_coupon.discount_value, p_order_amount);
  END IF;

  v_final_price := GREATEST(p_order_amount - v_discount, 0);

  RETURN json_build_object(
    'valid', true,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'final_price', v_final_price,
    'message', FORMAT('%s%s OFF applied! You save ₹%s',
      CASE WHEN v_coupon.discount_type = 'percent' THEN v_coupon.discount_value || '%'
           ELSE '₹' || v_coupon.discount_value END,
      '', v_discount)
  );
END;
$$;
