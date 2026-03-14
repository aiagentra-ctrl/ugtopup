
-- Create whatsapp_message_flows table for 3-stage telemetry
CREATE TABLE IF NOT EXISTS public.whatsapp_message_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id text NOT NULL,
  phone_number text,
  session_id text,
  stage text NOT NULL CHECK (stage IN ('incoming_webhook', 'ai_processing', 'send_message')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'success', 'failed', 'skipped')),
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wmf_created_at ON public.whatsapp_message_flows (created_at DESC);
CREATE INDEX idx_wmf_flow_id ON public.whatsapp_message_flows (flow_id);
CREATE INDEX idx_wmf_phone_created ON public.whatsapp_message_flows (phone_number, created_at DESC);

-- RLS
ALTER TABLE public.whatsapp_message_flows ENABLE ROW LEVEL SECURITY;

-- Admin read-only
CREATE POLICY "Admins can read whatsapp_message_flows"
  ON public.whatsapp_message_flows
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
