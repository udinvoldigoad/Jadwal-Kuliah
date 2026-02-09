export default function StatsCard({ label, value, icon, iconColor = 'text-primary/50' }) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark p-2 md:p-5 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
            <span className="text-slate-500 dark:text-slate-400 text-[8px] md:text-sm font-medium truncate leading-none">{label}</span>
            <div className="flex items-center md:items-end justify-between mt-0.5 md:mt-1">
                <span className="text-base md:text-2xl font-bold text-slate-900 dark:text-white font-mono-data leading-tight">{value}</span>
                <span className={`material-symbols-outlined ${iconColor} text-xl md:text-3xl hidden sm:block`}>{icon}</span>
            </div>
        </div>
    );
}


