
## Goal
Add a brand-new **Tournaments** feature ("IG Arena") as a standalone page at `/tournaments`. Adapt the IG Arena brief into the project's existing **dark red/pink theme** (the brief's purple becomes our brand red `--primary`). Reuse the existing `Header` and `Footer`. **No changes to any existing page, component, or DB table.**

## Scope (strictly additive)
- **Route added** to `src/App.tsx`: `/tournaments` → new `Tournaments` page (just the route entry — nothing else in App.tsx changes).
- **No edits** to Index, product pages, admin, auth, theme tokens, or DB schema.
- All data is **frontend mock state** for v1 (no Supabase tables). Buttons (Withdraw, Join, Create, Report) open local modals/toasts only — no backend wiring yet.

## New files
1. `src/pages/Tournaments.tsx` — page shell with `Header`, page container, and section composition; `Footer` at bottom.
2. `src/components/tournaments/StatsRow.tsx` — 4 metric cards (Total earnings, Win/Loss with bar, Tournaments created, Global rank). 2×2 on mobile, 4-col on desktop.
3. `src/components/tournaments/MyGamesPanel.tsx` — pill-tab panel using shadcn `Tabs` with 5 tabs: Wallet, Joined, Created, Reported, Finished. Includes "Withdraw winnings" primary button (opens `WithdrawModal`).
4. `src/components/tournaments/MatchRow.tsx` — reusable row: game icon, name, monospace Room ID chip, masked password chip with eye-reveal (auto re-mask after 5s), status badge, prize. Click expands inline detail panel.
5. `src/components/tournaments/StatusBadge.tsx` — semantic badges: Live (red pulsing dot), Upcoming (amber), Won (green), Lost (red), Joined (brand red), Pending (gray).
6. `src/components/tournaments/WalletTab.tsx` — balance display, deposit method buttons (eSewa/Khalti/Bank — visual only, hooks into existing `TopUpModal` if trivial, otherwise placeholder), transaction history list.
7. `src/components/tournaments/LiveUpcomingSection.tsx` — sub-section with red pulsing dot header + "View all" link.
8. `src/components/tournaments/RecentlyFinishedSection.tsx` — last 3–5 finished matches.
9. `src/components/tournaments/Leaderboard.tsx` — Top players card, 5 rows, medals for top 3, deterministic avatar color from name hash, current user's row highlighted in brand red with "(You)" suffix.
10. `src/components/tournaments/NotificationsPanel.tsx` — local in-page notifications list (separate from the global bell — purely visual for the IG Arena context).
11. `src/components/tournaments/ActiveTournamentsCard.tsx` — live tournament count, players today, capacity progress bar.
12. `src/components/tournaments/HowItWorks.tsx` — 4-step horizontal row (Register → Add Coins → Join → Win Prizes). 2×2 on mobile.
13. `src/components/tournaments/WithdrawModal.tsx` — shadcn `Dialog` with amount input, method selector, destination field, NPR conversion preview, validation, and success state with mock reference ID.
14. `src/components/tournaments/CreateTournamentModal.tsx` — modeled on the uploaded screenshots (Custom/Lonewolf mode, Team 1v1/2v2/4v4, Throwable Limit, Gun Attribute, Character Skill, Rounds 9/13, Headshot Only, Coin Default IG/9980, Matchroom Name, Entry Fee, Potential Winning, Match Rules, Date/Time picker, "I understand…" checkbox, "Create Matchroom" CTA). Pure UI form with local validation; "Create" simulates success with a generated Room ID + password and pushes a mock row into the Created tab.
15. `src/components/tournaments/EmptyState.tsx` — shared empty-state component (icon + title + description + CTA).
16. `src/components/tournaments/SkeletonRow.tsx` — skeleton loaders for rows/cards using existing `Skeleton`.
17. `src/data/tournamentsMock.ts` — typed mock data (matches, leaderboard players, notifications, transactions). Easy to swap for Supabase later.
18. `src/lib/tournamentsUtils.ts` — `maskPassword`, `formatCoins`, `relativeTime`, `nameToColor` (deterministic hue from name hash), `formatRoomId`.

## Theme adaptation (no token changes)
- The brief specifies **purple** as brand accent. Our project's brand is **red/pink** (`--primary: 0 100% 50%`). Map all "purple" usages to `hsl(var(--primary))` so the page matches site identity.
- Wins/success → existing `--dashboard-green` (`142 76% 36%`).
- Losses/live status/alerts → `hsl(var(--destructive))`.
- Upcoming/warnings → amber (`text-amber-400 bg-amber-500/10`).
- Surfaces use existing `bg-card`, `bg-muted`, `border-border` — no new CSS variables, no new global styles.
- Cards: `rounded-lg`, `border border-border/60`, no heavy shadow (matches "flat" requirement).
- Room ID chips use `font-mono` (Tailwind built-in).
- Status badge "Live" uses a red dot with `animate-pulse` (already in Tailwind core).

## Layout (matches brief)
```
[Header (existing)]
[Page title: "IG Arena — Tournaments"]
[Stats row: 4 cards | 2x2 on mobile]
[My Games panel
   ├─ Tab pills: Wallet | Joined | Created | Reported | Finished
   ├─ Withdraw winnings button (top-right, primary red)
   ├─ Joined tab: Live & Upcoming → divider → Recently finished
   └─ Inline expandable rows]
[Two-column section
   ├─ Left: Top Players Leaderboard
   └─ Right: Notifications panel + Active Tournaments card (stacked)]
[How It Works: 4 steps]
[Footer (existing)]
[Floating "Create Tournament" button on Created tab → opens CreateTournamentModal]
```

## Mobile behavior
- Stats: 2×2 grid below `md`.
- Tabs: horizontally scrollable single row with `scrollbar-hide` and right-edge fade gradient.
- Two-column section stacks to single column.
- How It Works: 2×2 grid.
- All tap targets ≥44×44px (already enforced globally in `index.css`).

## States
- **Empty**: every list (Joined/Created/Reported/Finished/Notifications) renders `EmptyState` when its mock array is empty.
- **Loading**: a 600ms simulated load on first mount renders `SkeletonRow`s, then real mock data.
- **Error**: a "Retry" inline banner (mocked — never triggered in v1, but component included for future use).

## Out of scope (explicitly NOT doing)
- No Supabase tables, RLS, or edge functions.
- No real wallet/withdrawal/payment integration.
- No changes to `Header`, navbar wallet pill, or notification bell.
- No new admin panel section.
- No changes to existing routes/pages/components/styles.

## Acceptance
- Visiting `/tournaments` (or `/#/tournaments`) shows the full IG Arena dashboard rendered in the site's red/pink dark theme.
- All 5 tabs switch correctly, password mask reveal works for 5s then re-masks.
- Withdraw modal opens, validates, shows success state, closes.
- Create Tournament modal matches the uploaded screenshots' field set and produces a mock room.
- Zero diffs in any file outside `src/App.tsx` (one route line) and the new files listed above.
