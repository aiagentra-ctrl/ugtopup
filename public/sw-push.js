// Push notification event handler for Service Worker
// Imported by Workbox-generated SW via importScripts.

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'UGTOPUPS',
      body: event.data ? event.data.text() : 'You have a new notification',
    };
  }

  const title = data.title || 'UGTOPUPS';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: data.image || undefined,
    data: {
      // Always default to home so the app opens to the Home Screen
      // when the user taps a generic notification.
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

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const rawUrl = event.notification.data?.url || '/';
  // Build same-origin URL. App uses BrowserRouter so paths like "/" or
  // "/orders" map directly. Manifest start_url is "/" → Home Screen.
  const origin = self.location.origin;
  let target;
  if (rawUrl.startsWith('http')) {
    target = rawUrl;
  } else if (rawUrl.startsWith('/')) {
    target = origin + rawUrl;
  } else {
    target = origin + '/' + rawUrl;
  }

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // 1. Prefer an already-open standalone PWA window: focus it, then
      //    update its hash to navigate inside the same app instance.
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          if (url.origin !== origin) continue;
          // Focus the existing app window first to avoid spawning a browser tab
          await client.focus();
          // Use postMessage so the app router can navigate without a full reload
          client.postMessage({
            type: 'PUSH_NAVIGATE',
            url: rawUrl,
          });
          return;
        } catch (e) {
          // ignore and continue
        }
      }

      // 2. No existing window — open a new one. The PWA install context
      //    will keep this in the standalone app shell.
      if (clients.openWindow) {
        await clients.openWindow(target);
      }
    })()
  );
});

self.addEventListener('notificationclose', function () {
  // hook for analytics if ever needed
});

// Allow the app to ask the SW to skip waiting after an update.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
