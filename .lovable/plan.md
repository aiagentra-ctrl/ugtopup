

# Chatbot API Backend + Product Cards in Chat

## Overview

Create a Supabase Edge Function `chatbot-api` that serves as the centralized backend for all chatbot communication. The frontend will call this API instead of directly hitting the n8n webhook or querying Supabase tables. The API detects product-related queries, enriches responses with product data (image, price, link), handles order tracking, and forwards general questions to the n8n webhook. The Message model gets extended to support rich product card data.

## Architecture

```text
User message → ChatWidget → Edge Function (chatbot-api)
                                ├── Product query? → Search dynamic_products + game_product_prices → return product card
                                ├── Order query? → Query product_orders → return order status
                                └── General question? → Forward to n8n webhook → return AI reply
```

## Phase 1: Edge Function — `chatbot-api`

**New file**: `supabase/functions/chatbot-api/index.ts`

Three endpoints via request body `action` field:

### `action: "message"`
- Receives `{ action: "message", session_id, message }`
- Keyword-searches `dynamic_products` and `game_product_prices` tables for product matches
- If product found: returns `{ reply, product: { name, price, image_url, link, delivery_time } }`
- If no product match: forwards message to n8n webhook URL from `chatbot_settings`, returns `{ reply }`
- If webhook fails and Gmail fallback enabled: sends email notification

### `action: "order-status"`
- Receives `{ action: "order-status", order_id }`
- Queries `product_orders` by `order_number` or `user_email`
- Returns `{ status, product, delivery_time, created_at }`

### `action: "order"` (future-ready)
- Receives `{ action: "order", product_id, email, plan }`
- Placeholder for creating orders through the chatbot

**Config**: Add `[functions.chatbot-api] verify_jwt = false` to `supabase/config.toml`

## Phase 2: Extend Message Model

Update `src/hooks/useChat.ts` — extend the `Message` interface:

```typescript
export interface ProductCard {
  name: string;
  price: string;
  image_url: string | null;
  link: string | null;
  delivery_time?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  product?: ProductCard; // optional product card data
}
```

## Phase 3: Product Card Component

**New file**: `src/components/chat/ProductCardBubble.tsx`

A card rendered inside the chat when `message.product` exists:
- Product image (rounded, max-height)
- Product name + price
- "Buy Now" button linking to product page
- Mobile-friendly, matches chat theme

## Phase 4: Update MessageBubble

Update `src/components/chat/MessageBubble.tsx`:
- After the text bubble, if `message.product` exists, render `<ProductCardBubble>`

## Phase 5: Update Chat API Layer

Replace `src/utils/chatApi.ts` `sendMessageToWebhook` to call the edge function instead:
- `sendChatMessage(message, sessionId)` → calls `chatbot-api` edge function with `action: "message"`
- Returns `{ reply, product?, timestamp }`

Update `useChat.ts` `sendMessage`:
- Use new API function
- If response includes `product`, attach it to the bot message

Update `OrderTracker.tsx`:
- Call edge function with `action: "order-status"` instead of direct Supabase query

## Phase 6: Product Search Logic in Edge Function

The edge function product detection:
1. Tokenize message, look for product name matches in `dynamic_products.title` and `game_product_prices.package_name`
2. Use case-insensitive `ilike` search
3. Return the best match with image, price, and link
4. If multiple matches, return top 3 as separate product cards

## Files Summary

### New Files
- `supabase/functions/chatbot-api/index.ts` — Backend API for all chatbot operations

- `src/components/chat/ProductCardBubble.tsx` — Product card UI in chat

### Modified Files
- `supabase/config.toml` — Add chatbot-api function config
- `src/hooks/useChat.ts` — Extend Message interface with ProductCard, use new API
- `src/components/chat/MessageBubble.tsx` — Render ProductCardBubble when product data present
- `src/utils/chatApi.ts` — Replace webhook call with edge function call
- `src/components/chat/OrderTracker.tsx` — Use edge function for order tracking

### No Changes
- `src/components/admin/ChatbotSettings.tsx` — Existing settings work as-is (webhook URL used by edge function)
- `src/hooks/useChatbotSettings.ts` — No changes needed
- Game product pages — Untouched

