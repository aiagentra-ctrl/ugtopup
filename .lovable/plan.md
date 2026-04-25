# 🎮 IG Arena — God-Tier Premium Redesign

A complete visual overhaul of every Tournaments page with esports-grade design, animated hero, glow effects, and richer landing sections — built on the existing real-time Supabase data layer (no backend changes).

---

## 1. Design system upgrade

**Fonts** — add gaming-style typography via Google Fonts in `index.html`:
- **Display / headings**: `Orbitron` (futuristic esports look)
- **Accent / numbers**: `Rajdhani` (tech-stat feel)
- Body keeps existing Inter

Register in `tailwind.config.ts`:
```ts
fontFamily: {
  display: ['Orbitron', 'sans-serif'],
  stat: ['Rajdhani', 'sans-serif'],
}
```

**New animations** in `tailwind.config.ts`:
- `glow-pulse` — soft outer glow loop for CTAs & live badges
- `float` — gentle Y-axis float for hero orbs
- `shimmer` — diagonal sheen across cards on hover
- `bg-pan` — slow gradient pan for hero background
- `border-flow` — animated gradient borders for premium cards
- `count-up` — slide+fade for stat numbers

**Reusable utility classes** in `src/index.css`:
- `.btn-glow` — glowing primary button (uses primary HSL token)
- `.card-premium` — gradient border + hover sheen + lift
- `.text-gradient-gold`, `.text-gradient-primary`
- `.bg-mesh` — multi-radial mesh gradient background
- `.bg-grid-fade` — subtle grid with radial fade mask
- `.particle-field` — pure-CSS animated particles container

All colors continue using existing HSL semantic tokens (primary, emerald, amber, destructive). No hardcoded hex.

---

## 2. New shared components (`src/components/tournaments/`)

| Component | Purpose |
|---|---|
| `ArenaHero.tsx` | Animated hero: mesh gradient + floating orbs + CSS particles + live stats ticker + dual CTA |
| `FeaturedCarousel.tsx` | Horizontal snap-scroll carousel of top-prize tournaments with parallax hover |
| `LiveTicker.tsx` | Marquee of currently live matches with pulsing dots |
| `RecentWinnersStrip.tsx` | Auto-scrolling row of recent winners pulled from `tournament_participants` (result=won, ordered by finished_at) |
| `LeaderboardPreview.tsx` | Top-5 mini leaderboard for the hub |
| `FAQSection.tsx` | Accordion with 6 esports/tournament FAQs |
| `TestimonialsSection.tsx` | Static curated player testimonials (3 cards) |
| `AppCTASection.tsx` | "Install IG Arena PWA" CTA tied to existing `usePWAInstall` |
| `StatChip.tsx` | Animated count-up stat chip used across pages |
| `PremiumCard.tsx` | Wrapper applying gradient border + sheen used everywhere |
| `SectionHeader.tsx` | Consistent section title with icon, eyebrow, view-all link |

---

## 3. Page-by-page redesign

### `TournamentsHub.tsx` — Landing page
Sections in order:
1. **ArenaHero** — animated background, headline in Orbitron, dual CTA, 4 live stats
2. **Quick action grid** — 4 premium cards (Browse / Host / My Games / Leaderboard) with icon glow + arrow slide
3. **LiveTicker** — currently ongoing matches scrolling marquee
4. **FeaturedCarousel** — top 8 tournaments by prize
5. **How it works** — 3 steps with numbered glowing badges + connecting line
6. **LeaderboardPreview** — top 5 + "View full leaderboard" link
7. **RecentWinnersStrip** — last 10 winners
8. **Wallet snapshot** — withdrawable winnings card with shimmer
9. **TestimonialsSection** — 3 player quotes
10. **FAQSection** — 6 Q&As
11. **AppCTASection** — install PWA

### `JoinTournamentPage.tsx`
- Sticky filter bar with glassmorphism (game pills + status pills + search)
- Result count chip
- Grid uses upgraded `TournamentCard` (glow border on live, sheen on hover, animated progress bar)
- Empty state illustration with floating icon

### `CreateMatchPage.tsx` — Step-by-step wizard
Convert single form to 3-step wizard with progress indicator:
1. **Game & Mode** — large icon tiles for game; mode selector
2. **Details** — name, description, max players, entry fee with live prize-pool preview card
3. **Schedule & confirm** — datetime picker + summary card + agree checkbox + create button
- Animated step transitions (fade-in + slide)
- Success screen gets confetti-style glow + animated checkmark

