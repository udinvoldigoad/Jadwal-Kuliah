export default function ExamCard({ exam }) {
    const isUpcoming = exam.targetDate > new Date();

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex">
            {/* Date sidebar */}
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-5 flex flex-col items-center justify-center min-w-[80px] border-r border-slate-200 dark:border-slate-700">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono-data">
                    {exam.date.split(' ')[0]}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">
                    {exam.date.split(' ')[1]?.substring(0, 3)}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{exam.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${exam.type === 'UAS'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                }`}>
                                {exam.type}
                            </span>
                            {isUpcoming && (
                                <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                                    Mendatang
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>{exam.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        <span>{exam.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 col-span-2">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        <span>{exam.lecturer}</span>
                    </div>
                </div>

                {/* Topics */}
                {exam.topics && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Materi</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {exam.topics.map((topic, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
