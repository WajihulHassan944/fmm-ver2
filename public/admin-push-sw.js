// Admin push service worker. Registered only on /administration pages.
self.addEventListener('push', (event) => {
  let data = { title: 'Fantasy MMAdness admin', body: 'You have a new alert.', url: '/administration' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_error) { /* keep defaults */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      data: { url: data.url || '/administration' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/administration';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((client) => client.url.includes('/administration'));
      if (existing) return existing.focus().then(() => existing.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
