const DB_NAME = 'jadwal-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';
const MAX_NOTIFICATIONS = 50;

function normalizeNotification(notification) {
    const timestamp = Number(notification?.timestamp) || Date.now();
    return {
        id: notification?.id || `${timestamp}-${Math.random().toString(36).slice(2)}`,
        title: notification?.title || 'Notifikasi',
        body: notification?.body || '',
        url: notification?.url || '/',
        icon: notification?.icon || 'notifications',
        timestamp,
    };
}

function openNotificationDb() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB tidak tersedia.'));
            return;
        }

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

function runStoreTransaction(mode, callback) {
    return openNotificationDb().then((db) => new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const result = callback(store);

        transaction.oncomplete = () => {
            db.close();
            resolve(result);
        };
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    }));
}

export async function getStoredNotifications() {
    try {
        const notifications = await runStoreTransaction('readonly', (store) => {
            const request = store.getAll();
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        });

        return notifications
            .map(normalizeNotification)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_NOTIFICATIONS);
    } catch (error) {
        console.error('[Notifications] Failed to load notifications:', error);
        return [];
    }
}

export async function saveStoredNotification(notification) {
    const normalized = normalizeNotification(notification);

    try {
        await runStoreTransaction('readwrite', (store) => {
            store.put(normalized);
        });
    } catch (error) {
        console.error('[Notifications] Failed to save notification:', error);
    }

    return normalized;
}

export async function clearStoredNotifications() {
    try {
        await runStoreTransaction('readwrite', (store) => {
            store.clear();
        });
    } catch (error) {
        console.error('[Notifications] Failed to clear notifications:', error);
    }
}
