import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { resetAllData } from '../lib/db';
import {
    isPushSupported,
    getPermissionStatus,
    requestPermissionAndSubscribe,
    unsubscribe,
    isSubscribed as checkIsSubscribed,
} from '../lib/pushNotifications';

export default function SettingsModal({ isOpen, onClose }) {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Push notification state
    const [pushSupported] = useState(() => isPushSupported());
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushPermission, setPushPermission] = useState(() => getPermissionStatus());
    const [pushError, setPushError] = useState('');

    // Check push subscription status when modal opens
    useEffect(() => {
        if (isOpen && pushSupported) {
            checkIsSubscribed().then(setPushSubscribed);
            setPushPermission(getPermissionStatus());
            setPushError('');
        }
    }, [isOpen, pushSupported]);

    const handleTogglePush = async () => {
        if (!user) return;
        setPushLoading(true);
        setPushError('');

        try {
            if (pushSubscribed) {
                // Unsubscribe
                const result = await unsubscribe();
                if (result.success) {
                    setPushSubscribed(false);
                } else {
                    setPushError(result.error || 'Gagal menonaktifkan notifikasi.');
                }
            } else {
                // Subscribe
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
        try {
            await signOut();
            window.location.reload();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleReset = async () => {
        if (!isConfirmed) return;

        // Delete all data from Supabase
        try {
            await resetAllData();
            onClose();
            window.location.reload();
        } catch (err) {
            console.error('Reset failed:', err);
        }
    };

    const handleClose = () => {
        setShowResetConfirm(false);
        setIsConfirmed(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Pengaturan">
            <div className="flex flex-col gap-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Tema</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                        Ganti
                    </button>
                </div>

                {/* Push Notification Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                            {pushSubscribed ? 'notifications_active' : 'notifications_off'}
                        </span>
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">Push Notification</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {!pushSupported
                                    ? 'Browser tidak mendukung'
                                    : pushPermission === 'denied'
                                        ? 'Diblokir di browser'
                                        : pushSubscribed
                                            ? 'Aktif'
                                            : 'Nonaktif'}
                            </p>
                        </div>
                    </div>
                    {pushSupported && pushPermission !== 'denied' ? (
                        <button
                            onClick={handleTogglePush}
                            disabled={pushLoading}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${pushSubscribed
                                    ? 'bg-blue-600'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                } ${pushLoading ? 'opacity-60' : ''}`}
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${pushSubscribed ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    ) : pushPermission === 'denied' ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Buka Settings Browser
                        </span>
                    ) : null}
                </div>

                {pushError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {pushError}
                    </div>
                )}

                {/* Reset Data Section */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Zona Berbahaya</h4>

                    {!showResetConfirm ? (
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500">delete_forever</span>
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Reset Semua Data</h4>
                                    <p className="text-xs text-red-500 dark:text-red-400/70">Hapus jadwal, tugas, dan ujian</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-red-400 group-hover:text-red-500 transition-colors">chevron_right</span>
                        </button>
                    ) : (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                                <div>
                                    <h4 className="font-semibold text-red-700 dark:text-red-400">Peringatan!</h4>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                        Tindakan ini akan menghapus <strong>semua data</strong> secara permanen.
                                    </p>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-red-500 focus:ring-red-500"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    Saya yakin ingin menghapus semua data
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowResetConfirm(false); setIsConfirmed(false); }}
                                    className="flex-1 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={!isConfirmed}
                                    className={`flex-1 px-4 h-10 rounded-lg font-medium text-sm transition-all ${isConfirmed
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 h-10 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm mt-2"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Keluar
                </button>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-full px-4 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}
