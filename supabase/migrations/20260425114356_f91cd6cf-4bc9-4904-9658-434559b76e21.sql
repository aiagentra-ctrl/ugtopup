-- Ensure no duplicate referrer/referee pairs
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referrer_referee_unique
  ON public.referrals (referrer_id, referee_id);

-- Secure RPC: called by an authenticated user to record their referral
CREATE OR REPLACE FUNCTION public.apply_referral(p_referral_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_existing uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  IF p_referral_code IS NULL OR length(trim(p_referral_code)) = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Empty referral code');
  END IF;

  -- Don't overwrite an existing referral
  SELECT referred_by INTO v_existing FROM public.profiles WHERE id = v_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Referral already set');
  END IF;

  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE UPPER(referral_code) = UPPER(trim(p_referral_code))
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid referral code');
  END IF;

  IF v_referrer_id = v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'You cannot refer yourself');
  END IF;

  UPDATE public.profiles SET referred_by = v_referrer_id, updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO public.referrals (referrer_id, referee_id)
  VALUES (v_referrer_id, v_user_id)
  ON CONFLICT (referrer_id, referee_id) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Referral applied');
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;