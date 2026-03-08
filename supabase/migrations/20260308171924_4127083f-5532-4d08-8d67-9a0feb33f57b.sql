
-- Function to notify admins via push when a new order is placed
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Loop through all admin users and send push notification
  FOR admin_record IN
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    WHERE ur.role IN ('admin', 'super_admin', 'sub_admin')
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := 'https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/send-push-notification',
        body := jsonb_build_object(
          'user_id', admin_record.user_id,
          'direct_payload', jsonb_build_object(
            'title', '🛒 New Order Received',
            'body', 'Order ' || NEW.order_number || ' from ' || COALESCE(NEW.user_name, NEW.user_email) || ' - ' || NEW.product_name,
            'url', '/admin?section=orders',
            'icon', '/icon-192x192.png'
          )
        ),
        params := '{}'::jsonb,
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the order insert if push fails
      NULL;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Function to notify admins on new credit request
CREATE OR REPLACE FUNCTION public.notify_admins_on_credit_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    WHERE ur.role IN ('admin', 'super_admin', 'sub_admin')
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := 'https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/send-push-notification',
        body := jsonb_build_object(
          'user_id', admin_record.user_id,
          'direct_payload', jsonb_build_object(
            'title', '💳 New Credit Request',
            'body', 'Rs.' || NEW.amount || ' request from ' || COALESCE(NEW.user_name, NEW.user_email),
            'url', '/admin?section=payments',
            'icon', '/icon-192x192.png'
          )
        ),
        params := '{}'::jsonb,
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Function to notify admins on API order failure
CREATE OR REPLACE FUNCTION public.notify_admins_on_api_failure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Only trigger when status changes to 'failed'
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    FOR admin_record IN
      SELECT DISTINCT ur.user_id
      FROM user_roles ur
      WHERE ur.role IN ('admin', 'super_admin', 'sub_admin')
    LOOP
      BEGIN
        PERFORM net.http_post(
          url := 'https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/send-push-notification',
          body := jsonb_build_object(
            'user_id', admin_record.user_id,
            'direct_payload', jsonb_build_object(
              'title', '⚠️ API Order Failed',
              'body', 'Order ' || NEW.order_id || ' failed: ' || COALESCE(NEW.error_message, 'Unknown error'),
              'url', '/admin?section=ml-monitoring',
              'icon', '/icon-192x192.png'
            )
          ),
          params := '{}'::jsonb,
          headers := '{"Content-Type": "application/json"}'::jsonb
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_admins_new_order
  AFTER INSERT ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_new_order();

CREATE TRIGGER trigger_notify_admins_credit_request
  AFTER INSERT ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_credit_request();

CREATE TRIGGER trigger_notify_admins_api_failure
  AFTER UPDATE ON liana_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_api_failure();
