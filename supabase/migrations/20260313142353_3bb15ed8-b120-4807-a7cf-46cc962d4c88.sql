
-- WhatsApp configuration table (single row)
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  instance_name text NOT NULL DEFAULT 'ugc-topup',
  server_url text,
  api_key text,
  webhook_url text,
  connected_number text,
  connection_status text NOT NULL DEFAULT 'disconnected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp config" ON public.whatsapp_config
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update whatsapp config" ON public.whatsapp_config
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default config
INSERT INTO public.whatsapp_config (instance_name, server_url, api_key, webhook_url, connection_status)
VALUES (
  'ugc-topup',
  'http://evo-o8c08sckkkc8ws40o8cks80g.88.222.245.219.sslip.io',
  's7bThCSUjVpXF5gPaGwVI8R4S37vSInR',
  'https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/whatsapp-webhook',
  'disconnected'
);

-- WhatsApp message logs
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message text NOT NULL,
  session_id text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (public.is_admin());

-- Index for quick lookups
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages (phone_number, created_at DESC);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages (created_at DESC);
