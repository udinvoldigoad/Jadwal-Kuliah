import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePageActionRegistration } from '../contexts/PageActionContext.js';
import { useTheme } from '../contexts/ThemeContext';
import { resetAllData } from '../lib/db';
import {
    getPermissionStatus,
    isPushSupported,
    isSubscribed as checkIsSubscribed,
    requestPermissionAndSubscribe,
    unsubscribe,
} from '../lib/pushNotifications';

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [pageError, setPageError] = useState('');

    const [pushSupported] = useState(() => isPushSupported());
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushPermission, setPushPermission] = useState(() => getPermissionStatus());
    const [pushError, setPushError] = useState('');

    usePageActionRegistration(null);

    useEffect(() => {
        if (!pushSupported) return undefined;

        let cancelled = false;
        checkIsSubscribed().then((subscribed) => {
            if (!cancelled) setPushSubscribed(subscribed);
        });
        setPushPermission(getPermissionStatus());
        setPushError('');

        return () => {
            cancelled = true;
        };
    }, [pushSupported]);

    const handleTogglePush = async () => {
        if (!user) return;
        setPushLoading(true);
        setPushError('');
        setPageError('');

        try {
            if (pushSubscribed) {
                const result = await unsubscribe();
                if (result.success) {
                    setPushSubscribed(false);
                } else {
                    setPushError(result.error || 'Gagal menonaktifkan notifikasi.');
                }
            } else {
                const result = await requestPermissionAndSubscribe(user.id);
                if (result.success) {
                    setPushSubscribed(true);
                    setPushPermission('granted');
                } else if (result.error === 'denied') {
                    setPushPermission('denied');
                    setPushError('Izin notifikasi diblokir di browser.');
                } else {
                    setPushError(result.error || 'Gagal mengaktifkan notifikasi.');
                }
            }
        } catch (err) {
            console.error('Toggle push failed:', err);
            setPushError(err.message || 'Gagal mengubah status notifikasi.');
        } finally {
            setPushLoading(false);
        }
    };

    const handleLogout = async () => {
        setPageError('');
        try {
            await signOut();
            window.location.reload();
        } catch (err) {
            console.error('Logout failed:', err);
            setPageError('Gagal keluar dari akun. Coba lagi.');
        }
    };

    const handleResetData = async () => {
        if (!isConfirmed) return;

        setPageError('');
        try {
            const result = await resetAllData();
            if (result?.success === false) {
                setPageError(result.error || 'Gagal menghapus data.');
                return;
            }
            window.location.reload();
        } catch (err) {
            console.error('Reset failed:', err);
            setPageError('Gagal menghapus data. Coba lagi.');
        }
    };

    const pushStatus = !pushSupported
        ? 'Browser tidak mendukung'
        : pushPermission === 'denied'
            ? 'Diblokir di browser'
            : pushSubscribed
                ? 'Aktif'
                : 'Nonaktif';

    return (
        <>
            <header className="hidden lg:block flex-shrink-0 bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0">
                <div className="px-6 py-4">
                    <h2 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight">Pengaturan</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Preferensi aplikasi</p>
                </div>
            </header>

            <div className="page-content-animated flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 lg:pb-8 space-y-4 md:space-y-6">
                {(pageError || pushError) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {pageError || pushError}
                    </div>
                )}

                <section className="rounded-xl border border-slate-200 bg-surface-light dark:border-slate-700 dark:bg-surface-dark">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white">Pengaturan</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Preferensi tampilan dan notifikasi</p>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <div className="flex items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                </span>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Tema</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="h-9 rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                                Ganti
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                                    {pushSubscribed ? 'notifications_active' : 'notifications_off'}
                                </span>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Push Notification</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{pushStatus}</p>
                                </div>
                            </div>

                            {pushSupported && pushPermission !== 'denied' ? (
                                <button
                                    type="button"
                                    onClick={handleTogglePush}
                                    disabled={pushLoading}
                                    aria-label="Ubah status push notification"
                                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${pushSubscribed
                                        ? 'bg-blue-600'
                                        : 'bg-slate-300 dark:bg-slate-600'
                                        } ${pushLoading ? 'opacity-60' : ''}`}
                                >
                                    <span
                                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${pushSubscribed ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            ) : pushPermission === 'denied' ? (
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Buka Settings Browser
                                </span>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/10">
                    <div className="border-b border-red-200 px-4 py-3 dark:border-red-800">
                        <h3 className="font-bold text-red-700 dark:text-red-400">Zona Berbahaya</h3>
                        <p className="text-xs text-red-500 dark:text-red-300">Aksi di bagian ini berdampak langsung ke data akun.</p>
                    </div>

                    <div className="space-y-3 p-4">
                        {!showResetConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(true)}
                                className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-white/70 p-4 text-left transition-colors hover:bg-white dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">delete_forever</span>
                                    <div>
                                        <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Reset Semua Data</h4>
                                        <p className="text-xs text-red-500 dark:text-red-300">Hapus jadwal, tugas, dan ujian</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-red-400">chevron_right</span>
                            </button>
                        ) : (
                            <div className="rounded-lg border border-red-200 bg-white/70 p-4 dark:border-red-800 dark:bg-red-950/20">
                                <div className="mb-4 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[24px] text-red-500">warning</span>
                                    <div>
                                        <h4 className="font-semibold text-red-700 dark:text-red-400">Peringatan!</h4>
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                                            Tindakan ini akan menghapus semua data secara permanen.
                                        </p>
                                    </div>
                                </div>

                                <label className="mb-4 flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isConfirmed}
                                        onChange={(event) => setIsConfirmed(event.target.checked)}
                                        className="h-5 w-5 rounded border-slate-300 text-red-500 focus:ring-red-500 dark:border-slate-600"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        Saya yakin ingin menghapus semua data
                                    </span>
                                </label>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetConfirm(false);
                                            setIsConfirmed(false);
                                        }}
                                        className="h-10 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetData}
                                        disabled={!isConfirmed}
                                        className={`h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-all ${isConfirmed
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                                            }`}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white/70 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-white dark:border-red-800 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Keluar
                        </button>
                    </div>
                </section>
            </div>
        </>
    );
}
