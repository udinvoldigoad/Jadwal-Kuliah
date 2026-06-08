export default function LoadingScreen({
    title = 'Jadwal Kuliah',
    description = 'Menyiapkan data dan sesi kamu...',
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-blue-500/25">
                    <span className="material-symbols-outlined text-[34px]">calendar_month</span>
                </div>

                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>

                <div className="mx-auto mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-1/2 rounded-full bg-primary loading-bar"></div>
                </div>

                <div className="mt-5 flex justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary loading-dot"></span>
                    <span className="h-2 w-2 rounded-full bg-primary loading-dot animation-delay-150"></span>
                    <span className="h-2 w-2 rounded-full bg-primary loading-dot animation-delay-300"></span>
                </div>
            </div>
        </div>
    );
}
