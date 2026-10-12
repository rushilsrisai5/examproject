import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Printer, 
  ShieldCheck, 
  BookOpen, 
  UserCheck, 
  FileBadge,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/db';
import { Allocation } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSchedule = async () => {
    if (!profile) return;
    setLoading(true);
    setLoadError(null);
    try {
      const studentAllocs = await DatabaseService.getStudentSchedule(
        profile.id,
        profile.email,
        profile.reg_no
      );
      setSchedule(studentAllocs);
    } catch (err) {
      console.error('Failed to load student schedule:', err);
      setLoadError(err instanceof Error ? err.message : 'Failed to load your schedule from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Candidate Profile Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8 border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <GraduationCap className="w-8 h-8 text-indigo-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Student Examination Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile?.full_name || 'Rushil Sai'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                  <span>Reg No: <strong className="text-white font-mono">{profile?.reg_no || '2026-CS-042'}</strong></span>
                  <span>·</span>
                  <span>Dept: <strong className="text-white">{profile?.department || 'Computer Science & Engineering'}</strong></span>
                  <span>·</span>
                  <span>Semester: <strong className="text-white">VI</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={loadSchedule}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors shadow-sm shrink-0 cursor-pointer"
                title="Refresh schedule from Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Admit Card / Hall Ticket</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Published Examination Schedule & Seat Numbers</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Confirmed hall allocations and reserved seating numbers for the upcoming university examination sessions.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
            {schedule.length} Papers Scheduled
          </span>
        </div>

        {/* Examination Schedule Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">Retrieving Published Examination Schedule...</div>
            <p className="text-xs text-slate-500 mt-1">Connecting to Cloud Firestore database...</p>
          </div>
        ) : loadError ? (
          <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 text-center shadow-sm text-rose-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm font-bold">Could not load your examination schedule</div>
            <p className="text-xs mt-1">{loadError}</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-800">No Published Examination Schedule Found</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your examination allocations have not been published by the examination section yet, or are currently under administrative review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.map((item, index) => (
              <div 
                key={item.id || index}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left: Course Information */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {item.course_code}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Confirmed Seating
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {item.course_code === 'CS-601' ? 'Distributed Systems & Cloud Infrastructure' :
                       item.course_code === 'CS-604' ? 'Formal Methods & Compiler Design' :
                       item.course_code === 'CS-607' ? 'Applied Cryptography & Network Security' :
                       item.course_code === 'EC-601' ? 'Digital Signal Processing & Microcontrollers' :
                       `Paper ${item.course_code}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Date: <strong>{item.exam_date}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Session: <strong>{item.session}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Hall & Seat Number Highlight */}
                  <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Assigned Examination Hall
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                        {item.room_number}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.building}
                      </div>
                    </div>

                    <div className="w-px h-10 bg-slate-200" />

                    <div className="text-center pl-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Seat No.
                      </div>
                      <div className="font-mono text-2xl font-black text-indigo-700 mt-0.5">
                        {item.seat_number}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Instructions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bring University Photo ID & Physical Admit Card. Report 15 minutes before session time.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Rules Notice */}
        <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileBadge className="w-4 h-4 text-indigo-600" />
            <span>Examination Hall Discipline & Regulations</span>
          </div>
          <p>
            1. Candidates must occupy only their assigned seat as specified above. Unauthorized room swapping will result in immediate disqualification.
          </p>
          <p>
            2. Electronic devices, smartwatches, and programmable calculators are strictly prohibited inside the hall.
          </p>
          <p>
            3. In case of any discrepancies regarding seat allocation, contact the Controller of Examinations section before the examination date.
          </p>
        </div>
      </div>
    </div>
  );
};
