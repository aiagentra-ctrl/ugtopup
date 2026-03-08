

# ML API Ordering: IGN Verification & Error Monitoring

## Overview

Add a pre-order IGN verification step so users confirm their in-game name before credits are deducted, plus an API monitoring section in admin.

## Current State

- The edge function `process-ml-order` already verifies IGN via Liana API, but only **after** the order is placed and credits deducted. If verification fails, the order is canceled (credits lost temporarily).
- No user-facing IGN confirmation step exists.
- Admin has `LianaOrdersDashboard` and `LianaWalletBalance` but no dedicated API error monitoring view.

## Plan

### 1. Pre-Order IGN Verification (Frontend)

**Add a new action to the edge function**: `action: 'verify-ign'` that accepts `{ user_id, zone_id, variation_id }` and returns the IGN without placing an order.

**New component: `src/components/ml/MLIgnVerification.tsx`**
- After user enters Game ID + Zone ID and selects a package, clicking "Buy Now" first calls `verify-ign`
- Shows a confirmation card: "Is this your account? **[IGN]**" with Confirm/Cancel buttons
- Only after user confirms → proceed to balance check → order review modal → place order

**Flow change in `MobileLegends.tsx`**:
1. `handleBuyNow` → call `verify-ign` edge function
2. If success → show IGN confirmation UI with the returned name
3. User confirms → proceed to balance check + review modal (existing flow)
4. If verification fails → show error, don't proceed

**Edge function update**: The `handleProcessOrder` can skip re-verification since it was already done pre-order, saving an API call. Add a `skip_verification` flag in product_details.

### 2. Edge Function: Add verify-ign Action

In `process-ml-order/index.ts`, add a new handler:

```
action: 'verify-ign' → handleVerifyIgn(userId, zoneId, variationId, apiKey, apiSecret)
```

This calls `LIANA_API_BASE_URL/ign/verify` and returns `{ success, ign, display }` without creating any order or liana_orders record. It also resolves the correct `variation_id` from the package name to ensure correct API product code mapping.

### 3. Correct Diamond Value Validation

Add validation in `handleProcessOrder` that cross-checks:
- `order.quantity` matches the expected quantity for the resolved `variation_id`
- Log a warning if mismatch detected (but still proceed since variation_id is the source of truth)

The `MLPackageSelector` already pulls from `game_product_prices` DB, and the edge function uses `resolveVariationId` which maps by package name. These are already consistent. Add a `variation_id` field to `product_details` metadata set by the frontend so the edge function can validate it matches.

### 4. Retry Logic for API Connection

Add retry wrapper in the edge function for both verify and order API calls:
- Up to 2 retries with 1s delay on network errors (not on 4xx responses)
- Log each retry attempt

### 5. API Order Monitoring Section (Admin)

**New component: `src/components/admin/MLApiMonitoring.tsx`**

A dedicated monitoring tab showing:
- **Failed Orders table**: order_number, package, error message, API response code, timestamp, retry button
- **Verification Results**: recent verify calls with IGN returned, success/fail
- **API Response Codes**: summary of response statuses (200/400/500) from `liana_orders`
- Data sourced from `liana_orders` + `wallet_activity_logs` tables (already exist)

Add as a tab in the existing `LianaOrdersDashboard` or as a new section in AdminPanel.

### 6. Success Modal Enhancement

Update `MLSuccessModal` to show the verified IGN when available (passed from order flow).

## Files Summary

### New Files
- `src/components/ml/MLIgnVerification.tsx` — IGN confirmation card component
- `src/components/admin/MLApiMonitoring.tsx` — API error monitoring dashboard

### Modified Files
- `supabase/functions/process-ml-order/index.ts` — Add `verify-ign` action, retry logic, skip-verification flag
- `src/pages/MobileLegends.tsx` — Add IGN verification step before order placement
- `src/components/ml/MLSuccessModal.tsx` — Show IGN in success modal
- `src/components/admin/AdminLayout.tsx` — Add monitoring menu item (or integrate into existing ML section)
- `src/pages/AdminPanel.tsx` — Add monitoring section routing

### No DB Changes Required
All data already captured in `liana_orders` and `wallet_activity_logs` tables.

