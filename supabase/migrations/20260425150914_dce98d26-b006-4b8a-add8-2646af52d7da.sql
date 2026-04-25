-- =========================================================================
-- TOURNAMENTS PRODUCT v2 — escrow wallet, settings, ledger, revenue
-- =========================================================================

-- 1. Profiles: held_balance for escrow
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS held_balance NUMERIC NOT NULL DEFAULT 0;

-- 2. Tournaments: financial fields
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS host_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS prize_pool NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS winner_prize NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_start_at TIMESTAMPTZ;

-- 3. Tournament settings (singleton)
CREATE TABLE IF NOT EXISTS public.tournament_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_commission_percent NUMERIC NOT NULL DEFAULT 10,
  min_entry_fee NUMERIC NOT NULL DEFAULT 10,
  max_entry_fee NUMERIC NOT NULL DEFAULT 10000,
  host_fee_flat NUMERIC NOT NULL DEFAULT 50,
  host_fee_percent NUMERIC NOT NULL DEFAULT 0,
  withdrawal_fee_percent NUMERIC NOT NULL DEFAULT 2,
  min_withdrawal_npr NUMERIC NOT NULL DEFAULT 200,
  coin_to_npr_rate NUMERIC NOT NULL DEFAULT 1,
  premium_boost_price NUMERIC NOT NULL DEFAULT 100,
  allow_user_creation BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.tournament_settings (id)
  SELECT gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM public.tournament_settings);

ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings readable by everyone" ON public.tournament_settings;
CREATE POLICY "settings readable by everyone" ON public.tournament_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings updatable by admins" ON public.tournament_settings;
CREATE POLICY "settings updatable by admins" ON public.tournament_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Ledger
CREATE TABLE IF NOT EXISTS public.tournament_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tournament_id UUID,
  type TEXT NOT NULL CHECK (type IN ('escrow_lock','escrow_release','prize_credit','commission','host_fee','refund','withdrawal','boost')),
  balance_kind TEXT NOT NULL CHECK (balance_kind IN ('balance','held','winnings')),
  amount NUMERIC NOT NULL,
  balance_before NUMERIC,
  balance_after NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.tournament_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_tournament ON public.tournament_ledger(tournament_id);

ALTER TABLE public.tournament_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own ledger" ON public.tournament_ledger;
CREATE POLICY "users read own ledger" ON public.tournament_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 5. Platform revenue
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('commission','host_fee','withdrawal_fee','boost')),
  tournament_id UUID,
  user_id UUID,
  amount NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON public.platform_revenue(created_at DESC);
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "revenue admin only" ON public.platform_revenue;
CREATE POLICY "revenue admin only" ON public.platform_revenue FOR SELECT USING (public.is_admin());

-- 6. Boosts
CREATE TABLE IF NOT EXISTS public.tournament_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  paid_by UUID NOT NULL,
  amount NUMERIC NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tournament_boosts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boosts public read" ON public.tournament_boosts;
CREATE POLICY "boosts public read" ON public.tournament_boosts FOR SELECT USING (true);

-- =========================================================================
-- 7. RPC FUNCTIONS — atomic, ledger-backed
-- =========================================================================

