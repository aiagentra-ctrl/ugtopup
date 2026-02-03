

## Mobile Legends API Integration Fix Plan

### Problem Summary
The Liana API integration is broken due to several critical issues:
1. **Wrong API URL** - Using `https://api.lfrfrk.xyz` instead of `https://lianastore.in/wp-json/ar2/v1`
2. **Wrong endpoints** - Using `/api/verify` and `/api/order` instead of `/ign/verify` and `/orders`
3. **Wrong request/response format** - API expects different headers and returns different response structure
4. **Orders stuck in "Processing"** - All recent orders have `api_response: null` (API never called successfully)

---

### Phase 1: Update Database Schema

Add missing columns to `liana_orders` table for better tracking:

```sql
ALTER TABLE liana_orders 
ADD COLUMN IF NOT EXISTS verification_response JSONB,
ADD COLUMN IF NOT EXISTS order_response JSONB,
ADD COLUMN IF NOT EXISTS api_request_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS order_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
```

---

### Phase 2: Rewrite Edge Function

**Replace `supabase/functions/process-ml-order/index.ts`** with corrected implementation:

**Key Changes:**
| Current (Broken) | Fixed |
|-----------------|-------|
| `https://api.lfrfrk.xyz` | `https://lianastore.in/wp-json/ar2/v1` |
| `/api/verify` | `/ign/verify` |
| `/api/order` | `/orders` |
| `X-API-Key` header | `X-API-KEY` header |
| `{ success: true }` check | `{ status: 'success' }` check |
| `product_id` param | `variation_id` param |
| `user_id` param | `uid` param |
| No `X-ORIGIN-DOMAIN` | Include `X-ORIGIN-DOMAIN` header |

**Request Headers (Fixed):**
```javascript
headers: {
  'Content-Type': 'application/json',
  'X-API-KEY': lianaApiKey,
  'X-API-SECRET': lianaApiSecret,
  'X-ORIGIN-DOMAIN': originDomain,
  'Accept': 'application/json',
  'User-Agent': 'LianaStoreWooCommerce/2.2.2'
}
```

**Verify Endpoint Payload (Fixed):**
```javascript
body: {
  variation_id: lianaProductId,
  uid: userId,
  zone_id: zoneId
}
```

**Order Endpoint Payload (Fixed):**
```javascript
body: {
  variation_id: lianaProductId,
  qty: quantity,
  uid: userId,
  zone_id: zoneId,
  reference_id: orderNumber
}
```

**Response Handling (Fixed):**
```javascript
// Old: if (verifyData.success)
// New: if (verifyData.status === 'success' && verifyData.verified)

// IGN field: verifyData.display (not verifyData.data?.ign)
```

---

### Phase 3: Update Dashboard to Show API Details

**Update `src/lib/lianaApi.ts`** to include new columns:
- `verification_response`
- `order_response`
- `api_request_sent`
- `verification_sent_at`
- `order_sent_at`
- `completed_at`

**Update `src/components/admin/LianaOrdersDashboard.tsx`** to display:
- Whether API request was actually sent
- Verification response details
- Order response details
- Timestamps for each stage

---

### Phase 4: Remove Manual Database Functions

**Update `complete_ml_order` and `fail_ml_order` functions** to use new column names, or switch to direct updates in the edge function (as shown in the uploaded code) for simpler debugging.

---

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/process-ml-order/index.ts` | **REWRITE** | Fix API URL, endpoints, headers, payload format |
| `src/lib/lianaApi.ts` | **UPDATE** | Add new tracking columns to interface |
| `src/components/admin/LianaOrdersDashboard.tsx` | **UPDATE** | Show detailed API tracking info |
| Database migration | **CREATE** | Add new columns to liana_orders and product_orders |

---

### Technical Implementation Details

**Corrected API Flow:**

```text
1. User places order
       ↓
2. Edge function called with order_id
       ↓
3. Create liana_orders record (status: processing, api_request_sent: false)
       ↓
4. Call /ign/verify endpoint
   - Store response in verification_response
   - Update verification_sent_at, verification_completed_at
       ↓
5. If verified, call /orders endpoint
   - Store response in order_response
   - Update order_sent_at, api_request_sent: true
       ↓
6. Update final status based on response
   - Success: status='completed', completed_at=now()
   - Failed: status='failed', error_message=...
```

**Fixed Response Parsing:**
```javascript
// Verification response
{
  status: 'success',
  verified: true,
  display: 'PlayerName123',  // This is the IGN
  game: 'Mobile Legends'
}

// Order response
{
  status: 'success',
  order_id: '12345',
  balance_after: 50.00
}
```

---

### Expected Outcome

After implementation:
- Orders will correctly call the Liana API at `https://lianastore.in/wp-json/ar2/v1`
- Status will update to **completed** or **failed** based on actual API response
- Admin dashboard will show complete API request/response details
- No more orders stuck in "Processing" state

---

### Immediate Actions After Approval

1. Deploy the corrected edge function
2. Run database migration for new columns
3. Test with a real order to verify API connectivity
4. Order ID 16 is stuck in Processing.
Please cancel/stop the processing status.
We do not need this order to be processed through the system because it has already been completed manually.
Kindly update the status properly.

