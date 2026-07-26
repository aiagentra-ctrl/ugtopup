# Mobile Legends (ML) API Integration Documentation

**Last Updated:** February 2025  
**Platform:** UGTopup  
**Integration Partner:** Liana Store (lianastore.in)

---

## Table of Contents

1. [Overview](#overview)
2. [What is the Mobile Legends API](#what-is-the-mobile-legends-api)
3. [Architecture & Workflow](#architecture--workflow)
4. [Integration Setup](#integration-setup)
5. [Authentication & Credentials](#authentication--credentials)
6. [API Endpoints](#api-endpoints)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)
9. [Testing the API](#testing-the-api)
10. [Adding Features & Updates](#adding-features--updates)
11. [Troubleshooting](#troubleshooting)
12. [Security Considerations](#security-considerations)

---

## Overview

UGTopup integrates with **Liana Store's Mobile Legends API** to provide **automated, real-time diamond delivery** for Mobile Legends players in Nepal. This integration enables:

✅ **Instant automated delivery** of diamonds to player accounts  
✅ **Player verification** before processing orders  
✅ **Real-time wallet balance tracking** for Liana merchant account  
✅ **Safeguards** against overspending (daily caps, rate limits)  
✅ **Admin monitoring** of all API transactions  
✅ **Automatic retry logic** for failed orders  

---

## What is the Mobile Legends API

### Liana Store API

**Liana Store** is a game credit distribution platform that provides APIs for automating in-game purchases. The **Mobile Legends API** is part of their v1 system (`/wp-json/ar2/v1`).

**Key Features:**
- Real-time player ID verification
- Automated diamond package delivery
- Wallet balance management
- Transaction tracking via transaction IDs
- Support for multiple diamond package sizes and special passes

**Base URL:** `https://lianastore.in/wp-json/ar2/v1`

**API Provider:** Liana Store  
**Documentation:** Available through Liana Store merchant dashboard  

---

## Architecture & Workflow

### High-Level Flow

```
┌─────────────────┐
│  User Orders    │
│  Diamonds       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React - MobileLegends.tsx)                           │
│  - Collect User ID, Zone ID, Package Selection                 │
│  - Client-side balance check                                   │
│  - Call IGN verification endpoint                              │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Edge Function (process-ml-order)                      │
│  - Verify player ID/Zone with Liana API                        │
│  - Check merchant wallet balance                               │
│  - Place order via Liana API                                   │
│  - Handle retry logic & safeguards                             │
│  - Track transaction & wallet activity                         │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Liana Store API (lianastore.in)                               │
│  - /ign/verify → Verify player exists                          │
│  - /orders → Place diamond order                               │
│  - /balance → Check wallet balance                             │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mobile Legends Game Servers                                    │
│  - Diamonds credited to player account                         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
Components & Files:
├── Frontend
│   ├── src/pages/MobileLegends.tsx          # Main page component
│   ├── src/components/ml/MLIgnVerification.tsx   # IGN verification modal
│   ├── src/components/ml/MLPackageSelector.tsx   # Package selection UI
│   ├── src/components/ml/MLUserInputForm.tsx     # User ID/Zone input
│   ├── src/components/ml/MLOrderReview.tsx       # Order review modal
│   ├── src/components/ml/MLSuccessModal.tsx      # Success confirmation
│   └── src/components/ml/MLProductHeader.tsx     # Header/branding
│
├── API Client Library
│   └── src/lib/lianaApi.ts                 # API helpers & types
│
├── Edge Function (Supabase)
│   └── supabase/functions/process-ml-order/index.ts  # Core processor
│
├── Database
│   ├── liana_orders table                  # Transaction tracking
│   ├── wallet_activity_logs table          # Wallet history
│   ├── product_orders table                # General orders
│   └── system_settings table               # Configuration (caps, limits)
│
└── Admin Monitoring
    ├── src/components/admin/MLApiMonitoring.tsx     # Order monitoring
    ├── src/components/admin/LianaWalletBalance.tsx  # Wallet dashboard
    ├── src/components/admin/LianaOrdersDashboard.tsx # Order history
    └── src/components/admin/MobileLegendsPricing.tsx # Package pricing
```

### Data Flow

1. **User Places Order**
   - Frontend collects: User ID, Zone ID, Package
   - Client validates balance locally
   - Deduplicates request to prevent double orders

2. **IGN Verification (Optional)**
   - Frontend calls edge function with `action: "verify-ign"`
   - Edge function calls Liana `/ign/verify` endpoint
   - Returns player IGN confirmation modal

3. **Order Creation**
   - Frontend invokes `process-ml-order` with `order_id`
   - Edge function checks safeguards (daily cap, rate limit)
   - Verifies merchant wallet balance
   - Calls Liana `/ign/verify` → `/orders` endpoints
   - Updates tracking tables on success/failure

4. **Admin Monitoring**
   - Admins view real-time order status in dashboard
   - Can retry failed orders or cancel pending ones
   - Monitor wallet balance and daily spending

---

## Integration Setup

### Prerequisites

1. **Liana Store Merchant Account**
   - Sign up at Liana Store
   - Obtain API Key and API Secret
   - Fund merchant wallet with credits

2. **Supabase Project**
   - Database already configured
   - Edge Functions enabled
   - Service role key available

3. **Environment Variables**
   - `LIANA_API_KEY` - Your Liana API key
   - `LIANA_API_SECRET` - Your Liana API secret
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
   - `SUPABASE_ANON_KEY` - Supabase anonymous key

### Step-by-Step Connection

#### 1. Set Up Liana API Credentials

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets

# Add these environment variables:
LIANA_API_KEY=your_liana_api_key_here
LIANA_API_SECRET=your_liana_api_secret_here
```

#### 2. Deploy Edge Function

The edge function is already deployed at:
- **Function Name:** `process-ml-order`
- **Path:** `supabase/functions/process-ml-order/index.ts`
- **Trigger:** HTTP POST via `supabase.functions.invoke()`

To redeploy after changes:

```bash
supabase functions deploy process-ml-order
```

#### 3. Create Required Database Tables

Run the migrations:

```bash
# Already included in migrations:
# - supabase/migrations/20260114162733_*.sql
# - supabase/migrations/20260322081527_*.sql
# - supabase/migrations/20260308193348_*.sql

# These create:
# - liana_orders table
# - wallet_activity_logs table
# - system_settings table
```

#### 4. Configure System Settings

Insert default settings in Supabase:

```sql
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('liana_daily_spending_cap', '5000'),           -- Max coins per day
  ('liana_rate_limit_per_minute', '10'),          -- Max orders per minute
  ('liana_low_balance_threshold', '2000');        -- Alert when below this
```

#### 5. Enable Feature Flag

```sql
INSERT INTO feature_flags (feature_key, feature_name, description) VALUES
  ('liana_api', 'Mobile Legends API', 'Automated diamond delivery via Liana API');
```

---

## Authentication & Credentials

### Liana API Authentication

All Liana API requests require these headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-API-KEY` | Your API Key | Identifies your merchant account |
| `X-API-SECRET` | Your API Secret | Authenticates requests |
| `X-ORIGIN-DOMAIN` | `ugtopups.com` | Whitelist validation |
| `Content-Type` | `application/json` | Request format |
| `Accept` | `application/json` | Response format |
| `User-Agent` | `LianaStoreWooCommerce/2.2.2` | Client identifier |

### How Credentials Are Used

**File:** `supabase/functions/process-ml-order/index.ts`

```typescript
function getLianaHeaders(apiKey: string, apiSecret: string) {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'X-API-SECRET': apiSecret,
    'X-ORIGIN-DOMAIN': 'ugtopups.com',
    'Accept': 'application/json',
    'User-Agent': 'LianaStoreWooCommerce/2.2.2'
  };
}
```

### Credential Rotation

If credentials expire or are compromised:

1. **Generate new credentials** in Liana Store dashboard
2. **Update Supabase secrets:**
   ```bash
   supabase secrets set LIANA_API_KEY=new_key
   supabase secrets set LIANA_API_SECRET=new_secret
   ```
3. **Redeploy edge function** (automatic on secret change)
4. **Update admin dashboard** - Notify admins of any 403 errors

---

## API Endpoints

### 1. IGN Verification Endpoint

**Purpose:** Verify player ID and Zone ID, retrieve player IGN

**Request:**
```
POST https://lianastore.in/wp-json/ar2/v1/ign/verify
```

**Headers:**
```
X-API-KEY: your_api_key
X-API-SECRET: your_api_secret
X-ORIGIN-DOMAIN: ugtopups.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "variation_id": 9802,    // Liana variation ID for diamond package
  "uid": "123456789",      // Mobile Legends Player ID
  "zone_id": "1234"        // Mobile Legends Zone ID
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "verified": true,
  "display": "PlayerIGN123",    // In-game name
  "game": "mobile_legends",
  "message": "Player verified successfully"
}
```

**Error Response (400/500):**
```json
{
  "status": "error",
  "verified": false,
  "error": "Player not found in this zone",
  "message": "Verification failed"
}
```

### 2. Place Order Endpoint

**Purpose:** Create and process diamond order

**Request:**
```
POST https://lianastore.in/wp-json/ar2/v1/orders
```

**Headers:**
```
X-API-KEY: your_api_key
X-API-SECRET: your_api_secret
X-ORIGIN-DOMAIN: ugtopups.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "variation_id": 9802,      // Liana product variation ID
  "qty": 1,                  // Quantity (usually 1 for single purchase)
  "uid": "123456789",        // Mobile Legends Player ID
  "zone_id": "1234",         // Mobile Legends Zone ID
  "reference_id": "ORD-001"  // Your internal order number
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "order_id": "LIANA-987654",         // Liana's order ID
  "transaction_id": "TXN-123456",     // Transaction ID
  "balance_after": 4500,              // Merchant wallet balance after order
  "message": "Order placed successfully"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "code": "insufficient_funds",
  "error": "Not enough coins in wallet",
  "message": "Insufficient balance for this transaction"
}
```

### 3. Wallet Balance Endpoint

**Purpose:** Check merchant wallet balance

**Request:**
```
GET https://lianastore.in/wp-json/ar2/v1/balance
```

**Headers:**
```
X-API-KEY: your_api_key
X-API-SECRET: your_api_secret
X-ORIGIN-DOMAIN: ugtopups.com
Accept: application/json
```

**Success Response (200):**
```json
{
  "status": "success",
  "balance": 5000,        // Available coins in merchant wallet
  "currency": "coins",
  "message": "Balance retrieved successfully"
}
```

**Error Response (403):**
```json
{
  "status": "error",
  "code": "expired",
  "data": { "status": 403 },
  "message": "Credentials have expired"
}
```

---

## Request/Response Examples

### Example 1: Complete Order Flow

```typescript
// 1. Frontend initiates IGN verification
const verifyResponse = await supabase.functions.invoke('process-ml-order', {
  body: {
    action: 'verify-ign',
    user_id: '123456789',
    zone_id: '1234',
    package_name: '55 Diamonds',
    quantity: 55
  }
});

// Response:
{
  success: true,
  ign: "PlayerIGN123",
  variation_id: 5657,
  display: "PlayerIGN123"
}

// 2. User confirms IGN, order is created and sent to edge function
const orderResponse = await supabase.functions.invoke('process-ml-order', {
  body: {
    order_id: 'uuid-of-order-in-product_orders'
  }
});

// Response:
{
  success: true,
  message: 'Diamonds delivered successfully!',
  ign: 'PlayerIGN123',
  transaction_id: 'LIANA-987654',
  wallet_balance_after: 4500,
  coins_used: 500
}

// 3. Admin can check wallet balance anytime
const balanceResponse = await supabase.functions.invoke('process-ml-order', {
  body: {
    action: 'check-balance'
  }
});

// Response:
{
  success: true,
  balance: { status: 'success', balance: 4500 },
  timestamp: '2025-02-15T10:30:00Z'
}
```

### Example 2: Diamond Package Mapping

```typescript
// All supported ML diamond packages and their Liana variation IDs
const productIdMap = {
  '10 Diamonds': 9802,
  '22 Diamonds': 9805,
  '33 Diamonds': 9806,
  '51 Diamonds': 9807,
  '55 Diamonds': 5657,
  '86 Diamonds': 5743,
  '102 Diamonds': 9809,
  '110 Diamonds': 6976,
  '165 Diamonds': 5658,
  '172 Diamonds': 5857,
  '257 Diamonds': 5859,
  '275 Diamonds': 5659,
  '343 Diamonds': 5860,
  '429 Diamonds': 5861,
  '514 Diamonds': 5862,
  '565 Diamonds': 5660,
  '600 Diamonds': 5863,
  '706 Diamonds': 5864,
  '878 Diamonds': 6936,
  '1049 Diamonds': 5865,
  '1135 Diamonds': 6978,
  '1412 Diamonds': 5866,
  '2195 Diamonds': 5867,
  '3688 Diamonds': 5868,
  '5532 Diamonds': 5869,
  '9288 Diamonds': 5870,
  'Weekly Diamond Pass': 5570,
  'Twilight Pass': 6111,
  'Super Value Pass': 7236
};
```

### Example 3: Database Tracking

After a successful order, these tables are updated:

```sql
-- liana_orders table
INSERT INTO liana_orders (
  order_id,
  liana_product_id,
  user_id,
  zone_id,
  ign,
  status,
  api_response,
  api_transaction_id
) VALUES (
  'order-uuid',
  5657,                                    -- Variation ID
  '123456789',
  '1234',
  'PlayerIGN123',
  'completed',
  '{"status": "success", "transaction_id": "LIANA-987654"}',
  'LIANA-987654'
);

-- wallet_activity_logs table
INSERT INTO wallet_activity_logs (
  order_id,
  order_number,
  action,
  coins_used,
  balance_before,
  balance_after,
  api_status
) VALUES (
  'order-uuid',
  'ORD-001',
  'order_completed',
  500,
  5000,
  4500,
  'success'
);
```

---

## Error Handling

### Error Types and Responses

| Error | Code | Status | Solution |
|-------|------|--------|----------|
| Player not found | `verification_failed` | 400 | Ask user to verify Game ID and Zone ID |
| Insufficient wallet balance | `insufficient_funds` | 400 | Top up merchant wallet in Liana dashboard |
| Rate limit exceeded | `rate_limited` | 429 | Wait 60 seconds before retrying |
| Daily spending cap reached | `spending_cap_reached` | 429 | Wait until next day or increase cap |
| Credentials expired | `credentials_expired` | 403 | Update API key/secret in Supabase secrets |
| Connection error | `connection_error` | 500 | Retry after 1-2 seconds |

### Error Response Structure

```json
{
  "success": false,
  "error": "Human-readable error message",
  "stage": "verification|order|api_connection",
  "insufficient_funds": false,
  "spending_cap_reached": false,
  "rate_limited": false,
  "credentials_expired": false
}
```

### Automatic Retry Logic

The edge function implements exponential backoff:

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  delayMs = 1000
): Promise<Response> {
  // Retries up to 2 times with 1-second delay
  // Only retries on network errors or 5xx responses
  // Does NOT retry on 4xx errors (client errors)
}
```

### Admin Notifications

When critical errors occur:

- **Credentials Expired** → Admin notification in dashboard
- **Low Wallet Balance** → Alert notification when below threshold
- **Repeated Failures** → Error aggregation in admin panel

### Manual Retry

Admins can manually retry failed orders:

```typescript
// From admin dashboard
await retryLianaOrder(lianaOrderId);

// This:
// 1. Resets order status to 'pending'
// 2. Clears error messages
// 3. Re-invokes edge function
// 4. Allows successful completion if issue was temporary
```

---

## Testing the API

### Unit Testing

**File:** Tests for IGN verification and order processing

```typescript
describe('Liana API', () => {
  it('should verify valid player ID and Zone', async () => {
    const result = await supabase.functions.invoke('process-ml-order', {
      body: {
        action: 'verify-ign',
        user_id: '123456789',
        zone_id: '1234',
        package_name: '55 Diamonds'
      }
    });
    
    expect(result.data.success).toBe(true);
    expect(result.data.ign).toBeDefined();
  });

  it('should fail for invalid player ID', async () => {
    const result = await supabase.functions.invoke('process-ml-order', {
      body: {
        action: 'verify-ign',
        user_id: 'invalid',
        zone_id: '1234',
        package_name: '55 Diamonds'
      }
    });
    
    expect(result.data.success).toBe(false);
    expect(result.data.error).toBeDefined();
  });
});
```

### Integration Testing

**Test Checklist:**

1. **Player Verification**
   ```bash
   # Test with valid ML player ID
   POST /process-ml-order
   {
     "action": "verify-ign",
     "user_id": "VALID_PLAYER_ID",
     "zone_id": "1234",
     "package_name": "55 Diamonds"
   }
   # Expect: {"success": true, "ign": "PlayerName"}
   ```

2. **Balance Check**
   ```bash
   # Check wallet has sufficient coins
   POST /process-ml-order
   {
     "action": "check-balance"
   }
   # Expect: {"success": true, "balance": {...}}
   ```

3. **Wallet Logs**
   ```bash
   # View all transaction history
   POST /process-ml-order
   {
     "action": "wallet-logs"
   }
   # Expect: {"success": true, "logs": [...], "summary": {...}}
   ```

4. **Full Order Flow**
   ```bash
   # 1. Create order in product_orders table
   # 2. Invoke process-ml-order with order_id
   # 3. Verify diamonds credited in-game
   # 4. Check liana_orders status = 'completed'
   # 5. Confirm wallet_activity_logs entry created
   ```

### Test with Admin Dashboard

1. Navigate to Admin Panel → "ML API Monitoring"
2. View real-time order processing status
3. Check wallet balance and daily spending
4. Monitor wallet activity logs
5. Test retry functionality on failed orders

### Load Testing

For rate limit testing (normally 10 orders/minute):

```bash
# Simulate concurrent orders (should succeed first 10, queue others)
for i in {1..20}; do
  curl -X POST /process-ml-order \
    -d "{\"order_id\": \"order-$i\"}"
done
```

---

## Adding Features & Updates

### Adding a New Diamond Package

**Steps:**

1. **Get variation_id from Liana Store**
   - Log into Liana dashboard
   - Find the new package's variation ID

2. **Update productIdMap**
   ```typescript
   // File: supabase/functions/process-ml-order/index.ts
   const productIdMap: Record<string, number> = {
     // ... existing packages
     'NEW_PACKAGE_NAME': NEW_VARIATION_ID,  // Add new entry
   };
   
   const quantityMap: Record<number, number> = {
     // ... existing quantities
     NEW_QUANTITY: NEW_VARIATION_ID,        // Add new entry
   };
   ```

3. **Add to Game Pricing DB**
   ```sql
   INSERT INTO game_prices (game, package_name, quantity, price, currency)
   VALUES ('mobile_legends', 'NEW_PACKAGE_NAME', NEW_QUANTITY, PRICE, 'NPR');
   ```

4. **Test**
   - Verify IGN verification works with new package
   - Test order completion

5. **Deploy**
   ```bash
   supabase functions deploy process-ml-order
   ```

### Adding a New Safeguard

**Example:** Rate limit per hour instead of per minute

```typescript
// In supabase/functions/process-ml-order/index.ts

async function checkHourlyRateLimit(supabaseAdmin: any): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
}> {
  const { data: limitSetting } = await supabaseAdmin
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'liana_rate_limit_per_hour')
    .single();
  
  const limit = parseInt(limitSetting?.setting_value || '100', 10);
  
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data: recentOrders } = await supabaseAdmin
    .from('wallet_activity_logs')
    .select('id')
    .in('action', ['order_completed', 'order_failed'])
    .gte('created_at', oneHourAgo);
  
  const count = (recentOrders || []).length;
  return { allowed: count < limit, count, limit };
}

// Then in handleProcessOrder():
const hourlyCheck = await checkHourlyRateLimit(supabaseAdmin);
if (!hourlyCheck.allowed) {
  return new Response(
    JSON.stringify({
      success: false,
      error: `Hourly rate limit reached (${hourlyCheck.count}/${hourlyCheck.limit})`
    }),
    { status: 429 }
  );
}
```

### Updating API Credentials

1. **Generate new credentials** in Liana Store dashboard
2. **Update secrets:**
   ```bash
   supabase secrets set LIANA_API_KEY=your_new_key
   supabase secrets set LIANA_API_SECRET=your_new_secret
   ```
3. **Verify in dashboard** - Check balance endpoint

### Modifying Response Formats

If you need to change what data is returned:

**File:** `src/pages/MobileLegends.tsx`

```typescript
// Update the handler for API results
if (apiResult?.success) {
  setShowSuccessModal(true);
  toast.success(`Diamonds delivered! 💎 (IGN: ${apiResult.ign})`);
  // Add custom logic for new response fields
}
```

### Adding Admin Monitoring Features

**File:** `src/components/admin/MLApiMonitoring.tsx`

```typescript
// Add new data fetch
const { data: newMetrics } = await supabase
  .from('wallet_activity_logs')
  .select('*')
  // ... additional filtering

// Update display
setNewMetrics(newMetrics);
```

---

## Troubleshooting

### Common Issues

#### Issue: "Player not found in this zone"

**Cause:** Invalid Game ID or Zone ID

**Solution:**
- Ask user to double-check their Mobile Legends Game ID
- Verify Zone ID (1 for Asia Server, etc.)
- Check if player has logged in recently to ML

#### Issue: "Not enough coins in wallet"

**Cause:** Merchant wallet has insufficient balance

**Solution:**
1. Log into Liana Store dashboard
2. Add credits to merchant wallet
3. Retry the order from admin dashboard
4. Alert will automatically trigger when balance is low

#### Issue: "Order placed but processing encountered an issue"

**Cause:** Edge function ran but had an error

**Solution:**
1. Check admin dashboard under "ML API Monitoring"
2. View error details in wallet activity logs
3. Click "Retry" button to reprocess
4. Check if issue persists (may be API temporary issue)

#### Issue: "Credentials have expired (403)"

**Cause:** Liana API credentials are outdated

**Solution:**
1. Log into Liana Store merchant dashboard
2. Generate new API credentials
3. Update in Supabase → Project Settings → Secrets
4. Edge function will auto-reload

#### Issue: IGN verification showing wrong player

**Cause:** Game ID belongs to different account

**Solution:**
- User should use the Game ID associated with the account they want diamonds on
- May need to provide Mobile Legends username instead if app synced to different account

#### Issue: Rate limit errors

**Cause:** Too many orders in short time window

**Solution:**
- Wait at least 60 seconds before next order
- Check current rate limit in `system_settings`
- Increase limit if needed: `UPDATE system_settings SET setting_value = '20' WHERE setting_key = 'liana_rate_limit_per_minute'`

### Debug Logging

All API interactions are logged. To view:

1. **Browser Console (Frontend)**
   ```javascript
   // Check for verification and order errors
   console.log('Liana API error:', apiError);
   ```

2. **Supabase Logs (Edge Function)**
   - Dashboard → Functions → process-ml-order → Logs
   - View detailed API requests/responses

3. **Database Logs**
   ```sql
   -- View all wallet activity
   SELECT * FROM wallet_activity_logs 
   ORDER BY created_at DESC 
   LIMIT 20;
   
   -- View failed orders
   SELECT * FROM liana_orders 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

### Performance Optimization

If orders are slow:

1. **Check Liana API latency** - May be their server issue
2. **Verify network connection** - Edge function may be timing out
3. **Check safeguards** - Daily cap or rate limit may be blocking
4. **Monitor database** - Query performance might be slow

```sql
-- Check database query performance
EXPLAIN ANALYZE SELECT * FROM liana_orders WHERE status = 'processing';
```

---

## Security Considerations

### Credential Management

✅ **DO:**
- Store API credentials in Supabase Secrets, never in code
- Rotate credentials quarterly
- Use separate credentials for dev and production
- Restrict Liana API credentials to IP whitelist if available

❌ **DON'T:**
- Commit credentials to Git
- Share credentials in messages/email
- Expose credentials in client-side code
- Use same credentials across environments

### Data Privacy

- User IDs are stored in `liana_orders` table for transaction tracking
- All requests go over HTTPS to Liana API
- Admin access is restricted via RLS policies
- User access to orders is filtered by `user_id`

### Rate Limiting & Safeguards

The system includes built-in protections:

1. **Daily Spending Cap** - Default 5000 coins/day
2. **Per-Minute Rate Limit** - Default 10 orders/minute
3. **Wallet Balance Check** - Won't process if insufficient funds
4. **Retry Limits** - Failed orders can retry but won't spam API
5. **Request Deduplication** - Frontend prevents double-submit

### API Attack Prevention

- Edge function validates all input parameters
- Invalid package names are rejected before calling Liana
- Missing required fields (user_id, zone_id) are caught
- Malformed requests return 400 errors

### Monitoring & Alerts

- Low balance alerts notify admins automatically
- Failed orders are aggregated for visibility
- Suspicious activity patterns can be detected via logs
- All transactions create audit trail in `activity_logs`

---

## Quick Reference

### Environment Variables

```bash
LIANA_API_KEY=your_key_here
LIANA_API_SECRET=your_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
```

### Database Tables

```
liana_orders              # Tracks all ML orders
product_orders            # General orders (linked)
wallet_activity_logs      # Transaction history
system_settings          # Configuration (caps, limits)
```

### Key Files

```
supabase/functions/process-ml-order/index.ts    # Core processor
src/pages/MobileLegends.tsx                      # User interface
src/lib/lianaApi.ts                              # API client helpers
src/components/admin/MLApiMonitoring.tsx         # Admin dashboard
```

### API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ign/verify` | POST | Verify player ID and get IGN |
| `/orders` | POST | Place diamond order |
| `/balance` | GET | Check wallet balance |

### Useful Admin Commands

```sql
-- Check today's spending
SELECT SUM(coins_used) as total_spent 
FROM wallet_activity_logs 
WHERE action = 'order_completed' 
AND created_at::date = CURRENT_DATE;

-- View failed orders in last hour
SELECT * FROM liana_orders 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 hour';

-- Reset order for retry
UPDATE liana_orders 
SET status = 'pending', error_message = null 
WHERE id = 'order-uuid';
```

---

## Support & Escalation

### Getting Help

1. **Check Logs First**
   - Supabase → Functions → process-ml-order → Logs
   - Admin Dashboard → ML API Monitoring

2. **Contact Liana Support**
   - For API issues or account problems
   - For credential issues or wallet questions
   - URL: lianastore.in (merchant dashboard)

3. **Internal Escalation**
   - For frontend bugs → Frontend team
   - For database issues → Database admin
   - For Supabase issues → DevOps/Infrastructure

### Version History

| Date | Version | Changes |
|------|---------|---------|
| Feb 2025 | 1.0 | Initial Liana API integration |
| Feb 2025 | 1.1 | Added safeguards (daily cap, rate limit) |
| Feb 2025 | 1.2 | Admin monitoring dashboard |

---

**Document Version:** 1.2  
**Last Updated:** February 2025  
**Maintained By:** UGTopup Development Team
