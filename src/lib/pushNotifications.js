// ============================
// Push Notification Utility Module
// ============================
// Handles: browser support check, permission management,
// service worker registration, push subscription, and unsubscription.

import { supabase } from './supabase';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert a base64-url string to Uint8Array (for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if the browser supports Push Notifications
 */
export function isPushSupported() {
    return (
        window.isSecureContext &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

export function getPushSupportMessage() {
    if (!window.isSecureContext) {
        return 'Push notification hanya bisa aktif di HTTPS atau localhost.';
    }
    if (!('serviceWorker' in navigator)) {
        return 'Browser tidak mendukung service worker.';
    }
    if (!('PushManager' in window)) {
        return 'Browser tidak mendukung push notification.';
    }
    if (!('Notification' in window)) {
        return 'Browser tidak mendukung notification API.';
    }
    return '';
}

/**
 * Get current notification permission status
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getPermissionStatus() {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission;
}

/**
 * Register the service worker
 */
async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
}

/**
 * Get existing push subscription (if any)
 */
export async function getExistingSubscription() {
    if (!isPushSupported()) return null;
    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch {
        return null;
    }
}

/**
 * Request notification permission and subscribe to push notifications.
 * Saves the subscription to the database.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {{ success: boolean, subscription?: PushSubscription, error?: string }}
 */
export async function requestPermissionAndSubscribe(userId) {
    if (!isPushSupported()) {
        return {
            success: false,
            error: getPushSupportMessage() || 'Browser tidak mendukung push notification',
        };
    }

    if (!VAPID_PUBLIC_KEY) {
        return {
            success: false,
            error: 'VAPID public key belum dikonfigurasi',
        };
    }

    try {
        // Step 1: Request permission
        const permission = await Notification.requestPermission();

        if (permission === 'denied') {
            return {
                success: false,
                error: 'denied',
            };
        }

        if (permission !== 'granted') {
            return {
                success: false,
                error: 'Izin notifikasi tidak diberikan',
            };
        }

        // Step 2: Register service worker
        const registration = await registerServiceWorker();

        // Step 3: Subscribe to push
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            await existingSubscription.unsubscribe();
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Step 4: Save subscription to database
        const subscriptionJSON = subscription.toJSON();
        await saveSubscriptionToDb(userId, subscriptionJSON);

        return { success: true, subscription };
    } catch (error) {
        console.error('[Push] Error subscribing:', error);
        return {
            success: false,
            error: error.message || 'Gagal subscribe push notification',
        };
    }
}

/**
 * Unsubscribe from push notifications and remove from database.
 *
 * @param {string} userId - The authenticated user's ID
 */
export async function unsubscribe() {
    try {
        const subscription = await getExistingSubscription();
        if (subscription) {
            // Remove from database first
            await deleteSubscriptionFromDb(subscription.endpoint);
            // Then unsubscribe from push
            await subscription.unsubscribe();
        }
        return { success: true };
    } catch (error) {
        console.error('[Push] Error unsubscribing:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if the current browser is subscribed to push notifications
 */
export async function isSubscribed() {
    const subscription = await getExistingSubscription();
    return subscription !== null;
}

// ============================
// Database Operations
// ============================

/**
 * Save a push subscription to Supabase
 */
async function saveSubscriptionToDb(userId, subscriptionJSON) {
    if (!supabase) throw new Error('Supabase tidak tersedia');

    const { error } = await supabase.from('push_subscriptions').upsert(
        {
            user_id: userId,
            endpoint: subscriptionJSON.endpoint,
            keys_p256dh: subscriptionJSON.keys.p256dh,
            keys_auth: subscriptionJSON.keys.auth,
        },
        { onConflict: 'endpoint' }
    );

    if (error) {
        console.error('[Push] Error saving subscription:', error.message);
        throw error;
    }
}

/**
 * Delete a push subscription from Supabase
 */
async function deleteSubscriptionFromDb(endpoint) {
    if (!supabase) return;

    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

    if (error) {
        console.error('[Push] Error deleting subscription:', error.message);
    }
}

/**
 * Send a push notification to a specific user via the Edge Function
 *
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {string} [params.url='/'] - URL to open when notification is clicked
 * @param {string} [params.icon] - Notification image icon
 * @param {string} [params.iconName] - Material icon name for in-app notification center
 * @param {string} [params.notificationId] - Existing notification row ID
 * @param {string} [params.dedupeKey] - Notification dedupe key
 */
export async function sendPushNotification({
    userId,
    title,
    body,
    url = '/',
    icon,
    iconName,
    notificationId,
    dedupeKey,
}) {
    if (!supabase) throw new Error('Supabase tidak tersedia');

    const { data, error } = await supabase.functions.invoke('send-push', {
        body: { userId, title, body, url, icon, iconName, notificationId, dedupeKey },
    });

    if (error) {
        console.error('[Push] Error sending notification:', error.message);
        throw error;
    }

    return data;
}
