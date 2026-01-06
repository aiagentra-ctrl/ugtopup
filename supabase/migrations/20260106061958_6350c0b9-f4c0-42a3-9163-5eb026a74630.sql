-- Helper function to create notifications for a specific user
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_notification_type text DEFAULT 'general'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id uuid;
  v_user_email text;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM profiles WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN;
  END IF;
  
  -- Create notification targeted to specific user
  INSERT INTO notifications (title, message, target_type, target_emails, notification_type, is_active)
  VALUES (p_title, p_message, 'specific', ARRAY[v_user_email], p_notification_type, true)
  RETURNING id INTO v_notification_id;
  
  -- The deliver_notification trigger will auto-create user_notification
END;
$$;

-- Trigger for ORDER PLACED (after insert on product_orders)
CREATE OR REPLACE FUNCTION public.notify_order_placed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notification 1: Order Sent
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Sent',
    'Your order request for ' || NEW.product_name || ' has been sent successfully.',
    'general'
  );
  
  -- Notification 2: Order Pending
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Status',
    'Your order ' || NEW.order_number || ' is pending confirmation.',
    'general'
  );
  
  -- Notification 3: Credit Deducted (if credits were used)
  IF NEW.credits_deducted IS NOT NULL AND NEW.credits_deducted > 0 THEN
    PERFORM create_user_notification(
      NEW.user_id,
      'Credit Deducted',
      'Your credit of Rs.' || NEW.credits_deducted || ' has been deducted for order ' || NEW.order_number || '.',
      'general'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_placed
AFTER INSERT ON product_orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_placed();

-- Trigger for ORDER CONFIRMED
CREATE OR REPLACE FUNCTION public.notify_order_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Confirmed',
    'Your order ' || NEW.order_number || ' has been confirmed successfully.',
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_confirmed
AFTER UPDATE ON product_orders
FOR EACH ROW
WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
EXECUTE FUNCTION notify_order_confirmed();

-- Trigger for ORDER CANCELED
CREATE OR REPLACE FUNCTION public.notify_order_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM create_user_notification(
    NEW.user_id,
    'Order Update',
    'Your order ' || NEW.order_number || ' has been cancelled. Reason: ' || COALESCE(NEW.cancellation_reason, 'Not specified'),
    'admin'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_canceled
AFTER UPDATE ON product_orders
FOR EACH ROW
WHEN (NEW.status = 'canceled' AND OLD.status = 'pending')
EXECUTE FUNCTION notify_order_canceled();

-- Trigger for CREDIT REQUEST SUBMITTED
CREATE OR REPLACE FUNCTION public.notify_credit_request_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = NEW.user_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Notification 1: Request Sent
    PERFORM create_user_notification(
      v_user_id,
      'Credit Request Sent',
      'Your credit request for Rs.' || NEW.amount || ' has been sent successfully.',
      'general'
    );
    
    -- Notification 2: Pending Status
    PERFORM create_user_notification(
      v_user_id,
      'Credit Status',
      'Your credit request is pending approval.',
      'general'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_request_submitted
AFTER INSERT ON payment_requests
FOR EACH ROW
EXECUTE FUNCTION notify_credit_request_submitted();

-- Trigger for CREDIT APPROVED
CREATE OR REPLACE FUNCTION public.notify_credit_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = NEW.user_email;
  
  IF v_user_id IS NOT NULL THEN
    PERFORM create_user_notification(
      v_user_id,
      'Credit Added',
      'Your credit of Rs.' || NEW.credits || ' has been successfully added to your wallet.',
      'admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_approved
AFTER UPDATE ON payment_requests
FOR EACH ROW
WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
EXECUTE FUNCTION notify_credit_approved();

-- Trigger for CREDIT REJECTED
CREATE OR REPLACE FUNCTION public.notify_credit_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = NEW.user_email;
  
  IF v_user_id IS NOT NULL THEN
    PERFORM create_user_notification(
      v_user_id,
      'Credit Request Update',
      'Your credit request for Rs.' || NEW.amount || ' was not approved. ' || COALESCE(NEW.admin_remarks, ''),
      'admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_rejected
AFTER UPDATE ON payment_requests
FOR EACH ROW
WHEN (NEW.status = 'rejected' AND OLD.status = 'pending')
EXECUTE FUNCTION notify_credit_rejected();