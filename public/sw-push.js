// Push notification event handler for Service Worker
// This file is imported by the Workbox-generated service worker via importScripts

self.addEventListener('push', function(event) {
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'UGTOPUPS', body: event.data ? event.data.text() : 'You have a new notification' };
  }

  const title = data.title || 'UGTOPUPS';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
      notificationId: data.notificationId || null,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: 'ugtopups-' + Date.now(),
    renotify: true,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/';
  
  // Handle admin deep-links: /admin?section=orders -> navigate to admin panel with section
  let fullUrl;
  if (rawUrl.startsWith('/admin')) {
    // Preserve query params for admin section deep-linking
    fullUrl = self.location.origin + rawUrl;
  } else {
    fullUrl = self.location.origin + rawUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      // Open new window if none found
      return clients.openWindow(fullUrl);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  // Analytics or cleanup if needed
});
