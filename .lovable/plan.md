

# WhatsApp Chatbot System

## Overview

Add a WhatsApp chatbot integration that reuses the existing `chatbot-api` edge function as the AI brain. The system uses Evolution API (already provided credentials) as the WhatsApp provider, with a new webhook edge function to receive/send WhatsApp messages, and an admin UI to configure and monitor everything.

## Architecture

```text
User sends WhatsApp message
  → Evolution API receives it
  → Sends webhook to /whatsapp-webhook edge function
  → whatsapp-webhook calls chatbot-api (message action) with platform="whatsapp"
  → AI response returned
  → whatsapp-webhook sends reply back via Evolution API
  → User receives reply on WhatsApp
```

No new chatbot API needed — the existing `chatbot-api` already handles messages, orders, order tracking, payments, and credit requests with platform awareness.

## Database Changes (1 migration)

### New table: `whatsapp_config`
- `id` uuid PK
- `is_enabled` boolean DEFAULT false
- `instance_name` text DEFAULT 'ugc-topup'
- `server_url` text (Evolution API server URL)
- `api_key` text (Evolution API key — stored in DB since admin needs to change it freely)
- `webhook_url` text (auto-generated, points to our edge function)
- `connected_number` text (the WhatsApp number)
- `connection_status` text DEFAULT 'disconnected' (connected/disconnected/connecting)
- `created_at` / `updated_at` timestamps
- RLS: admin SELECT/UPDATE only

### New table: `whatsapp_messages`
- `id` uuid PK
- `phone_number` text NOT NULL
- `direction` text NOT NULL (inbound/outbound)
- `message` text NOT NULL
- `session_id` text (maps to chatbot_conversations session)
- `status` text DEFAULT 'sent' (sent/delivered/read/failed)
- `error_message` text
- `metadata` jsonb DEFAULT '{}'
- `created_at` timestamptz DEFAULT now()
- RLS: admin SELECT only, service role INSERT
- Auto-delete after 15 days (reuse cleanup logic)

## Secrets

The Evolution API key and server URL will be stored in the `whatsapp_config` table (not as edge function secrets) so the admin can change them from the UI without developer intervention.

## New Edge Function: `whatsapp-webhook`

Receives incoming WhatsApp messages from Evolution API webhook, processes them through the chatbot-api, and sends replies back.

**Flow:**
1. Receive POST from Evolution API with message payload
2. Extract sender phone number and message text
3. Generate session_id from phone number (e.g., `wa-{phone}`)
4. Load whatsapp_config to check if enabled
5. Call chatbot-api logic internally (reuse handleMessage with platform="whatsapp")
6. Send AI reply back via Evolution API `POST /message/sendText/{instance}`
7. Log both messages in `whatsapp_messages` table

**Handles:** text messages, ignores media/status updates gracefully.

## New Admin Component: `WhatsAppChatbot.tsx`

### Configuration Tab
- Server URL input (pre-filled with provided URL)
- API Key input (masked, with show/hide toggle)
- Instance name input
- WhatsApp number display
- Enable/Disable toggle
- Save Configuration button
- Test Connection button (calls Evolution API `/instance/connectionState`)

### Number Management Tab
- Connect new number (generates QR code via Evolution API)
- View connected number and status
- Disconnect number button
- Replace number flow

### Message Logs Tab
- Table showing: phone number, direction (in/out), message preview, timestamp, status
- Filter by date range
- Filter by phone number
- Auto-refresh every 30 seconds
- Error highlighting for failed messages

### Statistics Cards (top)
- Total messages today
- Active conversations
- Messages this week
- Error count

## Admin Panel Integration

Add to `AdminLayout.tsx` menu items:
- `{ id: "whatsapp", title: "WhatsApp Chatbot", icon: MessageSquare }`

Add to `AdminPanel.tsx` switch case:
- `case "whatsapp": return <WhatsAppChatbot />`

## File Changes

| File | Action |
|------|--------|
| Migration SQL | Create `whatsapp_config` + `whatsapp_messages` tables, seed default config |
| `supabase/functions/whatsapp-webhook/index.ts` | New edge function for webhook processing |
| `supabase/config.toml` | Add whatsapp-webhook with verify_jwt=false |
| `src/components/admin/WhatsAppChatbot.tsx` | New admin component with 3 tabs |
| `src/components/admin/AdminLayout.tsx` | Add menu item |
| `src/pages/AdminPanel.tsx` | Add route case |

## Security

- Webhook validates requests by checking a shared token in the URL query parameter
- Rate limiting per phone number (reuses existing rate limiter pattern)
- API key stored in database, accessed only by service role
- Message logs auto-cleanup after 15 days
- Input sanitization on all incoming messages

## Implementation Order

1. Database migration (tables + seed)
2. WhatsApp webhook edge function
3. Admin UI component
4. Wire into AdminLayout + AdminPanel

