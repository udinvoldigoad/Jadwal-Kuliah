import { useState } from 'react';
import Modal from './Modal';

export default function ResetDataModal({ isOpen, onClose }) {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleReset = () => {
        if (!isConfirmed) return;

        // Remove all app data from localStorage
        localStorage.removeItem('jadwal-schedule');
        localStorage.removeItem('jadwal-tasks');
        localStorage.removeItem('jadwal-exams');
        localStorage.removeItem('jadwal-user-profile');

        // Close modal and refresh page
        onClose();
        window.location.reload();
    };

    const handleClose = () => {
        setIsConfirmed(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Reset Semua Data">
            <div className="flex flex-col gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                        <div>
                            <h4 className="font-semibold text-red-700 dark:text-red-400">Peringatan!</h4>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                Tindakan ini akan menghapus <strong>semua data</strong> secara permanen:
                            </p>
                            <ul className="text-sm text-red-600 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
                                <li>Jadwal Kuliah</li>
                                <li>Daftar Tugas</li>
                                <li>Jadwal Ujian</li>
                                <li>Profil User</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
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

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!isConfirmed}
                        className={`flex-1 px-4 h-10 rounded-lg font-medium text-sm transition-all ${isConfirmed
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Reset Semua Data
                    </button>
                </div>
            </div>
        </Modal>
    );
}
