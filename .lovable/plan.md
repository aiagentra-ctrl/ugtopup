

# Advanced Analytics Dashboard

## Overview

Create a new "Advanced Analytics" admin section with page view tracking, visitor session tracking, traffic source detection, and retention analysis. This requires new database tables for tracking, a client-side hook to record page views/sessions, and a comprehensive dashboard component.

## Database Changes (1 migration)

### New table: `page_views`
- `id` uuid PK
- `session_id` text NOT NULL
- `user_id` uuid (nullable, for logged-in users)
- `page_path` text NOT NULL
- `page_title` text
- `referrer` text
- `traffic_source` text DEFAULT 'direct' (google, referral, direct, social)
- `user_agent` text
- `created_at` timestamptz DEFAULT now()
- RLS: admin SELECT only, anyone can INSERT

### New table: `visitor_sessions`
- `id` uuid PK
- `session_id` text UNIQUE NOT NULL
- `user_id` uuid (nullable)
- `traffic_source` text DEFAULT 'direct'
- `referrer` text
- `started_at` timestamptz DEFAULT now()
- `last_active_at` timestamptz DEFAULT now()
- `page_count` integer DEFAULT 1
- `is_bounce` boolean DEFAULT true (updated when page_count > 1)
- RLS: admin SELECT only, anyone can INSERT/UPDATE own session

## Client-Side Tracking: `src/hooks/usePageTracking.ts`

A hook used in App.tsx that:
1. On route change, generates/reuses a session ID (sessionStorage)
2. Detects traffic source from `document.referrer` and URL params (utm_source, etc.)
3. Inserts a row into `page_views`
4. Upserts `visitor_sessions` (increment page_count, update last_active_at, set is_bounce=false if page_count > 1)

Lightweight -- fires on each navigation via react-router's `useLocation`.

## New Component: `src/components/admin/AdvancedAnalytics.tsx`

Tabbed dashboard with 4 sections:

### Traffic Sources Tab
- Pie chart: distribution of traffic sources (direct, google, social, referral)
- Table of top referrers with visit counts
- Date range filter (today, 7d, 30d)

### Page Views Tab
- Line chart: daily page views over selected period
- Top pages table with view counts
- Product page vs homepage breakdown

### Visitor Behavior Tab
- Cards: total sessions, avg pages/session, bounce rate, avg duration estimate
- Bar chart: sessions by day
- New vs returning visitor breakdown (by user_id presence)

### Retention Tab
- Monthly cohort: new users vs returning users (from profiles + orders data)
- Active users per month chart
- Churned users (had orders before, none in last 30d)
- Retention rate percentage over 6 months

### Real-Time Widget (top of page)
- Count of sessions active in last 5 minutes (from visitor_sessions.last_active_at)
- Currently viewed pages

## File Changes

| File | Action |
|------|--------|
| Migration SQL | Create `page_views` + `visitor_sessions` tables with RLS |
| `src/hooks/usePageTracking.ts` | New -- client-side tracking hook |
| `src/App.tsx` | Add `usePageTracking()` call |
| `src/components/admin/AdvancedAnalytics.tsx` | New dashboard component |
| `src/components/admin/AdminLayout.tsx` | Add menu item |
| `src/pages/AdminPanel.tsx` | Add route case |

## Implementation Order

1. Migration: create tables + RLS policies
2. Build usePageTracking hook
3. Wire hook into App.tsx
4. Build AdvancedAnalytics component
5. Add to AdminLayout + AdminPanel

