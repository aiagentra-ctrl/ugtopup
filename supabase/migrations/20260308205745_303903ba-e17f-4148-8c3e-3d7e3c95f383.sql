
CREATE TABLE public.developer_service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NPR',
  is_active boolean NOT NULL DEFAULT true,
  billing_start_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'maintenance',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.developer_service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can manage service pricing"
  ON public.developer_service_pricing
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'developer'::app_role))
  WITH CHECK (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Admins can view service pricing"
  ON public.developer_service_pricing
  FOR SELECT
  TO authenticated
  USING (is_admin());

INSERT INTO public.developer_service_pricing (service_name, description, monthly_price, category, display_order, billing_start_date) VALUES
  ('API Maintenance', 'Liana API integration, monitoring, and uptime management', 2000, 'api', 1, CURRENT_DATE),
  ('AI Chatbot System', 'UIQ chatbot AI model hosting, prompt tuning, and conversation management', 1500, 'automation', 2, CURRENT_DATE),
  ('Automation Systems', 'Order processing automation, cleanup jobs, and scheduled tasks', 1000, 'automation', 3, CURRENT_DATE),
  ('Advanced Offer System', 'Promotion engine, coupon rules, seasonal offers management', 800, 'advanced', 4, CURRENT_DATE),
  ('Push Notification Service', 'Web push notification infrastructure and delivery', 500, 'api', 5, CURRENT_DATE),
  ('Payment Gateway Integration', 'Online payment processing, IPN handling, and transaction monitoring', 1500, 'api', 6, CURRENT_DATE);
