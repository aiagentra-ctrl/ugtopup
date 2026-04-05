

# Liana API Wallet Audit Report -- Root Cause Analysis

## Executive Summary

After a thorough investigation of the wallet activity logs, edge function code, API request patterns, and database records, here are the findings:

**There is NO security breach, unauthorized usage, or billing bug.**

The wallet balance dropped from ~10,020 coins to ~6,388 coins through **137 legitimate customer orders** over 28 days. All coin deductions match real orders with correct `balance_before` → `balance_after` chains.

---

## Findings

### 1. Wallet Activity -- Fully Accounted For

| Metric | Value |
|---|---|
| Total completed orders | 137 |
| Total coins consumed | 26,200.70 |
| Failed orders (no coins deducted) | 16 |
| Balance checks (read-only, no cost) | 153 |
| Duplicate deductions found | **0** |
| Unauthorized API calls found | **0** |

The balance chain is continuous: each `order_completed` log shows `balance_after` matching the next order's `balance_before`. No gaps, no phantom deductions.

### 2. Daily Consumption (Last 7 Days)

| Date | Orders | Coins Spent |
|---|---|---|
| Apr 4 | 11 | 2,822 |
| Apr 3 | 23 | 2,239 |
| Apr 2 | 14 | 1,250 |
| Apr 1 | 8 | 1,035 |
| Mar 31 | 5 | 2,791 |
| Mar 30 | 3 | 507 |

The spike on Apr 3 (23 orders) is where the perception of "sudden drain" likely comes from -- this is normal order volume, not a breach.

### 3. API Key Security

- LIANA_API_KEY and LIANA_API_SECRET are stored as **Supabase Edge Function secrets** -- not exposed in frontend code or `.env`
- The edge function logs show `"API access expired"` errors, meaning Liana has **expired/rotated your API credentials** on their side
- No API keys are hardcoded in client-side code

### 4. Critical Issue Found: Liana API Access Expired

The edge function logs show repeated errors:
```
"code": "expired", "message": "API access expired.", "data": {"status": 403}
```

This means **your Liana API key/secret has expired**. This is NOT a security breach -- it's a credential expiry on Liana's end. New orders will fail until credentials are renewed.

### 5. Code Audit -- No Bugs Found

- No infinite loops or retry storms (retries limited to 2 attempts, only on 5xx/network errors)
- Failed orders correctly log `coins_used: 0` -- no billing for failures
- Balance check is read-only (`GET /balance`) and does not consume coins
- The `fetchWithRetry` function correctly skips retries on 4xx errors
- Admin polling was already disabled in prior optimization work

---

## Action Required

### Immediate (Do Now)

1. **Renew Liana API credentials**: Log into the Liana Store dashboard (lianastore.in), get fresh API key and secret, then update them in Supabase Edge Function secrets:
   - `LIANA_API_KEY`
   - `LIANA_API_SECRET`

2. **Top up Liana wallet**: Current balance is ~6,388 coins. If order volume continues at ~2,000+ coins/day, the wallet will run out in ~3 days.

### Preventive Measures (Implementation Plan)

These are code changes to add safeguards:

**A. Low-balance alert system** (Edge Function)
- After each order, if `balance_after < 2000`, log a warning and send admin notification
- Add a daily spending cap check (e.g., if coins_used_today > 5000, pause processing)

**B. Rate limiting on order processing**
- Add a per-minute limit (e.g., max 10 orders/minute) to prevent accidental bursts
- Track in `wallet_activity_logs` with a simple time-window check

**C. Admin dashboard improvements**
- Add a "Daily Spending" chart to the LianaWalletBalance widget
- Show a prominent warning banner when balance < threshold
- Add credential expiry detection (show alert when API returns 403)

**D. Spending cap enforcement**
- Add a `liana_daily_spending_cap` setting in admin
- Edge function checks total coins used today before processing

### Technical Changes

1. **Modify `process-ml-order/index.ts`**: Add daily spending cap check, low-balance alerts, and rate limiting before order processing
2. **Modify `LianaWalletBalance.tsx`**: Add daily spending chart and credential status indicator
3. **Create migration**: Add `system_settings` row for `liana_daily_spending_cap` with default 5000 coins
4. **Add admin notification**: Trigger push notification when balance drops below configurable threshold

---

## Conclusion

The wallet drain is from **legitimate orders** (137 orders = 26,200 coins over 28 days). The real issue is the **expired Liana API credentials** which will block all future orders. Renew credentials immediately, then implement the spending safeguards above.

