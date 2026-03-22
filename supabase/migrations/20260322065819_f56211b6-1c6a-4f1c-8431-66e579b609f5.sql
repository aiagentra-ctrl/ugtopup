
-- 1. Simplify order placed: single notification instead of 3
CREATE OR REPLACE FUNCTION public.notify_order_placed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Placed',
    'Your order ' || NEW.order_number || ' for ' || NEW.product_name || ' has been placed. Rs.' || NEW.credits_deducted || ' deducted from your wallet.',
    'general'
  );
  RETURN NEW;
END;
$function$;

-- 2. Simplify credit request submitted: single notification instead of 2
CREATE OR REPLACE FUNCTION public.notify_credit_request_submitted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = NEW.user_email;
  
  IF v_user_id IS NOT NULL THEN
    PERFORM create_user_notification(
      v_user_id,
      'Credit Request Submitted',
      'Your credit request for Rs.' || NEW.amount || ' is pending approval.',
      'general'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Enhance voucher delivery notification with the actual code
CREATE OR REPLACE FUNCTION public.try_assign_voucher(p_order_id uuid, p_game text, p_package_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_code text;
  v_order product_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM product_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Order not found');
  END IF;

  v_code := assign_voucher_code(p_order_id, p_game, p_package_id);

  IF v_code IS NOT NULL THEN
    UPDATE product_orders
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('voucher_code', v_code),
        status = 'completed',
        completed_at = now(),
        updated_at = now(),
        admin_remarks = 'Auto-delivered voucher code'
    WHERE id = p_order_id;

    -- Single instant notification with the voucher code
    PERFORM create_user_notification(
      v_order.user_id,
      'Order Completed — Voucher Delivered 🎉',
      'Your order ' || v_order.order_number || ' is completed. Your voucher code: ' || v_code,
      'general'
    );

    RETURN json_build_object('success', true, 'code', v_code);
  ELSE
    RETURN json_build_object('success', false, 'message', 'Voucher stock empty. Order will be processed manually.');
  END IF;
END;
$function$;