-- helper: write a ledger row
CREATE OR REPLACE FUNCTION public._tournament_ledger(
  _user UUID, _tournament UUID, _type TEXT, _kind TEXT,
  _amount NUMERIC, _before NUMERIC, _after NUMERIC, _meta JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.tournament_ledger(user_id, tournament_id, type, balance_kind, amount, balance_before, balance_after, metadata)
  VALUES (_user, _tournament, _type, _kind, _amount, _before, _after, COALESCE(_meta,'{}'::jsonb));
$$;

-- create_tournament_v2 (with host fee escrow)
CREATE OR REPLACE FUNCTION public.create_tournament_v2(
  p_name TEXT, p_game TEXT, p_game_mode TEXT, p_description TEXT,
  p_room_id TEXT, p_password TEXT,
  p_entry_fee NUMERIC, p_max_players INTEGER,
  p_starts_at TIMESTAMPTZ, p_auto_start BOOLEAN DEFAULT false
) RETURNS public.tournaments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_settings tournament_settings%ROWTYPE;
  v_host_fee NUMERIC;
  v_balance NUMERIC;
  v_t tournaments%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_settings FROM tournament_settings LIMIT 1;
  IF NOT v_settings.allow_user_creation AND NOT is_admin() THEN
    RAISE EXCEPTION 'Match hosting is currently disabled';
  END IF;
  IF p_entry_fee < v_settings.min_entry_fee OR p_entry_fee > v_settings.max_entry_fee THEN
    RAISE EXCEPTION 'Entry fee must be between % and % coins', v_settings.min_entry_fee, v_settings.max_entry_fee;
  END IF;

  v_host_fee := v_settings.host_fee_flat + ROUND(p_entry_fee * v_settings.host_fee_percent / 100.0, 2);

  -- lock & deduct host fee from creator's balance into held_balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user FOR UPDATE;
  IF v_balance < v_host_fee THEN
    RAISE EXCEPTION 'Insufficient coins to host. Need %, have %.', v_host_fee, v_balance;
  END IF;
  UPDATE profiles SET balance = balance - v_host_fee, held_balance = held_balance + v_host_fee WHERE id = v_user;

  INSERT INTO tournaments (
    name, game, game_mode, description, room_id, password,
    entry_fee, prize, max_players, current_players,
    status, room_status, created_by, starts_at, auto_start_at,
    host_fee, commission_percent, prize_pool
  ) VALUES (
    p_name, p_game, COALESCE(p_game_mode,'1v1'), p_description, p_room_id, p_password,
    p_entry_fee, 0, COALESCE(p_max_players,4), 0,
    'upcoming','waiting', v_user, p_starts_at,
    CASE WHEN p_auto_start THEN p_starts_at ELSE NULL END,
    v_host_fee, v_settings.default_commission_percent, v_host_fee
  ) RETURNING * INTO v_t;

  PERFORM _tournament_ledger(v_user, v_t.id, 'host_fee','held', v_host_fee, v_balance, v_balance - v_host_fee,
    jsonb_build_object('action','host_fee_lock'));

  RETURN v_t;
END;
$$;

-- join_tournament (rewrite — escrow)
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_t tournaments%ROWTYPE;
  v_balance NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.status NOT IN ('upcoming') THEN RAISE EXCEPTION 'Tournament not open for joining'; END IF;
  IF v_t.current_players >= v_t.max_players THEN RAISE EXCEPTION 'Room is full'; END IF;
  IF EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Already joined this tournament';
  END IF;

  SELECT balance INTO v_balance FROM profiles WHERE id = v_user FOR UPDATE;
  IF v_balance < v_t.entry_fee THEN
    RAISE EXCEPTION 'Insufficient IG Coins. Need %, have %.', v_t.entry_fee, v_balance;
  END IF;

  UPDATE profiles SET balance = balance - v_t.entry_fee, held_balance = held_balance + v_t.entry_fee WHERE id = v_user;
  INSERT INTO tournament_participants (tournament_id, user_id, result, coins_won) VALUES (p_tournament_id, v_user, 'pending', 0);
  UPDATE tournaments SET prize_pool = prize_pool + v_t.entry_fee WHERE id = p_tournament_id;

  PERFORM _tournament_ledger(v_user, p_tournament_id, 'escrow_lock','held', v_t.entry_fee, v_balance, v_balance - v_t.entry_fee,
    jsonb_build_object('action','join_entry_fee'));

  RETURN json_build_object('success', true, 'entry_fee', v_t.entry_fee);
END;
$$;

-- leave_tournament (refund from held back to balance)
CREATE OR REPLACE FUNCTION public.leave_tournament(p_tournament_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_t tournaments%ROWTYPE;
  v_held NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.status <> 'upcoming' THEN RAISE EXCEPTION 'Cannot leave once tournament has started'; END IF;
  IF NOT EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'You have not joined this tournament';
  END IF;

  DELETE FROM tournament_participants WHERE tournament_id = p_tournament_id AND user_id = v_user;
  SELECT held_balance INTO v_held FROM profiles WHERE id = v_user FOR UPDATE;
  UPDATE profiles SET held_balance = held_balance - v_t.entry_fee, balance = balance + v_t.entry_fee WHERE id = v_user;
  UPDATE tournaments SET prize_pool = GREATEST(prize_pool - v_t.entry_fee, 0) WHERE id = p_tournament_id;

  PERFORM _tournament_ledger(v_user, p_tournament_id, 'refund','balance', v_t.entry_fee, v_held, v_held - v_t.entry_fee,
    jsonb_build_object('action','leave_refund'));

  RETURN json_build_object('success', true, 'refunded', v_t.entry_fee);
END;
$$;

-- finish_tournament_v2 (replaces v1 logic)
CREATE OR REPLACE FUNCTION public.finish_tournament(p_tournament_id UUID, p_winner_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_t tournaments%ROWTYPE;
  v_pool NUMERIC; v_commission NUMERIC; v_winner_prize NUMERIC;
  r RECORD;
  v_held_winner NUMERIC;
  v_creator_held NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.created_by <> v_user AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only the creator or admin can finish this tournament';
  END IF;
  IF v_t.status NOT IN ('upcoming','live') THEN RAISE EXCEPTION 'Tournament already finished'; END IF;
  IF NOT EXISTS (SELECT 1 FROM tournament_participants WHERE tournament_id = p_tournament_id AND user_id = p_winner_user_id) THEN
    RAISE EXCEPTION 'Winner is not a participant';
  END IF;

  v_pool := v_t.prize_pool;
  v_commission := ROUND(v_pool * v_t.commission_percent / 100.0, 2);
  v_winner_prize := v_pool - v_commission;

  -- Drain each participant's escrow (entry_fee)
  FOR r IN SELECT user_id FROM tournament_participants WHERE tournament_id = p_tournament_id LOOP
    UPDATE profiles SET held_balance = GREATEST(held_balance - v_t.entry_fee, 0) WHERE id = r.user_id;
    PERFORM _tournament_ledger(r.user_id, p_tournament_id, 'escrow_release','held', v_t.entry_fee, NULL, NULL,
      jsonb_build_object('action','release_entry_fee'));
  END LOOP;

  -- Drain creator's host_fee escrow
  IF v_t.host_fee > 0 THEN
    UPDATE profiles SET held_balance = GREATEST(held_balance - v_t.host_fee, 0) WHERE id = v_t.created_by;
    PERFORM _tournament_ledger(v_t.created_by, p_tournament_id, 'escrow_release','held', v_t.host_fee, NULL, NULL,
      jsonb_build_object('action','release_host_fee'));
    INSERT INTO platform_revenue(source, tournament_id, user_id, amount, metadata)
      VALUES ('host_fee', p_tournament_id, v_t.created_by, v_t.host_fee, '{}'::jsonb);
  END IF;

  -- Credit prize to winner
  SELECT winnings_balance INTO v_held_winner FROM profiles WHERE id = p_winner_user_id FOR UPDATE;
  UPDATE profiles SET winnings_balance = winnings_balance + v_winner_prize WHERE id = p_winner_user_id;
  PERFORM _tournament_ledger(p_winner_user_id, p_tournament_id, 'prize_credit','winnings', v_winner_prize, v_held_winner, v_held_winner + v_winner_prize,
    jsonb_build_object('action','prize'));

  -- Commission revenue
  IF v_commission > 0 THEN
    INSERT INTO platform_revenue(source, tournament_id, user_id, amount, metadata)
      VALUES ('commission', p_tournament_id, p_winner_user_id, v_commission,
        jsonb_build_object('pool', v_pool, 'percent', v_t.commission_percent));
  END IF;

  -- Mark participants
  UPDATE tournament_participants
    SET result = CASE WHEN user_id = p_winner_user_id THEN 'won' ELSE 'lost' END,
        coins_won = CASE WHEN user_id = p_winner_user_id THEN v_winner_prize ELSE 0 END
    WHERE tournament_id = p_tournament_id;

  UPDATE tournaments
    SET status='finished', room_status='finished', finished_at=now(),
        prize = v_winner_prize, winner_prize = v_winner_prize, commission_amount = v_commission
    WHERE id = p_tournament_id;

  PERFORM create_user_notification(p_winner_user_id, '🏆 You won a tournament!',
    'You won ' || v_winner_prize || ' IG Coins in ' || v_t.name || '. Withdraw anytime from Wallet.', 'general');

  RETURN json_build_object('success', true, 'prize_pool', v_pool, 'commission', v_commission, 'winner_prize', v_winner_prize);
END;
$$;

-- cancel_tournament_admin — full refund of held coins
CREATE OR REPLACE FUNCTION public.cancel_tournament_admin(p_tournament_id UUID, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_t tournaments%ROWTYPE;
  r RECORD;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO v_t FROM tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_t.status = 'finished' THEN RAISE EXCEPTION 'Cannot cancel finished tournament'; END IF;

  FOR r IN SELECT user_id FROM tournament_participants WHERE tournament_id = p_tournament_id LOOP
    UPDATE profiles SET held_balance = GREATEST(held_balance - v_t.entry_fee,0), balance = balance + v_t.entry_fee WHERE id = r.user_id;
    PERFORM _tournament_ledger(r.user_id, p_tournament_id, 'refund','balance', v_t.entry_fee, NULL, NULL,
      jsonb_build_object('action','admin_cancel_refund','reason',p_reason));
    PERFORM create_user_notification(r.user_id, 'Tournament cancelled',
      'Your entry fee of ' || v_t.entry_fee || ' coins has been refunded for ' || v_t.name || '. Reason: ' || COALESCE(p_reason,'N/A'), 'general');
  END LOOP;

  -- Refund host fee to creator
  IF v_t.host_fee > 0 THEN
    UPDATE profiles SET held_balance = GREATEST(held_balance - v_t.host_fee,0), balance = balance + v_t.host_fee WHERE id = v_t.created_by;
    PERFORM _tournament_ledger(v_t.created_by, p_tournament_id, 'refund','balance', v_t.host_fee, NULL, NULL,
      jsonb_build_object('action','admin_cancel_host_refund'));
  END IF;

  UPDATE tournaments SET status='canceled', room_status='finished', finished_at=now() WHERE id = p_tournament_id;
  RETURN json_build_object('success', true);
END;
$$;

-- process_withdrawal_admin
CREATE OR REPLACE FUNCTION public.process_withdrawal_admin(p_withdrawal_id UUID, p_action TEXT, p_remarks TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_w tournament_withdrawals%ROWTYPE;
  v_settings tournament_settings%ROWTYPE;
  v_fee NUMERIC := 0;
  v_winnings NUMERIC;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF p_action NOT IN ('processed','rejected') THEN RAISE EXCEPTION 'Invalid action'; END IF;

  SELECT * INTO v_w FROM tournament_withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_w.status <> 'pending' THEN RAISE EXCEPTION 'Already processed'; END IF;

  SELECT * INTO v_settings FROM tournament_settings LIMIT 1;

  IF p_action = 'processed' THEN
    -- deduct from winnings_balance now
    SELECT winnings_balance INTO v_winnings FROM profiles WHERE id = v_w.user_id FOR UPDATE;
    IF v_winnings < v_w.amount_coins THEN
      RAISE EXCEPTION 'User has insufficient winnings (% < %)', v_winnings, v_w.amount_coins;
    END IF;
    v_fee := ROUND(v_w.amount_coins * v_settings.withdrawal_fee_percent / 100.0, 2);
    UPDATE profiles SET winnings_balance = winnings_balance - v_w.amount_coins WHERE id = v_w.user_id;
    PERFORM _tournament_ledger(v_w.user_id, NULL, 'withdrawal','winnings', v_w.amount_coins, v_winnings, v_winnings - v_w.amount_coins,
      jsonb_build_object('withdrawal_id', v_w.id, 'method', v_w.method, 'fee', v_fee));
    IF v_fee > 0 THEN
      INSERT INTO platform_revenue(source, user_id, amount, metadata) VALUES ('withdrawal_fee', v_w.user_id, v_fee, jsonb_build_object('withdrawal_id', v_w.id));
    END IF;
    UPDATE tournament_withdrawals SET status='processed', admin_remarks=p_remarks, processed_at=now() WHERE id=p_withdrawal_id;
    PERFORM create_user_notification(v_w.user_id, 'Withdrawal processed',
      'Your withdrawal of ' || v_w.amount_coins || ' coins (Rs.' || v_w.amount_npr || ') has been processed.', 'payment');
  ELSE
    UPDATE tournament_withdrawals SET status='rejected', admin_remarks=p_remarks, processed_at=now() WHERE id=p_withdrawal_id;
    PERFORM create_user_notification(v_w.user_id, 'Withdrawal rejected',
      'Your withdrawal request was rejected. ' || COALESCE(p_remarks,''), 'payment');
  END IF;

  RETURN json_build_object('success', true, 'fee', v_fee);
END;
$$;

-- enable realtime for new fields
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;