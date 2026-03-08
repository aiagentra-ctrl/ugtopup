

# Chatbot Orders Admin Page

## Approach

Create a new admin section that filters `product_orders` by `payment_method = 'chatbot'` (or by checking `metadata` for chatbot source). Since the existing `handleOrder` in the edge function already sets `payment_method: 'credit'` and stores metadata, we need a way to identify chatbot orders. The cleanest approach: the edge function's `handleOrder` already stores orders — we just need to tag them with a source indicator in the `metadata` JSON field (e.g., `metadata.source = "whatsapp"` or `"chatbot_api"`).

## Changes

### 1. Edge Function Update (`supabase/functions/chatbot-api/index.ts`)

Ensure the `handleOrder` action stores `{ source: platform }` in the order's `metadata` field when inserting into `product_orders`. This tags orders as coming from `"whatsapp"`, `"chatbot_api"`, etc.

### 2. New Component: `src/components/admin/ChatbotOrders.tsx`

A dedicated admin page that:
- Queries `product_orders` where `metadata->>'source'` is not null (i.e., chatbot-originated orders)
- Displays table with: Order ID, Product Name, User Name, Email, Source Platform, Order Status, Payment Status, Date
- Order detail modal showing product details, user info, conversation reference (link to `chatbot_conversations` by session_id if stored in metadata)
- Admin actions: Confirm, Cancel (reusing existing `confirmOrder`/`cancelOrder` from `adminApi`)
- Real-time updates via Supabase channel subscription on `product_orders`
- Filters: status, platform source, product name, date range
- Search by order number or email

### 3. Admin Layout + Panel Registration

- Add `{ id: "chatbot-orders", title: "Chatbot Orders", icon: Bot }` to `menuItems` in `AdminLayout.tsx`
- Add `case "chatbot-orders"` in `AdminPanel.tsx` rendering `<ChatbotOrders />`

### 4. No Database Changes

Orders already go into `product_orders` with `metadata` jsonb. The `chatbot_conversations` table already exists. We just query with a filter on `metadata->>'source'`.

## File Summary

| File | Action |
|------|--------|
| `src/components/admin/ChatbotOrders.tsx` | New — dedicated chatbot orders page |
| `src/components/admin/AdminLayout.tsx` | Modified — add menu item |
| `src/pages/AdminPanel.tsx` | Modified — add case for chatbot-orders |
| `supabase/functions/chatbot-api/index.ts` | Modified — tag orders with source platform in metadata |

