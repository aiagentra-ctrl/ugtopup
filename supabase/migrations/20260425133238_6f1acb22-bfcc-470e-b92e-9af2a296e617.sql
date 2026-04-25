
-- Fix search_path warning
CREATE OR REPLACE FUNCTION public.tournaments_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Tighten admin-only UPDATE policies (remove permissive USING(true) pattern by ensuring is_admin gate is the WHOLE condition; linter flagged because UPDATE without a row-level filter is broad. Adding explicit WITH CHECK.)
DROP POLICY IF EXISTS "tp_update_admin" ON public.tournament_participants;
CREATE POLICY "tp_update_admin" ON public.tournament_participants
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tr_update_admin" ON public.tournament_reports;
CREATE POLICY "tr_update_admin" ON public.tournament_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tw_update_admin" ON public.tournament_withdrawals;
CREATE POLICY "tw_update_admin" ON public.tournament_withdrawals
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tournaments_update_owner_or_admin" ON public.tournaments;
CREATE POLICY "tournaments_update_owner_or_admin" ON public.tournaments
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());
