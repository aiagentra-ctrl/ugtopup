

# Simplify Product Add/Edit with Inline Pricing Plans

## Problem

The `DynamicProductManager` (Admin > Product Update) already stores a `plans` JSON field on `dynamic_products`, but the add/edit dialog has no UI for managing pricing plans. Pricing lives separately in `game_product_prices` and requires navigating to a different admin section. This is confusing for admins.

## Solution

Add an inline **Pricing Plans** editor directly inside the `DynamicProductManager` add/edit dialog. Plans are stored as JSON in the existing `plans` column of `dynamic_products` — no database changes needed.

## Changes

### `src/components/admin/DynamicProductManager.tsx`

1. **Add plan management state** to the form: `plans` array with shape `{ name: string; price: number; discount_price?: number; api_code?: string }[]`

2. **Add "Pricing Plans" section** inside the dialog, below the Price/Discount Price fields:
   - Section header: "Pricing Plans" with an "Add Plan" button
   - Table with columns: Plan Name, Price, Discount Price (optional), API Code (optional), Remove button
   - Each row is inline-editable with Input fields
   - "Add Plan" inserts a blank row

3. **Pre-populate plans** when editing: parse existing `plans` JSON from the product

4. **Save plans** as part of the payload (already wired — `plans` field exists on `dynamic_products`)

5. **Simplify the dialog layout**: 
   - Reorder fields: Title, Image upload, Category, Description, Link → then Price section → then Plans table → then Features/Tags/Badge/Active toggle
   - Remove the confusing separate Price/Discount Price fields when plans are present (show a note: "Product pricing is managed via plans below")

6. **Visual improvements**:
   - Plans section gets a bordered card with clear "Add Plan +" button
   - Empty state message: "No plans yet. Add pricing plans for this product."
   - Each plan row has a red trash icon to remove

### No other files need changes

The `dynamic_products.plans` column already exists as `jsonb` with default `'[]'`. The homepage `ProductTabs` and `Products` page already read from `dynamic_products`. No migration needed.

## Plan Schema (stored in `plans` jsonb column)

```json
[
  { "name": "110 Diamonds", "price": 120, "discount_price": null, "api_code": "" },
  { "name": "341 Diamonds", "price": 350, "discount_price": 330, "api_code": "FF-341" }
]
```

## Summary

Single file change to `DynamicProductManager.tsx` — adds an inline pricing plans table editor to the existing add/edit dialog so admins can configure product plans without navigating elsewhere.

