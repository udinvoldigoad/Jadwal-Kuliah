import { NavLink } from 'react-router-dom';
import { useUser } from '../stores/useUserStore.jsx';

export default function Sidebar({ onEditProfile, onOpenSettings }) {
    const { profile } = useUser();

    const navItems = [
        { path: '/', icon: 'calendar_month', label: 'Jadwal' },
        { path: '/assignments', icon: 'checklist', label: 'Tugas' },
        { path: '/exams', icon: 'event_note', label: 'Ujian' },
    ];

    const hasProfile = profile.name && profile.program;

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 h-full flex-shrink-0">
            {/* Profile Section */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <button
                    onClick={onEditProfile}
                    className="w-full flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800 -m-2 p-2 rounded-lg transition-colors"
                >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {profile.photoUrl ? (
                            <img
                                alt={profile.name || 'Foto Profil'}
                                className="w-full h-full object-cover"
                                src={profile.photoUrl}
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <span
                            className={`material-symbols-outlined text-slate-400 dark:text-slate-500 text-[28px] ${profile.photoUrl ? 'hidden' : 'flex'}`}
                            style={{ display: profile.photoUrl ? 'none' : 'flex' }}
                        >
                            person
                        </span>
                    </div>
                    <div className="flex flex-col flex-1 text-left min-w-0">
                        {hasProfile ? (
                            <>
                                <h1 className="text-slate-900 dark:text-white text-base font-semibold leading-tight truncate">{profile.name}</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal truncate">{profile.program}</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-slate-500 dark:text-slate-400 text-base font-medium leading-tight">Atur Profil</h1>
                                <p className="text-slate-400 dark:text-slate-500 text-sm font-normal">Klik untuk mengisi</p>
                            </>
                        )}
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[18px] transition-colors">
                        edit
                    </span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary dark:text-blue-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 group'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`material-symbols-outlined text-[24px] ${!isActive ? 'group-hover:text-primary transition-colors' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Settings Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors group"
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    <span className="text-sm font-medium">Pengaturan</span>
                </button>
            </div>
        </aside>
    );
}
