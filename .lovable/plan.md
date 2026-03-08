

# Advanced Supabase Management & Monitoring System

## Overview

Upgrade the existing DB Management section and EnhancedDashboard with: (1) a new `system_daily_reports` table for auto-generated daily summaries, (2) enhanced edge function with alert generation and daily report logic, (3) a new `SystemHealthMonitor` admin component with order/credit/health monitoring, and (4) integration of alert widgets into the existing dashboard.

## Database Changes (1 migration)

### New table: `system_daily_reports`
- `id` uuid PK
- `report_date` date UNIQUE NOT NULL
- `total_orders` integer DEFAULT 0
- `total_revenue` numeric DEFAULT 0
- `total_credit_requests` integer DEFAULT 0
- `total_chatbot_interactions` integer DEFAULT 0
- `pending_orders` integer DEFAULT 0
- `failed_orders` integer DEFAULT 0
- `active_users` integer DEFAULT 0
- `database_stats` jsonb DEFAULT '{}'
- `created_at` timestamptz DEFAULT now()
- RLS: admin-only SELECT

### New cleanup_settings seeds (via insert tool)
Add rows for `expired_coupon_retention_days` if not already present.

## Edge Function Changes: `database-cleanup/index.ts`

Extend the existing function with:

1. **Expired coupon cleanup**: Delete expired coupons older than retention period (new cleanup category).

2. **Alert generation logic** (runs after cleanup):
   - Count pending orders older than 2 hours → if > 0, create admin notification "X orders pending for 2+ hours"
   - Count pending credit requests older than 1 hour → if > 0, create admin notification
   - Count failed orders today → if > 3, alert "X failed orders today"
   - Check database record counts against thresholds → alert if approaching limits

3. **Daily report generation**:
   - Count today's orders, revenue, credit requests, chatbot conversations, pending/failed orders
   - Upsert into `system_daily_reports` for today's date
   - This runs each time cleanup runs (daily via cron)

## New Component: `SystemHealthMonitor.tsx`

A new admin panel section with 4 sub-tabs:

### Order Monitor Tab
- Cards: orders today, orders this week, pending orders, failed orders needing attention
- Table of orders pending > 2 hours (highlighted as urgent)
- Table of recent failed orders

### Credit Monitor Tab  
- Cards: credit requests today, pending verification, approved today, rejected today
- Table of pending credit requests with age indicator

### System Health Tab
- Reuse `fetchSupabaseLimits` for storage gauge
- Record count bars: orders, notifications, activity logs, chatbot logs (with warning thresholds)
- Active users count (profiles with recent activity)
- API activity summary (from activity_logs counts)

### Daily Reports Tab
- Table of `system_daily_reports` entries (last 30 days)
- Summary cards for today's report
- Export capability

## File Changes

| File | Action |
|------|--------|
| Migration SQL | Create `system_daily_reports` table + RLS |
| `supabase/functions/database-cleanup/index.ts` | Add expired coupon cleanup, alert generation, daily report generation |
| New: `src/components/admin/SystemHealthMonitor.tsx` | Full monitoring component |
| `src/components/admin/AdminLayout.tsx` | Add "System Health" menu item |
| `src/pages/AdminPanel.tsx` | Add `system-health` case |
| `src/components/admin/DatabaseManagement.tsx` | Add expired coupons to settingLabels map |

## Implementation Order

1. Database migration (system_daily_reports table)
2. Insert new cleanup_settings row for expired coupons
3. Update edge function (coupon cleanup + alerts + daily report)
4. Build SystemHealthMonitor component
5. Wire into AdminLayout + AdminPanel

