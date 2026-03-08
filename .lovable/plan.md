

# Redesign: Offers, Rewards & Referral Pages

## Summary

The current pages are functional but have room for visual polish and simplification. The main changes:

1. **ReferAndEarn page** (the combined page) — streamline into a cleaner layout with better visual hierarchy, step-by-step "How it works" section, and tighter spacing
2. **Rewards page** — add a visual milestone tracker with icons/steps instead of plain progress bars, and cleaner coupon cards
3. **Referrals page** — simplify with a prominent share CTA and cleaner stats
4. **Admin OfferManager** — simplify the form by reducing tabs from 4 to 2 (Content + Settings), remove rarely-used options from the main view, keep live preview

No database changes needed. All pages already have proper security (RLS policies, server-side coupon validation via `place_order` function, referral reward checks in `check_referral_rewards` trigger).

## File Changes

### 1. `src/pages/ReferAndEarn.tsx` — Redesign

- Replace gradient hero with a clean illustrated card showing 3 steps: "Share Link → Friend Signs Up → Both Earn Coupons"
- Simplify the share section: larger copy button, social share icons as icon-only buttons in a row
- Combine stats into a single horizontal bar instead of 3 separate cards
- Milestone section: use a step-based visual (circles connected by lines) instead of plain progress bars
- Offers section: show as simple cards with title, discount badge, and CTA button
- Coupons section: keep tabs but use a dashed-border "ticket" style for coupon cards
- Referral history: keep collapsible, clean up spacing

### 2. `src/pages/Rewards.tsx` — Redesign

- Add a summary card at top: "X orders completed, Y coupons earned"
- Milestone tracker: visual step indicators (circles with checkmarks for completed, numbers for upcoming) connected by a line
- Coupon cards: redesign as ticket-style cards with a dotted left border and prominent discount display
- Better empty states with illustrations/icons

### 3. `src/pages/Referrals.tsx` — Redesign

- Larger, more prominent referral link section with a big "Copy Link" button
- Add "How it works" 3-step visual
- Stats as inline badges rather than separate cards
- Cleaner referral history list

### 4. `src/components/admin/OfferManager.tsx` — Simplify

- Reduce form tabs from 4 (Basics/Style/Animation/Schedule) to 2 (Content/Settings)
- Move animation and seasonal theme into an "Advanced" collapsible section within Settings
- Keep the live preview panel
- Simplify the offer list cards with less visual clutter

### 5. `src/components/BestDeals.tsx` — Minor cleanup

- Ensure homepage offer cards render cleanly with the simplified offer data

## Security (Already in Place)

- Referral rewards only trigger via `check_referral_rewards()` DB trigger on completed orders — cannot be faked client-side
- Coupon validation happens server-side in `place_order()` and `validate_coupon()` functions
- Duplicate coupon usage prevented by `is_used` flag and `use_count` checks in atomic transactions
- RLS policies prevent users from modifying coupons, referrals, or orders directly

No additional security changes needed — the existing server-side validation is solid.

