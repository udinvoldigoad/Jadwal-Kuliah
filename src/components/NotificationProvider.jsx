import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationContext } from '../contexts/NotificationContext.js';
import {
    clearStoredNotifications,
    getStoredNotifications,
    saveStoredNotification,
} from '../lib/notificationStore';

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
        const storedNotifications = await getStoredNotifications();
        setNotifications(storedNotifications);
    }, []);

    const addNotification = useCallback(async (notification) => {
        const storedNotification = await saveStoredNotification(notification);
        setNotifications(prev => mergeNotifications(prev, storedNotification));
    }, []);

    const clearAllNotifications = useCallback(async () => {
        await clearStoredNotifications();
        setNotifications([]);
    }, []);

    useEffect(() => {
        let cancelled = false;

        getStoredNotifications().then((storedNotifications) => {
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
        notificationCount: notifications.length,
        addNotification,
        clearAllNotifications,
        refreshNotifications,
    }), [notifications, addNotification, clearAllNotifications, refreshNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
