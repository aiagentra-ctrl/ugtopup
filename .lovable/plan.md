

# Mobile Admin App with Real-Time Notifications

## Overview

The admin panel already has mobile-responsive layout (hamburger menu, Sheet sidebar) and the app is a PWA. Rather than building a separate app, we'll create a dedicated **Admin PWA experience** with a mobile-optimized admin route, admin-specific push notifications, and an install prompt within the admin panel.

## Current State

- **AdminLayout** already has mobile support via Sheet sidebar (hamburger menu on `lg:hidden`)
- **PWA** is configured via `vite-plugin-pwa` with service worker push support
- **Push notifications** work for users via `usePushNotifications` hook + `push_subscriptions` table
- **Service worker** (`sw-push.js`) handles push events and click-to-navigate
- Admin panel is at `/#/admin` (HashRouter)

## Plan

### 1. Admin Push Notification Triggers (Database)

Create triggers that fire when admin-relevant events occur, sending push notifications to all admin users:

**New DB function: `notify_admins_push`** — looks up all users with admin roles, finds their push subscriptions, and invokes `send-push-notification` for each.

**New triggers on:**
- `product_orders` INSERT → "New order received: [order_number]" with url `/#/admin` (orders section)
- `payment_requests` INSERT → "New credit request from [email]" with url `/#/admin` (payments section)
- `liana_orders` UPDATE when status = 'failed' → "API order failed: [error]" with url `/#/admin` (ml-monitoring section)

**Migration SQL:**
- Create `notify_admins_on_new_order()` trigger function
- Create `notify_admins_on_credit_request()` trigger function  
- Create `notify_admins_on_api_failure()` trigger function
- Attach triggers to respective tables

### 2. Admin Push Subscription (Frontend)

**New file: `src/hooks/useAdminPushNotifications.ts`**

Similar to `usePushNotifications` but specifically for admin users. When an admin logs into the admin panel, auto-subscribe them to push notifications if not already subscribed. Reuses the existing `push_subscriptions` table and `send-push-notification` edge function.

**Modify: `src/pages/AdminPanel.tsx`**

- Import and call `useAdminPushNotifications()` to auto-subscribe admins on panel load
- Add a notification permission prompt if not yet granted

### 3. Mobile-Optimized Admin Experience

**Modify: `src/components/admin/AdminLayout.tsx`**

- Add bottom navigation bar for mobile (visible on `lg:hidden`) with quick-access icons for Dashboard, Orders, Payments, Notifications
- Make the top header more compact on mobile
- Add pull-to-refresh gesture support via a refresh button

**Modify: `src/components/admin/EnhancedDashboard.tsx`**

- Make stat cards stack in a 2-column grid on mobile
- Ensure charts are touch-friendly with proper sizing

### 4. Admin App Download Section

**New file: `src/components/admin/AdminAppDownload.tsx`**

A card/section in the admin panel that:
- Detects if the app is already installed (via `usePWAInstall` hook)
- Shows "Install Admin App" button that triggers PWA install prompt
- Shows platform-specific instructions (iOS: Add to Home Screen, Android: auto-install)
- Displays app features list

**Modify: `src/components/admin/AdminLayout.tsx`**

- Add "Admin App" menu item to sidebar

**Modify: `src/pages/AdminPanel.tsx`**

- Add `admin-app` section routing

### 5. Deep-Link Notification Actions

**Modify: `public/sw-push.js`**

- Already handles `data.url` for click navigation — admin notifications will include the correct hash route (e.g., `/#/admin`)
- Add admin-specific action handling: parse section from URL params to auto-navigate to the right admin section

**Modify: `src/pages/AdminPanel.tsx`**

- Read URL query params on load (e.g., `?section=orders`) and auto-set `activeSection`

### 6. Send Push Notification Edge Function Update

**Modify: `supabase/functions/send-push-notification/index.ts`**

- Add support for sending to multiple users by accepting `user_ids` array (for admin broadcast)
- Or create a new lightweight function `notify-admins` that queries admin user_ids and loops

## Files Summary

### New Files
- `src/hooks/useAdminPushNotifications.ts` — Admin auto-subscribe hook
- `src/components/admin/AdminAppDownload.tsx` — PWA install section for admin

### Modified Files
- `src/components/admin/AdminLayout.tsx` — Bottom nav bar for mobile, new menu item
- `src/pages/AdminPanel.tsx` — Admin push subscription, deep-link section routing, new section
- `public/sw-push.js` — Admin section deep-link support

### Database Migration
- New trigger functions for admin push notifications on orders, credit requests, API failures
- Triggers attached to `product_orders`, `payment_requests`, `liana_orders`

