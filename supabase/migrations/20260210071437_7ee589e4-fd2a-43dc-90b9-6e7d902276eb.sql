
-- Update cancel_order to refund credits and notify user
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
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Only pending/processing orders can be canceled (current status: %)', order_record.status;
  END IF;
  
  -- Calculate refund amount (credits that were deducted at order placement)
  v_refund_amount := COALESCE(order_record.credits_deducted, order_record.price, 0);
  
  -- Refund credits to user
  IF v_refund_amount > 0 THEN
    UPDATE public.profiles
    SET balance = balance + v_refund_amount
    WHERE id = order_record.user_id;
  END IF;
  
  -- Update order status
  UPDATE product_orders
  SET 
    status = 'canceled',
    reviewed_by = auth.uid(),
    canceled_at = NOW(),
    updated_at = NOW(),
    cancellation_reason = cancellation_reason_text
  WHERE id = order_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_canceled',
    'Order Canceled',
    FORMAT('Order %s canceled. %s credits refunded.', order_record.order_number, v_refund_amount),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'reason', cancellation_reason_text,
      'product', order_record.product_name,
      'credits_refunded', v_refund_amount
    )
  );
  
  -- Send notification to user about cancellation and refund
  PERFORM create_user_notification(
    order_record.user_id,
    'Order Canceled - Credits Refunded',
    'Your order ' || order_record.order_number || ' has been canceled. Rs.' || v_refund_amount || ' credits have been refunded to your account. Reason: ' || COALESCE(cancellation_reason_text, 'Not specified'),
    'admin'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order canceled and credits refunded',
    'order_number', order_record.order_number,
    'credits_refunded', v_refund_amount
  );
END;
$function$;
