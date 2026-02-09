import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { useUser } from '../stores/useUserStore.jsx';

export default function MobileTopNavbar({
    onEditProfile,
    onOpenSettings,
    title,
    subtitle,
    showDateNav = false,
    onPrevWeek,
    onNextWeek
}) {
    const { theme, toggleTheme } = useTheme();
    const { profile } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20">
            {/* Left side - Page title and navigation */}
            <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h2>
                {showDateNav ? (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-0.5">
                        <button
                            onClick={onPrevWeek}
                            className="hover:text-primary transition-colors p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                            <span className="material-symbols-outlined text-[12px]">arrow_back_ios</span>
                        </button>
                        <span className="text-[10px] font-medium font-mono-data">{subtitle}</span>
                        <button
                            onClick={onNextWeek}
                            className="hover:text-primary transition-colors p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        >
                            <span className="material-symbols-outlined text-[12px]">arrow_forward_ios</span>
                        </button>
                    </div>
                ) : subtitle ? (
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 truncate">{subtitle}</p>
                ) : null}
            </div>

            {/* Right side - Theme toggle + Profile with dropdown */}
            <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                {/* Profile with dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-0.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                            )}
                        </div>
                        <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
                    </button>

                    {/* Dropdown Menu */}
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 w-44 z-[100]">
                            {/* Profile info */}
                            {profile.name && (
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{profile.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.program}</p>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEditProfile?.();
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">edit</span>
                                Edit Profil
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onOpenSettings?.();
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">settings</span>
                                Pengaturan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


