import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTopNavbar from './MobileTopNavbar';
import NotificationBanner from './NotificationBanner';
import NotificationProvider from './NotificationProvider';
import PageActionProvider from './PageActionProvider';
import { useAuth } from '../contexts/AuthContext';
import { UserProvider } from '../stores/useUserStore.jsx';
import { usePageAction } from '../contexts/PageActionContext.js';

function LayoutContent({ children }) {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { pageAction } = usePageAction();

    const mobileNavItems = [
        { path: '/', icon: 'calendar_month', label: 'Jadwal' },
        { path: '/assignments', icon: 'checklist', label: 'Tugas' },
        { type: 'action', icon: pageAction?.icon || 'add', label: pageAction?.shortLabel || 'Tambah' },
        { path: '/exams', icon: 'event_note', label: 'Ujian' },
        { type: 'more', icon: 'more_horiz', label: 'Lainnya' },
    ];

    // Get page info based on current route
    const getPageInfo = () => {
        switch (location.pathname) {
            case '/':
                return { title: 'Jadwal Kuliah', subtitle: 'Atur jadwal mingguanmu' };
            case '/assignments':
                return { title: 'Daftar Tugas', subtitle: 'Kelola tugas dan deadline' };
            case '/exams':
                return { title: 'Jadwal Ujian', subtitle: 'Kelola jadwal ujianmu' };
            case '/profile':
                return { title: 'Profil', subtitle: 'Kelola identitas akun' };
            case '/settings':
                return { title: 'Pengaturan', subtitle: 'Preferensi aplikasi' };
            default:
                return { title: 'Jadwal', subtitle: '' };
        }
    };

    const pageInfo = getPageInfo();
    const handleOpenProfile = () => navigate('/profile');
    const handleOpenSettings = () => navigate('/settings');
    const isMoreRouteActive = ['/profile', '/settings'].includes(location.pathname);

    useEffect(() => {
        if (!isMoreMenuOpen) return undefined;

        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setIsMoreMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMoreMenuOpen]);

    const handleNavigateFromMore = (path) => {
        setIsMoreMenuOpen(false);
        navigate(path);
    };

    const handleLogout = async () => {
        setIsMoreMenuOpen(false);

        try {
            await signOut();
            window.location.reload();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div className="app-shell-enter bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen flex overflow-hidden">
            <Sidebar
                onEditProfile={handleOpenProfile}
                onOpenSettings={handleOpenSettings}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Top Navbar */}
                <MobileTopNavbar
                    onEditProfile={handleOpenProfile}
                    onOpenSettings={handleOpenSettings}
                    title={pageInfo.title}
                    subtitle={pageInfo.subtitle}
                />

                {/* Notification Banner - floating overlay */}
                <div className="absolute top-12 lg:top-0 left-0 right-0 z-40 pointer-events-none">
                    <div className="pointer-events-auto">
                        <NotificationBanner />
                    </div>
                </div>

                <div key={location.pathname} className="flex min-h-0 flex-1 flex-col page-transition-shell">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div ref={moreMenuRef} className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-5 pointer-events-none">
                <div
                    aria-hidden={!isMoreMenuOpen}
                    className={`fixed inset-0 bg-slate-950/10 backdrop-blur-[3px] transition-opacity duration-200 dark:bg-slate-950/25 ${isMoreMenuOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                        }`}
                />

                <div
                    aria-hidden={!isMoreMenuOpen}
                    className={`absolute left-4 right-4 bottom-[86px] origin-bottom rounded-2xl border border-slate-200/80 bg-slate-50/90 p-2 text-slate-700 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-slate-950/35 ${isMoreMenuOpen
                        ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-3 scale-95 opacity-0'
                        }`}
                >
                    <button
                        type="button"
                        onClick={() => handleNavigateFromMore('/profile')}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-blue-500/10 hover:text-blue-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
                    >
                        <span className="material-symbols-outlined text-[21px] text-slate-500 dark:text-slate-400">person</span>
                        <span>Profil</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigateFromMore('/settings')}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-blue-500/10 hover:text-blue-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
                    >
                        <span className="material-symbols-outlined text-[21px] text-slate-500 dark:text-slate-400">settings</span>
                        <span>Pengaturan</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                    >
                        <span className="material-symbols-outlined text-[21px] text-red-500">logout</span>
                        <span>Log out</span>
                    </button>
                </div>

                <div className="grid grid-cols-5 items-center rounded-2xl border border-slate-200/80 bg-slate-50/85 px-2 py-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl pointer-events-auto dark:border-slate-700/80 dark:bg-slate-900/85 dark:shadow-slate-950/35">
                    {mobileNavItems.map((item) => {
                        if (item.type === 'action') {
                            return (
                                <button
                                    key="mobile-action"
                                    type="button"
                                    aria-label={pageAction?.label || 'Tambah'}
                                    disabled={!pageAction?.onClick}
                                    onClick={() => {
                                        setIsMoreMenuOpen(false);
                                        pageAction?.onClick?.();
                                    }}
                                    className={`mx-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-blue-500/30 ring-4 ring-slate-50/90 transition-all dark:ring-slate-900/90 ${pageAction?.onClick
                                        ? 'hover:bg-blue-700 active:scale-95'
                                        : 'cursor-not-allowed opacity-45'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                                </button>
                            );
                        }

                        if (item.type === 'more') {
                            return (
                                <button
                                    key="mobile-more"
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={isMoreMenuOpen}
                                    onClick={() => setIsMoreMenuOpen(prev => !prev)}
                                    className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors ${isMoreMenuOpen || isMoreRouteActive
                                        ? 'text-blue-400'
                                        : 'text-slate-500 hover:text-blue-400 dark:text-slate-400 dark:hover:text-blue-400'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                    <span className="max-w-full truncate text-[9px] font-medium">{item.label}</span>
                                </button>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMoreMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors ${isActive
                                        ? 'text-blue-400'
                                        : 'text-slate-500 hover:text-blue-400 dark:text-slate-400 dark:hover:text-blue-400'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                <span className="max-w-full truncate text-[9px] font-medium">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function Layout({ children }) {
    return (
        <UserProvider>
            <NotificationProvider>
                <PageActionProvider>
                    <LayoutContent>{children}</LayoutContent>
                </PageActionProvider>
            </NotificationProvider>
        </UserProvider>
    );
}



