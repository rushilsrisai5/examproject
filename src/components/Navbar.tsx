import React, { useState } from 'react';
import { LogOut, User, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ExamNovaLogo } from './ExamNovaLogo';

export const Navbar: React.FC = () => {
  const { profile, role, logout, currentPath } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md">
            Exam Administrator
          </span>
        );
      case 'incharge':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
            Hall In-Charge (Invigilator)
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-md">
            Candidate / Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 no-print print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand info */}
        <div className="flex items-center gap-3">
          <ExamNovaLogo size={36} showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Exam<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Nova</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                2026 Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Smart Examination Section Management
            </p>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Current route indicator */}
          <div className="hidden lg:flex items-center text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
            {currentPath}
          </div>

          {/* Profile info */}
          {profile && (
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {profile.full_name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {profile.email}
                </div>
              </div>

              {getRoleBadge()}
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-800 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Sign out of current examination session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
