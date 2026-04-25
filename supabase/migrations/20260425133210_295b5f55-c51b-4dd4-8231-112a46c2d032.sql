
-- Local updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.tournaments_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN CREATE TYPE public.tournament_status AS ENUM ('upcoming','live','finished','canceled');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.participant_result AS ENUM ('pending','won','lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.report_status AS ENUM ('review','resolved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.withdrawal_status AS ENUM ('pending','processed','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  game text NOT NULL,
  room_id text NOT NULL,
  password text NOT NULL,
  prize numeric NOT NULL DEFAULT 0,
  entry_fee numeric NOT NULL DEFAULT 0,
  status public.tournament_status NOT NULL DEFAULT 'upcoming',
  starts_at timestamptz,
  finished_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator ON public.tournaments(created_by);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_auth" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tournaments_insert_own" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tournaments_update_owner_or_admin" ON public.tournaments FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "tournaments_delete_admin" ON public.tournaments FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  result public.participant_result NOT NULL DEFAULT 'pending',
  coins_won numeric NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON public.tournament_participants(tournament_id);
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tp_select_auth" ON public.tournament_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tp_insert_own" ON public.tournament_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_update_admin" ON public.tournament_participants FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "tp_delete_own_or_admin" ON public.tournament_participants FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.tournament_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  match_name text NOT NULL,
  reason text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'review',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.tournament_reports(user_id);
ALTER TABLE public.tournament_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_select_own_or_admin" ON public.tournament_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "tr_insert_own" ON public.tournament_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tr_update_admin" ON public.tournament_reports FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.tournament_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  amount_coins numeric NOT NULL,
  amount_npr numeric NOT NULL,
  method text NOT NULL,
  account_detail text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.tournament_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.tournament_withdrawals(status);
ALTER TABLE public.tournament_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tw_select_own_or_admin" ON public.tournament_withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "tw_insert_own" ON public.tournament_withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tw_update_admin" ON public.tournament_withdrawals FOR UPDATE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER trg_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.tournaments_set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.tournament_reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.tournament_reports
  FOR EACH ROW EXECUTE FUNCTION public.tournaments_set_updated_at();
