

# Advanced Offer Management System

## Current State

- **`offers` table** exists with: title, subtitle, description, image_url, offer_type (flash_sale/limited_time/daily_deal/discount_bundle), timer fields, product_link, show_on_homepage/show_on_product_page, display_order, is_active
- **`OfferManager.tsx`** admin UI: basic CRUD with type selection, timer controls, visibility toggles
- **`BestDeals.tsx`** renders homepage offers from `useOffers("homepage")` — simple centered text+timer layout
- **`ProductCard.tsx`** has no offer/badge support
- **`dynamic_products` table** has no offer attachment fields
- No design templates, no animations, no product-level badges, no seasonal themes

## Database Changes

### 1. Add columns to `offers` table

```sql
ALTER TABLE offers ADD COLUMN IF NOT EXISTS design_template text NOT NULL DEFAULT 'badge';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_color text DEFAULT '#ef4444';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text_color text DEFAULT '#ffffff';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS animation_type text DEFAULT 'none';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS seasonal_theme text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS background_gradient text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS timer_start_date timestamptz;
```

### 2. Add offer columns to `dynamic_products` table

```sql
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES offers(id) ON DELETE SET NULL;
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_badge_text text;
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_badge_color text;
```

This lets admins attach an offer to any product + override the badge text/color per product.

## Design Templates (5 types)

The `design_template` field controls which layout renders:

1. **`badge`** — Small label on product card ("20% OFF", "Hot Deal"). Renders as a positioned badge on ProductCard.
2. **`animated_banner`** — Full-width animated banner with slide-in or pulse effect. For homepage/product pages.
3. **`homepage_highlight`** — Featured promotional card with image, gradient background, CTA button.
4. **`seasonal`** — Festival-themed design with custom colors, themed border/background (Holi rainbow, Diwali gold, Christmas red/green, New Year sparkle).
5. **`daily_deal`** — Compact countdown card with urgent styling, pulsing timer, and action button.

## File Changes

### Modified Files

**`src/components/admin/OfferManager.tsx`** — Major upgrade:
- Add design template selector (5 options with visual previews)
- Add badge text/color pickers
- Add animation type selector (none, pulse, slide-in, flash, bounce)
- Add seasonal theme picker (holi, diwali, christmas, new_year, custom)
- Add background gradient picker
- Add start date field for scheduling
- Add live preview panel showing how the offer will look
- Add product assignment section (multi-select from dynamic_products)

**`src/components/admin/DynamicProductManager.tsx`** — Add offer attachment:
- Dropdown to assign an offer to a product
- Override badge text and color fields

**`src/components/ProductCard.tsx`** — Add offer badge rendering:
- Accept optional `badgeText`, `badgeColor`, `badgeTextColor` props
- Render positioned badge with optional animation class (pulse/flash)

**`src/components/ProductTabs.tsx`** — Pass offer data to ProductCard:
- Join product's `offer_id` with offers data
- Pass badge props to each ProductCard

**`src/components/BestDeals.tsx`** — Complete redesign:
- Render different layouts based on `design_template`
- `badge` type: skip (badge renders on product cards only)
- `animated_banner`: full-width banner with slide-in animation
- `homepage_highlight`: featured card with gradient + CTA
- `seasonal`: themed card with festival colors and optional background pattern
- `daily_deal`: urgent countdown card with pulsing timer
- Add CSS animations (flash, pulse, slide-in, bounce) via Tailwind keyframes

**`src/hooks/useOffers.ts`** — Extend Offer interface with new fields

**`src/hooks/useDynamicProducts.ts`** — Join offers data when fetching products

**`src/lib/offerApi.ts`** — Update create/update payloads with new fields

**`src/pages/Index.tsx`** — No changes needed (BestDeals already renders there)

**`tailwind.config.ts`** — Add new keyframes:
- `flash`: opacity blink for flash sale badges
- `bounce-subtle`: gentle bounce for daily deals
- `slide-in-left`: for animated banners

### New Files

**`src/components/offers/OfferBadge.tsx`** — Reusable badge component with animation support. Used by ProductCard.

**`src/components/offers/OfferBanner.tsx`** — Animated banner template component.

**`src/components/offers/OfferHighlight.tsx`** — Homepage highlight card template.

**`src/components/offers/OfferSeasonal.tsx`** — Seasonal/festival themed offer card with themed backgrounds (Holi colors, Diwali gold particles, etc).

**`src/components/offers/OfferDailyDeal.tsx`** — Countdown-focused daily deal card with urgency styling.

**`src/components/offers/OfferTemplatePreview.tsx`** — Preview component used in admin to show how each template looks.

## Auto-Expiry

Offers with `timer_end_date` in the past are filtered out in `useOffers` by adding `.or('timer_end_date.is.null,timer_end_date.gt.now()')` to the query. Offers with `timer_start_date` in the future are also filtered: `.or('timer_start_date.is.null,timer_start_date.lte.now()')`.

## Summary

- 1 migration (new columns on `offers` + `dynamic_products`)
- 5 new offer template components
- 1 new OfferBadge component for product cards
- Major OfferManager admin upgrade with templates, colors, animations, scheduling
- ProductCard gains offer badge support
- BestDeals renders 5 distinct template layouts
- Auto-expiry via query filters

