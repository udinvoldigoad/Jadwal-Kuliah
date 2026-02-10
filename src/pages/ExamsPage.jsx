import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import CountdownHero from '../components/exams/CountdownHero';
import ExamRow from '../components/exams/ExamRow';
import { loadExams, saveExams, loadSchedule } from '../lib/db';

// Helper to get day name in Indonesian
const getDayName = (date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
};

// Helper to format date key
const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper to format date label
const formatDateLabel = (date) => {
    const dayName = getDayName(date);
    const day = date.getDate();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const month = months[date.getMonth()];
    return `${dayName}, ${day} ${month}`;
};

// Helper to format short date
const formatShortDate = (date) => {
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[date.getMonth()]}`;
};

// Initial exams - empty for fresh start
const initialExams = [];



// Convert saved data back to proper format with Date objects
const parseExams = (savedExams) => {
    return savedExams.map(exam => ({
        ...exam,
        targetDate: new Date(exam.targetDate)
    }));
};

export default function ExamsPage() {
    const [exams, setExams] = useState(initialExams);
    const [courseList, setCourseList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoad = useRef(true);
    const [nextExam, setNextExam] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'UTS',
        date: '',
        startTime: '09:00',
        endTime: '11:00',
        room: '',
        lecturer: '',
    });

    // Load data from Supabase on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [savedExams, savedSchedule] = await Promise.all([
                    loadExams(),
                    loadSchedule(),
                ]);
                if (savedExams) setExams(parseExams(savedExams));
                if (savedSchedule) {
                    const courseNames = new Set();
                    Object.values(savedSchedule).flat().forEach(course => {
                        if (course.name) courseNames.add(course.name);
                    });
                    setCourseList(Array.from(courseNames).sort());
                }
            } catch (err) {
                console.error('Error loading exams:', err);
            } finally {
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        }
        fetchData();
    }, []);

    // Save to Supabase when exams change (skip initial load)
    useEffect(() => {
        if (isInitialLoad.current) return;
        const timer = setTimeout(() => {
            saveExams(exams);
        }, 500);
        return () => clearTimeout(timer);
    }, [exams]);

    useEffect(() => {
        const now = new Date();
        const upcoming = exams
            .filter(e => e.targetDate > now)
            .sort((a, b) => a.targetDate - b.targetDate);

        if (upcoming.length > 0) {
            setNextExam(upcoming[0]);
        }
    }, [exams]);

    useEffect(() => {
        if (!nextExam) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = nextExam.targetDate.getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextExam]);

    const handleOpenModal = () => {
        setEditingExam(null);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData({
            name: '',
            type: 'UTS',
            date: tomorrow.toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '11:00',
            room: '',
            lecturer: '',
        });
        setIsModalOpen(true);
    };

    const handleEditExam = (exam) => {
        setEditingExam(exam);
        const dateValue = exam.targetDate
            ? new Date(exam.targetDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        const [startTime, endTime] = exam.time ? exam.time.split(' - ') : ['09:00', '11:00'];
        setFormData({
            name: exam.name,
            type: exam.type || 'UTS',
            date: dateValue,
            startTime: startTime,
            endTime: endTime,
            room: exam.room || '',
            lecturer: exam.lecturer || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const targetDate = new Date(`${formData.date}T${formData.startTime}:00`);

        if (editingExam) {
            // Update existing exam
            setExams(prev => prev.map(exam =>
                exam.id === editingExam.id
                    ? {
                        ...exam,
                        name: formData.name,
                        type: formData.type,
                        date: formatShortDate(targetDate),
                        time: `${formData.startTime} - ${formData.endTime}`,
                        room: formData.room,
                        lecturer: formData.lecturer,
                        targetDate: targetDate,
                    }
                    : exam
            ));
        } else {
            // Add new exam
            const newExam = {
                id: Date.now(),
                name: formData.name,
                type: formData.type,
                date: formatShortDate(targetDate),
                time: `${formData.startTime} - ${formData.endTime}`,
                room: formData.room,
                lecturer: formData.lecturer,
                targetDate: targetDate,
            };

            setExams(prev => [...prev, newExam]);
        }

        setIsModalOpen(false);
        setEditingExam(null);
    };

    const handleDeleteExam = (examId) => {
        if (window.confirm('Yakin ingin menghapus jadwal ujian ini?')) {
            setExams(prev => prev.filter(exam => exam.id !== examId));
        }
    };

    // Group exams by date
    const groupedExams = exams
        .sort((a, b) => a.targetDate - b.targetDate)
        .reduce((groups, exam) => {
            const dateKey = getDateKey(exam.targetDate);
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: exam.targetDate,
                    label: formatDateLabel(exam.targetDate),
                    exams: [],
                };
            }
            groups[dateKey].exams.push(exam);
            return groups;
        }, {});

    const examGroups = Object.values(groupedExams);

    return (
        <>
            <Header
                title="Jadwal Ujian"
                subtitle="Kelola dan persiapkan ujianmu"
                actionLabel="Tambah Ujian"
                actionIcon="add"
                onAction={handleOpenModal}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 pb-20 lg:pb-8">
                {/* Mobile Add Button - scrolls with content */}
                <button
                    onClick={handleOpenModal}
                    className="lg:hidden w-full flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span className="text-sm font-medium">Tambah Ujian</span>
                </button>

                {/* Countdown Hero */}
                {nextExam && <CountdownHero exam={nextExam} timeLeft={timeLeft} />}

                {/* Exam List by Day */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                        <span>Daftar Ujian</span>
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{exams.length} Ujian</span>
                    </h3>

                    {examGroups.map((group) => (
                        <section key={group.label} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                                <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                                <h4 className="font-bold text-slate-900 dark:text-white">{group.label}</h4>
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono-data px-2 py-0.5 rounded-full">
                                    {group.exams.length} ujian
                                </span>
                            </div>
                            <div>
                                {group.exams.map(exam => (
                                    <ExamRow key={exam.id} exam={exam} onEdit={handleEditExam} onDelete={handleDeleteExam} />
                                ))}
                            </div>
                        </section>
                    ))}

                    {examGroups.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-2">event_busy</span>
                            <p>Belum ada jadwal ujian</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Exam Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingExam(null); }} title={editingExam ? "Edit Jadwal Ujian" : "Tambah Jadwal Ujian"}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama Mata Kuliah *
                        </label>
                        {courseList.length > 0 ? (
                            <select
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                            Jenis Ujian *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        >
                            <option value="UTS">UTS (Ujian Tengah Semester)</option>
                            <option value="UAS">UAS (Ujian Akhir Semester)</option>
                            <option value="Kuis">Kuis</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Tanggal *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ruangan
                        </label>
                        <input
                            type="text"
                            value={formData.room}
                            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                            className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                            placeholder="Contoh: Aula Utama"
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

