

# RAG-Powered Chatbot Upgrade with Knowledge Base & Feedback System

## Overview

This is a large upgrade touching the database (3 new tables), the edge function (RAG retrieval logic), the admin UI (knowledge base manager + feedback viewer), and the chat UI (feedback buttons). The existing Lovable AI Gateway integration stays — we enhance it with retrieval context.

## Architecture

```text
User message
    │
    ▼
Edge Function (chatbot-api)
    │
    ├─ 1. Search knowledge_base table (text matching on title/content)
    ├─ 2. Search existing product tables (current logic, kept)
    ├─ 3. Build RAG context from matched KB entries + products
    ├─ 4. Call Lovable AI Gateway with context-enriched system prompt
    │
    ▼
Response + feedback buttons in chat UI
```

## Database Changes (3 new tables via migration)

### 1. `knowledge_base` — stores RAG documents
- `id` uuid PK
- `title` text NOT NULL
- `content` text NOT NULL — the actual knowledge content
- `category` text DEFAULT 'general' — e.g. 'faq', 'product', 'support', 'policy'
- `tags` text[] DEFAULT '{}'
- `is_active` boolean DEFAULT true
- `created_at`, `updated_at` timestamps
- RLS: admins can manage, anyone can SELECT active entries (needed by edge function via service role anyway)

### 2. `chatbot_feedback` — stores user ratings
- `id` uuid PK
- `message_id` text NOT NULL — client-generated message ID
- `session_id` text NOT NULL
- `user_message` text — what the user asked
- `bot_response` text — what the bot answered
- `rating` text NOT NULL — 'helpful' or 'not_helpful'
- `comment` text — optional user comment
- `created_at` timestamp
- RLS: insert allowed for all (anon users use chatbot), admins can SELECT all

### 3. No changes to `chatbot_settings` schema needed
The existing `ai_provider`, `ai_model`, `ai_system_prompt` fields already support provider configuration. We just need to expand the admin UI to show more provider options and add a custom API URL field. Actually, adding one column would help:

**Add column to `chatbot_settings`:**
- `custom_api_url` text — for custom API endpoint (when admin wants to use their own AI provider)
- `custom_api_key_name` text — name of the Supabase secret holding the custom API key

## File Changes

### 1. `supabase/functions/chatbot-api/index.ts` — Add RAG retrieval

- New function `searchKnowledgeBase(message)`: queries `knowledge_base` table using `ilike` on title and content with keywords extracted from the message. Returns top 5 matching entries.
- Modify `handleMessage`: call `searchKnowledgeBase` alongside existing `searchProducts`, merge both into the system prompt context.
- Add new action handler `submit-feedback` that inserts into `chatbot_feedback`.
- Support `custom_api_url` from settings: if set and provider is 'custom', call that URL instead of Lovable AI Gateway.

### 2. `src/components/admin/ChatbotSettings.tsx` — Expand AI provider options

- Add 'Custom API' option to AI Provider select
- Show custom API URL input when 'custom' is selected
- Note to admin about storing API key as a Supabase secret

### 3. New: `src/components/admin/KnowledgeBaseManager.tsx`

Admin CRUD for `knowledge_base` table:
- List all entries in a table (title, category, active status, date)
- Add/Edit dialog with title, content (textarea), category (select), tags
- Delete with confirmation
- Bulk import: paste multiple FAQs at once (title + content pairs)
- Category filter tabs

### 4. New: `src/components/admin/ChatbotFeedback.tsx`

Dashboard showing feedback data:
- Summary cards: total feedback, % helpful, % not helpful
- Table of recent feedback entries (user message, bot response, rating, date)
- Filter by rating type
- Export capability

### 5. `src/components/chat/MessageBubble.tsx` — Add feedback buttons

- Add thumbs up / thumbs down buttons below bot messages
- On click, call the chatbot-api with `action: 'submit-feedback'`
- Visual state: disabled after clicking, show which was selected
- Store feedback state in local component state (per message ID)

### 6. `src/hooks/useChat.ts` — Add feedback submission helper

- New function `submitFeedback(messageId, rating, userMessage, botResponse)`
- Calls the edge function with the feedback action

### 7. `src/utils/chatApi.ts` — Add `submitChatFeedback` API function

### 8. `src/components/admin/AdminLayout.tsx` — Add sidebar items
- "Knowledge Base" under chatbot section
- "Chat Feedback" under chatbot section

### 9. `src/pages/AdminPanel.tsx` — Add cases for new sections
- `knowledge-base` → `KnowledgeBaseManager`
- `chat-feedback` → `ChatbotFeedback`

## Implementation Order

1. Database migration (3 tables + 2 columns on chatbot_settings)
2. Edge function update (RAG search + feedback handler + custom provider support)
3. Chat UI feedback buttons (MessageBubble + useChat + chatApi)
4. Admin Knowledge Base Manager
5. Admin Feedback Dashboard
6. Admin settings expansion (custom provider UI)
7. Sidebar/routing updates

## Notes

- The RAG approach uses simple text search (`ilike` with keywords) rather than vector embeddings. This is practical for the scale of a gaming topup store's KB (likely <500 entries). Vector search could be added later.
- The knowledge base content is injected into the AI system prompt as context, same pattern as the existing product context injection.
- Custom API provider support lets admins point to any OpenAI-compatible endpoint.

