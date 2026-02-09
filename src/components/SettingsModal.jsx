import { useState } from 'react';
import Modal from './Modal';
import { useTheme } from './ThemeProvider';

export default function SettingsModal({ isOpen, onClose, onResetData }) {
    const { theme, toggleTheme } = useTheme();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleReset = () => {
        if (!isConfirmed) return;

        localStorage.removeItem('jadwal-schedule');
        localStorage.removeItem('jadwal-tasks');
        localStorage.removeItem('jadwal-exams');

        onClose();
        window.location.reload();
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

                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-full px-4 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm mt-2"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}
