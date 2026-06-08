import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext.js';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

export default function MobileTopNavbar({
    title,
    subtitle,
    showDateNav = false,
    onPrevWeek,
    onNextWeek,
}) {
    const { theme, toggleTheme } = useTheme();
    const { profile } = useUser();
    const { notifications, notificationCount, clearAllNotifications } = useNotifications();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        if (!isNotificationOpen) return undefined;

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationOpen]);

    const handleClearAll = async () => {
        await clearAllNotifications();
        setIsNotificationOpen(false);
    };

    return (
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20">
            <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h2>
                {showDateNav ? (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-0.5">
                        <button
                            type="button"
                            onClick={onPrevWeek}
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined text-[12px] leading-none">arrow_back_ios</span>
                        </button>
                        <span className="text-[10px] font-medium font-mono-data">{subtitle}</span>
                        <button
                            type="button"
                            onClick={onNextWeek}
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined text-[12px] leading-none">arrow_forward_ios</span>
                        </button>
                    </div>
                ) : subtitle ? (
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 truncate">{subtitle}</p>
                ) : null}
            </div>

            <div ref={notificationRef} className="relative flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => setIsNotificationOpen(prev => !prev)}
                    aria-label="Buka notifikasi"
                    aria-expanded={isNotificationOpen}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                    <span className="material-symbols-outlined text-[20px] leading-none">notifications</span>
                    {notificationCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-surface-light dark:ring-surface-dark" />
                    )}
                </button>

                <div
                    aria-hidden={!isNotificationOpen}
                    className={`absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 text-slate-900 shadow-2xl shadow-slate-900/15 backdrop-blur-xl transition-all duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-100 ${isNotificationOpen
                        ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
                        }`}
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <h3 className="text-sm font-bold">Notifikasi</h3>
                        {notificationCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-[11px] font-medium text-blue-500 transition-colors hover:text-blue-600"
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2">
                        {notifications.length > 0 ? (
                            <div className="space-y-1">
                                {notifications.map((notification) => (
                                    <a
                                        key={notification.id}
                                        href={notification.url || '/'}
                                        onClick={() => setIsNotificationOpen(false)}
                                        className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-blue-50 dark:hover:bg-slate-800"
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-300">
                                            <span className="material-symbols-outlined text-[18px]">
                                                {notification.icon || 'notifications'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                {notification.title}
                                            </p>
                                            {notification.body && (
                                                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                                    {notification.body}
                                                </p>
                                            )}
                                            <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                {formatNotificationTime(notification.timestamp)}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                                <span className="material-symbols-outlined text-[28px]">notifications_off</span>
                                <p className="mt-2 text-xs font-medium">Belum ada notifikasi</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Ganti tema"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                >
                    <span className="material-symbols-outlined text-[20px] leading-none">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div className="flex h-9 w-9 items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        {profile.photoUrl ? (
                            <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-[17px] text-slate-400">person</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatNotificationTime(timestamp) {
    const date = new Date(Number(timestamp) || Date.now());
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
