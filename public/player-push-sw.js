self.addEventListener('push', (event) => {
  let data = { title: 'Fantasy MMAdness', body: 'You have a new alert.', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_error) { /* use defaults */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: data.tag || 'fantasy-mmadness-player',
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url.startsWith(self.location.origin));
    if (existing) return existing.focus().then(() => existing.navigate(url));
    return self.clients.openWindow(url);
  }));
});
