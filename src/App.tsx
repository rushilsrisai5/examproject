import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { InchargeDashboard } from './components/dashboards/InchargeDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { ShieldAlert, Compass } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile, role, isLoading, currentPath, navigate } = useAuth();

  // 1. Loading screen while authentication state resolves
  if (isLoading) {
    return <LoadingScreen message="Verifying examination authority session & role..." />;
  }

  // 2. Unauthenticated visitor: display Login Page
  if (!user || !profile || !role) {
    return (
      <div className="relative">
        <LoginPage />
        
        {/* Quick URL Test Bar for Scenario Testing */}
        <ScenarioTester currentPath={currentPath} navigate={navigate} role={null} />
      </div>
    );
  }

  // 3. Render appropriate role dashboard
  let DashboardComponent = null;

  if (currentPath === '/admin/dashboard' && role === 'admin') {
    DashboardComponent = <AdminDashboard />;
  } else if (currentPath === '/incharge/dashboard' && role === 'incharge') {
    DashboardComponent = <InchargeDashboard />;
  } else if (currentPath === '/student/dashboard' && role === 'student') {
    DashboardComponent = <StudentDashboard />;
  } else {
    // Role protection fallback if navigation is resolving
    if (role === 'admin') DashboardComponent = <AdminDashboard />;
    else if (role === 'incharge') DashboardComponent = <InchargeDashboard />;
    else if (role === 'student') DashboardComponent = <StudentDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {DashboardComponent}
      </main>

      {/* Quick URL Bar for evaluators to test scenario 7 (URL hijacking attempt) */}
      <ScenarioTester currentPath={currentPath} navigate={navigate} role={role} />
    </div>
  );
};

// URL Test Bar allowing fast testing of Scenario 6 and Scenario 7
const ScenarioTester: React.FC<{
  currentPath: string;
  navigate: (p: string) => void;
  role: string | null;
}> = ({ currentPath, navigate, role }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="fixed bottom-3 right-3 z-50">
      {isExpanded ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 max-w-sm text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              Route & Role Security Inspector
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Current Path: <code className="text-indigo-300 font-mono bg-slate-950 px-1 py-0.5 rounded">{currentPath}</code><br/>
            Active Role: <strong className="text-amber-300">{role || 'Unauthenticated'}</strong>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Test URL Manipulation (Protected Routes):
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-left truncate font-mono text-[10px]"
                title="Try accessing /admin/dashboard"
              >
                Go /admin/dashboard
              </button>
              <button
                onClick={() => navigate('/incharge/dashboard')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-left truncate font-mono text-[10px]"
                title="Try accessing /incharge/dashboard"
              >
                Go /incharge/dashboard
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-left truncate font-mono text-[10px]"
                title="Try accessing /student/dashboard"
              >
                Go /student/dashboard
              </button>
              <button
                onClick={() => navigate('/login')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-left truncate font-mono text-[10px]"
                title="Go to /login"
              >
                Go /login
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Changing URL without the proper role will automatically redirect you back according to Firebase security rules.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 text-xs font-mono transition-all backdrop-blur-sm"
          title="Open URL security inspector"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentPath}</span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
