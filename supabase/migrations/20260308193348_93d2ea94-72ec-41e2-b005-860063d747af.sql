
-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  feature_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  category text NOT NULL DEFAULT 'api_service',
  monthly_cost_note text,
  depends_on text,
  disabled_message text DEFAULT 'This feature is currently unavailable.',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Developers can manage feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'))
  WITH CHECK (public.has_role(auth.uid(), 'developer'));

CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT public.has_role(auth.uid(), 'developer');
$$;

INSERT INTO public.feature_flags (feature_key, feature_name, description, category, monthly_cost_note, depends_on) VALUES
  ('ai_chatbot', 'AI Chatbot', 'AI-powered customer support chatbot using Gemini/OpenAI APIs', 'api_service', 'Requires AI API credits (Gemini/OpenAI)', 'Lovable AI Gateway'),
  ('liana_api', 'Mobile Legends API', 'Automated diamond delivery via Liana API for Mobile Legends orders', 'api_service', 'Requires Liana API subscription', 'Liana API'),
  ('payment_gateway', 'Online Payment Gateway', 'eSewa/Khalti payment processing for credit top-ups', 'api_service', 'Payment gateway transaction fees apply', 'eSewa/Khalti API'),
  ('push_notifications', 'Push Notifications', 'Real-time push notifications for orders, payments, and alerts', 'api_service', 'Requires VAPID keys and web-push service', 'Web Push API'),
  ('promotion_system', 'Promotion & Coupon System', 'Automated coupon generation, referral rewards, and milestone tracking', 'internal', 'No external cost — runs on database triggers', 'Supabase Functions');
