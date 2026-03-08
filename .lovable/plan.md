

# Developer Maintenance Feature System — Implementation Plan

## Overview

This is a large multi-month feature set. I will implement all the infrastructure and Month 2-5 features in phases: database tables first, then components and pages.

## Phase 1: Database Migration

Create all new tables in a single migration:

**`support_tickets`** — user support tickets
- id, user_id, subject, description, status (open/in_progress/resolved/closed), priority (low/medium/high), created_at, updated_at, closed_at

**`ticket_messages`** — messages within tickets
- id, ticket_id (FK), sender_id, sender_role (user/admin), message, created_at

**`announcements`** — admin announcements
- id, title, message, type (banner/modal), target (all/specific), target_emails (text[]), is_active, starts_at, expires_at, created_at

**`wishlists`** — user favorites
- id, user_id, product_id (text — links to dynamic_products or game product keys), product_name, created_at

**`subscriptions`** — recurring purchase plans
- id, user_id, product_category, product_name, package_name, price, frequency (weekly/biweekly/monthly), next_run_at, is_active, created_at, updated_at

**`developer_maintenance_log`** — tracks monthly maintenance work
- id, month (text, e.g. "2026-03"), feature_area, description, hours_spent, created_at

RLS: User tables (support_tickets, wishlists, subscriptions) — users can read/write own rows, admins can manage all. Announcements — public read for active, admin write. Maintenance log — developer read/write, admin read.

## Phase 2: Month 2 — Order Status Timeline

**New file: `src/components/dashboard/OrderTimeline.tsx`**
- Visual step timeline: Placed → Processing → Confirmed → Completed (with Canceled branch)
- Each step shows timestamp if available, with green/yellow/gray indicators
- Uses existing order data (`created_at`, `processing_started_at`, `confirmed_at`, `completed_at`, `canceled_at`)

**Modified: `src/components/dashboard/OrderHistoryCard.tsx`**
- Add expandable row that shows `OrderTimeline` for each order when clicked

## Phase 3: Month 3 — Support & Announcements

**New files:**
- `src/pages/SupportTickets.tsx` — user-facing ticket list + create form
- `src/components/admin/TicketManager.tsx` — admin ticket management with reply
- `src/components/announcements/AnnouncementBanner.tsx` — renders active announcements
- `src/lib/supportApi.ts` — CRUD for tickets/messages
- `src/lib/announcementApi.ts` — fetch/manage announcements

**Modified:**
- `src/App.tsx` — add `/support` route (protected)
- `src/pages/AdminPanel.tsx` — add `case "tickets"` and `case "announcements"`
- `src/components/admin/AdminLayout.tsx` — add menu items for Tickets and Announcements
- `src/pages/Dashboard.tsx` — add link to support tickets
- `src/App.tsx` or layout — render `AnnouncementBanner` globally

## Phase 4: Month 4 — Analytics & Automation

**New files:**
- `src/components/admin/UserAnalytics.tsx` — admin analytics with recharts (new vs returning users, revenue segments, popular products, inactive users)

**Modified:**
- `src/pages/AdminPanel.tsx` — add `case "user-analytics"`
- `src/components/admin/AdminLayout.tsx` — add "User Analytics" menu item

Automated campaigns: Add feature flag entries for `automated_campaigns`. Actual cron-based edge function (`supabase/functions/marketing-cron/index.ts`) that queries inactive users and creates notification + coupon records.

## Phase 5: Month 5 — Wishlist & Subscriptions

**New files:**
- `src/pages/Wishlist.tsx` — user wishlist page
- `src/lib/wishlistApi.ts` — add/remove/fetch wishlist items
- `src/pages/Subscriptions.tsx` — manage recurring plans
- `src/lib/subscriptionApi.ts` — CRUD for subscriptions

**Modified:**
- `src/App.tsx` — add `/wishlist` and `/subscriptions` routes
- `src/pages/Dashboard.tsx` — add quick links to wishlist and subscriptions
- Product pages — add "Add to Wishlist" heart button

## Phase 6: Developer Maintenance Dashboard

**New file: `src/components/admin/MaintenanceLog.tsx`**
- Read-only view for admins showing developer maintenance history
- Shows monthly work log, hours, feature areas

**Modified:**
- `src/pages/DeveloperPanel.tsx` — add maintenance log management section
- `src/pages/AdminPanel.tsx` — add `case "maintenance-log"`
- `src/components/admin/AdminLayout.tsx` — add "Maintenance Log" menu item
- `src/components/admin/ServiceStatus.tsx` — add banner explaining monthly maintenance model

## Feature Flags Integration

Add new feature flag seed entries for: `support_tickets`, `announcements`, `user_analytics`, `automated_campaigns`, `wishlist`, `subscriptions` — all controllable from the Developer Panel.

## Summary of All New Files (12)
1. `src/components/dashboard/OrderTimeline.tsx`
2. `src/pages/SupportTickets.tsx`
3. `src/components/admin/TicketManager.tsx`
4. `src/components/announcements/AnnouncementBanner.tsx`
5. `src/lib/supportApi.ts`
6. `src/lib/announcementApi.ts`
7. `src/components/admin/UserAnalytics.tsx`
8. `supabase/functions/marketing-cron/index.ts`
9. `src/pages/Wishlist.tsx`
10. `src/lib/wishlistApi.ts`
11. `src/lib/subscriptionApi.ts`
12. `src/components/admin/MaintenanceLog.tsx`

## Modified Files (7)
1. `src/App.tsx` — new routes
2. `src/pages/AdminPanel.tsx` — new section cases
3. `src/components/admin/AdminLayout.tsx` — new menu items
4. `src/pages/Dashboard.tsx` — quick links
5. `src/pages/DeveloperPanel.tsx` — maintenance log section
6. `src/components/admin/ServiceStatus.tsx` — maintenance model banner
7. `src/components/dashboard/OrderHistoryCard.tsx` — timeline expansion

