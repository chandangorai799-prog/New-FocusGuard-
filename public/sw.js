// FocusGuard PWA Service Worker
const CACHE_NAME = 'focusguard-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

// Install Event: Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate / Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension / API requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests (HTML document) - Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Static Assets (JS, CSS, SVGs, Fonts, Images) - Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to keep cache updated
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {/* offline silently */});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Offline fetch fallback for:', request.url);
        });
    })
  );
});

// Listen for message events (e.g. skipWaiting or show system notification from client)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SHOW_SYSTEM_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      body: options?.body || 'Ready to focus? Time for your evening study session!',
      icon: options?.icon || '/icon-192.svg',
      badge: options?.badge || '/icon-192.svg',
      vibrate: options?.vibrate || [200, 100, 200, 100, 200],
      tag: options?.tag || 'focusguard-daily-5pm',
      renotify: true,
      requireInteraction: true,
      data: options?.data || { url: '/?tab=focus' },
      actions: [
        { action: 'start_focus', title: '🎯 Start Focus' },
        { action: 'snooze_10m', title: '⏳ 10 Min Later' },
      ],
    };

    self.registration.showNotification(title || '🎯 FocusGuard: Ready to Focus?', notificationOptions);
  }
});

// Notification Click Handler: opens/focuses the app and starts focus session
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If client is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action || 'start_focus',
            tag: event.notification.tag,
          });
          return;
        }
      }
      // If not open, open FocusGuard with focus tab
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?tab=focus');
      }
    })
  );
});

// Push Event: Handle background push messages
self.addEventListener('push', (event) => {
  let data = { title: '🎯 FocusGuard: Ready to Focus?', body: 'Evening study time! Open FocusGuard to begin.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Shaam ke 5 baje ho gaye hain! Ready to focus?',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'focusguard-daily-5pm',
    renotify: true,
    requireInteraction: true,
    data: { url: '/?tab=focus' },
    actions: [
      { action: 'start_focus', title: '🚀 Start Focus' },
      { action: 'snooze_10m', title: '⏳ Snooze 10m' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || '🎯 FocusGuard: Ready to Focus?', options));
});
