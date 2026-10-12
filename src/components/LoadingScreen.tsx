import React from 'react';
import { Loader2 } from 'lucide-react';
import { ExamNovaLogo } from './ExamNovaLogo';

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Verifying examination credentials & workspace session...',
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="relative flex flex-col items-center max-w-sm text-center">
        {/* Glow ambient */}
        <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl" />

        {/* Logo / Badge */}
        <div className="relative mb-4">
          <ExamNovaLogo size={56} />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
          Exam<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Nova</span>
        </h2>
        <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-6">
          Smart Examination Section
        </p>

        <div className="flex items-center gap-3 text-slate-300 text-sm bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 shadow-inner">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};
