
-- Fix search_path for generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Fix search_path for check_milestone_rewards
CREATE OR REPLACE FUNCTION public.check_milestone_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_completed_count integer;
  v_milestone record;
  v_coupon_code text;
  v_existing_count integer;
BEGIN
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO v_completed_count
  FROM product_orders WHERE user_id = NEW.user_id AND status = 'completed';
  FOR v_milestone IN
    SELECT * FROM reward_milestones WHERE is_active = true ORDER BY order_count ASC
  LOOP
    IF v_completed_count >= v_milestone.order_count THEN
      SELECT COUNT(*) INTO v_existing_count
      FROM coupons WHERE user_id = NEW.user_id AND source = 'milestone' AND source_id = v_milestone.id;
      IF v_existing_count = 0 THEN
        v_coupon_code := 'MST-' || UPPER(SUBSTR(MD5(NEW.user_id::text || v_milestone.id::text), 1, 8));
        INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
        VALUES (NEW.user_id, v_coupon_code, v_milestone.discount_percent, 'milestone', v_milestone.id,
          NOW() + (v_milestone.coupon_validity_days || ' days')::interval);
        PERFORM create_user_notification(NEW.user_id, '🎉 Milestone Reward!',
          'Congratulations! You completed ' || v_milestone.order_count || ' orders and earned a ' || v_milestone.discount_percent || '% OFF coupon! Code: ' || v_coupon_code, 'general');
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Fix search_path for check_referral_rewards
CREATE OR REPLACE FUNCTION public.check_referral_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
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
  SELECT * INTO v_settings FROM referral_settings LIMIT 1;
  IF NOT FOUND OR NOT v_settings.is_enabled THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_referral FROM referrals
  WHERE referee_id = NEW.user_id AND rewarded = false AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  IF v_settings.reward_after = 'first_order' THEN
    IF (SELECT COUNT(*) FROM product_orders WHERE user_id = NEW.user_id AND status = 'completed') > 1 THEN
      RETURN NEW;
    END IF;
  END IF;
  IF NEW.price < v_settings.min_order_amount THEN
    RETURN NEW;
  END IF;
  v_referrer_code := 'REF-' || UPPER(SUBSTR(MD5(v_referral.referrer_id::text || NOW()::text), 1, 8));
  INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
  VALUES (v_referral.referrer_id, v_referrer_code, v_settings.referrer_discount_percent, 'referral', v_referral.id,
    NOW() + (v_settings.referrer_coupon_validity_days || ' days')::interval);
  IF v_settings.referee_discount_percent > 0 THEN
    v_referee_code := 'WEL-' || UPPER(SUBSTR(MD5(v_referral.referee_id::text || NOW()::text), 1, 8));
    INSERT INTO coupons (user_id, code, discount_percent, source, source_id, expires_at)
    VALUES (v_referral.referee_id, v_referee_code, v_settings.referee_discount_percent, 'referral_welcome', v_referral.id,
      NOW() + (v_settings.referee_coupon_validity_days || ' days')::interval);
  END IF;
  UPDATE referrals SET status = 'completed', rewarded = true, rewarded_at = NOW(), referee_first_order_id = NEW.id
  WHERE id = v_referral.id;
  PERFORM create_user_notification(v_referral.referrer_id, '🎁 Referral Reward!',
    'Your friend made their first purchase! You earned a ' || v_settings.referrer_discount_percent || '% OFF coupon. Code: ' || v_referrer_code, 'general');
  RETURN NEW;
END;
$$;
