/* global clients */

// ============================
// Service Worker — Push Notification Handler
// ============================
// File ini berjalan di background dan menangani:
// 1. Push event (menerima notifikasi dari server)
// 2. Notification click (membuka/fokus website saat notifikasi diklik)

const DB_NAME = 'jadwal-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';

function createNotificationRecord(data) {
    const timestamp = Number(data.timestamp) || Date.now();
    return {
        id: data.notificationId || data.id || `${timestamp}-${Math.random().toString(36).slice(2)}`,
        type: data.type || 'push',
        title: data.title || 'Jadwal Kuliah',
        body: data.body || 'Ada pembaruan dari Jadwal Kuliah!',
        url: data.url || '/',
        icon: data.iconName || 'notifications',
        timestamp,
        readAt: null,
        dedupeKey: data.dedupeKey || '',
    };
}

function openNotificationDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp');
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveNotificationRecord(notification) {
    try {
        const db = await openNotificationDb();
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).put(notification);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });
        db.close();
    } catch (error) {
        console.error('[SW] Failed to store notification:', error);
    }
}

async function sendNotificationToClients(notification) {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientList.forEach((client) => {
        client.postMessage({
            type: 'JADWAL_NOTIFICATION_RECEIVED',
            notification,
        });
    });
}

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

    const notificationRecord = createNotificationRecord(data);
    const options = {
        body: notificationRecord.body,
        icon: data.icon || '/ITERA.png',
        badge: data.badge || '/ITERA.png',
        tag: data.tag || 'jadwal-notification',
        data: {
            id: notificationRecord.id,
            url: notificationRecord.url,
            timestamp: notificationRecord.timestamp,
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
        Promise.all([
            saveNotificationRecord(notificationRecord),
            sendNotificationToClients(notificationRecord),
            self.registration.showNotification(notificationRecord.title, options),
        ])
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
