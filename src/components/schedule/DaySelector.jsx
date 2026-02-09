export default function DaySelector({ days, selectedDay, onSelectDay }) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-1 md:p-1.5 flex overflow-x-auto gap-1 md:gap-2 no-scrollbar">
            {days.map((day) => (
                <button
                    key={day.id}
                    onClick={() => onSelectDay(day.id)}
                    className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 md:py-3 px-1 md:px-4 rounded-lg transition-all ${selectedDay === day.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                >
                    <span className={`text-[9px] md:text-xs font-medium uppercase tracking-wider ${selectedDay === day.id ? 'opacity-80' : 'opacity-70'}`}>
                        {day.name}
                    </span>
                    <span className="text-sm md:text-lg font-bold font-mono-data">{day.date}</span>
                </button>
            ))}
        </div>
    );
}
