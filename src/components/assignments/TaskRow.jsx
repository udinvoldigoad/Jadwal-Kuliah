import { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';

export default function TaskRow({ task, onToggle, onEdit, onDelete }) {
    const isCompleted = task.isCompleted;
    const [menuOpen, setMenuOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
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
        <>
            <div
                onClick={() => setDetailOpen(true)}
                className={`group flex items-start md:items-center gap-3 md:gap-4 px-3 md:px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
            >
                {/* Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 md:mt-0 ${isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary'
                        }`}
                >
                    {isCompleted && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title with badge */}
                    <div className="flex items-center gap-2">
                        <h4 className={`font-semibold text-sm md:text-base text-slate-900 dark:text-white truncate ${isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                            {task.title}
                        </h4>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            {isCompleted ? 'Selesai' : 'Aktif'}
                        </span>
                    </div>

                    {/* Description - truncated */}
                    {task.description && (
                        <p className={`text-[10px] md:text-xs truncate mt-0.5 ${isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {task.description}
                        </p>
                    )}
                </div>

                {/* Deadline - on the right */}
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono-data flex-shrink-0">
                    <span className="material-symbols-outlined text-[12px] md:text-[14px]">schedule</span>
                    <span>{task.dueDate}</span>
                </div>

                {/* Menu button */}
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 w-32 z-[100]">
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(task); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-slate-500">edit</span>
                                    Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(task.id); }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Hapus
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Tugas">
                <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${isCompleted
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            {isCompleted ? 'Selesai' : 'Belum Selesai'}
                        </span>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Judul Tugas</label>
                        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{task.title}</p>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Deskripsi</label>
                            <p className="text-slate-700 dark:text-slate-300 mt-1">{task.description}</p>
                        </div>
                    )}

                    {/* Course */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Mata Kuliah</label>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-[18px] text-primary">book</span>
                            <span className="text-slate-900 dark:text-white font-medium">{task.course}</span>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Deadline</label>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-[18px] text-orange-500">schedule</span>
                            <span className="text-slate-900 dark:text-white font-mono-data font-medium">{task.dueDate}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => { onToggle(task.id); setDetailOpen(false); }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${isCompleted
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isCompleted ? 'undo' : 'check'}</span>
                            {isCompleted ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => { setDetailOpen(false); onEdit(task); }}
                                className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}

