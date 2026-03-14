

# Fix Chatbot "Diamond package not found" Issue

## Root Cause Analysis

The chatbot uses `arcee-ai/trinity-mini:free` (OpenRouter). This free model has poor/no tool-calling support. Here's what happens:

1. **Pre-fetch works correctly** -- `searchProducts("diamond package price")` finds 20+ diamond packages from `game_product_prices` via the broad text search (`package_name.ilike.%diamond%`).
2. **Products are injected into the system prompt** as context.
3. **The free AI model ignores the injected context** and responds with "not found" because it doesn't understand the structured data in the prompt.
4. The fallback path (which formats products without AI) only triggers on AI **errors**, not when the AI returns a wrong answer.

The database has real data: Free Fire (25-50600 Diamonds, NPR 29-39999), Mobile Legends (55-565 Diamonds, NPR 150-1250), etc.

## Plan

### 1. Add "diamond/diamonds" to fuzzy aliases

Add "diamond" and "diamonds" as aliases for both `freefire` and `mobile_legends` in `FUZZY_ALIASES`. Also add common typos like "diamon", "diamnd".

### 2. Smart product-first response (bypass weak AI for product queries)

The key fix: when `searchProducts()` returns results during pre-fetch, **format and return them directly** using a structured template instead of relying on the AI model. Use the AI only to polish the greeting/intro, not to decide whether products exist.

New flow:
```text
User: "diamond package price"
  ↓
Pre-fetch finds 20+ diamond packages
  ↓
Format directly using template (no AI dependency)
  ↓
Return structured response with real prices
```

Template format:
```
💎 Diamond Packages

📦 Free Fire Diamonds
• 25 Diamonds — NPR 29
• 50 Diamonds — NPR 49
• 115 Diamonds — NPR 99
...

📦 Mobile Legends Diamonds
• 55 Diamonds — NPR 150
• 86 Diamonds — NPR 199
...

🛒 Buy now: https://ugtopups.lovable.app/#/freefire-diamond
⏱ Delivery: 5–10 minutes

Reply with the package you want to order!
```

### 3. Conversational order flow

When user says "buy diamond package" or "I want to buy", the AI should ask for required details step by step:
1. Which specific package? (show options)
2. Email address
3. Player ID (for games that need it)
4. Zone/Server ID (if applicable)

Only call `place_order` tool after all info is collected.

### 4. Improve AI system prompt

Make the prompt more directive:
- "ALWAYS use the product data provided in AVAILABLE PRODUCTS section"
- "NEVER say a product is not found if product data is listed above"
- Add formatting instructions for chat-friendly output

### 5. Better fallback when AI gives wrong answers

After AI responds, check if the response contains negative phrases like "not found", "not available", "don't have" BUT pre-fetched products exist. If so, override with the formatted product template.

### Changes

**File: `supabase/functions/chatbot-api/index.ts`**

- Add "diamond", "diamonds", "diamon", "diamnd" to `FUZZY_ALIASES` for freefire and mobile_legends
- New function `formatProductResponse(products)` -- groups by game, formats with emoji and structure
- In `handleUnifiedMessage`: if pre-fetched products found AND they match the query well, use `formatProductResponse` as the primary reply, optionally enhanced by AI
- Add post-AI safety check: if AI says "not found" but products were pre-fetched, override response
- Update system prompt to be more directive about using injected product data
- Add order conversation flow instructions to prompt (ask for details step-by-step)

