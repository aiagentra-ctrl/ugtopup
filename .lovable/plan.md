# Proper Push Notification System

## Current State

The app already has:

- `usePushNotifications` hook using browser `new Notification()` API (only works when tab is open)
- `NotificationPermissionModal` that asks for permission on first login
- `useUnreadNotifications` hook with real-time Supabase subscription
- Header dropdown with "Notifications" link (no bell icon with badge)
- Admin `NotificationsManager` for sending broadcast/targeted notifications
- PWA configured via `vite-plugin-pwa` with Workbox

## Problem

The current system uses the **Web Notification API** (`new Notification()`), which only works when the browser tab is active. For true push notifications that appear even when the tab/browser is closed, we need **Service Worker push notifications** via the Push API with VAPID keys.

## Plan

### 1. Service Worker Push Handler

Add a custom service worker file (`public/sw-push.js`) that handles `push` events and `notificationclick` events. The click handler will open the PWA or website URL using `clients.openWindow()`.

Update `vite.config.ts` to inject this custom SW code via VitePWA's `injectManifest` or append it to the generated SW using `importScripts`.

### 2. VAPID Key Setup

Generate VAPID keys (public/private pair) for Web Push. Store the private key as a Supabase secret (`VAPID_PRIVATE_KEY`). Store the public key as `VITE_VAPID_PUBLIC_KEY` in the codebase (it's a publishable key).

### 3. Push Subscription Storage

**New migration**: Create a `push_subscriptions` table:

- `id` uuid PK
- `user_id` uuid NOT NULL (references profiles)
- `endpoint` text NOT NULL
- `p256dh` text NOT NULL
- `auth` text NOT NULL
- `created_at` timestamptz
- `updated_at` timestamptz
- UNIQUE(user_id, endpoint)
- RLS: users can manage own subscriptions, admins can read all

### 4. Update `usePushNotifications` Hook

After getting notification permission, register a push subscription using `serviceWorkerRegistration.pushManager.subscribe()` with the VAPID public key. Save the subscription (endpoint, keys) to the `push_subscriptions` table. Replace the `new Notification()` approach with service worker push.

### 5. Edge Function: `send-push-notification`

New edge function that:

- Accepts `user_id` or `notification_id`
- Fetches push subscriptions for the target user(s)
- Sends Web Push messages using the `web-push` protocol (VAPID signing with the private key)
- Handles expired/invalid subscriptions (clean up)

### 6. Database Trigger for Auto-Push

Add a trigger on `user_notifications` INSERT that calls the edge function via `pg_net` (or use the existing Supabase realtime + edge function invocation pattern). When a notification is delivered to a user, the edge function sends a push to all their registered devices.

### 7. Bell Icon with Badge in Header

Update `Header.tsx` to add a **Bell icon** next to the user menu with:

- Red dot/badge showing unread count (using `useUnreadNotifications`)
- Clicking opens a dropdown showing recent notifications
- "View all" link to `/notifications` page
- Mark as read on click

### 8. Update `NotificationPermissionModal`

After permission is granted, subscribe to push and save the subscription to the database (instead of just setting localStorage).

### Files Summary

**New files:**

- `public/sw-push.js` — Service worker push event handlers
- `supabase/functions/send-push-notification/index.ts` — Edge function for Web Push delivery
- Migration SQL — `push_subscriptions` table + trigger on `user_notifications`

**Modified files:**

- `vite.config.ts` — Add custom SW import and `navigateFallbackDenylist` for `/~oauth`
- `src/hooks/usePushNotifications.ts` — Subscribe to Push API, save subscription to DB
- `src/components/NotificationPermissionModal.tsx` — Trigger push subscription after permission
- `src/components/Header.tsx` — Add bell icon with unread badge dropdown

### Technical Details

**Web Push flow:**

1. User grants notification permission → browser creates push subscription with **Prompt — Implement Proper Push Notification System for Website**
  Notifications are currently **not working properly**. When a notification arrives, users do not see it like notifications from email or other mobile apps. We need to implement a proper **push notification system**.
  ---
  ### 1. Mobile Push Notifications
  When a notification is sent, users should see it on their **mobile device screen** even if the website tab is not open.
  The notification should appear like normal app notifications.
  Example uses:  
  • Order updates  
  • New offers  
  • Payment confirmations  
  • Account notifications.
  ---
  ### 2. Click Action Behavior
  When the user taps the notification:
  • It should open the **website directly**  
  OR  
  • If the user installed the **web app (PWA)**, it should open inside the app.
  ---
  ### 3. Notification Indicator
  Add a **notification indicator** inside the website UI.
  Features:
  • A bell icon with a **colored dot or badge** showing unread notifications  
  • When the user clicks the icon, it should show the list of notifications  
  • Once opened, the notification should be marked as read.
  ---
  ### 4. Real-Time Notification System
  Notifications should be sent in real time when events happen, such as:
  • Order placed  
  • Order delivered  
  • Credit added  
  • New promotional offers.
  ---
  ### 5. Admin Panel Control
  Create a section in the admin panel where admins can:
  • Send broadcast notifications  
  • Send notifications to specific users  
  • View notification history.
  ---
  ### 6. Final Goal
  Create a **full push notification system** so that:
  • Users receive notifications directly on their device screen  
  • Clicking the notification opens the website or web app  
  • The website shows a visual notification indicator  
  • Notifications work reliably on mobile and desktop.**Prompt — Implement Proper Push Notification System for Website**
  Notifications are currently **not working properly**. When a notification arrives, users do not see it like notifications from email or other mobile apps. We need to implement a proper **push notification system**.
  ---
  ### 1. Mobile Push Notifications
  When a notification is sent, users should see it on their **mobile device screen** even if the website tab is not open.
  The notification should appear like normal app notifications.
  Example uses:  
  • Order updates  
  • New offers  
  • Payment confirmations  
  • Account notifications.
  ---
  ### 2. Click Action Behavior
  When the user taps the notification:
  • It should open the **website directly**  
  OR  
  • If the user installed the **web app (PWA)**, it should open inside the app.
  ---
  ### 3. Notification Indicator
  Add a **notification indicator** inside the website UI.
  Features:
  • A bell icon with a **colored dot or badge** showing unread notifications  
  • When the user clicks the icon, it should show the list of notifications  
  • Once opened, the notification should be marked as read.
  ---
  ### 4. Real-Time Notification System
  Notifications should be sent in real time when events happen, such as:
  • Order placed  
  • Order delivered  
  • Credit added  
  • New promotional offers.
  ---
  ### 5. Admin Panel Control
  Create a section in the admin panel where admins can:
  • Send broadcast notifications  
  • Send notifications to specific users  
  • View notification history.
  ---
  ### 6. Final Goal
  Create a **full push notification system** so that:
  • Users receive notifications directly on their device screen  
  • Clicking the notification opens the website or web app  
  • The website shows a visual notification indicator  
  • Notifications work reliably on mobile and desktop. public key
2. Subscription (endpoint + keys) saved to `push_subscriptions` table
3. When `user_notifications` row is inserted (via existing triggers), a DB trigger calls `send-push-notification` edge function via `pg_net`
4. Edge function reads subscription, signs payload with VAPID private key, POSTs to push endpoint
5. Service worker receives `push` event, shows native notification
6. User taps → `notificationclick` opens the PWA/website

**VAPID key generation:** Will need to ask the user to provide or generate VAPID keys and store the private key as a Supabase secret.