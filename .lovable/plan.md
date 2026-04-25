
# IG Arena — Production-Ready Tournaments Rebuild

## Goals
1. Replace all mock/static data with **real-time Supabase data** (live subscriptions).
2. Build a **dedicated Tournaments page** with browsing, joining, live status, and countdowns.
3. Redesign **My Games dashboard** as a fully functional control center.
4. Add **room capacity & lifecycle states** (Waiting → Full → Ongoing → Finished).
5. Modern gaming-style UI with animations, responsive layouts.

---

## 1. Database Schema Changes (migration)

Add columns to `tournaments` for capacity & lifecycle:
- `max_players` (int, default 4)
- `current_players` (int, default 0) — auto-maintained by trigger
- `room_status` (text: 'waiting' | 'full' | 'ongoing' | 'finished') — derived from participant count + status
- `description` (text, optional rules)
- `game_mode` (text: '1v1' | '2v2' | '4v4' | 'squad')

Add SQL functions:
- `join_tournament(p_tournament_id uuid)` — atomically deducts entry_fee from `profiles.balance`, inserts participant, increments `current_players`, flips `room_status` to 'full' when capacity reached. Returns JSON.
- `leave_tournament(p_tournament_id uuid)` — refunds entry_fee if status='upcoming', removes participant, decrements counter.
- `start_tournament(p_id uuid)` — creator/admin only, flips status to 'live' and `room_status` to 'ongoing'.
- `finish_tournament(p_id uuid, p_winner_user_id uuid)` — credits prize to winner's balance, marks participants won/lost, sets status='finished'.
- Trigger `tournament_participants_count_trg` keeps `current_players` and `room_status` in sync on insert/delete.

Notifications: reuse existing `create_user_notification` for join/start/win events.

---

## 2. API Layer (`src/lib/tournamentsApi.ts`)

Extend with:
- `joinTournament(id)`, `leaveTournament(id)`, `startTournament(id)`, `finishTournament(id, winnerId)` — RPC wrappers.
- `fetchLiveTournaments()` — live + upcoming with participant counts.
- `fetchTournamentDetail(id)` — tournament + participants list (with usernames from profiles).
- `subscribeTournaments(callback)` — Supabase realtime channel on `tournaments` + `tournament_participants` tables.
- `reportMatch({ tournament_id, reason })` — insert into `tournament_reports`.
- `fetchEarningsSummary(userId)` — sum of `coins_won` from participants table for real wins/losses/earnings stats.

Delete `src/data/tournamentsMock.ts` entirely (move only the `MatchStatus` type into `tournamentsApi.ts`).

---

## 3. New Dedicated Tournaments Page (`src/pages/Tournaments.tsx`)

Full rebuild with these sections:

### 3a. Hero header
Brand title, live counter ("X tournaments live now" — real subscription count), Create Match Room CTA, link to My Games.

### 3b. Filter/Sort bar
Game (Free Fire, PUBG, ML, Custom), status (All / Live / Upcoming / Full), entry fee range.

### 3c. Tournament Card grid (responsive 1/2/3 cols)
Each card shows:
- Game icon + tournament name + game mode chip
- **Live countdown timer** to `starts_at` (updates every second via shared `useCountdown` hook)
- Prize pool (large, accent color) and entry fee
- Player count progress bar `current_players / max_players`
- **Room status pill**: Waiting (amber pulse) / Full (red) / Ongoing (green pulse) / Finished (gray)
- Action button: **Join** (deducts coins via RPC) / **Full** (disabled) / **Watch** (live) / **Joined ✓**
- Hover/tap → opens **Tournament Detail Drawer**

### 3d. Tournament Detail Drawer/Modal
- Full info, participant list with avatars, room credentials (only visible to joined players, with auto-mask 5s reveal), countdown, leave button (if upcoming), report button.

### 3e. Real-time
Supabase subscription on `tournaments` + `tournament_participants` channels — list updates instantly when anyone joins, room fills, or status changes.

---

## 4. Redesigned My Games Dashboard (`MyGamesPanel`)

Rewrite with **real data** and these tabs (all backed by Supabase queries):