### `MyGamesPage.tsx` — Dashboard
- Top row: 4 animated stat cards (Total earned / Active / Wins / Win-rate %) using `StatChip` with count-up
- Tabs (Overview / Joined / Created / Reported / Wallet) restyled with gaming pill design
- Match cards get status-tinted left border + hover lift
- Add mini sparkline / win-loss ratio bar (CSS-only, no chart library)

### `LiveMatchesPage.tsx`
- Full-bleed live banner header with red pulse
- Cards filtered to live/ongoing — show elapsed timer instead of countdown
- Spectator-style layout with prominent "Watch room" CTA for joined players

### `LeaderboardPage.tsx`
- New podium: 3D-tilted cards, gold/silver/bronze gradient borders, crown icon for #1
- Tabs restyled (Top earnings / Most wins / Most played)
- Table rows: rank badge, animated avatar ring, win-rate bar, glowing coin chip
- Highlight current user row with primary glow
- "Your rank" sticky callout if user not in top 50

### `TournamentWalletPage.tsx`
- Hero balance card: large Rajdhani number, shimmer effect, "Withdrawable winnings only" badge
- Side-by-side: deposited credits (locked, shown in muted style) vs winnings (active emerald)
- Quick withdraw amount chips (500 / 1000 / 2500 / All)
- Withdrawal history timeline with status pills
- Reuses existing `useWinningsBalance` hook & withdrawal RPCs (no logic changes)

### `MatchHistoryPage.tsx`
- Top: 3 stat tiles + win-rate ring (CSS conic-gradient, no library)
- Filters: All / Won / Lost / Cancelled pills
- Each row gets result-tinted background, animated trophy/X icon, coin delta with +/- color

### `ReportsPage.tsx`
- Cleaner card list with status badges (Under review / Resolved / Rejected)
- File-report dialog gets stepped UI: select match → describe issue → submit
- Empty state with shield illustration

---

## 4. Layout polish (`TournamentsLayout.tsx`)
- Sub-nav becomes glassmorphic with backdrop blur + bottom glow line under active item
- Animated underline indicator that slides between nav items
- Add page-transition fade-in wrapper around children
- Mobile: nav becomes scrollable pill bar with edge fade masks
- Optional breadcrumb under title for deep pages

---

## 5. Responsive & motion guarantees
- All hero animations respect `prefers-reduced-motion` (disable particle/float/pan)
- Mobile (<640px): hero compresses, particles reduced, carousels become snap-scroll
- All interactive elements keep 44px tap targets
- No layout shift during count-up animations (reserve width)

---

## 6. Data — uses existing real-time layer
- `fetchOpenTournaments`, `fetchJoinedMatches`, `fetchEarningsSummary`, `subscribeTournaments` (already exist)
- Add small helpers in `src/lib/tournamentsApi.ts`:
  - `fetchRecentWinners(limit)` — last N `result='won'` participants joined with profile + tournament
  - `fetchTopLeaderboard(sortKey, limit)` — already covered client-side, optionally server-aggregated later
- **No DB migrations.** No schema changes. All winnings-only withdrawal rules from previous plan remain intact.

---

## 7. Files touched

**Created**
- `src/components/tournaments/ArenaHero.tsx`
- `src/components/tournaments/FeaturedCarousel.tsx`
- `src/components/tournaments/LiveTicker.tsx`
- `src/components/tournaments/RecentWinnersStrip.tsx`
- `src/components/tournaments/LeaderboardPreview.tsx`
- `src/components/tournaments/FAQSection.tsx`
- `src/components/tournaments/TestimonialsSection.tsx`
- `src/components/tournaments/AppCTASection.tsx`
- `src/components/tournaments/StatChip.tsx`
- `src/components/tournaments/PremiumCard.tsx`
- `src/components/tournaments/SectionHeader.tsx`

**Edited**
- `index.html` (add Google Fonts)
- `tailwind.config.ts` (fonts + new keyframes/animations)
- `src/index.css` (utility classes)
- `src/components/tournaments/TournamentsLayout.tsx` (glass nav)
- `src/components/tournaments/TournamentCard.tsx` (premium styling)
- All 9 pages in `src/pages/tournaments/`
- `src/lib/tournamentsApi.ts` (small helper additions)

---

## 8. Out of scope (kept as-is)
- Database schema, RPCs, withdrawal rules
- Auth, header, footer, dashboard entry card
- Other product pages

✅ Verification: `tsc --noEmit` after each batch of edits.
