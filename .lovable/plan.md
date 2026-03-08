

# Fix and Improve Voucher Inventory System

## Current State

- **Database**: `voucher_codes` table + `assign_voucher_code` and `try_assign_voucher` functions exist and work correctly (atomic assignment with `FOR UPDATE SKIP LOCKED`)
- **UniPin**: Already calls `try_assign_voucher` after order placement — working
- **Garena, Netflix**: Do NOT call `try_assign_voucher` — vouchers are never auto-assigned for these products
- **Admin UI**: `VoucherInventory.tsx` has stats, table, add/bulk import, filters — functional but basic
- **Real-time**: Uses Supabase realtime subscription (refetches all on any change)

## What Needs Fixing

1. **Garena and Netflix** pages need voucher auto-assignment (same pattern as UniPin)
2. **Real-time subscription** refetches entire table on every change — should use incremental updates
3. **UI** needs a cleaner spreadsheet-style look with pagination
4. **Success modals** for Garena and Netflix need voucher code display

## Plan

### 1. Add Voucher Assignment to Garena & Netflix Order Flows

**Files**: `src/pages/GarenaShell.tsx`, `src/pages/Netflix.tsx`

After `createOrder()`, call `try_assign_voucher` with the correct game name (`garena`, `netflix`). Store the returned code and pass it to the success modal.

**Files**: `src/components/garena/GarenaSuccessModal.tsx`, `src/components/netflix/NetflixSuccessModal.tsx`

Add `voucherCode` prop and display the code (same pattern as `UnipinSuccessModal`).

### 2. Improve VoucherInventory UI

**File**: `src/components/admin/VoucherInventory.tsx`

- Add pagination (show 50 per page) to handle large inventories
- Add alternating row colors for spreadsheet feel
- Add "copy code" button per row
- Improve stat cards with progress bar showing available/total ratio
- Add confirmation dialog before delete
- Show low-stock alert banner when any game has < 5 available codes
- Group stats by game (expandable summary showing per-game availability)

### 3. Improve Real-Time Updates

**File**: `src/components/admin/VoucherInventory.tsx`

Instead of refetching everything on each realtime event, handle INSERT/UPDATE/DELETE events individually by updating local state. Add a polling fallback every 30s for reliability.

### 4. No Database Changes Required

The existing `voucher_codes` table, `assign_voucher_code`, and `try_assign_voucher` functions already handle everything correctly — atomic locking prevents duplicate assignment, notifications are sent via `create_user_notification`.

### Files Summary

**Modified files:**
- `src/pages/GarenaShell.tsx` — Add `try_assign_voucher` call after order
- `src/pages/Netflix.tsx` — Add `try_assign_voucher` call after order  
- `src/components/garena/GarenaSuccessModal.tsx` — Add voucher code display
- `src/components/netflix/NetflixSuccessModal.tsx` — Add voucher code display
- `src/components/admin/VoucherInventory.tsx` — UI upgrade with pagination, incremental realtime, per-game stats

