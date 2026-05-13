
# Admin Panel Reorganization & UI Polish

## Scope & Guardrails
- Keep all existing colors, fonts, and design tokens.
- Do not rebuild any page from scratch — wrap, refactor, and merge in place.
- Preserve every existing feature and data flow. No business logic changes.
- All work is frontend (`src/components/admin/*`, `src/pages/AdminPanel.tsx`).

## Phase 1 — Sidebar Reorganization (`AdminLayout.tsx`)

Replace the flat 40-item list with collapsible groups using shadcn `Sidebar` + `SidebarGroup` + `Collapsible`. Section ids (`activeSection` keys) stay the same so `AdminPanel.tsx` routing keeps working; only the menu structure and labels change.

```text
📊 Analytics      → dashboard, advanced-analytics, user-analytics, promo-analytics
🛒 Store          → game-pricing (Products New), products, categories,
                    offers-coupons (merged), vouchers, banners
📦 Orders         → orders, chatbot-orders, liana-orders
💳 Payments       → online-payments (Sales Tracker), payments (Credit Requests)
👥 Users          → users, referrals-rewards (merged)
🤖 AI & Chatbot   → ai-assistant (new), chatbot (+ feedback tab),
                    knowledge-base, whatsapp
📢 Communications → notifications, announcements
🎫 Support        → tickets
⚙️ System         → system-health (+ activity + maintenance tabs),
                    db-management (+ supabase-limits tab),
                    ml-monitoring, service-status
🛠 Developer      → chatbot-docs (collapsed by default)
```

- Removed from sidebar: `page-descriptions` (moved into Products page as a tab), `admin-app` (drop entry; route still works if accessed directly), `activity`, `maintenance-log`, `supabase-limits`, `chat-feedback` (still reachable as tabs in their hosts).
- Active group auto-expands based on current `activeSection`.
- Each group: icon + label + count badge optional; collapsible chevron.
- Mobile: keep the 5-tab bottom bar; the “More” tab opens the full grouped drawer (`Sheet`) instead of the current flat list.

## Phase 2 — Merged Pages

New thin wrapper components, each composed of `Tabs` rendering existing components (no data rewrite):

| New file | Tabs render |
|---|---|
| `OffersCouponsHub.tsx` | `<OfferManager />`, `<CouponRulesManager />`, Expired (filtered view of OfferManager) |
| `ReferralsRewardsHub.tsx` | `<ReferralManager />`, `<RewardMilestoneManager />`, Leaderboard (existing referral leaderboard view) |
| `SystemHealthHub.tsx` | `<SystemHealthMonitor />`, `<ActivityLogs />`, `<MaintenanceLog />` |
| `DatabaseHub.tsx` | `<DatabaseManagement />`, `<SupabaseLimits />`, Backups (existing list inside DatabaseManagement) |
| `ChatbotHub.tsx` | `<ChatbotSettings />`, `<ChatbotFeedback />`, link-tab to Knowledge Base |
| `ProductsHub.tsx` | `<ProductsList />`, `<GamePageDescriptionsManager />` (Page Descriptions becomes a tab) |

`AdminPanel.tsx` `renderContent()` switch updated:
- `offers` & `coupon-rules` → `<OffersCouponsHub />` (preserve old keys for deep links).
- `referrals` & `milestones` → `<ReferralsRewardsHub />`.
- `system-health`, `activity`, `maintenance-log` → `<SystemHealthHub />`.
- `db-management`, `supabase-limits` → `<DatabaseHub />`.
- `chatbot`, `chat-feedback` → `<ChatbotHub />`.
- `products`, `page-descriptions` → `<ProductsHub />`.

## Phase 3 — Shared UI Primitives

Create reusable wrappers in `src/components/admin/_shared/`:

- `PageShell.tsx` — title, subtitle, breadcrumb, primary action slot, search slot. Drop into each page (replaces ad-hoc headers).
- `DataTableShell.tsx` — sticky header, row hover, sort hooks; on `<768px` renders children as a card list via `useIsMobile`.
- `StatusBadge.tsx` — single source for active/pending/error/info pill colors.
- `EmptyState.tsx`, `TableSkeleton.tsx` — friendly empty + shimmer.
- `BulkActionsBar.tsx` — appears when selected rows > 0.
- `ConfirmDialog.tsx` — wraps shadcn `AlertDialog` for destructive actions.
- `DetailDrawer.tsx` — `Sheet` that slides from right on desktop, bottom on mobile.

Adopt these in the highest-traffic pages first: Orders, Products, Users, Credit Requests, Notifications, Support Tickets, Vouchers. Other pages keep working unchanged and adopt incrementally.

## Phase 4 — Page-Specific Polish (in place)

Only the items below; everything else stays as-is.

- **Dashboard**: add count-up to KPI numbers (lightweight `useEffect` interpolation), day/week/month toggle on the existing chart, AI summary strip (uses already-fetched dashboard counts — pure computed string), Quick Actions row.
- **Products**: add grid/list toggle, category + status + price filters above existing table, inline stock select, "+ Quick Add" opens slide-in drawer that mounts existing `<AddProduct />`.
- **Banners**: enable drag handle (`@dnd-kit/sortable` already in deps if available, else CSS handle + arrow buttons), live preview pane, schedule date/time fields bound to existing record.
- **Notifications**: wrap existing manager in tabs (Sent / Scheduled / Drafts) using existing data flags; add audience filter and preview modal before send.
- **Users**: add filters (active/banned/new/high spenders), click row → `DetailDrawer` showing existing user detail content.
- **Advanced Analytics**: global date-range picker passed to all chart queries, export buttons (CSV via existing data; PDF stubbed via `window.print` styled view).
- **Offers & Coupons / Referrals & Rewards / System / DB**: tab containers from Phase 2.
- **Support Tickets**: add status tabs + priority badges; reply inside `DetailDrawer`.
- **WhatsApp**: connection status pill at top, message log filters.
- **API Monitoring / Service Status / ML API Orders / Chatbot Orders**: standardize on `PageShell` + `DataTableShell` + filters; no data changes.
- **AI Assistant page** (`AIAssistant.tsx`, new): renders the existing `AdminCommandBar` full-screen with response history list; reuses current command actions. Cmd+K already wired — extend to open this page when invoked from anywhere. Write actions show `ConfirmDialog` before execution.

## Phase 5 — Mobile

- Bottom tab bar unchanged shape; relabel "Search" → "AI", add "More" tab opening grouped sheet.
- `DataTableShell` auto-switches to card list under 768px.
- `DetailDrawer` uses `side="bottom"` on mobile, `side="right"` on desktop.
- Tap targets ≥ 44px enforced via `min-h-[44px]` in shared primitives.
- Swipe-to-action: add lightweight CSS swipe (translateX on touchmove) on Orders / Tickets / Credit Requests cards revealing approve/delete buttons.

## Out of Scope
- Database, RLS, edge functions, business logic.
- Color palette, typography, brand changes.
- Tournaments and Profit Calculator pages (kept as-is at top of sidebar under Analytics group? → kept under their own existing entries; not in spec, so left untouched).

## Rollout Order
1. Shared primitives (Phase 3).
2. Sidebar grouping + merged hub wrappers (Phases 1–2) — biggest visible win, low risk.
3. Page polish per priority list (Phase 4).
4. Mobile refinements (Phase 5).

Each step is independently shippable; nothing is removed until its replacement renders the same data.
