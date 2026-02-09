import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import MobileTopNavbar from './MobileTopNavbar';
import { UserProvider, useUser } from '../stores/useUserStore.jsx';

function LayoutContent({ children }) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const location = useLocation();

    const mobileNavItems = [
        { path: '/', icon: 'calendar_month', label: 'Jadwal' },
        { path: '/assignments', icon: 'checklist', label: 'Tugas' },
        { path: '/exams', icon: 'event_note', label: 'Ujian' },
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
            default:
                return { title: 'Jadwal', subtitle: '' };
        }
    };

    const pageInfo = getPageInfo();

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen flex overflow-hidden">
            <Sidebar
                onEditProfile={() => setIsProfileModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Top Navbar */}
                <MobileTopNavbar
                    onEditProfile={() => setIsProfileModalOpen(true)}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    title={pageInfo.title}
                    subtitle={pageInfo.subtitle}
                />
                {children}
            </main>

            {/* Mobile Bottom Navigation - Only 3 items */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="flex justify-around items-center">
                    {mobileNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex-1 p-2 flex flex-col items-center ${isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </div>
    );
}

export default function Layout({ children }) {
    return (
        <UserProvider>
            <LayoutContent>{children}</LayoutContent>
        </UserProvider>
    );
}



