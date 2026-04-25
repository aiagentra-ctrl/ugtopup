
-- 1. Schema additions
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS current_players integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_status text NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT '1v1';

CREATE INDEX IF NOT EXISTS idx_tournaments_status_starts_at ON public.tournaments(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tid ON public.tournament_participants(tournament_id);

-- 2. Trigger: maintain current_players + room_status
CREATE OR REPLACE FUNCTION public.sync_tournament_room_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tid uuid;
  v_count int;
  v_max int;
  v_status text;
BEGIN
  v_tid := COALESCE(NEW.tournament_id, OLD.tournament_id);
  SELECT COUNT(*) INTO v_count FROM tournament_participants WHERE tournament_id = v_tid;
  SELECT max_players, status INTO v_max, v_status FROM tournaments WHERE id = v_tid;
  UPDATE tournaments
  SET current_players = v_count,
      room_status = CASE
        WHEN v_status = 'finished' THEN 'finished'
        WHEN v_status = 'live' THEN 'ongoing'
        WHEN v_count >= v_max THEN 'full'
        ELSE 'waiting'
      END
  WHERE id = v_tid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_room_status_ins ON public.tournament_participants;
DROP TRIGGER IF EXISTS trg_sync_room_status_del ON public.tournament_participants;
CREATE TRIGGER trg_sync_room_status_ins AFTER INSERT ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_tournament_room_status();
CREATE TRIGGER trg_sync_room_status_del AFTER DELETE ON public.tournament_participants
  FOR EACH ROW EXECUTE FUNCTION public.sync_tournament_room_status();

-- 3. RPC: join_tournament
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_t tournaments%ROWTYPE;
  v_balance numeric;
  v_existing int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.status NOT IN ('upcoming','live') THEN RAISE EXCEPTION 'Tournament not open for joining'; END IF;
  IF v_t.current_players >= v_t.max_players THEN RAISE EXCEPTION 'Room is full'; END IF;

  SELECT COUNT(*) INTO v_existing FROM tournament_participants
    WHERE tournament_id = p_tournament_id AND user_id = v_user;
  IF v_existing > 0 THEN RAISE EXCEPTION 'Already joined this tournament'; END IF;

  SELECT balance INTO v_balance FROM profiles WHERE id = v_user FOR UPDATE;
  IF v_balance < v_t.entry_fee THEN
    RAISE EXCEPTION 'Insufficient IG Coins. Need %, have %.', v_t.entry_fee, v_balance;
  END IF;

  UPDATE profiles SET balance = balance - v_t.entry_fee WHERE id = v_user;
  INSERT INTO tournament_participants (tournament_id, user_id, result, coins_won)
    VALUES (p_tournament_id, v_user, 'pending', 0);

  RETURN json_build_object('success', true, 'message', 'Joined tournament', 'entry_fee', v_t.entry_fee);
END;
$$;

-- 4. RPC: leave_tournament
CREATE OR REPLACE FUNCTION public.leave_tournament(p_tournament_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_t tournaments%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.status <> 'upcoming' THEN RAISE EXCEPTION 'Cannot leave once tournament has started'; END IF;

  DELETE FROM tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user;
  UPDATE profiles SET balance = balance + v_t.entry_fee WHERE id = v_user;
  RETURN json_build_object('success', true, 'refunded', v_t.entry_fee);
END;
$$;

-- 5. RPC: start_tournament
CREATE OR REPLACE FUNCTION public.start_tournament(p_tournament_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_t tournaments%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.created_by <> v_user AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the creator can start this tournament';
  END IF;
  IF v_t.status <> 'upcoming' THEN RAISE EXCEPTION 'Tournament not in upcoming state'; END IF;

  UPDATE tournaments SET status = 'live', room_status = 'ongoing' WHERE id = p_tournament_id;
  RETURN json_build_object('success', true);
END;
$$;

-- 6. RPC: finish_tournament
CREATE OR REPLACE FUNCTION public.finish_tournament(p_tournament_id uuid, p_winner_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_user uuid := auth.uid();
  v_t tournaments%ROWTYPE;
  v_winner_exists int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.created_by <> v_user AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the creator can finish this tournament';
  END IF;
  IF v_t.status NOT IN ('upcoming','live') THEN RAISE EXCEPTION 'Tournament already finished'; END IF;

  SELECT COUNT(*) INTO v_winner_exists FROM tournament_participants
    WHERE tournament_id = p_tournament_id AND user_id = p_winner_user_id;
  IF v_winner_exists = 0 THEN RAISE EXCEPTION 'Winner is not a participant'; END IF;

  UPDATE tournament_participants
    SET result = CASE WHEN user_id = p_winner_user_id THEN 'won' ELSE 'lost' END,
        coins_won = CASE WHEN user_id = p_winner_user_id THEN v_t.prize ELSE 0 END
    WHERE tournament_id = p_tournament_id;

  UPDATE profiles SET balance = balance + v_t.prize WHERE id = p_winner_user_id;
  UPDATE tournaments
    SET status = 'finished', room_status = 'finished', finished_at = now()
    WHERE id = p_tournament_id;

  PERFORM create_user_notification(
    p_winner_user_id,
    '🏆 You won a tournament!',
    'You won ' || v_t.prize || ' IG Coins in ' || v_t.name,
    'general'
  );
  RETURN json_build_object('success', true, 'prize', v_t.prize);
END;
$$;

-- 7. Allow viewing participant rows (so anyone can see counts / participant list)
DROP POLICY IF EXISTS "Anyone authenticated can view participants" ON public.tournament_participants;
CREATE POLICY "Anyone authenticated can view participants"
  ON public.tournament_participants FOR SELECT
  TO authenticated USING (true);
