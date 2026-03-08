

# HTTPS Chatbot API Enhancement + Documentation Page

## Analysis

The existing `chatbot-api` edge function already handles most of what's needed — it has `message`, `order-status`, `order`, and `credit-request` actions. The `platform` and `session_id` fields are already accepted but not stored server-side. The main gaps are:

1. **No server-side conversation storage** — history is sent from the client, external platforms can't maintain context
2. **No `platform` field handling** — API ignores which platform the message comes from
3. **No documentation page** — no way for external developers to understand the API

## Changes

### 1. Database: `chatbot_conversations` table

Store conversations server-side keyed by `session_id`:

```sql
CREATE TABLE chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  role text NOT NULL, -- 'user' or 'assistant'
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can manage chatbot conversations"
  ON chatbot_conversations FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Index for fast lookups and cleanup
CREATE INDEX idx_cc_session ON chatbot_conversations(session_id);
CREATE INDEX idx_cc_created ON chatbot_conversations(created_at);
```

### 2. Edge Function: `supabase/functions/chatbot-api/index.ts`

Enhance `handleMessage` to:
- Accept `platform` field (default `"web"`)
- If `session_id` is provided and `platform` is NOT `"web"`, load last 10 messages from `chatbot_conversations` for that session (server-side context)
- For `"web"` platform, continue using client-sent `history` (backward compatible)
- Store both user message and bot reply in `chatbot_conversations`
- Add a new `cleanup-conversations` action that deletes records older than 10 days

The response format stays identical — external platforms get the same `{ reply, products, product, timestamp }` structure.

### 3. New Page: `src/pages/ApiDocs.tsx`

A clean documentation page at `/api-docs` with:
- **Overview** — architecture diagram (text-based)
- **Base URL** — the edge function URL
- **Authentication** — apikey header
- **Endpoints** — all 4 actions documented with request/response examples
- **Platform field** — how external systems should set `platform: "whatsapp"` etc.
- **Session management** — how `session_id` enables conversation context
- **Code examples** — curl snippets for each action
- **Rate limits** — brief note on AI rate limiting

Card-based layout using existing Header/Footer components.

### 4. Route + Footer

- Add `/api-docs` route to `App.tsx` (public, no auth required)
- Add "API Documentation" link to Footer quick links

## File Summary

| File | Action |
|------|--------|
| `chatbot_conversations` table | New (migration) |
| `supabase/functions/chatbot-api/index.ts` | Modified — add conversation storage + cleanup action |
| `src/pages/ApiDocs.tsx` | New |
| `src/App.tsx` | Modified — add route |
| `src/components/Footer.tsx` | Modified — add link |

No breaking changes — web chatbot continues working identically. External platforms gain server-side conversation context by setting `platform` and `session_id`.

