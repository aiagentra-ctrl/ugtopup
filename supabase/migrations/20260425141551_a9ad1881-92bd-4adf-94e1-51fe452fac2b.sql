
-- Separate tournament winnings from deposited credits
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS winnings_balance numeric NOT NULL DEFAULT 0;

-- Credit winnings to winnings_balance (NOT main credit balance)
CREATE OR REPLACE FUNCTION public.finish_tournament(p_tournament_id uuid, p_winner_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- Credit prize ONLY to winnings_balance (withdrawable)
  UPDATE profiles SET winnings_balance = winnings_balance + v_t.prize WHERE id = p_winner_user_id;

  UPDATE tournaments
    SET status = 'finished', room_status = 'finished', finished_at = now()
    WHERE id = p_tournament_id;

  PERFORM create_user_notification(
    p_winner_user_id,
    '🏆 You won a tournament!',
    'You won ' || v_t.prize || ' IG Coins in ' || v_t.name || '. Withdraw anytime from Wallet.',
    'general'
  );
  RETURN json_build_object('success', true, 'prize', v_t.prize);
END;
$function$;

-- Enforce: withdrawals can ONLY come from winnings_balance, never from deposited credits
CREATE OR REPLACE FUNCTION public.enforce_winnings_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_winnings numeric;
BEGIN
  SELECT winnings_balance INTO v_winnings FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;
  IF v_winnings IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF NEW.amount_coins <= 0 THEN RAISE EXCEPTION 'Withdrawal amount must be positive'; END IF;
  IF NEW.amount_coins > v_winnings THEN
    RAISE EXCEPTION 'You can only withdraw tournament winnings. Available: % coins (deposited credits cannot be withdrawn).', v_winnings;
  END IF;
  -- Deduct from winnings immediately to lock the amount
  UPDATE public.profiles SET winnings_balance = winnings_balance - NEW.amount_coins WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_winnings_withdrawal ON public.tournament_withdrawals;
CREATE TRIGGER trg_enforce_winnings_withdrawal
  BEFORE INSERT ON public.tournament_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_winnings_withdrawal();

-- Refund winnings if a withdrawal is rejected
CREATE OR REPLACE FUNCTION public.refund_rejected_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    UPDATE public.profiles SET winnings_balance = winnings_balance + NEW.amount_coins WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refund_rejected_withdrawal ON public.tournament_withdrawals;
CREATE TRIGGER trg_refund_rejected_withdrawal
  AFTER UPDATE OF status ON public.tournament_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.refund_rejected_withdrawal();

-- Backfill winnings_balance for users who already won prizes (best-effort: sum of coins_won minus prior withdrawals)
UPDATE public.profiles p SET winnings_balance = GREATEST(0, COALESCE((
  SELECT SUM(tp.coins_won) FROM public.tournament_participants tp WHERE tp.user_id = p.id AND tp.result = 'won'
),0) - COALESCE((
  SELECT SUM(tw.amount_coins) FROM public.tournament_withdrawals tw WHERE tw.user_id = p.id AND tw.status IN ('pending','processed')
),0));
