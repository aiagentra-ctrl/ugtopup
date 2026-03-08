

# WhatsApp Chatbot HTTPS API Enhancement

## Current State

The system already has a solid foundation:
- **Edge function** (`chatbot-api`) with `message`, `order-status`, `credit-request`, and `cleanup-conversations` actions
- **Server-side conversation storage** in `chatbot_conversations` table with 10-day retention
- **Product search** (RAG-like) querying `game_product_prices` and `dynamic_products`
- **API documentation page** at `/api-docs`
- **Session/platform support** for external integrations

## What Needs to Be Built

### 1. Order Placement via Chatbot (`handleOrder` — currently a stub)

Enhance the existing stub to accept order details and create real orders. The flow:
- Accept `product_name`, `package_id`, `player_id`, `email`, `zone_id` (optional)
- Validate the product exists and is active in `game_product_prices`
- Look up user by email in `profiles`
- Check credit balance
- If sufficient credits: call the existing `place_order` DB function (atomic credit deduction), return confirmation
- If insufficient credits: return payment instructions with the API Nepal payment link

### 2. Payment Link Generation Action (`action: "initiate-payment"`)

New action that wraps the existing `initiate-payment` edge function logic:
- Accept `email` and `amount`
- Look up user, call the payment initiation flow
- Return the payment redirect URL for the external platform to share with the user

### 3. Payment Status Check Action (`action: "payment-status"`)

New action to check payment transaction status:
- Accept `identifier` (payment transaction ID)
- Query `payment_transactions` table
- Return current status (initiated/completed/failed)

### 4. Enhanced API Documentation Page

Update `src/pages/ApiDocs.tsx` to add sections for:
- Order placement endpoint with request/response examples
- Payment link generation endpoint
- Payment status check endpoint
- WhatsApp integration guide (step-by-step: set up WhatsApp bot → point webhook to our API → handle responses)
- Error codes reference table

### 5. No Admin Panel Changes Needed

The existing admin panel already has:
- AI model/prompt configuration in ChatbotSettings
- Payment gateway is configured via Supabase secrets
- Chatbot enable/disable toggle
- Conversation cleanup is already implemented

## File Changes

| File | Action |
|------|--------|
| `supabase/functions/chatbot-api/index.ts` | Modified — implement `handleOrder`, add `initiate-payment` and `payment-status` actions |
| `src/pages/ApiDocs.tsx` | Modified — add new endpoint docs, WhatsApp guide, error codes |

## No Database Changes

All required tables already exist (`chatbot_conversations`, `game_product_prices`, `product_orders`, `payment_transactions`, `profiles`).

## Edge Function Details

**`handleOrder`** implementation:
```
Input: { action: "order", email, product_name, package_id, player_id, zone_id? }
1. Validate required fields
2. Look up package in game_product_prices by package_id
3. Look up user profile by email
4. Check balance >= price
5. If yes → insert into product_orders, deduct credits, return success + order_number
6. If no → return insufficient_credits + payment instructions
```

**`initiate-payment`** action:
```
Input: { action: "initiate-payment", email, amount }
1. Look up user by email
2. Generate payment via existing API Nepal logic (or return QR/manual instructions)
3. Return { payment_url, identifier }
```

**`payment-status`** action:
```
Input: { action: "payment-status", identifier }
1. Query payment_transactions by identifier
2. Return { status, amount, completed_at }
```

