-- Fix 1: Restrict chatbot_settings SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view chatbot settings" ON chatbot_settings;
CREATE POLICY "Authenticated users can view chatbot settings" ON chatbot_settings
  FOR SELECT TO authenticated USING (true);

-- Fix 2: Restrict coupon_rules SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view active rules" ON coupon_rules;
CREATE POLICY "Authenticated users can view active rules" ON coupon_rules
  FOR SELECT TO authenticated USING (is_active = true);

-- Fix 3: Fix function search paths for functions missing it
CREATE OR REPLACE FUNCTION public.deliver_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.target_type = 'all' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, id FROM public.profiles;
  ELSE
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, id FROM public.profiles WHERE email = ANY(NEW.target_emails);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_order_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.payment_method = 'credit' THEN
    IF NEW.credits_deducted IS NULL OR NEW.credits_deducted < NEW.price THEN
      RAISE EXCEPTION 'Invalid order: credits_deducted (%) must be >= price (%)', 
        NEW.credits_deducted, NEW.price;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;