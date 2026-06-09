import {
    clearStoredNotifications,
    getStoredNotifications,
    saveStoredNotification,
} from './notificationStore';
import { sendPushNotification } from './pushNotifications';
import { supabase } from './supabase';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
    timezone: 'Asia/Jakarta',
    task_reminder_hours: [24],
    exam_reminder_hours: [168, 72, 24],
};

async function getCurrentUserId() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
}

function normalizeHours(value, fallback) {
    if (!Array.isArray(value)) return fallback;

    const hours = value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0)
        .map((item) => Math.round(item));

    return hours.length > 0 ? Array.from(new Set(hours)).sort((a, b) => b - a) : fallback;
}

function mapNotificationRow(row) {
    const timestamp = Date.parse(row.sent_at || row.created_at || row.scheduled_for || '') || Date.now();

    return {
        id: row.id,
        type: row.type,
        title: row.title || 'Notifikasi',
        body: row.body || '',
        url: row.url || '/',
        icon: row.icon || 'notifications',
        timestamp,
        readAt: row.read_at || null,
        dedupeKey: row.dedupe_key || '',
    };
}

function normalizePreferences(row) {
    return {
        timezone: row?.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
        task_reminder_hours: normalizeHours(
            row?.task_reminder_hours,
            DEFAULT_NOTIFICATION_PREFERENCES.task_reminder_hours
        ),
        exam_reminder_hours: normalizeHours(
            row?.exam_reminder_hours,
            DEFAULT_NOTIFICATION_PREFERENCES.exam_reminder_hours
        ),
    };
}

export async function loadNotifications() {
    const userId = await getCurrentUserId();
    if (!supabase || !userId) return getStoredNotifications();

    const { data, error } = await supabase
        .from('notifications')
        .select('id,type,title,body,url,icon,created_at,sent_at,read_at,scheduled_for,dedupe_key')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('[Notifications] Failed to load server notifications:', error.message);
        return getStoredNotifications();
    }

    const notifications = (data || []).map(mapNotificationRow);
    await Promise.all(notifications.map(saveStoredNotification));
    return notifications;
}

export async function clearNotifications() {
    const userId = await getCurrentUserId();

    if (supabase && userId) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }

    await clearStoredNotifications();
}

export async function markNotificationRead(notificationId) {
    const userId = await getCurrentUserId();
    if (!supabase || !userId || !notificationId) return;

    const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

    if (error) throw error;
}

export async function loadNotificationPreferences() {
    const userId = await getCurrentUserId();
    if (!supabase || !userId) return DEFAULT_NOTIFICATION_PREFERENCES;

    const { data, error } = await supabase
        .from('notification_preferences')
        .select('timezone,task_reminder_hours,exam_reminder_hours')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    if (data) return normalizePreferences(data);

    const preferences = {
        user_id: userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
    };

    const { error: upsertError } = await supabase
        .from('notification_preferences')
        .upsert(preferences, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;
    return DEFAULT_NOTIFICATION_PREFERENCES;
}

export async function saveNotificationPreferences(preferences) {
    const userId = await getCurrentUserId();
    if (!supabase || !userId) throw new Error('Sesi pengguna tidak ditemukan.');

    const nextPreferences = {
        user_id: userId,
        timezone: preferences.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
        task_reminder_hours: normalizeHours(
            preferences.task_reminder_hours,
            DEFAULT_NOTIFICATION_PREFERENCES.task_reminder_hours
        ),
        exam_reminder_hours: normalizeHours(
            preferences.exam_reminder_hours,
            DEFAULT_NOTIFICATION_PREFERENCES.exam_reminder_hours
        ),
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('notification_preferences')
        .upsert(nextPreferences, { onConflict: 'user_id' });

    if (error) throw error;
    return normalizePreferences(nextPreferences);
}

export async function sendTestNotification() {
    const userId = await getCurrentUserId();
    if (!supabase || !userId) throw new Error('Sesi pengguna tidak ditemukan.');

    const timestamp = Date.now();
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: 'test',
            title: 'Test Notifikasi',
            body: 'Notifikasi berhasil terhubung ke akun ini.',
            url: '/settings',
            icon: 'notifications_active',
            scheduled_for: new Date(timestamp).toISOString(),
            dedupe_key: `test:${timestamp}`,
            metadata: { source: 'settings' },
        })
        .select('id,type,title,body,url,icon,created_at,sent_at,read_at,scheduled_for,dedupe_key')
        .single();

    if (error) throw error;

    const notification = mapNotificationRow(data);
    await saveStoredNotification(notification);
    const result = await sendPushNotification({
        userId,
        title: data.title,
        body: data.body,
        url: data.url,
        iconName: data.icon,
        notificationId: data.id,
        dedupeKey: data.dedupe_key,
    });

    return { notification, result };
}
