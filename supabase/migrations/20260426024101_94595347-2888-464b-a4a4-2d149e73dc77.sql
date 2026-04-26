
-- ============================================================
-- 1. TOURNAMENT CREDENTIALS: column-level access control
-- ============================================================

-- Helper: can current user view a given tournament's room credentials?
CREATE OR REPLACE FUNCTION public.can_view_tournament_credentials(_tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = _tournament_id AND t.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.tournament_participants tp
      WHERE tp.tournament_id = _tournament_id AND tp.user_id = auth.uid()
    );
$$;

-- RPC the frontend uses to read credentials on demand
CREATE OR REPLACE FUNCTION public.get_tournament_credentials(_tournament_id uuid)
RETURNS TABLE(room_id text, password text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.can_view_tournament_credentials(_tournament_id) THEN
    RAISE EXCEPTION 'Not authorized to view tournament credentials';
  END IF;

  RETURN QUERY
    SELECT t.room_id, t.password
    FROM public.tournaments t
    WHERE t.id = _tournament_id;
END;
$$;

-- Revoke direct column access for room_id and password from public roles.
-- They can still SELECT all other columns; reads of room_id/password
-- via the table will fail unless caller is service_role / postgres.
REVOKE SELECT (room_id, password) ON public.tournaments FROM anon, authenticated;

-- Grant explicit SELECT on every other column to anon/authenticated to
-- preserve listing behavior.
GRANT SELECT (
  id, name, game, game_mode, description,
  entry_fee, prize, prize_pool, max_players, current_players,
  status, room_status, created_by, created_at, updated_at,
  starts_at, auto_start_at, finished_at,
  host_fee, commission_percent, commission_amount, winner_prize
) ON public.tournaments TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_tournament_credentials(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_tournament_credentials(uuid) TO authenticated;

-- ============================================================
-- 2. VISITOR_SESSIONS: lock down UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Anyone can update own session" ON public.visitor_sessions;

-- Block direct updates from clients entirely. Page tracking still works
-- because INSERT policy remains, and admins retain SELECT access.
-- Provide a SECURITY DEFINER function the frontend can call to upsert
-- safely without overwriting other sessions.
CREATE OR REPLACE FUNCTION public.upsert_visitor_session(
  p_session_id text,
  p_traffic_source text,
  p_referrer text,
  p_page_count integer,
  p_is_bounce boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) = 0 OR length(p_session_id) > 100 THEN
    RAISE EXCEPTION 'Invalid session id';
  END IF;

  INSERT INTO public.visitor_sessions(
    session_id, traffic_source, referrer, page_count, is_bounce, last_active_at
  ) VALUES (
    p_session_id,
    LEFT(COALESCE(p_traffic_source, 'direct'), 50),
    LEFT(COALESCE(p_referrer, ''), 500),
    GREATEST(COALESCE(p_page_count, 1), 1),
    COALESCE(p_is_bounce, true),
    now()
  )
  ON CONFLICT (session_id) DO UPDATE
  SET page_count = GREATEST(visitor_sessions.page_count, EXCLUDED.page_count),
      is_bounce = (visitor_sessions.is_bounce AND EXCLUDED.is_bounce),
      last_active_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_visitor_session(text, text, text, integer, boolean) TO anon, authenticated;

-- ============================================================
-- 3. ADMIN DASHBOARD MATERIALIZED VIEW: revoke API access
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'admin_dashboard_stats') THEN
    EXECUTE 'REVOKE ALL ON public.admin_dashboard_stats FROM anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 4. is_developer() RPC (for DeveloperRoute server-side check)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.has_role(auth.uid(), 'developer'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated;
