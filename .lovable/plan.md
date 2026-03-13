

# WhatsApp Chatbot System Enhancement

## Current State

The system already has a working WhatsApp chatbot:
- Edge function `whatsapp-webhook` handles incoming messages, admin actions (QR, connect, disconnect, set-webhook), and replies via Evolution API
- Admin UI with config, number management, and message logs tabs
- `whatsapp_config` and `whatsapp_messages` tables exist
- Chatbot logic reuses `chatbot-api` for AI responses

## What Needs to Be Done

### 1. Webhook URL Display + Copy Button
Add a prominent card in the admin config tab showing the exact webhook URL:
```
https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/whatsapp-webhook
```
With a "Copy URL" button so admin can paste it directly into the Evolution API dashboard.

### 2. WhatsApp-Style Chat Interface (New Tab)
Add a 4th "Conversations" tab showing grouped chats by phone number — a left sidebar listing unique phone numbers with last message preview, and a right panel showing the full conversation thread in WhatsApp-style bubbles (green for outbound, white for inbound).

### 3. Enhanced Edge Function
- Add `delay` parameter to Evolution API calls (typing simulation)
- Add `send-message` admin action so admin can manually send messages from the dashboard
- Add `fetch-instance-info` action to get instance details
- Improve webhook event handling for `MESSAGES_UPSERT` (Evolution v2 format uses this event name)

### 4. Admin Manual Reply Feature
Allow admin to type and send a manual reply to any phone number from the Conversations tab — bypassing the chatbot for human takeover.

### 5. Auto-Webhook Setup Card
Add a card with step-by-step instructions for the admin showing how to add the webhook URL in Evolution API dashboard, plus a "Set Webhook Automatically" button that calls the Evolution API to register the webhook programmatically.

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/WhatsAppChatbot.tsx` | Add webhook URL display with copy, conversations tab with chat UI, manual reply feature |
| `supabase/functions/whatsapp-webhook/index.ts` | Add `send-message` admin action, add `delay` to replies, improve Evolution v2 event parsing |

## No Database Changes Needed
Existing `whatsapp_config` and `whatsapp_messages` tables are sufficient.

## Implementation Order
1. Enhance edge function with send-message action and delay
2. Rebuild admin UI with 4 tabs: Config (with webhook URL), Number, Conversations (chat-style), Logs

