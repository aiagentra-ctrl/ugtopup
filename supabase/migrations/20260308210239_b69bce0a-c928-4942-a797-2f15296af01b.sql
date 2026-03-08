
-- Page views tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  page_path text NOT NULL,
  page_title text,
  referrer text,
  traffic_source text NOT NULL DEFAULT 'direct',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);
CREATE INDEX idx_page_views_traffic_source ON public.page_views (traffic_source);

-- Visitor sessions tracking table
CREATE TABLE public.visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid,
  traffic_source text NOT NULL DEFAULT 'direct',
  referrer text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  page_count integer NOT NULL DEFAULT 1,
  is_bounce boolean NOT NULL DEFAULT true
);

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view visitor sessions"
  ON public.visitor_sessions FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can insert visitor sessions"
  ON public.visitor_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own session"
  ON public.visitor_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_visitor_sessions_last_active ON public.visitor_sessions (last_active_at DESC);
CREATE INDEX idx_visitor_sessions_started_at ON public.visitor_sessions (started_at DESC);
