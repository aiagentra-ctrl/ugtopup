-- Create enum for notification target type
CREATE TYPE public.notification_target_type AS ENUM ('all', 'specific');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  target_type notification_target_type NOT NULL DEFAULT 'all',
  target_emails TEXT[],
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notifications table for tracking delivery and read status
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Admins can manage notifications"
ON public.notifications
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view active notifications targeted to them"
ON public.notifications
FOR SELECT
USING (
  is_active = true AND (
    target_type = 'all' OR 
    (SELECT email FROM public.profiles WHERE id = auth.uid()) = ANY(target_emails)
  )
);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view own notification status"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification status"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user notifications"
ON public.user_notifications
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON public.user_notifications(notification_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX idx_notifications_target_type ON public.notifications(target_type);
CREATE INDEX idx_notifications_is_active ON public.notifications(is_active);

-- Create storage bucket for notification images
INSERT INTO storage.buckets (id, name, public) VALUES ('notification-images', 'notification-images', true);

-- Storage policies for notification images
CREATE POLICY "Anyone can view notification images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notification-images');

CREATE POLICY "Admins can upload notification images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'notification-images' AND is_admin());

CREATE POLICY "Admins can update notification images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'notification-images' AND is_admin());

CREATE POLICY "Admins can delete notification images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'notification-images' AND is_admin());

-- Function to deliver notification to users
CREATE OR REPLACE FUNCTION public.deliver_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.target_type = 'all' THEN
    -- Deliver to all users
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, id FROM public.profiles;
  ELSE
    -- Deliver to specific users by email
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, id FROM public.profiles WHERE email = ANY(NEW.target_emails);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-deliver notifications on insert
CREATE TRIGGER on_notification_created
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.deliver_notification();