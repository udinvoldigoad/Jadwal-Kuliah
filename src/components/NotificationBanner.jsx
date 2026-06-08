import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    isPushSupported,
    getPermissionStatus,
    requestPermissionAndSubscribe,
    isSubscribed as checkIsSubscribed,
} from '../lib/pushNotifications';

/**
 * Banner yang muncul setelah login untuk meminta izin push notification.
 * Hanya tampil jika permission masih 'default' dan user belum subscribe.
 */
export default function NotificationBanner() {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [status, setStatus] = useState('idle'); // idle | loading | denied | error
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function checkStatus() {
            const supported = isPushSupported();
            if (!supported) return;

            const permission = getPermissionStatus();

            if (permission === 'granted') {
                const subscribed = await checkIsSubscribed();
                if (!subscribed) {
                    await requestPermissionAndSubscribe(user.id);
                }
                return;
            }

            if (permission === 'denied') {
                return;
            }

            const dismissedKey = `push_banner_dismissed_${user.id}`;
            const wasDismissed = sessionStorage.getItem(dismissedKey);
            if (wasDismissed) return;

            setVisible(true);
        }

        checkStatus().catch(err => console.error('[Banner] Error:', err));
    }, [user]);

    const handleActivate = async () => {
        if (!user) return;
        setStatus('loading');

        const result = await requestPermissionAndSubscribe(user.id);

        if (result.success) {
            setVisible(false);
        } else if (result.error === 'denied') {
            setStatus('denied');
        } else {
            setStatus('error');
        }
    };

    const handleDismiss = () => {
        if (!user) return;
        const dismissedKey = `push_banner_dismissed_${user.id}`;
        sessionStorage.setItem(dismissedKey, 'true');
        setDismissed(true);
        setTimeout(() => setVisible(false), 300);
    };

    if (!visible) return null;

    return (
        <div
            className={`mx-4 mt-4 transition-all duration-300 ${dismissed ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
                }`}
        >
            <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full -translate-y-8 translate-x-8 blur-xl" />

                {status === 'denied' ? (
                    /* Denied state */
                    <div className="relative flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">
                                notifications_off
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Notifikasi Diblokir
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                Kamu memblokir izin notifikasi. Untuk mengaktifkan, buka pengaturan browser
                                &gt; Site Settings &gt; izinkan notifikasi untuk website ini.
                            </p>
                            <button
                                onClick={() => setVisible(false)}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                ) : status === 'error' ? (
                    /* Error state */
                    <div className="relative flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[20px]">
                                error
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Gagal Mengaktifkan Notifikasi
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                Terjadi kesalahan. Coba lagi nanti atau aktifkan dari menu Pengaturan.
                            </p>
                            <button
                                onClick={() => setVisible(false)}
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Default prompt state */
                    <div className="relative flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">
                                notifications_active
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                Aktifkan Notifikasi
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                Dapatkan pengingat tugas dan ujian langsung di perangkatmu, bahkan saat browser tertutup.
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={handleActivate}
                                    disabled={status === 'loading'}
                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                            Aktifkan
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    disabled={status === 'loading'}
                                    className="px-3.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                                >
                                    Nanti Saja
                                </button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
