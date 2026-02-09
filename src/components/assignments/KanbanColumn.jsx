import TaskCard from './TaskCard';

const statusColors = {
    upcoming: 'bg-blue-500',
    inProgress: 'bg-amber-500',
    completed: 'bg-green-500',
};

export default function KanbanColumn({ title, status, tasks }) {
    return (
        <div className="flex-1 flex flex-col min-w-[300px] h-full bg-surface-light dark:bg-surface-dark/40 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-surface-light dark:bg-surface-dark sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}></span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-mono-data px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} status={status} />
                ))}
            </div>

            {/* Add button */}
            {status !== 'completed' && (
                <button className="m-3 p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Task
                </button>
            )}
        </div>
    );
}
