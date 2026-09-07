self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'BookSetu', body: 'You have a new notification' }
  try {
    if (event.data) data = Object.assign(data, event.data.json())
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'BookSetu', {
      body: data.body || '',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          return client.navigate(url).then(() => client.focus())
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
