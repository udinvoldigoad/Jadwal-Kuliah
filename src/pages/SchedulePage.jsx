import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import StatsCard from '../components/schedule/StatsCard';
import DaySelector from '../components/schedule/DaySelector';
import CourseCard from '../components/schedule/CourseCard';

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
    const [scheduleData, setScheduleData] = useState(() => {
        const saved = localStorage.getItem('jadwal-schedule');
        return saved ? JSON.parse(saved) : initialScheduleData;
    });
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

    useEffect(() => {
        localStorage.setItem('jadwal-schedule', JSON.stringify(scheduleData));
    }, [scheduleData]);

    const courses = scheduleData[selectedDay] || [];

    // Calculate stats dynamically
    const allCourses = Object.values(scheduleData).flat();
    const totalSks = allCourses.reduce((sum, c) => sum + (c.sks || 0), 0);
    const todayClasses = courses.length;

    // Get tasks deadline count from localStorage
    const getTasksDeadlineCount = () => {
        try {
            const savedTasks = localStorage.getItem('jadwal-tasks');
            if (!savedTasks) return 0;
            const tasks = JSON.parse(savedTasks);
            const now = Date.now();
            const sevenDaysLater = now + (7 * 24 * 60 * 60 * 1000);
            return tasks.filter(t => !t.isCompleted && t.dueDateTimestamp <= sevenDaysLater).length;
        } catch { return 0; }
    };

    // Get upcoming exams count from localStorage
    const getUpcomingExamsCount = () => {
        try {
            const savedExams = localStorage.getItem('jadwal-exams');
            if (!savedExams) return 0;
            const exams = JSON.parse(savedExams);
            const now = Date.now();
            const thirtyDaysLater = now + (30 * 24 * 60 * 60 * 1000);
            return exams.filter(e => {
                const examTime = new Date(e.targetDate).getTime();
                return examTime >= now && examTime <= thirtyDaysLater;
            }).length;
        } catch { return 0; }
    };

    const stats = [
        { label: 'Total SKS', value: `${totalSks} SKS`, icon: 'credit_score', iconColor: 'text-primary/50' },
        { label: 'Kelas Hari Ini', value: String(todayClasses), icon: 'today', iconColor: 'text-green-500/50' },
        { label: 'Tugas Deadline', value: String(getTasksDeadlineCount()), icon: 'assignment_late', iconColor: 'text-orange-500/50' },
        { label: 'Ujian Mendatang', value: String(getUpcomingExamsCount()), icon: 'event_busy', iconColor: 'text-red-500/50' },
    ];

    const handleOpenModal = () => {
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
        setIsModalOpen(true);
    };

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
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingCourse) {
            // Update existing course
            setScheduleData(prev => ({
                ...prev,
                [selectedDay]: prev[selectedDay].map(course =>
                    course.id === editingCourse.id
                        ? {
                            ...course,
                            time: `${formData.startTime} - ${formData.endTime}`,
                            name: formData.name,
                            sks: parseInt(formData.sks),
                            class: formData.class,
                            room: formData.room,
                            lecturer: formData.lecturer,
                        }
                        : course
                ).sort((a, b) => a.time.localeCompare(b.time)),
            }));
        } else {
            // Add new course
            const newCourse = {
                id: Date.now(),
                time: `${formData.startTime} - ${formData.endTime}`,
                name: formData.name,
                sks: parseInt(formData.sks),
                class: formData.class,
                room: formData.room,
                lecturer: formData.lecturer,
            };

            setScheduleData(prev => ({
                ...prev,
                [formData.day]: [...(prev[formData.day] || []), newCourse].sort((a, b) => a.time.localeCompare(b.time)),
            }));
        }

        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleDeleteCourse = (courseId) => {
        if (window.confirm('Yakin ingin menghapus kelas ini?')) {
            setScheduleData(prev => ({
                ...prev,
                [selectedDay]: prev[selectedDay].filter(course => course.id !== courseId),
            }));
        }
    };

    return (
        <>
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
                {/* Mobile Add Button - scrolls with content */}
                <button
                    onClick={handleOpenModal}
                    className="lg:hidden w-full flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span className="text-sm font-medium">Tambah Kelas</span>
                </button>

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
                                    isLive={course.isLive}
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
