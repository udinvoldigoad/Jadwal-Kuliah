import { useTheme } from './ThemeProvider';

export default function Header({
    title,
    subtitle,
    showDateNav = false,
    actionLabel = 'Tambah',
    actionIcon = 'add',
    onAction,
    onPrevWeek,
    onNextWeek,
}) {
    const { toggleTheme } = useTheme();

    return (
        // Header only visible on desktop (lg and up)
        <header className="hidden lg:block flex-shrink-0 bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0">
            <div className="flex px-6 py-4 items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
                    {showDateNav ? (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <button
                                onClick={onPrevWeek}
                                className="hover:text-primary transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                            </button>
                            <span className="text-sm font-medium font-mono-data">{subtitle}</span>
                            <button
                                onClick={onNextWeek}
                                className="hover:text-primary transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                            </button>
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        aria-label="Ganti Tema"
                        className="flex items-center gap-2 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={toggleTheme}
                    >
                        <span className="material-symbols-outlined text-[20px]">light_mode</span>
                        <span className="text-sm font-medium">Tema</span>
                    </button>
                    <button
                        className="flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                        onClick={onAction}
                    >
                        <span className="material-symbols-outlined text-[20px]">{actionIcon}</span>
                        <span className="text-sm font-medium">{actionLabel}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}




