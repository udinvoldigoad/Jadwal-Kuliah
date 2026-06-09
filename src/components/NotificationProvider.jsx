import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationContext } from '../contexts/NotificationContext.js';
import {
    clearNotifications,
    loadNotifications,
    markNotificationRead,
} from '../lib/notifications';
import {
    getStoredNotifications,
    saveStoredNotification,
} from '../lib/notificationStore';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mergeNotifications(currentNotifications, incomingNotification) {
    const next = [
        incomingNotification,
        ...currentNotifications.filter((notification) => notification.id !== incomingNotification.id),
    ];

    return next
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
}

export default function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const refreshNotifications = useCallback(async () => {
        const nextNotifications = await loadNotifications();
        setNotifications(nextNotifications);
    }, []);

    const addNotification = useCallback(async (notification) => {
        const storedNotification = await saveStoredNotification(notification);
        setNotifications(prev => mergeNotifications(prev, storedNotification));
    }, []);

    const clearAllNotifications = useCallback(async () => {
        await clearNotifications();
        setNotifications([]);
    }, []);

    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) return;

        const readAt = new Date().toISOString();
        setNotifications(prev => prev.map((notification) => (
            notification.id === notificationId
                ? { ...notification, readAt }
                : notification
        )));

        if (!UUID_PATTERN.test(notificationId)) return;

        try {
            await markNotificationRead(notificationId);
        } catch (error) {
            console.error('[Notifications] Failed to mark notification as read:', error);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        loadNotifications().then((nextNotifications) => {
            if (!cancelled) setNotifications(nextNotifications);
        }).catch(async (error) => {
            console.error('[Notifications] Failed to refresh notifications:', error);
            const storedNotifications = await getStoredNotifications();
            if (!cancelled) setNotifications(storedNotifications);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return undefined;

        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type !== 'JADWAL_NOTIFICATION_RECEIVED') return;
            addNotification(event.data.notification);
        };

        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }, [addNotification]);

    const value = useMemo(() => ({
        notifications,
        notificationCount: notifications.filter(notification => !notification.readAt).length,
        addNotification,
        clearAllNotifications,
        markAsRead,
        refreshNotifications,
    }), [notifications, addNotification, clearAllNotifications, markAsRead, refreshNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
