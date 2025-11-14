-- ============================================
-- FINAL FIX: Credit deduction at order placement only
-- Admin actions ONLY update order status
-- ============================================

-- 1. Update confirm_order to ONLY change status (no credit deduction)
CREATE OR REPLACE FUNCTION public.confirm_order(order_id uuid, admin_remarks_text text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm orders';
  END IF;
  
  SELECT * INTO order_record
  FROM product_orders
  WHERE id = order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Order is not pending (current status: %)', order_record.status;
  END IF;
  
  -- ONLY update order status to confirmed (credits already deducted at placement)
  UPDATE product_orders
  SET 
    status = 'confirmed',
    reviewed_by = auth.uid(),
    confirmed_at = NOW(),
    updated_at = NOW(),
    admin_remarks = admin_remarks_text
  WHERE id = order_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'order_confirmed',
    'Order Confirmed',
    FORMAT('Order %s confirmed by admin', order_record.order_number),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'product', order_record.product_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order confirmed successfully',
    'order_number', order_record.order_number
  );
END;
$$;

-- 2. Update cancel_order to ONLY change status (no credit refund)
CREATE OR REPLACE FUNCTION public.cancel_order(order_id uuid, cancellation_reason_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  order_record product_orders%ROWTYPE;
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
  
  IF order_record.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be canceled (current status: %)', order_record.status;
  END IF;
  
  -- ONLY update order status to canceled (no credit refund)
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
    FORMAT('Order %s canceled by admin. Reason: %s', order_record.order_number, cancellation_reason_text),
    'order',
    order_id,
    jsonb_build_object(
      'order_number', order_record.order_number,
      'reason', cancellation_reason_text,
      'product', order_record.product_name
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Order canceled successfully',
    'order_number', order_record.order_number
  );
END;
$$;