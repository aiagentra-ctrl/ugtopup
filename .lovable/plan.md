## Goal

Completely remove the **Purchase Quantity** feature from the **Mobile Legends** product page (`/product/mobile-legends`). No other product pages are touched. No DB or backend changes.

## Why

Multi-unit purchases on ML are causing delivery losses via the Liana API. Users should buy one package per order — quantity must not be selectable.

## Changes — `src/pages/MobileLegends.tsx`

1. **Remove** the `<QuantitySelector …>` JSX block (lines ~267–277) and its import.
2. **Remove state**: `purchaseQuantity` / `setPurchaseQuantity` and all resets (`handlePackageSelect`, `handleTopUpAgain`).
3. **Simplify totals**:
   - `totalPrice = selectedPackage?.price ?? 0`
   - `totalItems = selectedPackage?.quantity ?? 0`
4. **Order payload** (`product_details`): drop `purchase_quantity`, `unit_price`, `unit_quantity`. Keep `verified_ign`, `skip_verification`, `variation_id`, etc.
5. **Dedupe key**: change `place_order:${user.id}:${selectedPackage.name}:${purchaseQuantity}:${couponCode||''}` → `place_order:${user.id}:${selectedPackage.name}:${couponCode||''}`.
6. **Order Review modal**: stop passing `purchaseQuantity`/`totalItems` (already equal to package values).

## Changes — `src/components/ml/MLOrderReview.tsx`

- Remove the `purchaseQuantity` and `totalItems` props from the interface.
- Remove the “× N” quantity display and the “Unit Price” row that only appears when `purchaseQuantity > 1`.
- Use `selectedPackage.quantity` and `selectedPackage.price` directly.

## Out of scope

- All other product pages (FreeFire, PUBG, Garena, Unipin, SmileCoin, Netflix, YouTube, ChatGPT, Roblox, TikTok) keep their Purchase Quantity as-is.
- No DB migrations, no admin panel changes, no description-section changes.

## Result

ML page structure becomes:

```text
[Header]
[Description (admin-controlled, auto-hides if empty)]
[User input form]
[Package selector]
[Fixed Buy Now bar — single package price]
```
