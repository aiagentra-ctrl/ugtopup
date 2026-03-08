
-- Wallet activity log table for tracking coin usage per order
CREATE TABLE public.wallet_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.product_orders(id) ON DELETE SET NULL,
  liana_order_id uuid REFERENCES public.liana_orders(id) ON DELETE SET NULL,
  order_number text,
  action text NOT NULL, -- 'order_placed', 'order_failed', 'balance_check'
  coins_used numeric DEFAULT 0,
  balance_before numeric,
  balance_after numeric,
  api_status text,
  api_response jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wallet activity logs"
  ON public.wallet_activity_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add index for fast lookups
CREATE INDEX idx_wallet_activity_logs_created_at ON public.wallet_activity_logs (created_at DESC);
CREATE INDEX idx_wallet_activity_logs_order_id ON public.wallet_activity_logs (order_id);