| Tab | Source | Shows |
|-----|--------|-------|
| **Overview** | aggregated | Earnings, win rate, active matches, balance |
| **Joined** | participants WHERE user_id AND status IN (upcoming,live) | live matches with countdown |
| **Created** | tournaments WHERE created_by=user | start/cancel/finish controls |
| **Ongoing** | participants WHERE tournament.status='live' | live room creds + leave |
| **Finished** | participants WHERE tournament.status='finished' | result, coins won |
| **Reported** | tournament_reports WHERE user_id | filed disputes |
| **Wallet** | profiles.balance + tournament_withdrawals + winnings tx | full history |

Each tab uses real-time subscription so status changes propagate immediately.

### Earnings card
Replace mock `initialStats` with live aggregates: `SUM(coins_won)` for total earnings, `COUNT(result='won')` for wins, etc.

### Wallet/IG Coins
Use `profiles.balance` (already real). Withdraw button opens existing `WithdrawModal` (already wired).

---

## 5. Improved Create Match Room UI (`CreateTournamentModal`)

Redesign as a 3-step wizard:
1. **Game & Mode** — visual game tiles (FF/PUBG/ML/Custom), mode (1v1/2v2/4v4/Squad), max players.
2. **Settings & Rules** — description, headshot only, gun attr, etc., rounds.
3. **Prize & Schedule** — entry fee, auto-calculated prize pool (`entry_fee × max_players × 0.9` with 10% platform cut shown), date/time picker, agreement checkbox.

Final review screen before submit. On success, show generated Room ID + Password with copy buttons and a "Share" link.

---

## 6. Live Room Status Display

New component `RoomStatusBadge` with 4 visual states:
- **Waiting** — amber dot + "Waiting (2/4)"
- **Full** — red filled + "Full — starting soon"
- **Ongoing** — green pulse + "Live now"
- **Finished** — gray + "Finished"

Used on cards, drawer, and dashboard rows.

---

## 7. UI/UX polish

- New gaming-style icons (lucide: Swords, Crosshair, Crown, Zap, Flame).
- Subtle gradient borders on live cards (pulse animation).
- Skeleton loaders for all data sections (already have `SkeletonRow`).
- Toast feedback on join/leave/create/finish actions.
- Empty states with illustrations and CTA.
- Mobile: bottom-sheet for detail drawer; cards stack; sticky filter bar.
- Tailwind animations: `animate-pulse` for live indicators, `hover:scale-[1.02]` on cards, `fade-in` on data load.

---

## 8. Files to Create / Edit

**New files:**
- `src/components/tournaments/TournamentCard.tsx`
- `src/components/tournaments/TournamentDetailDrawer.tsx`
- `src/components/tournaments/RoomStatusBadge.tsx`
- `src/components/tournaments/TournamentFilters.tsx`
- `src/components/tournaments/CountdownTimer.tsx`
- `src/components/tournaments/ParticipantList.tsx`
- `src/components/tournaments/CreateRoomWizard.tsx` (replaces CreateTournamentModal internals)
- `src/hooks/useCountdown.ts`
- `src/hooks/useRealtimeTournaments.ts`
- `supabase/migrations/<timestamp>_tournaments_rooms_capacity.sql` (schema + RPCs + triggers)

**Edit:**
- `src/pages/Tournaments.tsx` — full rebuild
- `src/components/tournaments/MyGamesPanel.tsx` — real-data tabs + Overview & Ongoing
- `src/components/tournaments/MatchRow.tsx` — show countdown, room status, join/leave buttons
- `src/components/tournaments/StatsRow.tsx` — wire to real aggregates
- `src/components/tournaments/Leaderboard.tsx` — query top players by `SUM(coins_won)` from participants
- `src/components/tournaments/ActiveTournamentsCard.tsx` — real live count
- `src/lib/tournamentsApi.ts` — new RPC wrappers + realtime helpers
- `src/pages/Dashboard.tsx` — use real stats

**Delete:**
- `src/data/tournamentsMock.ts` (move types only)

---

## 9. Out of scope (this round)
- Bracket/match scheduler UI (single-room matches only).
- Spectator mode / live streaming.
- Admin moderation panel for reports (uses existing admin patterns later).

---

## Verification
- `tsc --noEmit` passes.
- Manually test: create room → see in browse list → join from another tab → counter increments live → start → finish → winner balance increases → entry refunded on leave-while-upcoming.
