

# Refer & Earn Page — Unified Referral + Offers Page

## Overview

Merge the existing separate `/referrals` and `/rewards` pages into a single, comprehensive **"Refer & Earn"** page at `/refer-earn`. This page combines referral sharing (with social share buttons), referral progress tracking, available offers, and user coupons in one clean interface.

No database changes needed — all data already exists in `referrals`, `coupons`, `reward_milestones`, `offers`, and `referral_settings` tables.

## File Changes

### New File: `src/pages/ReferAndEarn.tsx`

A single unified page with these sections:

**1. Hero Section** — Gradient banner with "Refer & Earn" title and brief description.

**2. Referral Link Card** — User's unique referral link with:
- Copy button (from existing Referrals page)
- Social share buttons: WhatsApp, Telegram, Facebook, Twitter — each pre-fills a share message like "Join this website and get special offers! Use my referral link: [link]"
- Referral code display

**3. Referral Stats** — 3 stat cards (Total Referred, Successful, Pending) — taken from existing Referrals page.

**4. Referral Milestone Progress** — Progress bars showing invite-based milestones. Since current milestones are order-based, we show: "You've referred X friends" with visual progress. Also show order-based milestone progress from Rewards page.

**5. Available Offers Section** — Fetches from:
- Active `offers` (using `useOffers("all")`) — displayed as cards with title, description, discount badge, expiration, and "View Offer" link
- User's available `coupons` — with copy button and discount display
- Active `coupon_rules` with `rule_type = 'global_code'` — displayed as available promo codes

Each offer/coupon card shows: title, discount value, expiration date, and action button.

**6. Referral History** — Collapsible list of referred users with status badges.

### Modified: `src/App.tsx`
- Add route `/refer-earn` → `<ProtectedRoute><ReferAndEarn /></ProtectedRoute>`
- Keep existing `/referrals` and `/rewards` routes for backward compat

### Modified: `src/components/AccountDropdown.tsx`
- Add "Refer & Earn" menu item with Gift icon, linking to `/refer-earn`

### Modified: `src/components/Header.tsx` (if nav links exist)
- Add "Refer & Earn" link in navigation

## UI Design

- Card-based layout, fully responsive
- Social share buttons as colored icon buttons (WhatsApp green, Telegram blue, Facebook blue, Twitter/X black)
- Progress bars using existing `Progress` component
- Tabs for Available / Used / Expired coupons (reuse pattern from Rewards page)
- Offer cards with gradient borders matching offer's `badge_color`
- Animate-fade-in on sections

## Data Fetching

All client-side, no new APIs needed:
- `supabase.from("referrals").select("*").eq("referrer_id", user.id)`
- `supabase.from("coupons").select("*").eq("user_id", user.id)`
- `supabase.from("reward_milestones").select("*").eq("is_active", true)`
- `supabase.from("referral_settings").select("*").limit(1).single()`
- `useOffers("all")` for active offers
- `supabase.from("coupon_rules").select("*").eq("is_active", true).eq("rule_type", "global_code")` for global promo codes
- `supabase.from("product_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed")` for order count

## Social Sharing

Use `window.open()` with platform-specific URLs:
- WhatsApp: `https://wa.me/?text=...`
- Telegram: `https://t.me/share/url?url=...&text=...`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`
- Twitter: `https://twitter.com/intent/tweet?text=...&url=...`

## Admin Panel

Already fully controlled — existing admin pages handle:
- `ReferralManager.tsx` — enable/disable referral program, set discounts
- `RewardMilestoneManager.tsx` — manage order milestones
- `OfferManager.tsx` — manage offers
- `CouponRulesManager.tsx` — manage global coupon codes

No admin changes needed.

