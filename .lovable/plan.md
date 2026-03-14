
Goal: make WhatsApp fully auto-reply end-to-end (Webhook → AI → Evolution sendText) and add a truly reliable 3-step monitor that shows exactly where failures happen.

What I found in current code (important):
1) The “Flow” tab already exists, but it is built from `whatsapp_messages` only after parsing succeeds. If payload parsing fails, there is no reliable trace of the raw webhook event.
2) `parseIncomingMessage` can silently skip events; skipped events currently return `{ skipped: ... }` without durable stage-level diagnostics.
3) Signature/header handling is strict in one format (`apikey`) and can reject valid requests if provider sends key in another header format.
4) AI step has no explicit timeout guard; long AI calls can block reply flow and look like “no reply”.
5) There is no dedicated, correlated flow log table for: incoming raw payload, AI input/output, provider request/result.

Implementation plan:

1) Harden webhook ingestion in `supabase/functions/whatsapp-webhook/index.ts`
- Add robust payload normalization for Evolution v2 variants (`MESSAGES_UPSERT`, `messages.upsert`, nested `data.messages[]`, alternate sender/message fields).
- Add safe boolean parser for `fromMe` to avoid string/boolean mismatch drops.
- Accept API key from `apikey`, `x-api-key`, or `Authorization: Bearer ...` (normalized compare).
- Always create a `flow_id` per inbound event and persist initial “incoming_webhook” stage even when parsing later fails.
- Never silently skip without logging reason (`ignored_group`, `ignored_from_me`, `invalid_payload`, `missing_text`, etc.).

2) Add deterministic 3-stage telemetry (new DB table + usage)
- Create migration for `whatsapp_message_flows` with:
  - `id`, `flow_id`, `phone_number`, `session_id`
  - `stage` (`incoming_webhook` | `ai_processing` | `send_message`)
  - `status` (`received` | `processing` | `success` | `failed` | `skipped`)
  - `request_payload`, `response_payload`, `error_message`, `created_at`
- RLS: admin read-only; inserts from edge function (service role).
- Add indexes on `(created_at desc)`, `(flow_id)`, `(phone_number, created_at desc)`.

3) Make AI step observable and resilient
- In webhook function, log AI stage start with prompt text and session id.
- Add timeout (AbortController) when calling `chatbot-api`; on timeout/error, log failed AI stage with exact reason.
- Log AI response payload preview and final generated reply in stage data.

4) Make send-message step observable and doc-compliant
- Keep send endpoint format exactly: `POST {server_url}/message/sendText/{instance}` with body `{ number, text, delay }`.
- Log full outgoing request metadata (instance used, recipient number, delay) and provider response status/body preview.
- Preserve instance auto-resolution fallback and record which instance was finally used.

5) Upgrade Admin monitoring UI (`src/components/admin/WhatsAppChatbot.tsx`)
- Add a dedicated “Advanced Monitor” tab (or replace current Flow tab) backed by `whatsapp_message_flows`.
- Show grouped rows by `flow_id` with 3 fixed blocks:
  1. Incoming Webhook (raw payload)
  2. AI Processing (prompt + generated reply)
  3. Outgoing Message (sendText request + provider status/response)
- Add filters: phone, status, time window; add clear “stage missing” indicators.
- Keep existing Chats/Logs tabs for conversation history and quick troubleshooting.

6) Data retention / cleanup
- Extend cleanup logic to remove old `whatsapp_messages` and `whatsapp_message_flows` older than 15 days (matching your requirement).
- Keep latest data window for debugging without long-term bloat.

7) End-to-end verification checklist (after implementation)
- Use “Test Webhook” to create one full synthetic flow and confirm all 3 stages appear.
- Send a real message to your connected number and confirm:
  - Incoming stage has raw Evolution payload
  - AI stage shows prompt/reply
  - Send stage shows provider success (HTTP status/body)
- If failure happens, monitor will pinpoint exact failing stage immediately.

Technical notes (for your exact requirement)
- Webhook destination remains: `https://iwcqutzgtpbdowghalnl.supabase.co/functions/v1/whatsapp-webhook`
- Mapping will be enforced as:
  - recipient number = parsed webhook sender (`remoteJid` / sender number fallback)
  - message text = AI-generated reply
- No QR flow is reintroduced; integration stays webhook-only.
