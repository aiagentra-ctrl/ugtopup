
CREATE TABLE chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  role text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chatbot conversations"
  ON chatbot_conversations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX idx_cc_session ON chatbot_conversations(session_id);
CREATE INDEX idx_cc_created ON chatbot_conversations(created_at);
