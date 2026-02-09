import { useState, useRef, useEffect } from 'react';

export default function ExamRow({ exam, onEdit, onDelete }) {
    const isUpcoming = exam.targetDate > new Date();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="group flex items-start md:items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-4 border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            {/* Date */}
            <div className="flex flex-col items-center justify-center min-w-[40px] md:min-w-[50px] text-center">
                <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-white font-mono-data leading-tight">
                    {exam.date.split(' ')[0]}
                </span>
                <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                    {exam.date.split(' ')[1]?.substring(0, 3)}
                </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 md:h-10 bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>

            {/* Exam Info - Main Content */}
            <div className="flex-1 min-w-0">
                {/* Title Row */}
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className={`text-[9px] md:text-[10px] font-bold uppercase px-1.5 md:px-2 py-0.5 rounded flex-shrink-0 ${exam.type === 'UAS'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : exam.type === 'UTS'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {exam.type}
                    </span>
                    {isUpcoming && (
                        <span className="text-[9px] md:text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 md:px-2 py-0.5 rounded font-medium flex-shrink-0">
                            Mendatang
                        </span>
                    )}
                </div>
                <h4 className="font-semibold text-sm md:text-base text-slate-900 dark:text-white truncate mt-0.5">{exam.name}</h4>

                {/* Meta info - time and room on same row */}
                <div className="flex items-center gap-2 md:gap-3 mt-1 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 font-mono-data">
                        <span className="material-symbols-outlined text-[12px] md:text-[14px]">schedule</span>
                        <span>{exam.time}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono-data">
                        <span className="material-symbols-outlined text-[12px] md:text-[14px]">location_on</span>
                        <span>{exam.room}</span>
                    </div>
                </div>
            </div>

            {/* Three-dot Menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px] md:text-[18px]">more_vert</span>
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 w-32 z-[100]">
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onEdit(exam);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">edit</span>
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete(exam.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Hapus
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

