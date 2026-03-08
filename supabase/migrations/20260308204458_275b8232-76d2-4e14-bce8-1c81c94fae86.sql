
-- 1. cleanup_settings table
CREATE TABLE public.cleanup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value integer NOT NULL DEFAULT 30,
  description text,
  is_enabled boolean DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cleanup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cleanup settings"
  ON public.cleanup_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 2. archived_orders table (mirrors product_orders + archived_at)
CREATE TABLE public.archived_orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  user_name text,
  order_number text NOT NULL,
  product_category text NOT NULL,
  product_name text NOT NULL,
  package_name text NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  product_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  payment_method text DEFAULT 'credit',
  credits_deducted numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  admin_remarks text,
  reviewed_by uuid,
  transaction_id varchar,
  cancellation_reason text,
  failure_reason text,
  created_at timestamptz,
  updated_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  failed_at timestamptz,
  processing_started_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.archived_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage archived orders"
  ON public.archived_orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 3. cleanup_logs table
CREATE TABLE public.cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_type text NOT NULL,
  records_affected integer DEFAULT 0,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cleanup logs"
  ON public.cleanup_logs FOR SELECT
  USING (is_admin());

-- 4. Seed default cleanup settings
INSERT INTO public.cleanup_settings (setting_key, setting_value, description, is_enabled) VALUES
  ('notification_retention_days', 30, 'Delete notifications older than this many days', true),
  ('chatbot_retention_days', 15, 'Delete chatbot conversations older than this many days', true),
  ('activity_log_retention_days', 60, 'Delete activity logs older than this many days', true),
  ('order_archive_days', 30, 'Archive completed/canceled orders older than this many days', true),
  ('offer_retention_days', 30, 'Deactivate expired offers older than this many days', true),
  ('chatbot_feedback_retention_days', 30, 'Delete chatbot feedback older than this many days', true);
