export default function LoadingOverlay({
    visible,
    title = 'Memproses...',
    description = 'Sebentar ya, perubahan sedang disiapkan.',
    level = 'page',
}) {
    const zIndex = level === 'modal' ? 'z-[70]' : 'z-40';

    return (
        <div
            aria-live="polite"
            aria-busy={visible}
            className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-slate-950/20 dark:bg-slate-950/55 backdrop-blur-[2px] transition-all duration-300 ${visible
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className={`mx-6 w-full max-w-xs rounded-2xl border border-white/70 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-slate-900/15 px-5 py-5 transition-all duration-300 ${visible ? 'translate-y-0 scale-100' : 'translate-y-2 scale-95'
                }`}>
                <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 flex-shrink-0">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-950"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/60 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-primary/10 dark:bg-primary/20 animate-pulse"></div>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                    </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-1/2 rounded-full bg-primary loading-bar"></div>
                </div>
            </div>
        </div>
    );
}
