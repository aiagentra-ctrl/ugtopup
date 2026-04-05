
-- System settings table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anon/authenticated to read settings (needed by edge functions via service role)
CREATE POLICY "Anyone can read system_settings"
  ON public.system_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Seed default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('liana_daily_spending_cap', '5000', 'Maximum Liana coins that can be spent per day'),
  ('liana_low_balance_threshold', '2000', 'Alert when Liana wallet balance drops below this'),
  ('liana_rate_limit_per_minute', '10', 'Maximum orders per minute via Liana API')
ON CONFLICT (setting_key) DO NOTHING;
