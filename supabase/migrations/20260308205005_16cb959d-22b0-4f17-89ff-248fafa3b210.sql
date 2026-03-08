
-- Create system_daily_reports table
CREATE TABLE public.system_daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_credit_requests integer DEFAULT 0,
  total_chatbot_interactions integer DEFAULT 0,
  pending_orders integer DEFAULT 0,
  failed_orders integer DEFAULT 0,
  active_users integer DEFAULT 0,
  database_stats jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_daily_reports ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admins can view daily reports"
  ON public.system_daily_reports
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add expired_coupon_retention_days to cleanup_settings
INSERT INTO public.cleanup_settings (setting_key, setting_value, description, is_enabled)
VALUES ('expired_coupon_retention_days', 30, 'Delete expired coupons older than this many days after expiration', true)
ON CONFLICT (setting_key) DO NOTHING;
