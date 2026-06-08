export default function LoadingScreen({
    title = 'Jadwal Kuliah',
    description = 'Menyiapkan ruang kerja kamu...',
}) {
    return (
        <div className="app-shell-enter min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6 overflow-hidden">
            <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-blue-500/10 blur-3xl"></div>

            <div className="w-full max-w-sm text-center">
                <div className="relative mx-auto mb-7 h-24 w-24">
                    <div className="absolute inset-0 rounded-[28px] bg-primary/10 loading-fade-pulse"></div>
                    <div className="absolute inset-3 rounded-[24px] bg-primary/15 loading-fade-pulse animation-delay-300"></div>
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary text-white shadow-2xl shadow-blue-500/25">
                        <span className="material-symbols-outlined text-[38px]">calendar_month</span>
                    </div>
                </div>

                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    );
}
