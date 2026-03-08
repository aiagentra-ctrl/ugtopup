
-- 1. Knowledge Base table
CREATE TABLE public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active knowledge base" ON public.knowledge_base
  FOR SELECT USING (is_active = true);

-- 2. Chatbot Feedback table
CREATE TABLE public.chatbot_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  session_id text NOT NULL,
  user_message text,
  bot_response text,
  rating text NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.chatbot_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all feedback" ON public.chatbot_feedback
  FOR SELECT TO authenticated USING (is_admin());

-- 3. Add columns to chatbot_settings
ALTER TABLE public.chatbot_settings
  ADD COLUMN IF NOT EXISTS custom_api_url text,
  ADD COLUMN IF NOT EXISTS custom_api_key_name text;
