
-- Fix search_path on validate_coupon
ALTER FUNCTION public.validate_coupon(text, numeric, text) SET search_path TO 'public', 'pg_temp';
