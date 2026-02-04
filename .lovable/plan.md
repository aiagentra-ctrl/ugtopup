

## Mobile Legends API Orders - Complete Fix Plan

### Issues Identified

Based on my investigation:

| Issue | Current State | Root Cause |
|-------|---------------|------------|
| **8 Pending orders** | Status: pending, api_request_sent: false | Orders placed before API was fixed - never processed |
| **8 Failed orders** | Status: failed with legacy error message | Marked as failed during previous API fix |
| **Retry All Failed button** | Visible globally in header | Can cause duplicate orders if used on manually-completed orders |
| **API not sending requests** | api_request_sent: false on all orders | The edge function IS correctly configured, but existing orders were created before fix was deployed |
| **No email notifications** | No email system exists | Need to integrate Resend for Gmail notifications |

---

### Phase 1: Cancel All Stuck Orders

**Create database migration to:**
- Set all `pending` liana_orders to `canceled` status
- Set all `pending` product_orders to `canceled` status  
- Add cancel reason: "Manually completed - legacy order"

```sql
-- Cancel all pending liana_orders
UPDATE liana_orders 
SET status = 'canceled', 
    error_message = 'Manually completed - canceled to prevent duplicate processing',
    updated_at = NOW()
WHERE status IN ('pending', 'processing');

-- Cancel corresponding product_orders
UPDATE product_orders 
SET status = 'canceled',
    failure_reason = 'Manually completed - canceled to prevent duplicate processing',
    updated_at = NOW()
WHERE id IN (
  SELECT order_id FROM liana_orders WHERE status = 'canceled'
);
```

---

### Phase 2: Remove Global "Retry All Failed" Button

**Modify:** `src/components/admin/LianaOrdersDashboard.tsx`

**Changes:**
1. Remove the "Retry All Failed (X)" button from the global header
2. Keep individual "Retry" button only on each failed order row
3. Add a new status filter option: "canceled" to distinguish from failed

**Before (lines 226-240):**
```tsx
{(stats?.failed || 0) > 0 && (
  <Button
    variant="destructive"
    size="sm"
    onClick={handleRetryAll}
    disabled={retryingAll}
  >
    Retry All Failed ({stats?.failed})
  </Button>
)}
```

**After:**
```tsx
{/* Button removed - individual retry only */}
```

---

### Phase 3: Add "Cancel Order" Button for Admin

**Modify:** `src/components/admin/LianaOrdersDashboard.tsx`

Add ability to manually cancel any pending/processing/failed order:

```tsx
// Add cancel button next to retry button
{(order.status === "failed" || order.status === "pending" || order.status === "processing") && (
  <Button
    variant="ghost"
    size="icon"
    onClick={() => handleCancelOrder(order.id)}
  >
    <XCircle className="h-4 w-4 text-destructive" />
  </Button>
)}
```

**Add new function in `src/lib/lianaApi.ts`:**

```typescript
export async function cancelLianaOrder(orderId: string): Promise<void> {
  // Update liana_orders to canceled
  await supabase
    .from("liana_orders")
    .update({ 
      status: "canceled", 
      error_message: "Manually canceled by admin",
      updated_at: new Date().toISOString() 
    })
    .eq("id", orderId);
  
  // Also update product_orders
  const { data: lianaOrder } = await supabase
    .from("liana_orders")
    .select("order_id")
    .eq("id", orderId)
    .single();
    
  if (lianaOrder) {
    await supabase
      .from("product_orders")
      .update({ 
        status: "canceled",
        failure_reason: "Manually canceled by admin",
        updated_at: new Date().toISOString()
      })
      .eq("id", lianaOrder.order_id);
  }
}
```

---

### Phase 4: Fix API Error Display

**Modify:** `src/components/admin/LianaOrdersDashboard.tsx`

Enhance the error message display to show:
1. The exact API error message
2. Which stage failed (verification or order)
3. The raw API response for debugging

```tsx
{/* Enhanced error display */}
{selectedOrder.error_message && (
  <div>
    <p className="text-sm text-muted-foreground mb-1">Error Details</p>
    <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm space-y-2">
      <p className="font-medium">{selectedOrder.error_message}</p>
      {selectedOrder.verification_response && (
        <div className="text-xs mt-2">
          <p className="text-muted-foreground">Verification Stage:</p>
          <pre className="bg-background/50 p-2 rounded overflow-x-auto">
            {JSON.stringify(selectedOrder.verification_response, null, 2)}
          </pre>
        </div>
      )}
      {selectedOrder.order_response && (
        <div className="text-xs mt-2">
          <p className="text-muted-foreground">Order Stage:</p>
          <pre className="bg-background/50 p-2 rounded overflow-x-auto">
            {JSON.stringify(selectedOrder.order_response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </div>
)}
```

---

### Phase 5: Add "Canceled" Status to Dashboard

**Modify:** `src/components/admin/LianaOrdersDashboard.tsx`

Add canceled status configuration and filter:

```tsx
const statusConfig = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  processing: { label: "Processing", variant: "outline", icon: Loader2 },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
  canceled: { label: "Canceled", variant: "outline", icon: Ban },  // NEW
};
```

Add filter option:
```tsx
<SelectItem value="canceled">Canceled</SelectItem>
```

---

### Phase 6: Email Notification Integration

**For Gmail notifications on new orders, you'll need:**

1. **Sign up at Resend.com** (free tier: 100 emails/day)
2. **Verify your domain** or use their test domain
3. **Get an API key**

Once you have the Resend API key, I will:

1. **Create a new edge function:** `supabase/functions/send-order-email/index.ts`
2. **Add a database trigger** on `product_orders` table to call the function on new orders
3. **Send email to your Gmail** with order details

**Email Content Example:**
```
Subject: New Order Received - #order-number

New Order Details:
- Order Number: xyz-123
- Product: Mobile Legends Diamond
- Package: 86 Diamonds
- Price: ₹150
- Customer: customer@email.com
- Game ID: 123456789 (Zone: 5201)
- Status: Pending API Processing

View in Admin Panel: [link]
```

---

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/...` | **CREATE** | Cancel all pending/processing orders |
| `src/components/admin/LianaOrdersDashboard.tsx` | **MODIFY** | Remove global retry button, add cancel button, add canceled status |
| `src/lib/lianaApi.ts` | **MODIFY** | Add cancelLianaOrder function, update stats to include canceled |
| `supabase/functions/send-order-email/index.ts` | **CREATE** | Email notification edge function |
| `supabase/config.toml` | **MODIFY** | Add send-order-email function config |

---

### Summary of Changes

1. **Cancel 8 pending orders** - Via database migration (they were manually completed)
2. **Remove "Retry All Failed" button** - Prevent duplicate order processing
3. **Add individual Cancel button** - Allow admin to manually cancel orders
4. **Add "Canceled" status** - Distinguish from failed orders in dashboard
5. **Enhance error display** - Show exact API error message and response
6. **Email notifications** - Requires Resend API key to proceed

---

### Next Step for Email

Before I can implement email notifications, I need you to:

1. Go to https://resend.com and create an account
2. Create an API key at https://resend.com/api-keys  
3. Provide the **RESEND_API_KEY** and your **Gmail address** for notifications

Would you like me to proceed with the implementation?

