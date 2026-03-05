
-- Create chatbot_settings table (single-row config)
CREATE TABLE public.chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  webhook_url text DEFAULT 'https://n8n.aiagentra.com/webhook/chatbot',
  welcome_message text DEFAULT '👋 Hi! I''m UIQ, your AI assistant at UGC-Topup.

I can help you with:
• Product information
• Order tracking
• Account questions
• General support

What would you like to know?',
  button1_label text DEFAULT 'Basic Question / FAQ',
  button1_enabled boolean DEFAULT true,
  button2_label text DEFAULT 'Track Your Order',
  button2_enabled boolean DEFAULT true,
  button3_label text DEFAULT 'Prepaid / Payment',
  button3_enabled boolean DEFAULT true,
  payment_help_message text DEFAULT '## Payment Instructions

### QR Payment
Scan our QR code to make payment directly.

### Manual Transfer
Send payment to our account and upload screenshot.

### Need Help?
Contact us on WhatsApp for payment assistance.',
  order_track_prompt text DEFAULT 'Please enter your Order ID or email to track your order.',
  gmail_fallback_enabled boolean DEFAULT false,
  gmail_fallback_email text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Anyone can view chatbot settings"
  ON public.chatbot_settings FOR SELECT
  USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage chatbot settings"
  ON public.chatbot_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_settings;

-- Seed initial row
INSERT INTO public.chatbot_settings (id) VALUES (gen_random_uuid());

-- Auto-update updated_at
CREATE TRIGGER handle_chatbot_settings_updated_at
  BEFORE UPDATE ON public.chatbot_settings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
