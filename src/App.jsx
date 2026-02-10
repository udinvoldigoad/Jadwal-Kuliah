import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import AssignmentsPage from './pages/AssignmentsPage';
import ExamsPage from './pages/ExamsPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
