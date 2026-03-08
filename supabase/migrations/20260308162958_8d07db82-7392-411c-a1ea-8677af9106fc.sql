
-- Push subscriptions table for Web Push API
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (public.is_admin());

-- Index for fast lookups by user
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions (user_id);

-- Trigger function to send push notification via edge function
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/send-push-notification',
    body := jsonb_build_object('user_id', NEW.user_id, 'notification_id', NEW.notification_id),
    params := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the notification insert if push delivery fails
  RETURN NEW;
END;
$$;

-- Trigger on user_notifications insert
CREATE TRIGGER trigger_send_push_notification
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification();
