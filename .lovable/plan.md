
# Admin Polish + AI Command Dashboard

Two parallel workstreams. No color/font changes. No rebuilds — only additive improvements and one new feature page.

---

## Part 1 — UI Polish (existing pages)

### 1.1 Shared primitives (new files in `src/components/admin/ui/`)
- `Shimmer.tsx` — skeleton block (replaces all spinners)
- `GlassCard.tsx` — wraps shadcn `Card` with `backdrop-blur-md border-white/[0.08] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] rounded-xl`
- `StatusPill.tsx` — colored pill badges (success/warning/error/info/neutral) replacing plain text statuses
- `EmptyState.tsx` — icon + heading + subtext + CTA
- `SearchBar.tsx` — left icon, right clear button, focus ring; emits debounced query
- `HighlightText.tsx` — wraps matching substring in `<mark>` (yellow tint)
- `DataTableShell.tsx` — sticky header, zebra rows, hover highlight, sortable headers (arrow indicator), bulk-select column, floating `BulkActionsBar`, pagination footer (prev/next + page numbers + jump-to), CSV export button. Auto-switches to card list under 768px.
- `DetailDrawer.tsx` — shadcn `Sheet` wrapper, `side="right"` desktop / `side="bottom"` mobile (uses `useIsMobile`)
- `CountUp.tsx` — animates numeric KPI on mount
- `PageTransition.tsx` — fade + translateY 200ms ease-out wrapper
- `FloatingLabelInput.tsx` + `FloatingLabelTextarea.tsx` — floating label, inline validation (red/green border), required asterisk
- `SwipeableCard.tsx` — touch swipe-left to reveal action buttons (mobile)

### 1.2 Global CSS additions (`src/index.css`)
- `@keyframes shimmer`, `.shimmer` utility
- `@keyframes page-enter`, `@keyframes row-stagger`
- `.btn-press` — `active:scale-[0.97]` + ripple via pseudo-element
- `.toast-progress` — animated progress bar inside Sonner toasts
- Standardize radii via Tailwind config: cards `rounded-xl` (12px), inputs `rounded-lg` (8px), badges `rounded-md` (6px)

### 1.3 Apply across existing admin pages
For every page rendered by `AdminPanel.renderContent()`:
- Wrap content in `PageTransition`
- Replace `<div className="animate-spin..."/>` with `<Shimmer/>` blocks
- Replace status text with `StatusPill`
- Replace plain tables with `DataTableShell` (preserves columns/data); row click opens `DetailDrawer` instead of navigating
- Add per-page `SearchBar` filtering local data with `HighlightText`
- KPI numbers in `EnhancedDashboard` and `AdvancedAnalytics` use `CountUp`
- Charts: add `animationDuration={800}` on Recharts components
- Empty results → `EmptyState`
- Forms in `AddProduct`, `EditProduct`, `BannerManager`, etc. → `FloatingLabelInput`

### 1.4 Mobile bottom navigation
- Update existing `MobileBottomNav` (already present) to 5 icons + "More" sheet that lists remaining grouped sections.

### 1.5 Toast styling
Configure Sonner globally with top-right position + auto-dismiss progress bar (slot custom CSS).

---

## Part 2 — AI Command Dashboard

### 2.1 Remove floating chatbot
Delete usage of `SupportFAB`/chat widget on admin routes only (keep on user-facing site). Add new sidebar entry "AI Command" with `Sparkles` icon under a new top-level group.

### 2.2 New page: `src/components/admin/AICommand/`
- `AICommandPage.tsx` — 3 tabs: **Chat**, **Changelog**, **Saved Reports**
- `ChatTab.tsx` — split-panel layout
  - Left 40%: scrollable thread, admin bubbles right (accent), AI bubbles left (dark glass card), timestamps, "AI is thinking…" shimmer
  - Quick command chips row above input: Today's Sales / Pending Orders / Low Stock / Credit Requests / Send Notification / Sales Report
  - Input bar: large textarea, send button, voice input (Web Speech API)
  - Right 60%: `LiveResultPanel` renders structured response cards from latest AI reply; persists between messages; own scroll; **Pin** button (✦) saves to Saved Reports
