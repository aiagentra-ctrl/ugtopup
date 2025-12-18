-- Add notification_type to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type text NOT NULL DEFAULT 'admin';

-- Update existing notifications to have type 'admin'
UPDATE public.notifications SET notification_type = 'admin' WHERE notification_type IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.notifications.notification_type IS 'Type of notification: admin (from admin) or general (system/common)';