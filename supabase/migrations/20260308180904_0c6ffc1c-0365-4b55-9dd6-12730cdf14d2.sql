
-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = UPPER(SUBSTR(MD5(id::text || created_at::text), 1, 8)) WHERE referral_code IS NULL;

-- Reward milestones config table
CREATE TABLE public.reward_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_count integer NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 10,
  coupon_validity_days integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage milestones" ON public.reward_milestones FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users can view active milestones" ON public.reward_milestones FOR SELECT TO authenticated USING (is_active = true);

-- Referral settings (single row config)
CREATE TABLE public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  referrer_discount_percent numeric NOT NULL DEFAULT 5,
  referee_discount_percent numeric NOT NULL DEFAULT 5,
  referrer_coupon_validity_days integer NOT NULL DEFAULT 30,
  referee_coupon_validity_days integer NOT NULL DEFAULT 30,
  min_order_amount numeric NOT NULL DEFAULT 0,
  reward_after text NOT NULL DEFAULT 'first_order',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage referral settings" ON public.referral_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anyone can view referral settings" ON public.referral_settings FOR SELECT TO authenticated USING (true);

-- Insert default referral settings
INSERT INTO public.referral_settings (is_enabled, referrer_discount_percent, referee_discount_percent) VALUES (true, 5, 5);

-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL,
  source text NOT NULL DEFAULT 'milestone',
  source_id uuid,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_on_order_id uuid REFERENCES public.product_orders(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupons" ON public.coupons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all coupons" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  rewarded boolean NOT NULL DEFAULT false,
  rewarded_at timestamptz,
  referee_first_order_id uuid REFERENCES public.product_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Insert default milestones
INSERT INTO public.reward_milestones (order_count, discount_percent, coupon_validity_days, description) VALUES
  (10, 5, 30, '5% OFF after 10 orders'),
  (50, 10, 30, '10% OFF after 50 orders'),
  (100, 15, 60, '15% OFF after 100 orders');

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to check milestones and award coupons on order completion
CREATE OR REPLACE FUNCTION public.check_milestone_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_completed_count integer;
  v_milestone record;
  v_coupon_code text;
  v_existing_count integer;
BEGIN
  -- Only trigger when status changes to completed
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Count completed orders for this user
  SELECT COUNT(*) INTO v_completed_count
  FROM product_orders
  WHERE user_id = NEW.user_id AND status = 'completed';

  -- Check each active milestone
  FOR v_milestone IN
    SELECT * FROM reward_milestones WHERE is_active = true ORDER BY order_count ASC
  LOOP
    IF v_completed_count >= v_milestone.order_count THEN
      -- Check if already awarded for this milestone
      SELECT COUNT(*) INTO v_existing_count
      FROM coupons
      WHERE user_id = NEW.user_id AND source = 'milestone' AND source_id = v_milestone.id;

      IF v_existing_count = 0 THEN
        v_coupon_code := 'MST-' || UPPER(SUBSTR(MD5(NEW.user_id::text || v_milestone.id::text), 1, 8));
        
        INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
        VALUES (
          NEW.user_id,
          v_coupon_code,
          v_milestone.discount_percent,
          'milestone',
          v_milestone.id,
          NOW() + (v_milestone.coupon_validity_days || ' days')::interval
        );

        -- Notify user
        PERFORM create_user_notification(
          NEW.user_id,
          '🎉 Milestone Reward!',
          'Congratulations! You completed ' || v_milestone.order_count || ' orders and earned a ' || v_milestone.discount_percent || '% OFF coupon! Code: ' || v_coupon_code,
          'general'
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_milestone_rewards
  AFTER UPDATE ON public.product_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_milestone_rewards();

-- Function to handle referral rewards on order completion
CREATE OR REPLACE FUNCTION public.check_referral_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral record;
  v_settings record;
  v_referrer_code text;
  v_referee_code text;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get referral settings
  SELECT * INTO v_settings FROM referral_settings LIMIT 1;
  IF NOT FOUND OR NOT v_settings.is_enabled THEN
    RETURN NEW;
  END IF;

  -- Check if this user was referred and hasn't been rewarded yet
  SELECT * INTO v_referral
  FROM referrals
  WHERE referee_id = NEW.user_id AND rewarded = false AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Check reward condition
  IF v_settings.reward_after = 'first_order' THEN
    -- Only reward on first completed order
    IF (SELECT COUNT(*) FROM product_orders WHERE user_id = NEW.user_id AND status = 'completed') > 1 THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Check minimum order amount
  IF NEW.price < v_settings.min_order_amount THEN
    RETURN NEW;
  END IF;

  -- Generate coupon for referrer
  v_referrer_code := 'REF-' || UPPER(SUBSTR(MD5(v_referral.referrer_id::text || NOW()::text), 1, 8));
  INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
  VALUES (
    v_referral.referrer_id,
    v_referrer_code,
    v_settings.referrer_discount_percent,
    'referral',
    v_referral.id,
    NOW() + (v_settings.referrer_coupon_validity_days || ' days')::interval
  );

  -- Optionally generate welcome coupon for referee
  IF v_settings.referee_discount_percent > 0 THEN
    v_referee_code := 'WEL-' || UPPER(SUBSTR(MD5(v_referral.referee_id::text || NOW()::text), 1, 8));
    INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
    VALUES (
      v_referral.referee_id,
      v_referee_code,
      v_settings.referee_discount_percent,
      'referral_welcome',
      v_referral.id,
      NOW() + (v_settings.referee_coupon_validity_days || ' days')::interval
    );
  END IF;

  -- Update referral status
  UPDATE referrals
  SET status = 'completed', rewarded = true, rewarded_at = NOW(), referee_first_order_id = NEW.id
  WHERE id = v_referral.id;

  -- Notify referrer
  PERFORM create_user_notification(
    v_referral.referrer_id,
    '🎁 Referral Reward!',
    'Your friend made their first purchase! You earned a ' || v_settings.referrer_discount_percent || '% OFF coupon. Code: ' || v_referrer_code,
    'general'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_referral_rewards
  AFTER UPDATE ON public.product_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_referral_rewards();
