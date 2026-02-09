import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useUser } from '../stores/useUserStore.jsx';

export default function ProfileModal({ isOpen, onClose }) {
    const { profile, updateProfile } = useUser();
    const [formData, setFormData] = useState({
        name: profile.name,
        program: profile.program,
        photoUrl: profile.photoUrl,
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: profile.name,
                program: profile.program,
                photoUrl: profile.photoUrl,
            });
        }
    }, [isOpen, profile]);

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile(formData);
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profil">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        placeholder="Contoh: Udin Voldigoad"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Program Studi *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.program}
                        onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                        className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        placeholder="Contoh: Teknik Informatika"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        URL Foto Profil
                    </label>
                    <input
                        type="url"
                        value={formData.photoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                        className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        placeholder="https://example.com/photo.jpg"
                    />
                    <p className="text-xs text-slate-400 mt-1">Opsional. Kosongkan untuk menggunakan avatar default.</p>
                </div>

                {formData.photoUrl && (
                    <div className="flex justify-center">
                        <img
                            src={formData.photoUrl}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                )}

                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all font-medium text-sm"
                    >
                        Simpan
                    </button>
                </div>
            </form>
        </Modal>
    );
}
