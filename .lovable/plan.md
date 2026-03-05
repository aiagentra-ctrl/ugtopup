# AI Chatbot Admin Panel & Dynamic Chatbot System

## Overview

Create a new `chatbot_settings` table to store all chatbot configuration, a new admin page to manage it, and refactor the chatbot widget to read settings dynamically from the database. Add three quick-reply buttons (FAQ/webhook, Order Tracking via Supabase, Payment Help) with admin-controlled labels and content.

## Database

**New table: `chatbot_settings**` (single-row config table)

- `id` uuid PK default gen_random_uuid()
- `is_enabled` boolean default true
- `webhook_url` text (n8n URL, default current hardcoded URL)
- `welcome_message` text (the greeting shown on open)
- `button1_label` text default 'Basic Question / FAQ'
- `button1_enabled` boolean default true
- `button2_label` text default 'Track Your Order'
- `button2_enabled` boolean default true
- `button3_label` text default 'Prepaid / Payment'
- `button3_enabled` boolean default true
- `payment_help_message` text (rich text instructions for payment help)
- `order_track_prompt` text default 'Please enter your Order ID or email to track your order.'
- `created_at`, `updated_at`

RLS: Public SELECT for active settings, admin ALL.

Seed one row with current hardcoded values so nothing breaks.

## Admin Panel – AI Chatbot Page

**New sidebar item**: "AI Chatbot" with `Bot` icon  
**New component**: `src/components/admin/ChatbotSettings.tsx`

Features:

- Toggle chatbot on/off
- Edit webhook URL (text input)
- Edit welcome message (textarea)
- Edit each button label + toggle enable/disable
- Edit payment help message (textarea with markdown)
- Edit order tracking prompt text
- Save button that updates the single row in `chatbot_settings`
- Live preview panel showing how the chatbot welcome screen looks

## Chatbot Widget Changes

**New hook**: `src/hooks/useChatbotSettings.ts`

- Fetches the single row from `chatbot_settings` on mount
- Caches in state, provides `settings` object
- If `is_enabled` is false, chatbot floating button is hidden

**Refactor `useChat.ts**`:

- Remove hardcoded welcome message and webhook URL
- Accept settings from the hook
- After welcome message, show quick-reply buttons based on enabled flags

**Refactor `ChatWidget.tsx**`:

- After welcome message, render quick-reply buttons (styled as pill buttons)
- Button 1 (FAQ): switches to free-text chat mode, sends to webhook URL from settings
- Button 2 (Order Track): shows inline form asking for order ID/email, queries `product_orders` table, displays results as a formatted message bubble
- Button 3 (Payment): displays the `payment_help_message` from settings as a bot message

**Refactor `chatApi.ts**`:

- `sendMessageToWebhook` accepts webhook URL as parameter instead of hardcoded constant

## New Component: Quick Reply Buttons

`src/components/chat/QuickReplyButtons.tsx`

- Renders 1-3 pill-shaped buttons below the welcome message
- Each button triggers its respective flow
- Styled to match existing chat UI (gradient pills)

## New Component: Order Tracker

`src/components/chat/OrderTracker.tsx`

- Inline form within chat: input for order ID or email
- Queries `product_orders` by `order_number` or `user_email`
- Displays order status, product name, date, and status as a formatted card-style message

## Files

### New Files

- `src/components/admin/ChatbotSettings.tsx` - Admin management page
- `src/hooks/useChatbotSettings.ts` - Fetch settings from DB
- `src/components/chat/QuickReplyButtons.tsx` - Quick reply button UI
- `src/components/chat/OrderTracker.tsx` - Order tracking inline widget

### Modified Files

- `src/components/admin/AdminLayout.tsx` - Add "AI Chatbot" menu item
- `src/pages/AdminPanel.tsx` - Add chatbot section case
- `src/hooks/useChat.ts` - Use dynamic settings, support chat modes (faq/order/payment)
- `src/components/chat/ChatWidget.tsx` - Integrate quick replies, order tracker, conditional rendering
- `src/utils/chatApi.ts` - Accept dynamic webhook URL parameter
- `src/components/chat/FloatingButton.tsx` - Conditionally hide when chatbot disabled

### Database Migration

- Create `chatbot_settings` table with seed data
- RLS policies (public SELECT, admin ALL) - Create a **fully coded AI chatbot system** for the website with a **primary webhook integration (n8n)** and a **backup system using Gmail API** if the webhook fails. All integrations must be configurable from the **Admin Panel**.
  ## 1. Admin Panel – AI Chatbot Configuration
  Create a section: **Admin → AI Chatbot Settings**
  Admin must be able to edit:
  - n8n Webhook URL (primary automation)
  - Enable / disable webhook
  - Gmail API settings (backup system)
  - Gmail API key / credentials
  - Fallback email address
  - Enable / disable fallback system
  - Chatbot welcome message
  - Chatbot button texts
  - Enable / disable chatbot
  All settings must be **editable without code changes**.
  ---
  ## 2. Primary System – n8n Webhook Integration
  When the chatbot receives a message:
  1. Send the message to the **n8n webhook URL** from admin settings.
  2. Pass parameters such as:
    - user message
    - timestamp
    - session ID
    - user device info
  3. Wait for the response from n8n.
  4. Display the response inside the chatbot UI.
  ---
  ## 3. Backup System – Gmail API Fallback
  If the webhook fails (timeout, error, no response):
  1. Automatically trigger the **backup system**.
  2. Send the user’s question to **Gmail API**.
  3. Gmail sends an email to support/admin.
  4. Admin can respond manually or via automation.
  5. The response is sent back to the chatbot.
  Admin must be able to **turn this fallback ON/OFF** from the panel.
  ---
  ## 4. Chatbot Message Flow
  When a user opens chatbot:
  Show **first message** (editable from admin panel).
  Example layout:
  Welcome message
  Buttons:
  - Basic Questions
  - Track Your Order
  - Prepaid / Payment Help
  All button texts editable from admin.
  ---
  ## 5. Basic Questions (Webhook AI)
  When user selects **Basic Questions**:
  - Send message to n8n webhook.
  - Receive AI response.
  - Display response.
  ---
  ## 6. Order Tracking (Supabase)
  When user selects **Track Your Order**:
  1. Ask for Order ID.
  2. Query **Supabase orders database**.
  3. Return:
    - Order status
    - Product name
    - Order date
    - Delivery info
  All prompts editable in admin panel.
  ---
  ## 7. Prepaid / Payment Help
  Show instructions stored in admin panel:
  - Payment steps
  - QR payment instructions
  - WhatsApp contact
  ---
  ## 8. System Reliability
  Implement:
  - Webhook timeout detection
  - Automatic fallback to Gmail API
  - Error handling
  - Logging for chatbot messages
  - Admin notification when webhook fails
  ---
  ## 9. Dynamic Admin Control
  Admin panel must allow editing of:
  - Webhook URL
  - Gmail API credentials
  - Welcome message
  - Button labels
  - FAQ responses
  - Payment instructions
  - Enable/disable features
  No code editing required after setup.
  ---
  ## 10. UI Requirements
  - Chatbot UI must match website design.
  - Mobile responsive.
  - Smooth chat bubbles.
  - Quick reply buttons.
  - Loading animation while waiting for webhook response.