

# Simplified Offer Management UI with Real-Time Preview

## Problem
The current OfferManager dialog is a single long scrolling form with all fields visible at once. It is overwhelming — badge settings, animation, gradient, timer, visibility toggles, and image upload are all packed into one view with no live preview of what the offer will look like.

## Solution
Replace the single-dialog form with a **tabbed editor** and a **real-time live preview panel** that renders the actual offer components (`OfferBanner`, `OfferBadge`, `OfferHighlight`, `OfferSeasonal`, `OfferDailyDeal`) as the admin edits.

## File Changes

### Modified: `src/components/admin/OfferManager.tsx`
Complete rewrite of the dialog content. Replace the flat form with:

**Split layout** inside the dialog (max-w-5xl):
- **Left panel (60%)**: Tabbed form with 4 tabs
- **Right panel (40%)**: Sticky live preview that updates in real-time

**4 Tabs:**
1. **Basics** — Template selector (existing `OfferTemplatePreview`), Title, Subtitle, Description, Offer Type, Product Link
2. **Style** — Badge text/colors with color pickers, Background gradient (with preset buttons like "Purple Haze", "Sunset", "Ocean"), Image upload, Seasonal theme (only if seasonal template)
3. **Animation** — Visual animation picker: clickable cards with animated preview icons for each animation (pulse, flash, bounce, slide-in, none). When clicked, the live preview instantly reflects the animation.
4. **Schedule** — Timer toggle, timer type, start/end dates, Visibility toggles (homepage/product page), Active toggle

**Live Preview Panel:**
- Renders the actual offer component based on `form.design_template`:
  - `badge` → renders `OfferBadge` on a mock product card
  - `animated_banner` → renders `OfferBanner`
  - `homepage_highlight` → renders `OfferHighlight`
  - `seasonal` → renders `OfferSeasonal`
  - `daily_deal` → renders `OfferDailyDeal`
- Converts form state to a mock `Offer` object and passes it to the component
- Shows "Mobile" / "Desktop" toggle to switch preview width (320px vs full)
- Updates instantly on every form field change (already reactive via state)

**Gradient presets** (new addition in Style tab):
Instead of asking admin to type CSS, provide clickable preset buttons:
- "Purple Haze" → `linear-gradient(135deg, #667eea, #764ba2)`
- "Sunset" → `linear-gradient(135deg, #f093fb, #f5576c)`
- "Ocean" → `linear-gradient(135deg, #4facfe, #00f2fe)`
- "Forest" → `linear-gradient(135deg, #11998e, #38ef7d)`
- "Custom" → shows the text input for manual CSS

**Animation picker** (replace the dropdown):
Instead of a Select dropdown, show visual cards with the animation name and a small animated indicator element that demonstrates the animation in real-time.

### Modified: `src/components/offers/OfferTemplatePreview.tsx`
No changes needed — already clean and works well.

### New: `src/components/admin/OfferLivePreview.tsx`
Extracted preview component that:
- Takes the form state as props
- Constructs a mock `Offer` object
- Renders the correct offer component based on `design_template`
- Has a mobile/desktop width toggle
- Wrapped in a bordered container with "Preview" label

## Summary
- 1 new file: `OfferLivePreview.tsx`
- 1 major rewrite: `OfferManager.tsx` dialog section (list view stays the same)
- No database changes
- No API changes
- All existing functionality preserved, just reorganized into tabs with live preview

