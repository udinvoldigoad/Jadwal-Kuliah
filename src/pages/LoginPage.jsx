import { useAuth } from '../components/AuthProvider';

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            alert('Gagal login. Silakan coba lagi.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo / Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/25 mb-5">
                        <span className="material-symbols-outlined text-white text-4xl">calendar_month</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Jadwal Kuliah
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Kelola jadwal, tugas, dan ujian kamu
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700/50">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
                        Selamat Datang
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                        Masuk untuk menyimpan data kamu
                    </p>

                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 h-12 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600 transition-all duration-200 group"
                    >
                        {/* Google Icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Masuk dengan Google
                        </span>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
                    Data kamu tersimpan aman di cloud
                </p>
            </div>
        </div>
    );
}
