import { useState, useRef, useEffect } from 'react';

export default function CourseCard({ course, isLive = false, onEdit, onDelete }) {
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
        <div className="group bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer relative">
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center gap-5 p-5">
                {/* Time */}
                <div className="min-w-[160px] flex flex-col gap-1 pl-2">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide font-medium">Waktu</span>
                    <span className="text-slate-900 dark:text-white text-lg font-bold font-mono-data">{course.time}</span>
                </div>

                {/* Course Info */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide font-medium">Mata Kuliah</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors truncate">{course.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono-data">{course.sks} SKS</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono-data">{course.class}</span>
                    </div>
                </div>

                {/* Room & Lecturer */}
                <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide font-medium">Ruangan</span>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">{course.roomIcon || 'location_on'}</span>
                            <span className="font-mono-data font-medium text-slate-700 dark:text-slate-200">{course.room}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide font-medium">Dosen</span>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{course.lecturer}</span>
                        </div>
                    </div>
                </div>

                {/* LIVE & Menu */}
                <div className="flex items-center gap-2">
                    {isLive && (
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800 animate-pulse">LIVE</span>
                    )}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 w-32 z-[100]">
                                {onEdit && (
                                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(course); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px] text-slate-500">edit</span> Edit
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(course.id); }} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px]">delete</span> Hapus
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Clean vertical stack */}
            <div className="md:hidden p-3 pl-4">
                <div className="flex items-start justify-between gap-2">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Course name */}
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{course.name}</h3>

                        {/* Time */}
                        <p className="text-xs text-primary font-bold font-mono-data mt-0.5">{course.time}</p>

                        {/* Badges */}
                        <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono-data">{course.sks} SKS</span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono-data">{course.class}</span>
                            {isLive && (
                                <span className="text-[9px] bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold animate-pulse">LIVE</span>
                            )}
                        </div>

                        {/* Lecturer & Room */}
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">person</span>
                                <span className="truncate">{course.lecturer}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">location_on</span>
                                <span className="font-mono-data">{course.room}</span>
                            </div>
                        </div>
                    </div>

                    {/* Menu button */}
                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 w-32 z-[100]">
                                {onEdit && (
                                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(course); }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px] text-slate-500">edit</span> Edit
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(course.id); }} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px]">delete</span> Hapus
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

