/* global clients */

// ============================
// Service Worker — Push Notification Handler
// ============================
// File ini berjalan di background dan menangani:
// 1. Push event (menerima notifikasi dari server)
// 2. Notification click (membuka/fokus website saat notifikasi diklik)

// Handle push event dari server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = {
            title: 'Jadwal Kuliah',
            body: event.data.text(),
            url: '/',
        };
    }

    const options = {
        body: data.body || 'Ada pembaruan dari Jadwal Kuliah!',
        icon: data.icon || '/ITERA.png',
        badge: data.badge || '/ITERA.png',
        tag: data.tag || 'jadwal-notification',
        data: {
            url: data.url || '/',
            timestamp: data.timestamp || Date.now(),
        },
        // Vibration pattern in milliseconds
        vibrate: [100, 50, 100],
        // Actions (buttons) on the notification
        actions: [
            {
                action: 'open',
                title: 'Buka',
            },
            {
                action: 'dismiss',
                title: 'Tutup',
            },
        ],
        // Keep notification visible until user interacts
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Jadwal Kuliah', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // If user clicked "dismiss" action, just close
    if (event.action === 'dismiss') return;

    // Get the target URL from notification data
    const targetUrl = event.notification.data?.url || '/';
    const urlToOpen = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // If the site is open but on a different page, navigate to target
            for (const client of clientList) {
                if ('focus' in client && 'navigate' in client) {
                    return client.focus().then(() => client.navigate(urlToOpen));
                }
            }

            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', () => {
    // Reserved for future notification analytics.
});
