# Free Fire Tournaments — Real Product-Level System

This plan turns the current tournament feature into a true competitive-gaming product with a wallet/escrow engine, a prize-pool calculator, configurable commission, withdrawals, and a full admin command center.

---

## 1. Money Model (Wallet, Escrow, Winnings)

Three distinct balances on `profiles`:

| Field | Meaning | Withdrawable? |
|---|---|---|
| `balance` | Deposited IG Coins (top-ups) | ❌ |
| `held_balance` *(NEW)* | Coins locked in pending/live tournaments (entry fee + creator's host fee) | ❌ |
| `winnings_balance` *(existing)* | Prize money won from tournaments | ✅ |

**Escrow rule:** When a user joins or hosts, their coins move `balance → held_balance`. On finish: held funds are released — winner's share moves to `winnings_balance`, commission moves to platform, losers' held coins are simply consumed (already paid in).

---

## 2. Database Schema Migration

### A. Extend `profiles`
- Add `held_balance NUMERIC NOT NULL DEFAULT 0`.

### B. Extend `tournaments`
- `host_fee NUMERIC DEFAULT 0` — coins deducted from creator at creation (held in escrow).
- `commission_percent NUMERIC DEFAULT 10` — snapshot of platform fee at creation time.
- `prize_pool NUMERIC DEFAULT 0` — auto-computed: `host_fee + (entry_fee * current_players)`.
- `commission_amount NUMERIC DEFAULT 0` — finalized at `finish_tournament`.
- `winner_prize NUMERIC DEFAULT 0` — finalized at `finish_tournament`.
- `auto_start_at TIMESTAMPTZ` — for scheduled match start.

### C. New table `tournament_settings` (singleton, admin-managed)
```
id, default_commission_percent, min_entry_fee, max_entry_fee,
host_fee_flat, host_fee_percent,
withdrawal_fee_percent, min_withdrawal_npr, coin_to_npr_rate,
premium_boost_price, allow_user_creation, updated_at
```

### D. New table `tournament_ledger` (audit trail of every coin movement)
```
id, user_id, tournament_id, type ('escrow_lock' | 'escrow_release' |
'prize_credit' | 'commission' | 'host_fee' | 'refund' | 'withdrawal'),
amount, balance_before, balance_after, balance_kind ('balance'|'held'|'winnings'),
metadata jsonb, created_at
```

### E. New table `platform_revenue` (commission + fees earned)
```
id, source ('commission'|'host_fee'|'withdrawal_fee'|'boost'),
tournament_id, amount, created_at
```

### F. New table `tournament_boosts` (premium feature highlight)
```
id, tournament_id, paid_by, amount, expires_at, created_at
```

---

## 3. Atomic RPC Functions (rebuild)

All money flows go through `SECURITY DEFINER` functions with `FOR UPDATE` locking and ledger writes.

1. **`create_tournament_v2(...)`** — validates settings, deducts host_fee from creator's `balance` → `held_balance`, snapshots commission %, writes ledger row.
2. **`join_tournament` (rewrite)** — moves entry_fee from `balance` → `held_balance`, increments `prize_pool`, writes ledger.
3. **`leave_tournament` (rewrite)** — only allowed while `upcoming` and `auto_start_at` is in the future; releases held back to `balance`.
4. **`start_tournament` (rewrite)** — sets `room_status='ongoing'`, broadcasts room credentials, prevents further joins.
5. **`finish_tournament_v2(tournament_id, winner_user_id)`** —
   - Compute `commission_amount = round(prize_pool * commission_percent / 100)`.
   - `winner_prize = prize_pool - commission_amount`.
   - For each participant: drain their entry_fee from `held_balance` (it was already there).
   - Drain creator's `host_fee` from their `held_balance`.
   - Credit `winner_prize` to winner's `winnings_balance`.
   - Insert `platform_revenue` row for commission and host_fee.
   - Mark losers' `result='lost'`, winner `result='won', coins_won=winner_prize`.
   - Notify all participants.
6. **`cancel_tournament(tournament_id, reason)`** — admin-only; refunds all held coins to participants and creator.
7. **`process_withdrawal(withdrawal_id, action, remarks)`** — admin processes payout, applies `withdrawal_fee_percent`.

All of these append rows to `tournament_ledger`.

---

## 4. RLS Policies

- `tournament_ledger`: users can SELECT only their own rows; admins all (via `is_admin()`).
- `tournament_settings`: SELECT public; UPDATE admin only.
- `platform_revenue`: admin only.
- `tournament_boosts`: SELECT public; INSERT only via RPC.

---

## 5. Frontend — User-Facing Changes

### A. Wallet display (3-balance model)
Update `useLiveBalance`, add `useHeldBalance` hook. The header / dashboard wallet card now shows:

```
Available    Held in matches    Winnings (withdrawable)
  1,250            450                  2,300
```

Files: `src/components/dashboard/CreditBalanceCard.tsx`, `src/components/tournaments/WalletTab.tsx`, `src/pages/tournaments/TournamentWalletPage.tsx`.

### B. Tournament card / detail drawer
Add explicit rows: **Entry fee**, **Prize pool (live)**, **Commission %**, **Winner takes**. `TournamentCard.tsx` and `TournamentDetailDrawer.tsx` recompute on every realtime tick.

### C. `CreateMatchPage` (rewrite step 2)
- Show live calculator: *prize pool = host_fee + entry × players*; *winner gets = prize_pool × (1 − commission%)*; commission preview pulled from `tournament_settings`.
- Validate against `min_entry_fee` / `max_entry_fee`.
- "Schedule start at" field → fills `auto_start_at`.

### D. Live match flow
On `start_tournament`, room credentials become visible to participants (drawer already supports this — wired to new realtime payload). Add a 5-minute pre-start countdown banner and push notification.

### E. Withdrawal page
Show `winnings_balance`, NPR conversion using `coin_to_npr_rate`, fee preview, and history. Disable button when `< min_withdrawal_npr`.

### F. New `useHeldBalance.ts` hook
Mirrors `useWinningsBalance` pattern, subscribes to `profiles.held_balance`.

---

## 6. Admin Panel — New Section "Tournaments"

Add a new top-level admin sidebar group `tournaments` with 8 sub-views, each a new component under `src/components/admin/tournaments/`:

| Section key | Component | Purpose |
|---|---|---|
| `tournaments-dashboard` | `TournamentDashboard.tsx` | KPIs: revenue today, active matches, total held coins, withdrawals pending, commission earned |
| `tournaments-list` | `TournamentManager.tsx` | Full CRUD list, force-cancel with refund, edit room creds |
| `tournaments-participants` | `TournamentParticipants.tsx` | Drill into a match: roster, mark winner, kick player (with refund) |
| `tournaments-wallets` | `WalletOverview.tsx` | Per-user balance / held / winnings table |
| `tournaments-ledger` | `LedgerViewer.tsx` | Searchable audit trail (user, type, amount, date) |
| `tournaments-withdrawals` | `WithdrawalQueue.tsx` | Approve/reject queue with applied fees |
| `tournaments-revenue` | `RevenueDashboard.tsx` | Commission/host-fee/boost charts |
| `tournaments-reports` | `DisputeManager.tsx` | Resolve `tournament_reports`, can trigger refund |
| `tournaments-settings` | `TournamentSettingsPanel.tsx` | Edit `tournament_settings` (commission %, fees, rates, on/off switches) |

Wire them in `src/pages/AdminPanel.tsx` (new switch cases) and `src/components/admin/AdminLayout.tsx` (sidebar entries with a `Trophy` icon group).

---

## 7. Realtime + Notifications

- Subscribe admin dashboard channels to `tournament_withdrawals` (new pending) and `tournament_reports` for live alerts.
- DB trigger on `tournaments` status change (`upcoming → live`) → push notification to participants with room creds reminder.
- DB trigger on `finish_tournament_v2` → push to winner with prize amount.

---

## 8. Edge Function (optional automation)

`supabase/functions/tournament-auto-start/index.ts` — pg_cron-invoked every minute; finds tournaments where `auto_start_at <= now()` and `status='upcoming'`, calls `start_tournament` server-side. Keeps schedule reliable even when creator is offline.

---

## 9. Code Changes Summary

**New files**
- `supabase/migrations/<ts>_tournament_product_v2.sql`
- `src/hooks/useHeldBalance.ts`
- `src/lib/tournamentAdminApi.ts` (admin-side queries / mutations)
- `src/components/admin/tournaments/{TournamentDashboard,TournamentManager,TournamentParticipants,WalletOverview,LedgerViewer,WithdrawalQueue,RevenueDashboard,DisputeManager,TournamentSettingsPanel}.tsx`
- `supabase/functions/tournament-auto-start/index.ts`

**Edited files**
- `src/lib/tournamentsApi.ts` — new fields, new functions (`fetchSettings`, `cancelTournament`, ledger queries).
- `src/integrations/supabase/types.ts` — auto-regenerated.
- `src/components/tournaments/{TournamentCard,TournamentDetailDrawer,WalletTab,WithdrawModal}.tsx` — surface prize-pool / commission / held balance.
- `src/pages/tournaments/{CreateMatchPage,TournamentWalletPage,JoinTournamentPage,MyGamesPage,TournamentsHub}.tsx` — wire new data.
- `src/pages/AdminPanel.tsx` + `src/components/admin/AdminLayout.tsx` — register the 9 new admin sections.
- `src/components/dashboard/CreditBalanceCard.tsx` — show held + winnings inline (small footer chips).

---

## 10. Verification

After implementation:
1. Run Supabase linter (RLS coverage on all new tables).
2. Type-check (`tsc --noEmit`).
3. Manual flow: deposit → create match (host fee held) → 3 users join (entry fee held) → start → finish → confirm winner gets `prize_pool × (1−commission%)` in `winnings_balance`, platform_revenue rows match, ledger reconciles.

---

**Outcome:** A production-grade tournament platform — strict escrow accounting, configurable revenue model, real-time UX, and a complete admin control room — that can be reused across Free Fire, ML, PUBG, and any future title.
