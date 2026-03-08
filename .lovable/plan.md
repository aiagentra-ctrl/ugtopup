

# Voucher Code Inventory System

## Overview

Build an admin-managed voucher code inventory that stores redeemable codes (e.g., UniPin vouchers, gift cards), automatically assigns codes to orders upon purchase, and falls back to manual order management when stock runs out.

## Database

**New table: `voucher_codes`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| product_name | text NOT NULL | e.g. "UniPin 2000 UC" |
| game | text NOT NULL | matches `game_product_prices.game` e.g. "unipin" |
| package_id | text | matches `game_product_prices.package_id` for auto-matching |
| code | text NOT NULL UNIQUE | the voucher code |
| status | text NOT NULL DEFAULT 'available' | 'available' or 'used' |
| order_id | uuid NULL | FK to product_orders.id |
| added_at | timestamptz DEFAULT now() |
| used_at | timestamptz NULL |

RLS: Admin full access. No public access (codes are secrets).

**New DB function: `assign_voucher_code(p_order_id uuid, p_game text, p_package_id text)`**

- Finds first available voucher matching game + package_id, ordered by added_at
- Sets status='used', order_id, used_at
- Returns the code or NULL if none available
- Uses `FOR UPDATE SKIP LOCKED` for concurrency safety

## Admin UI

**New component: `src/components/admin/VoucherInventory.tsx`**

Google-Sheet-style table with:
- Columns: Product Name, Code, Status, Order ID, Date Added, Date Used
- Inline editing for product name and code
- Single add row + bulk import (textarea, one code per line with product name prefix)
- Delete button per row
- Summary stats at top: Total Available, Used Today, Low Stock warnings
- Real-time updates via Supabase subscription on `voucher_codes`
- Filter by product name, status

**Admin navigation**: Add "Voucher Inventory" menu item with `Ticket` icon to `AdminLayout.tsx` and `AdminPanel.tsx`.

## Automatic Code Delivery

**Modify `place_order` flow** — after order is created for voucher-eligible products (unipin and any future voucher products):

Create a new DB function `try_assign_voucher(p_order_id, p_game, p_package_id)` called via a trigger on `product_orders` INSERT where `product_category = 'unipin'` (extensible list):
1. Call `assign_voucher_code`
2. If code found: store code in `product_orders.metadata->>'voucher_code'`, set status to 'completed', notify user with code
3. If no code: leave order as 'pending' for manual admin handling, create admin notification "Voucher stock empty for [product]"

Alternatively, implement this in application code (edge function or RPC) called right after `place_order` returns, to keep the trigger simple. **Preferred approach**: Post-order RPC call from frontend.

## Frontend Order Flow Update

In the UniPin order page (and similar voucher products), after `place_order` succeeds:
1. Call `supabase.rpc('try_assign_voucher', { p_order_id, p_game, p_package_id })`
2. If returns a code → show success modal with the voucher code
3. If returns null → show "Order placed, code will be delivered manually"

## Files Summary

### New Files
- `src/components/admin/VoucherInventory.tsx` — Admin spreadsheet UI
- Migration SQL — `voucher_codes` table + `assign_voucher_code` + `try_assign_voucher` functions + trigger/RPC

### Modified Files
- `src/components/admin/AdminLayout.tsx` — Add menu item
- `src/pages/AdminPanel.tsx` — Add case for "vouchers" section
- `src/pages/UnipinUC.tsx` (or its order component) — Call voucher assignment after order
- `src/components/unipin/UnipinSuccessModal.tsx` — Display voucher code if present

