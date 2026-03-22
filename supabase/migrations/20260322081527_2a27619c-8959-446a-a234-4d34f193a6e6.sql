
-- Route voucher delivery notifications to 'order' type
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

    PERFORM create_user_notification(
      v_order.user_id,
      'Order Completed — Voucher Delivered 🎉',
      'Your order ' || v_order.order_number || ' is completed. Your voucher code: ' || v_code,
      'order'
    );

    RETURN json_build_object('success', true, 'code', v_code);
  ELSE
    RETURN json_build_object('success', false, 'message', 'Voucher stock empty. Order will be processed manually.');
  END IF;
END;
$function$;

-- Route order placed notification to 'order' type
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
    'order'
  );
  RETURN NEW;
END;
$function$;

-- Route order confirmed to 'order' type
CREATE OR REPLACE FUNCTION public.notify_order_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Confirmed',
    'Your order ' || NEW.order_number || ' has been confirmed successfully.',
    'order'
  );
  RETURN NEW;
END;
$function$;

-- Route order canceled to 'order' type
CREATE OR REPLACE FUNCTION public.notify_order_canceled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Update',
    'Your order ' || NEW.order_number || ' has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Not specified'),
    'order'
  );
  RETURN NEW;
END;
$function$;

-- Route ML order completed to 'order' type
CREATE OR REPLACE FUNCTION public.complete_ml_order(p_order_id uuid, p_liana_order_id uuid, p_api_response jsonb, p_api_transaction_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    UPDATE product_orders SET status = 'completed', completed_at = NOW(), updated_at = NOW(), admin_remarks = 'Auto-processed via Liana API' WHERE id = p_order_id;
    UPDATE liana_orders SET status = 'completed', api_response = p_api_response, api_transaction_id = p_api_transaction_id, updated_at = NOW() WHERE id = p_liana_order_id;
    PERFORM create_user_notification(v_order.user_id, 'Order Completed', 'Your Mobile Legends diamonds for order ' || v_order.order_number || ' have been delivered successfully!', 'order');
    INSERT INTO activity_logs (actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata) VALUES (v_order.user_id, v_order.user_email, 'order_completed', 'ML Order Auto-Completed', FORMAT('Order %s auto-completed via Liana API', v_order.order_number), 'order', p_order_id, jsonb_build_object('order_number', v_order.order_number, 'liana_order_id', p_liana_order_id, 'api_transaction_id', p_api_transaction_id));
    RETURN json_build_object('success', true, 'message', 'Order completed successfully');
END;
$function$;

-- Route ML order failed to 'order' type
CREATE OR REPLACE FUNCTION public.fail_ml_order(p_order_id uuid, p_liana_order_id uuid, p_error_message text, p_api_response jsonb DEFAULT NULL::jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_order product_orders%ROWTYPE;
BEGIN
    SELECT * INTO v_order FROM product_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Order not found');
    END IF;
    UPDATE product_orders SET status = 'canceled', canceled_at = NOW(), updated_at = NOW(), cancellation_reason = 'API Error: ' || p_error_message WHERE id = p_order_id;
    UPDATE liana_orders SET status = 'failed', error_message = p_error_message, api_response = p_api_response, retry_count = retry_count + 1, updated_at = NOW() WHERE id = p_liana_order_id;
    PERFORM create_user_notification(v_order.user_id, 'Order Failed', 'Your order ' || v_order.order_number || ' could not be processed: ' || p_error_message || '. Please contact support.', 'order');
    INSERT INTO activity_logs (actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata) VALUES (v_order.user_id, v_order.user_email, 'order_failed', 'ML Order Failed', FORMAT('Order %s failed: %s', v_order.order_number, p_error_message), 'order', p_order_id, jsonb_build_object('order_number', v_order.order_number, 'liana_order_id', p_liana_order_id, 'error', p_error_message));
    RETURN json_build_object('success', true, 'message', 'Order marked as failed');
END;
$function$;

-- Route cancel_order notification to 'order' type
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason_text text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  order_record product_orders%ROWTYPE;
  v_refund_amount numeric;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can cancel orders';
  END IF;
  IF cancellation_reason_text IS NULL OR cancellation_reason_text = '' THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;
  SELECT * INTO order_record FROM product_orders WHERE id = order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF order_record.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Only pending/processing orders can be canceled (current status: %)', order_record.status;
  END IF;
  v_refund_amount := COALESCE(order_record.credits_deducted, order_record.price, 0);
  IF v_refund_amount > 0 THEN
    UPDATE public.profiles SET balance = balance + v_refund_amount WHERE id = order_record.user_id;
  END IF;
  UPDATE product_orders SET status = 'canceled', reviewed_by = auth.uid(), canceled_at = NOW(), updated_at = NOW(), cancellation_reason = cancellation_reason_text WHERE id = cancel_order.order_id;
  INSERT INTO activity_logs (actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata) VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), 'order_canceled', 'Order Canceled', FORMAT('Order %s canceled. %s credits refunded.', order_record.order_number, v_refund_amount), 'order', cancel_order.order_id, jsonb_build_object('order_number', order_record.order_number, 'reason', cancellation_reason_text, 'product', order_record.product_name, 'credits_refunded', v_refund_amount));
  PERFORM create_user_notification(order_record.user_id, 'Order Canceled - Credits Refunded', 'Your order ' || order_record.order_number || ' has been canceled. Rs.' || v_refund_amount || ' credits have been refunded to your account. Reason: ' || COALESCE(cancellation_reason_text, 'Not specified'), 'order');
  RETURN json_build_object('success', true, 'message', 'Order canceled and credits refunded', 'order_number', order_record.order_number, 'credits_refunded', v_refund_amount);
END;
$function$;
