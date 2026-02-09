export default function CountdownHero({ exam, timeLeft }) {
    return (
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">Ujian Berikutnya</span>
                        <h2 className="text-2xl md:text-3xl font-bold">{exam.name}</h2>
                        <div className="flex items-center gap-3 text-blue-100">
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                {exam.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                                {exam.time}
                            </span>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex gap-3 md:gap-4">
                        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px]">
                            <span className="text-2xl md:text-3xl font-bold font-mono-data">{String(timeLeft.days).padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-200">Hari</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px]">
                            <span className="text-2xl md:text-3xl font-bold font-mono-data">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-200">Jam</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px]">
                            <span className="text-2xl md:text-3xl font-bold font-mono-data">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-200">Menit</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px]">
                            <span className="text-2xl md:text-3xl font-bold font-mono-data">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wider text-blue-200">Detik</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
