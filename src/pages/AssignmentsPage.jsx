import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../components/Modal';
import TaskRow from '../components/assignments/TaskRow';
import LoadingOverlay from '../components/LoadingOverlay';
import { loadTasks, saveTasks, loadSchedule } from '../lib/db';
import { useBriefLoading } from '../hooks/useBriefLoading';

// Initial task data - empty for fresh start
const initialTasks = [];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const createId = () => (
    window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now())
);

const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateInput = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function AssignmentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState(initialTasks);
    const [courseList, setCourseList] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle');
    const [formError, setFormError] = useState('');
    const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
    const actionLoading = useBriefLoading();
    const isInitialLoad = useRef(true);

    // Load data from Supabase on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [savedTasks, savedSchedule] = await Promise.all([
                    loadTasks(),
                    loadSchedule(),
                ]);
                if (savedTasks) setTasks(savedTasks);
                if (savedSchedule) {
                    const courseNames = new Set();
                    Object.values(savedSchedule).flat().forEach(course => {
                        if (course.name) courseNames.add(course.name);
                    });
                    setCourseList(Array.from(courseNames).sort());
                }
            } catch (err) {
                console.error('Error loading tasks:', err);
                setLoadError('Gagal memuat tugas. Periksa koneksi lalu muat ulang halaman.');
            } finally {
                isInitialLoad.current = false;
            }
        }
        fetchData();
    }, []);

    // Cleanup tasks completed more than 7 days ago
    const cleanupOldTasks = useCallback(() => {
        const now = Date.now();
        setTasks(prevTasks => {
            const filtered = prevTasks.filter(task => {
                if (task.isCompleted && task.completedAt) {
                    return (now - task.completedAt) <= SEVEN_DAYS_MS;
                }
                return true;
            });
            if (filtered.length !== prevTasks.length) {
                return filtered;
            }
            return prevTasks;
        });
    }, []);

    useEffect(() => {
        cleanupOldTasks();
    }, [cleanupOldTasks]);

    // Save to Supabase when tasks change (skip initial load)
    useEffect(() => {
        if (isInitialLoad.current) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setSaveStatus('saving');
            saveTasks(tasks).then((result) => {
                if (cancelled) return;
                if (result?.success) {
                    setSaveStatus('saved');
                    setLoadError('');
                } else {
                    setSaveStatus('error');
                    setLoadError(result?.error || 'Gagal menyimpan tugas.');
                }
            }).catch(() => {
                if (cancelled) return;
                setSaveStatus('error');
                setLoadError('Gagal menyimpan tugas.');
            });
        }, 500);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [tasks]);

    const handleToggle = (taskId) => {
        setOpenTaskMenuId(null);
        actionLoading.show('Memperbarui tugas...');
        setTasks(prevTasks =>
            prevTasks.map(task => {
                if (task.id === taskId) {
                    const isNowCompleted = !task.isCompleted;
                    return {
                        ...task,
                        isCompleted: isNowCompleted,
                        completedAt: isNowCompleted ? Date.now() : null,
                    };
                }
                return task;
            })
        );
    };

    const handleDeleteTask = (taskId) => {
        setOpenTaskMenuId(null);
        if (window.confirm('Yakin ingin menghapus tugas ini?')) {
            actionLoading.show('Menghapus tugas...');
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        }
    };

    const handleToggleTaskMenu = (taskId) => {
        setOpenTaskMenuId((currentTaskId) => currentTaskId === taskId ? null : taskId);
    };

    const filterTasks = (taskList) => {
        if (!searchQuery.trim()) return taskList;
        const query = searchQuery.toLowerCase();
        return taskList.filter(task =>
            (task.title || '').toLowerCase().includes(query) ||
            (task.description || '').toLowerCase().includes(query) ||
            (task.course || '').toLowerCase().includes(query)
        );
    };

    const upcomingTasks = filterTasks(
        tasks.filter(t => !t.isCompleted)
    ).sort((a, b) => a.dueDateTimestamp - b.dueDateTimestamp);

    const completedTasks = filterTasks(
        tasks.filter(t => t.isCompleted)
    ).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course: '',
        dueDate: '',
    });

    const handleOpenModal = () => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            course: '',
            dueDate: new Date().toISOString().split('T')[0],
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleEditTask = (task) => {
        setOpenTaskMenuId(null);
        setEditingTask(task);
        // Convert dueDate to YYYY-MM-DD format for date input
        const dueDateValue = task.dueDateTimestamp
            ? formatDateInput(task.dueDateTimestamp)
            : new Date().toISOString().split('T')[0];
        setFormData({
            title: task.title,
            description: task.description || '',
            course: task.course || '',
            dueDate: dueDateValue,
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const formatDueDate = (dateStr) => {
        const date = parseLocalDate(dateStr);
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${day} ${months[date.getMonth()]}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const title = formData.title.trim();
        const description = formData.description.trim();
        const course = formData.course.trim();
        const dueDate = parseLocalDate(formData.dueDate);

        if (!title) {
            setFormError('Judul tugas wajib diisi.');
            return;
        }

        if (!course) {
            setFormError('Mata kuliah wajib diisi.');
            return;
        }

        if (Number.isNaN(dueDate.getTime())) {
            setFormError('Deadline tidak valid.');
            return;
        }

        if (editingTask) {
            // Update existing task
            actionLoading.show('Memperbarui tugas...');
            setTasks(prev => prev.map(task =>
                task.id === editingTask.id
                    ? {
                        ...task,
                        title,
                        description,
                        course,
                        dueDate: formatDueDate(formData.dueDate),
                        dueDateTimestamp: dueDate.getTime(),
                    }
                    : task
            ));
        } else {
            // Add new task
            actionLoading.show('Menambahkan tugas...');
            const newTask = {
                id: createId(),
                title,
                description,
                course,
                courseIcon: 'assignment',
                dueDate: formatDueDate(formData.dueDate),
                dueDateTimestamp: dueDate.getTime(),
                isCompleted: false,
                completedAt: null,
            };

            setTasks(prev => [...prev, newTask]);
        }

        setIsModalOpen(false);
        setEditingTask(null);
        setFormError('');
    };


    return (
        <>
            <LoadingOverlay
                visible={Boolean(actionLoading.message) || saveStatus === 'saving'}
                title={actionLoading.message || 'Menyimpan tugas...'}
                description="Perubahan sedang disimpan ke cloud."
            />

            {/* Header - Desktop Only */}
            <header className="hidden lg:block flex-shrink-0 bg-surface-light/70 dark:bg-surface-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-10 sticky top-0">
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight">Daftar Tugas</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola tugas dan deadline kamu</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                            <input
                                className="w-64 pl-10 pr-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono-data"
                                placeholder="Cari tugas..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className="text-sm font-medium">Tambah Tugas</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8 space-y-4 md:space-y-6">
                {/* Mobile Search bar and Add button - scrolls with content */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="relative group flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[18px]">search</span>
                        <input
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono-data"
                            placeholder="Cari tugas..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="text-xs font-medium">Tambah</span>
                    </button>
                </div>

                {(loadError || saveStatus === 'error') && (
                    <div className={`rounded-lg border px-4 py-3 text-sm ${loadError || saveStatus === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                        {loadError || 'Gagal menyimpan perubahan tugas.'}
                    </div>
                )}

                {/* Upcoming Section */}
                <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <h3 className="font-bold text-slate-900 dark:text-white">Belum Selesai</h3>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono-data px-2 py-0.5 rounded-full">
                            {upcomingTasks.length}
                        </span>
                    </div>
                    <div>
                        {upcomingTasks.length > 0 ? (
                            upcomingTasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    menuOpen={openTaskMenuId === task.id}
                                    onToggleMenu={handleToggleTaskMenu}
                                    onCloseMenu={() => setOpenTaskMenuId(null)}
                                    onToggle={handleToggle}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                />
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                <span className="material-symbols-outlined text-3xl mb-2">task_alt</span>
                                <p className="text-sm">Tidak ada tugas yang belum selesai</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Completed Section */}
                <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <h3 className="font-bold text-slate-900 dark:text-white">Selesai</h3>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono-data px-2 py-0.5 rounded-full">
                            {completedTasks.length}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">Otomatis dihapus setelah 7 hari</span>
                    </div>
                    <div>
                        {completedTasks.length > 0 ? (
                            completedTasks.map(task => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    menuOpen={openTaskMenuId === task.id}
                                    onToggleMenu={handleToggleTaskMenu}
                                    onCloseMenu={() => setOpenTaskMenuId(null)}
                                    onToggle={handleToggle}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                />
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
                                <p className="text-sm">Belum ada tugas yang selesai</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Add Task Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} title={editingTask ? "Edit Tugas" : "Tambah Tugas Baru"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Judul Tugas *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Contoh: Implementasi Hash Table"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                            placeholder="Deskripsi tugas..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Mata Kuliah *
                        </label>
                        {courseList.length > 0 ? (
                            <select
                                required
                                value={formData.course}
                                onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            >
                                <option value="">Pilih Mata Kuliah</option>
                                {courseList.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                required
                                value={formData.course}
                                onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="Tambah jadwal dulu untuk dropdown"
                            />
                        )}
                        {courseList.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1">Tip: Tambah jadwal kuliah untuk mendapatkan dropdown</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deadline *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all font-medium text-sm"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

