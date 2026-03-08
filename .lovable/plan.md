

# Automatic Supabase Management System

## Overview

Build a database cleanup edge function (cron-triggered), an admin "Database Management" panel with cleanup controls/monitoring, and an archive system for old orders. All configurable by admin.

## Database Changes

### 1. New table: `cleanup_settings`
- `id` uuid PK
- `setting_key` text UNIQUE NOT NULL (e.g. 'notification_retention_days', 'chatbot_retention_days', 'order_archive_days', 'activity_log_retention_days', 'offer_retention_days')
- `setting_value` integer NOT NULL DEFAULT 30
- `description` text
- `is_enabled` boolean DEFAULT true
- `last_run_at` timestamptz
- `created_at`, `updated_at` timestamps
- RLS: admin-only management, read via service role in edge function

### 2. New table: `archived_orders`
- Same columns as `product_orders` plus `archived_at` timestamptz DEFAULT now()
- RLS: admin-only SELECT

### 3. New table: `cleanup_logs`
- `id` uuid PK
- `cleanup_type` text NOT NULL (e.g. 'notifications', 'chatbot', 'orders', 'activity_logs')
- `records_affected` integer DEFAULT 0
- `details` text
- `created_at` timestamptz DEFAULT now()
- RLS: admin-only SELECT

## Edge Function: `database-cleanup`

A single edge function that:
1. Reads `cleanup_settings` to get retention periods
2. For each enabled setting:
   - **Notifications**: Delete `user_notifications` + `notifications` older than retention period
   - **Chatbot conversations**: Delete from `chatbot_conversations` older than retention
   - **Activity logs**: Delete from `activity_logs` older than retention
   - **Expired offers**: Deactivate offers past `timer_end_date`
   - **Order archiving**: Move orders older than threshold from `product_orders` to `archived_orders`, then delete from main table
   - **Chatbot feedback**: Clean old feedback beyond retention
3. Log each action to `cleanup_logs`
4. Check storage thresholds and create admin notification if >80%
5. Return summary

Triggered via pg_cron (daily at 2 AM).

## Admin UI: `DatabaseManagement.tsx`

New admin panel section with tabs:

### Monitoring Tab
- Database stats cards: total orders, archived orders, active notifications, chatbot conversations, activity log entries (counts from DB)
- Storage usage (reuse existing `fetchSupabaseLimits`)
- Recent cleanup logs table

### Settings Tab
- Editable retention period for each cleanup category (from `cleanup_settings`)
- Enable/disable toggle per category
- "Run Cleanup Now" button (calls edge function manually)

### Archive Tab
- View archived orders with search/filter
- Restore individual orders back to main table
- Download/export archived data

## Threshold Notifications
- After each cleanup run, if storage > 80%, create admin notification via `create_user_notification`
- Show cleanup summary in cleanup_logs

## File Changes

| File | Action |
|------|--------|
| `supabase/migrations/new.sql` | Create 3 tables + RLS + seed cleanup_settings |
| `supabase/functions/database-cleanup/index.ts` | New edge function |
| `src/components/admin/DatabaseManagement.tsx` | New admin component |
| `src/components/admin/AdminLayout.tsx` | Add "DB Management" menu item |
| `src/pages/AdminPanel.tsx` | Add `db-management` case |

## Cron Setup (via SQL insert tool, not migration)

Schedule pg_cron job to call the edge function daily at 2 AM Nepal time.

## Implementation Order

1. Migration: create tables + seed default settings
2. Edge function: database-cleanup
3. Admin UI: DatabaseManagement component
4. Wire into AdminLayout + AdminPanel
5. Set up cron job via insert tool

