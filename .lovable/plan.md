## IG Arena — Multi-Page Restructure & Dashboard Integration

Goal: Stop cramming all tournament features into the user Dashboard or one mega `/tournaments` page. Build a dedicated **Tournaments hub** with a clean landing page that routes into focused sub-pages (Create, Join, My Games, Leaderboard, Wallet, Reports, History, Live). Link it cleanly from the main user Dashboard via a single entry card.

---

### 1. Routing — new dedicated routes (`src/App.tsx`)

Add a nested route group `/tournaments/*`. New routes:

| Route | Page | Purpose |
|---|---|---|
| `/tournaments` | `TournamentsHub` | Landing/overview dashboard (hero + summary cards + entry buttons) |
| `/tournaments/join` | `JoinTournamentPage` | Browse + filter open tournaments, join |
| `/tournaments/create` | `CreateMatchPage` | Full-page create wizard (replaces modal) |
| `/tournaments/my-games` | `MyGamesPage` | Joined / Created / Reported tabs |
| `/tournaments/live` | `LiveMatchesPage` | Currently ongoing matches with countdowns |
| `/tournaments/history` | `MatchHistoryPage` | Finished matches + win/loss results |
| `/tournaments/leaderboard` | `LeaderboardPage` | Top winners, top earners, most wins, rankings |
| `/tournaments/wallet` | `TournamentWalletPage` | IG Coins balance, withdraw, withdrawals history |
| `/tournaments/reports` | `ReportsPage` | Disputes / reported matches |

All wrapped in `ProtectedRoute` (login required) except `/tournaments` hub which can show CTA to login.

### 2. Remove tournament mixing from main Dashboard (`src/pages/Dashboard.tsx`)

Strip out: `StatsRow`, `MyGamesPanel`, `Leaderboard`, `NotificationsPanel`, `ActiveTournamentsCard`, `HowItWorks` imports/usage.

Replace with a single **"IG Arena Tournaments" entry card** in the dashboard grid:
- Trophy icon, brand-purple accent, gaming-style border
- Shows quick stats: total winnings + active joined matches (fetched via existing `fetchEarningsSummary` + `fetchJoinedMatches`)
- Single CTA button → `navigate('/tournaments')`
- Sits alongside existing CreditBalance, OrderHistory, Wishlist, Support cards — does not visually dominate

### 3. New shared layout (`src/components/tournaments/TournamentsLayout.tsx`)

Wraps every `/tournaments/*` page. Provides:
- Header (existing site `<Header />`)
- Sticky sub-nav bar with pills: Hub · Join · My Games · Live · Leaderboard · Wallet · History · Reports
- Active route highlighted with purple underline
- Back-to-Dashboard link
- Footer

Mobile: sub-nav becomes horizontal scroll with snap.

### 4. New pages — design & data sources

All use existing `src/lib/tournamentsApi.ts` (already has `fetchOpenTournaments`, `fetchJoinedMatches`, `fetchCreatedTournaments`, `fetchUserReports`, `fetchUserWithdrawals`, `fetchEarningsSummary`, `subscribeTournaments`, RPCs). No DB schema changes needed.

**`TournamentsHub` (landing)** — `src/pages/tournaments/TournamentsHub.tsx`
- Hero: "IG Arena" title, live arena stats (live tournaments count, players joined today, total prize pool live) — derived from `fetchOpenTournaments` aggregate
- Quick action grid (4 large cards): Quick Join · Create Match · My Games · Leaderboard
- Section: "How Tournaments Work" (reuse `HowItWorks.tsx`)
- Section: "Featured / Live Tournaments" (top 3 from `fetchOpenTournaments`, reuse `TournamentCard`) with "View all → /tournaments/join"
- Section: "Your Wallet & Earnings" mini-card (IG Coins balance from `profiles.balance` via `useLiveBalance`, total winnings from `fetchEarningsSummary`) → CTA to `/tournaments/wallet`
- Section: "Match Statistics" compact `StatsRow`
- Section: "Announcements / Updates" — reuse `NotificationsPanel`
- CTA strip: "View Leaderboard →"

**`JoinTournamentPage`** — `src/pages/tournaments/JoinTournamentPage.tsx`
- Reuses current `Tournaments.tsx` browse logic (search, status filter, game filter, `TournamentCard` grid, `TournamentDetailDrawer`, `joinTournament` RPC)
- Real-time via `subscribeTournaments`

**`CreateMatchPage`** — `src/pages/tournaments/CreateMatchPage.tsx`
- Full-page version of `CreateTournamentModal` content (3-step wizard: Game → Rules → Prize/Schedule) — extract form logic from existing modal into a reusable `CreateTournamentForm` component; modal stays as wrapper for in-place creation from hub
- On success → redirect to `/tournaments/my-games?tab=created`

