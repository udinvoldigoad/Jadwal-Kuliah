const priorityStyles = {
    high: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 border-red-100 dark:border-red-800/30',
    medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300 border-amber-100 dark:border-amber-800/30',
    low: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border-blue-100 dark:border-blue-800/30',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30',
};

const priorityLabels = {
    high: 'High Priority',
    medium: 'Medium',
    low: 'Low',
    done: 'Done',
};

export default function TaskCard({ task, status = 'upcoming' }) {
    const isCompleted = status === 'completed';
    const isInProgress = status === 'inProgress';
    const priority = isCompleted ? 'done' : task.priority;

    return (
        <div className={`
      ${isInProgress ? 'border-l-4 border-l-amber-500 rounded-l-sm' : ''} 
      ${isCompleted ? 'bg-slate-50 dark:bg-surface-dark/50 opacity-80 hover:opacity-100' : 'bg-white dark:bg-surface-dark'} 
      border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group
    `}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${priorityStyles[priority]}`}>
                    {isCompleted && <span className="material-symbols-outlined text-[12px]">check</span>}
                    {priorityLabels[priority]}
                </span>
                <span className="text-slate-400 hover:text-primary material-symbols-outlined text-[18px]">more_vert</span>
            </div>

            {/* Title */}
            <h4 className={`font-bold mb-1 group-hover:text-primary transition-colors ${isCompleted ? 'text-slate-700 dark:text-slate-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                {task.title}
            </h4>

            {/* Description */}
            <p className={`text-xs mb-4 line-clamp-2 ${isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                {task.description}
            </p>

            {/* Progress bar for in-progress items */}
            {isInProgress && task.progress !== undefined && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                </div>
            )}

            {/* Footer */}
            <div className={`flex items-center justify-between text-xs border-t pt-3 mt-2 ${isCompleted ? 'border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className={`flex items-center gap-1.5 font-mono-data ${isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[14px]">{task.courseIcon || 'code'}</span>
                    <span>{task.course}</span>
                </div>
                <div className={`flex items-center gap-1.5 font-mono-data px-2 py-1 rounded ${isCompleted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[14px]">{isCompleted ? 'event_available' : 'schedule'}</span>
                    <span>{task.dueDate}</span>
                </div>
            </div>
        </div>
    );
}
