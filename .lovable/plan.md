
## Plan — UI changes from your screenshots

### 1. Dashboard — Credit Balance card (image 1)
- `src/components/dashboard/CreditBalanceCard.tsx`: change the button label `+ Top-Up` → `+ Credit Topup` (keep same gradient/style).

### 2. Dashboard — Order History card (image 2)
- `src/components/dashboard/OrderHistoryCard.tsx`:
  - Fix the cramped header on mobile: stack the title/description above the order count `Badge` on small screens (`flex-col sm:flex-row`) so "101 Orders" no longer overlaps "Order History" / "Track your product orders".
  - Replace the `CardDescription` text "Track your product orders" with **"← Slide left to track your product orders"** and add a subtle horizontal-scroll hint (small chevron + `animate-pulse`) above the table on mobile only.
  - Keep the underlying horizontal scroll behaviour as-is.

### 3. Replace chatbot with Messenger + WhatsApp floating buttons (image 3)
- Remove the chatbot floating widget from the site:
  - In `src/App.tsx`, remove the `<ChatWidget />` mount (do **not** delete the chat files — just unmount, so admin-side data stays intact).
- Create new `src/components/SupportFAB.tsx`: a stacked floating action group in the bottom-right with three circular buttons matching the reference style:
  - Messenger (blue) → `https://m.me/<page>` (placeholder until you give the handle)
  - WhatsApp (green) → `https://wa.me/9779708562001` (existing number)
  - Toggle (purple X / chat icon) to expand/collapse the stack
- Mount `<SupportFAB />` globally in `src/App.tsx` so it shows on every page.
- Uses semantic tokens; no hard-coded hex outside the brand colors for the two channels.

**I need from you:** the Facebook Page username/ID for the Messenger link (e.g. `m.me/ugtopups`).

### 4. Terms & Conditions page (image 4)
- `src/pages/RefundPolicy.tsx`: bump the heading "⚔️ Battle Terms & Conditions ⚔️" from `text-3xl md:text-4xl` → `text-4xl md:text-6xl` and increase top/bottom spacing slightly. No other changes.

### 5. Homepage PWA install popup (image 5)
- New component `src/components/InstallAppPopup.tsx`: centered/bottom card matching the reference (app icon + "Install UGTOPUPS App" + subtitle + Install button + close X).
- Logic via existing `usePWAInstall` hook:
  - Show only when `isInstallable && !isInstalled` and the device is not iOS-standalone.
  - Trigger conditions:
    1. First visit to homepage after a short delay (~3s) if the user has never dismissed it.
    2. Re-show after the user completes a top-up (`handleTopUpSuccess` in `Dashboard.tsx`) or a successful product purchase (hook into the existing success modals' `onClose` / order-created event).
  - "Install App" → calls `promptInstall()` (one-click on Android/desktop, iOS instructions modal already exists in Footer — reuse it).
  - "Cancel" (X) → hides popup for the current session via `sessionStorage` flag `install_popup_dismissed`. Clearing happens automatically after a purchase/top-up event so it reappears as you requested.
- Mount popup on `src/pages/Index.tsx` (homepage) and `src/pages/Dashboard.tsx`. Works for new and existing users since it relies on the browser's native `beforeinstallprompt` event already wired up in `usePWAInstall`.

### 6. Footer redesign (image 7)
- Rework `src/components/Footer.tsx` to match the dark navy "Reaper Topups" reference:
  - Two-column layout: **Social Media** (left) and **Support** (right), with the brand block (logo + tagline) on top.
  - Replace the Instagram link slot with **TikTok** (icon + label) — note: current footer has Facebook/YouTube/TikTok/WhatsApp social row; per your request the social column will list **TikTok** and **Facebook**, support column will list **WhatsApp** and **Email**.
  - Add a horizontally-scrollable strip at the bottom (above the copyright) showing: Refund Policy, Coupon Policy, Products, Contact Us, API Docs, Dashboard — as scrollable chips/pills (`overflow-x-auto`, `snap-x`) so users can swipe through them on mobile.
  - Keep existing colors/tokens (`--footer-bg`, `--footer-heading`, etc.); only restructure layout and labels.

### Files to edit
- `src/components/dashboard/CreditBalanceCard.tsx`
- `src/components/dashboard/OrderHistoryCard.tsx`
- `src/App.tsx` (remove ChatWidget, mount SupportFAB)
- `src/pages/RefundPolicy.tsx`
- `src/pages/Index.tsx`, `src/pages/Dashboard.tsx` (mount InstallAppPopup + clear dismiss flag on purchase/top-up)
- `src/components/Footer.tsx`

### Files to create
- `src/components/SupportFAB.tsx`
- `src/components/InstallAppPopup.tsx`

### Out of scope / preserved
- No backend / Supabase changes (project is still under egress restriction).
- Chatbot code remains in repo, just unmounted — easy to re-enable later.
- Liana / orders / payment logic untouched.

Reply **"approve"** to implement, or tell me the Messenger page handle + any tweaks first.
