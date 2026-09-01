// FoodLens AI — No-Cache Service Worker
// Enables PWA installation ("Add to Home Screen") & mobile notifications
// Zero caching: Every request is fetched directly from the network for 100% fresh code.

self.addEventListener("install", (e) => {
  // Take control immediately and delete any previous caches
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
});

self.addEventListener("activate", (e) => {
  // Purge all legacy caches on activation
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Pass-through fetch handler (required for PWA installability without caching anything)
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});

// Support for system / lock screen notification clicks
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("./");
      }
    })
  );
});