- `LiveResultPanel.tsx` — switches on response `kind`:
  - `sales_summary` — `CountUp` totals + Recharts line chart + top-products list + comparison arrow
  - `credit_requests_list` — cards w/ inline Approve/Reject (calls existing `approve_payment_request` / `reject_payment_request` RPC)
  - `top_products` — ranked list + sparkline
  - `low_stock` — product cards + Update Stock button
  - `monthly_report` — KPIs + bar + donut + Export PDF (jsPDF)
  - `support_tickets` — ticket list + assign/reply
  - `user_activity` — counts + activity feed
  - `write_preview` — before/after diff card + Confirm + cancel
- `ChangelogTab.tsx` — `DataTableShell` over `ai_changelogs`, columns: Action, Table, Before, After, Who, When, Rollback. Rollback button → confirm dialog → calls `rollback_ai_change` RPC.
- `SavedReportsTab.tsx` — pinned reports list; Re-run (re-invokes AI), Delete, Export PDF.

### 2.3 Global CMD+K overlay
Extend existing `AdminCommandBar` (already supports ⌘K) with an "Ask AI" mode: if input starts with `?` or user picks "Ask AI…", overlay expands to compact AI input/response card below; "Open in AI Command" button navigates to the page with the query prefilled.

### 2.4 Database (migration)
New tables:
- `ai_conversations` (admin_id, title, created_at)
- `ai_messages` (conversation_id, role, content, response_payload jsonb, created_at)
- `ai_changelogs` (id, action_type, table_name, record_id, old_value jsonb, new_value jsonb, performed_by, performed_at, rolled_back bool, rollback_of uuid)
- `ai_saved_reports` (admin_id, title, query, response_payload jsonb, created_at)

RLS: admin-only via `is_admin()`.

RPCs:
- `apply_ai_write(action jsonb)` — validates action against allowed table/column whitelist, applies update, writes `ai_changelogs` row, returns new value. Uses `SECURITY DEFINER` with hard-coded whitelist (banners, products, product_orders, payment_requests, coupons, offers, announcements, notifications).
- `rollback_ai_change(change_id uuid)` — restores `old_value` to record, inserts inverse changelog row.

### 2.5 Edge function `supabase/functions/ai-command/index.ts`
- Auth: verifies caller is admin via JWT + `has_role`
- Calls Lovable AI Gateway (`google/gemini-2.5-pro` default) with system prompt containing schema summary, table whitelist, current admin name, date/time
- Tool calling: two tools
  - `query_data({ sql_safe_plan })` — backend executes via `supabase.rpc('ai_safe_select', …)` (parameterized, SELECT-only allowlist)
  - `propose_write({ action, table, where, old_value, new_value, confirmation_message })` — returns to frontend as `write_preview`
- Returns `{ chat_text, panel: { kind, data } }`

Frontend confirms writes via `apply_ai_write` RPC (never raw SQL from client).

### 2.6 Undo
On successful write, frontend shows a Sonner toast with 60s progress + Undo button calling `rollback_ai_change`.

---

## Technical notes

- AI model: use Lovable AI Gateway (no Anthropic key required). Default `google/gemini-2.5-pro`; selectable in admin settings later.
- All write paths go through whitelisted RPC — AI never executes raw SQL.
- Voice input uses `webkitSpeechRecognition` with graceful fallback.
- PDF export uses `jspdf` + `jspdf-autotable` (already common in repo? add if missing).
- `react-markdown` already used elsewhere — reuse for chat bubbles.

## Out of scope
- Color palette / typography changes
- Rebuilding existing page logic
- Removing data or features
- Changes to user-facing site (chatbot stays for end users)

## Rollout order
1. Migration: tables + RPCs (single approval)
2. Shared UI primitives + CSS
3. Apply primitives page-by-page (incremental, no behavior change)
4. AI Command page Chat tab + edge function (read-only first)
5. Write preview + Confirm + Changelog tab
6. Saved Reports tab + CMD+K AI mode
