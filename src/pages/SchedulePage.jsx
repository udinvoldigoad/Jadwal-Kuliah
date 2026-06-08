import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { loadSchedule, saveSchedule, loadTasks, loadExams } from '../lib/db';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatsCard from '../components/schedule/StatsCard';
import DaySelector from '../components/schedule/DaySelector';
import CourseCard from '../components/schedule/CourseCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { usePageActionRegistration } from '../contexts/PageActionContext.js';
import { useBriefLoading } from '../hooks/useBriefLoading';

const initialScheduleData = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
};

// Helper to get Monday of a given week
const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Helper to format date range
const formatWeekRange = (monday) => {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${monday.getDate()} ${months[monday.getMonth()]} - ${friday.getDate()} ${months[friday.getMonth()]}`;
};

// Generate days array for a given week
const generateDays = (monday) => {
    const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
    return dayIds.map((id, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return { id, name: dayNames[index], date: String(date.getDate()) };
    });
};

// Get day id from date
const getDayIdFromDate = (date) => {
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return dayMap[date.getDay()];
};

const dayNames = {
    mon: 'Senin',
    tue: 'Selasa',
    wed: 'Rabu',
    thu: 'Kamis',
    fri: 'Jumat',
};

const createId = () => (
    window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now())
);

const parseTimeMinutes = (time) => {
    const [hours, minutes] = String(time || '').split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    return (hours * 60) + minutes;
};

const hasTimeConflict = (courses, startTime, endTime, ignoredCourseId) => {
    const start = parseTimeMinutes(startTime);
    const end = parseTimeMinutes(endTime);

    return courses.some((course) => {
        if (course.id === ignoredCourseId) return false;
        const [courseStart, courseEnd] = String(course.time || '').split(' - ');
        return start < parseTimeMinutes(courseEnd) && end > parseTimeMinutes(courseStart);
    });
};

const isCourseLiveNow = (course, dayId, weekOffset) => {
    const now = new Date();
    if (weekOffset !== 0 || dayId !== getDayIdFromDate(now)) return false;

    const [startTime, endTime] = String(course.time || '').split(' - ');
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    return currentMinutes >= parseTimeMinutes(startTime) && currentMinutes <= parseTimeMinutes(endTime);
};

export default function SchedulePage() {
    // Week navigation state
    const [weekOffset, setWeekOffset] = useState(0);
    const today = new Date();
    const currentMonday = getMonday(today);
    const displayMonday = new Date(currentMonday);
    displayMonday.setDate(currentMonday.getDate() + (weekOffset * 7));

    const days = generateDays(displayMonday);
    const weekSubtitle = formatWeekRange(displayMonday);

    // Determine initial selected day
    const todayDayId = getDayIdFromDate(today);
    const initialDay = weekOffset === 0 && ['mon', 'tue', 'wed', 'thu', 'fri'].includes(todayDayId) ? todayDayId : 'mon';

    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [scheduleData, setScheduleData] = useState(initialScheduleData);
    const [loadError, setLoadError] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle');
    const [formError, setFormError] = useState('');
    const actionLoading = useBriefLoading();
    const [tasksDeadlineCount, setTasksDeadlineCount] = useState(0);
    const [upcomingExamsCount, setUpcomingExamsCount] = useState(0);
    const isInitialLoad = useRef(true);
    const [formData, setFormData] = useState({
        name: '',
        day: 'mon',
        startTime: '08:00',
        endTime: '09:40',
        sks: 3,
        class: '',
        room: '',
        lecturer: '',
    });

    // Load data from Supabase on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [savedSchedule, savedTasks, savedExams] = await Promise.all([
                    loadSchedule(),
                    loadTasks(),
                    loadExams(),
                ]);
                if (savedSchedule) setScheduleData(savedSchedule);

                // Calculate tasks deadline count
                if (savedTasks && Array.isArray(savedTasks)) {
                    const now = Date.now();
                    const sevenDaysLater = now + (7 * 24 * 60 * 60 * 1000);
                    setTasksDeadlineCount(savedTasks.filter(t => !t.isCompleted && t.dueDateTimestamp <= sevenDaysLater).length);
                }

                // Calculate upcoming exams count
                if (savedExams && Array.isArray(savedExams)) {
                    const now = Date.now();
                    const thirtyDaysLater = now + (30 * 24 * 60 * 60 * 1000);
                    setUpcomingExamsCount(savedExams.filter(e => {
                        const examTime = new Date(e.targetDate).getTime();
                        return examTime >= now && examTime <= thirtyDaysLater;
                    }).length);
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setLoadError('Gagal memuat data. Periksa koneksi lalu muat ulang halaman.');
            } finally {
                isInitialLoad.current = false;
            }
        }
        fetchData();
    }, []);

    // Save to Supabase when scheduleData changes (skip initial load)
    useEffect(() => {
        if (isInitialLoad.current) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            setSaveStatus('saving');
            saveSchedule(scheduleData).then((result) => {
                if (cancelled) return;
                if (result?.success) {
                    setSaveStatus('saved');
                    setLoadError('');
                } else {
                    setSaveStatus('error');
                    setLoadError(result?.error || 'Gagal menyimpan jadwal.');
                }
            }).catch(() => {
                if (cancelled) return;
                setSaveStatus('error');
                setLoadError('Gagal menyimpan jadwal.');
            });
        }, 500);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [scheduleData]);

    const courses = scheduleData[selectedDay] || [];
    const allCourses = Object.values(scheduleData).flat();
    const totalSks = allCourses.reduce((sum, c) => sum + (c.sks || 0), 0);
    const todayClasses = weekOffset === 0 && scheduleData[todayDayId] ? scheduleData[todayDayId].length : 0;

    const stats = [
        { label: 'Total SKS', value: `${totalSks} SKS`, icon: 'credit_score', iconColor: 'text-primary/50' },
        { label: 'Kelas Hari Ini', value: String(todayClasses), icon: 'today', iconColor: 'text-green-500/50' },
        { label: 'Tugas Deadline', value: String(tasksDeadlineCount), icon: 'assignment_late', iconColor: 'text-orange-500/50' },
        { label: 'Ujian Mendatang', value: String(upcomingExamsCount), icon: 'event_busy', iconColor: 'text-red-500/50' },
    ];

    const handleOpenModal = useCallback(() => {
        setEditingCourse(null);
        setFormData({
            name: '',
            day: selectedDay,
            startTime: '08:00',
            endTime: '09:40',
            sks: 3,
            class: '',
            room: '',
            lecturer: '',
        });
        setFormError('');
        setIsModalOpen(true);
    }, [selectedDay]);

    const pageAction = useMemo(() => ({
        label: 'Tambah Kelas',
        shortLabel: 'Tambah',
        icon: 'add',
        onClick: handleOpenModal,
    }), [handleOpenModal]);

    usePageActionRegistration(pageAction);

    const handleEditCourse = (course) => {
        setEditingCourse(course);
        const [startTime, endTime] = course.time.split(' - ');
        setFormData({
            name: course.name,
            day: selectedDay,
            startTime: startTime || '08:00',
            endTime: endTime || '09:40',
            sks: course.sks || 3,
            class: course.class || '',
            room: course.room || '',
            lecturer: course.lecturer || '',
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const name = formData.name.trim();
        const targetDay = formData.day;
        const startMinutes = parseTimeMinutes(formData.startTime);
        const endMinutes = parseTimeMinutes(formData.endTime);

        if (!name) {
            setFormError('Nama mata kuliah wajib diisi.');
            return;
        }

        if (startMinutes >= endMinutes) {
            setFormError('Jam selesai harus lebih besar dari jam mulai.');
            return;
        }

        if (hasTimeConflict(scheduleData[targetDay] || [], formData.startTime, formData.endTime, editingCourse?.id)) {
            setFormError('Jadwal bentrok dengan kelas lain di hari yang sama.');
            return;
        }

        const courseData = {
            id: editingCourse?.id || createId(),
            time: `${formData.startTime} - ${formData.endTime}`,
            name,
            sks: parseInt(formData.sks),
            class: formData.class.trim(),
            room: formData.room.trim(),
            lecturer: formData.lecturer.trim(),
        };

        setScheduleData(prev => {
            const next = { ...prev };
            if (editingCourse) {
                Object.keys(next).forEach((day) => {
                    next[day] = (next[day] || []).filter(course => course.id !== editingCourse.id);
                });
            }
            next[targetDay] = [...(next[targetDay] || []), courseData].sort((a, b) => a.time.localeCompare(b.time));
            return next;
        });

        actionLoading.show(editingCourse ? 'Memperbarui kelas...' : 'Menambahkan kelas...');
        setSelectedDay(targetDay);
        setIsModalOpen(false);
        setEditingCourse(null);
        setFormError('');
    };

    const handleDeleteCourse = (courseId) => {
        if (window.confirm('Yakin ingin menghapus kelas ini?')) {
            actionLoading.show('Menghapus kelas...');
            setScheduleData(prev => ({
                ...prev,
                [selectedDay]: prev[selectedDay].filter(course => course.id !== courseId),
            }));
        }
    };

    return (
        <>
            <LoadingOverlay
                visible={Boolean(actionLoading.message) || saveStatus === 'saving'}
                title={actionLoading.message || 'Menyimpan jadwal...'}
                description="Perubahan sedang disimpan ke cloud."
            />

            <Header
                title="Jadwal Harian"
                subtitle={weekSubtitle}
                showDateNav={true}
                actionLabel="Tambah Kelas"
                actionIcon="add"
                onAction={handleOpenModal}
                onPrevWeek={() => setWeekOffset(prev => prev - 1)}
                onNextWeek={() => setWeekOffset(prev => prev + 1)}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 scroll-smooth pb-20 lg:pb-8">
                {(loadError || saveStatus === 'error') && (
                    <div className={`rounded-lg border px-4 py-3 text-sm ${loadError || saveStatus === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                        {loadError || 'Gagal menyimpan perubahan jadwal.'}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                    {stats.map((stat) => (
                        <StatsCard key={stat.label} {...stat} />
                    ))}
                </div>

                {/* Day Selector & Schedule */}
                <div className="flex flex-col gap-6">
                    <DaySelector
                        days={days}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                    />

                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                            <span>Jadwal {dayNames[selectedDay]}</span>
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{courses.length} Mata Kuliah</span>
                        </h3>

                        <div className="flex flex-col gap-3">
                            {courses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    isLive={isCourseLiveNow(course, selectedDay, weekOffset)}
                                    onEdit={handleEditCourse}
                                    onDelete={handleDeleteCourse}
                                />
                            ))}
                            {courses.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
                                    <p>Tidak ada kelas hari ini</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Class Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCourse(null); }} title={editingCourse ? "Edit Kelas" : "Tambah Kelas Baru"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama Mata Kuliah *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Contoh: Struktur Data"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Hari *
                        </label>
                        <select
                            value={formData.day}
                            onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            {days.map(day => (
                                <option key={day.id} value={day.id}>{dayNames[day.id]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Jam Mulai *
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Jam Selesai *
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.endTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                SKS *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="6"
                                value={formData.sks}
                                onChange={(e) => setFormData(prev => ({ ...prev, sks: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Kelas
                            </label>
                            <input
                                type="text"
                                value={formData.class}
                                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                                className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                placeholder="Contoh: Kelas A"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ruangan
                        </label>
                        <input
                            type="text"
                            value={formData.room}
                            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Contoh: Ruang 304"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Dosen
                        </label>
                        <input
                            type="text"
                            value={formData.lecturer}
                            onChange={(e) => setFormData(prev => ({ ...prev, lecturer: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Contoh: Dr. Alan Turing"
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