**`MyGamesPage`** — `src/pages/tournaments/MyGamesPage.tsx`
- Tabs: Joined · Created · Reported (Wallet/Finished moved to their own pages)
- Reuses refactored `MyGamesPanel` internals split into `JoinedMatchesList`, `CreatedMatchesList`, `ReportedMatchesList`

**`LiveMatchesPage`** — `src/pages/tournaments/LiveMatchesPage.tsx`
- Filters `fetchOpenTournaments` to `room_status === 'ongoing'`
- Live countdown timers (`useCountdown`), pulsing live badges
- Click → `TournamentDetailDrawer`

**`MatchHistoryPage`** — `src/pages/tournaments/MatchHistoryPage.tsx`
- `fetchJoinedMatches` filtered to `status === 'finished'`
- Shows result (Won/Lost), coins won, finished date, opponent count

**`LeaderboardPage`** — `src/pages/tournaments/LeaderboardPage.tsx`
- Tabs: Top Earnings · Most Wins · Top Players (combined rank) · Most Matches Played
- Top 50 instead of current top 5
- Highlights current user row, podium (gold/silver/bronze) for top 3
- Reuses + extends current `Leaderboard.tsx` aggregation logic

**`TournamentWalletPage`** — `src/pages/tournaments/TournamentWalletPage.tsx`
- Big IG Coins balance card (`useLiveBalance`)
- Earnings summary cards (`fetchEarningsSummary`): total earned, wins, losses, pending
- "Withdraw" CTA → opens existing `WithdrawModal`
- Withdrawals history table (existing `WithdrawalsPanel`)

**`ReportsPage`** — `src/pages/tournaments/ReportsPage.tsx`
- List from `fetchUserReports` with status badges
- "File new dispute" button → form (tournament select + reason textarea) calling existing `reportMatch`

### 5. UI/UX polish (gaming-pro look)

- Brand accent: existing primary purple from theme tokens (no new colors, no gradients — consistent with project memory)
- Status badges: reuse `RoomStatusBadge` + `StatusBadge` (pulsing dot for live)
- Typography: monospace for room IDs (already used)
- Cards: `rounded-lg border border-border/60 bg-card`, subtle hover `hover:border-primary/40 transition-colors`
- Empty states: reuse `EmptyState.tsx` everywhere
- Loading: `SkeletonRow` / `Skeleton`
- Mobile-first: stacked single-column under `md`, 2-3 col grids on `lg+`
- Icons: `lucide-react` only (Trophy, Swords, Users, Wallet, Flag, History, Crown, Zap)

### 6. Files

**New (12):**
- `src/components/tournaments/TournamentsLayout.tsx`
- `src/components/tournaments/CreateTournamentForm.tsx` (extracted from modal)
- `src/pages/tournaments/TournamentsHub.tsx`
- `src/pages/tournaments/JoinTournamentPage.tsx`
- `src/pages/tournaments/CreateMatchPage.tsx`
- `src/pages/tournaments/MyGamesPage.tsx`
- `src/pages/tournaments/LiveMatchesPage.tsx`
- `src/pages/tournaments/MatchHistoryPage.tsx`
- `src/pages/tournaments/LeaderboardPage.tsx`
- `src/pages/tournaments/TournamentWalletPage.tsx`
- `src/pages/tournaments/ReportsPage.tsx`
- `src/components/dashboard/TournamentsEntryCard.tsx`

**Edited (5):**
- `src/App.tsx` — add 8 new routes, remove old single `/tournaments` page route (replaced by hub)
- `src/pages/Dashboard.tsx` — remove embedded tournament sections, add `TournamentsEntryCard`
- `src/pages/Tournaments.tsx` — delete (replaced by `TournamentsHub`) **or** keep as thin redirect to `/tournaments` hub
- `src/components/tournaments/CreateTournamentModal.tsx` — refactor to wrap new shared form
- `src/components/tournaments/MyGamesPanel.tsx` — split internals so each tab can be used standalone

**Unchanged:** `tournamentsApi.ts`, all DB tables/RPCs, `Header` (Tournaments link already present), existing card/badge/timer components.

### 7. Out of scope

- No DB schema changes (current schema covers all features)
- No new edge functions
- No changes to other product pages, payments, chatbot, or auth
- No design tokens/theme changes — strictly reuse existing tokens

### Verification

- `tsc --noEmit` after implementation
- Manual check: Dashboard shows single Tournaments card → click → lands on Hub → each sub-nav pill loads its dedicated page with real Supabase data → Create/Join/Withdraw flows still functional via existing RPCs.
