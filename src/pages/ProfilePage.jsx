import { useState } from 'react';
import { usePageActionRegistration } from '../contexts/PageActionContext.js';
import { useUser } from '../contexts/UserContext';

export default function ProfilePage() {
    const { profile, updateProfile, resetProfile } = useUser();
    const [profileDraft, setProfileDraft] = useState({});
    const [profileStatus, setProfileStatus] = useState('');

    usePageActionRegistration(null);

    const profileForm = {
        name: profileDraft.name ?? profile.name,
        program: profileDraft.program ?? profile.program,
        photoUrl: profileDraft.photoUrl ?? profile.photoUrl,
    };

    const handleSaveProfile = (event) => {
        event.preventDefault();
        updateProfile(profileForm);
        setProfileDraft({});
        setProfileStatus('Profil berhasil disimpan.');
    };

    const handleResetProfile = () => {
        resetProfile();
        setProfileDraft({});
        setProfileStatus('Profil lokal dikembalikan ke data akun.');
    };

    return (
        <>
            <header className="hidden lg:block flex-shrink-0 bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0">
                <div className="px-6 py-4">
                    <h2 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight">Profil</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola identitas akun</p>
                </div>
            </header>

            <div className="page-content-animated flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 lg:pb-8">
                <section className="rounded-xl border border-slate-200 bg-surface-light dark:border-slate-700 dark:bg-surface-dark">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white">Profil</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{profile.email || 'Akun pengguna'}</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                {profileForm.photoUrl ? (
                                    <img
                                        alt={profileForm.name || 'Foto Profil'}
                                        src={profileForm.photoUrl}
                                        className="h-full w-full object-cover"
                                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-[30px] text-slate-400">person</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-white">
                                    {profileForm.name || 'Nama belum diisi'}
                                </p>
                                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                                    {profileForm.program || 'Program studi belum diisi'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.name}
                                    onChange={(event) => setProfileDraft(prev => ({ ...prev, name: event.target.value }))}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                    placeholder="Contoh: Udin Voldigoad"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Program Studi *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.program}
                                    onChange={(event) => setProfileDraft(prev => ({ ...prev, program: event.target.value }))}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                    placeholder="Contoh: Teknik Informatika"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                URL Foto Profil
                            </label>
                            <input
                                type="url"
                                value={profileForm.photoUrl}
                                onChange={(event) => setProfileDraft(prev => ({ ...prev, photoUrl: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>

                        {profileStatus && (
                            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                {profileStatus}
                            </p>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                type="submit"
                                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Simpan Profil
                            </button>
                            <button
                                type="button"
                                onClick={handleResetProfile}
                                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                Reset Profil
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </>
    );
}
