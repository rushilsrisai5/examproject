import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Users, 
  ShieldAlert, 
  Layers, 
  ArrowRight,
  UserX,
  Shuffle,
  Info
} from 'lucide-react';
import { SmartAllocationPlan } from '../types';

interface SmartSeatAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SmartAllocationPlan | null;
  isLoading: boolean;
  onConfirm: () => Promise<void>;
  isCommitting: boolean;
  interleaveEnabled: boolean;
  onToggleInterleave: (enabled: boolean) => void;
  useMinimumRooms: boolean;
  onToggleMinimumRooms: (enabled: boolean) => void;
  onRecompute: () => void;
}

export const SmartSeatAllocationModal: React.FC<SmartSeatAllocationModalProps> = ({
  isOpen,
  onClose,
  plan,
  isLoading,
  onConfirm,
  isCommitting,
  interleaveEnabled,
  onToggleInterleave,
  useMinimumRooms,
  onToggleMinimumRooms,
  onRecompute,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'unallocated' | 'rooms'>('preview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Smart Seat Allocation Optimizer</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                  Algorithm Active
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                {plan ? `${plan.courseCode} · ${plan.examinationTitle}` : 'Configuring automated examination seat layout'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCommitting}
            className="text-indigo-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Algorithm Settings Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={interleaveEnabled}
                onChange={(e) => {
                  onToggleInterleave(e.target.checked);
                  setTimeout(onRecompute, 50);
                }}
                disabled={isCommitting || isLoading}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Interleave Departments & Sections (Anti-Cheating Alternating Pattern)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useMinimumRooms}
                onChange={(e) => {
                  onToggleMinimumRooms(e.target.checked);
                  setTimeout(onRecompute, 50);
                }}
                disabled={isCommitting || isLoading}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                <span>Minimum Rooms Optimization (Pack Largest Halls First)</span>
              </span>
            </label>
          </div>

          <button
            onClick={onRecompute}
            disabled={isCommitting || isLoading}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-Calculate Preview</span>
          </button>
        </div>

        {/* Capacity Warning Banner (Requirement 7) */}
        {plan?.insufficientCapacityWarning && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-xs shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 flex items-center gap-2">
                Capacity Warning: Insufficient Examination Hall Seating
              </h4>
              <p className="mt-1 text-amber-800 leading-relaxed">
                {plan.insufficientCapacityWarning}
              </p>
            </div>
          </div>
        )}

        {/* 4 Mandatory Metric Cards (Requirement 6) */}
        {plan && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pt-4 shrink-0">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Eligible</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">{plan.totalStudents}</span>
                <span className="text-xs text-slate-500">candidates</span>
              </div>
            </div>

            <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">Allocated Seats</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-700 font-mono">{plan.allocatedStudentsCount}</span>
                <span className="text-xs text-indigo-600">placed</span>
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 border ${
              plan.unallocatedStudentsCount > 0 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Unallocated</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-2xl font-black font-mono ${plan.unallocatedStudentsCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {plan.unallocatedStudentsCount}
                </span>
                <span className="text-xs opacity-75">remaining</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Available Hall Seats</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 font-mono">{plan.totalAvailableSeats}</span>
                <span className="text-xs text-slate-500">capacity</span>
              </div>
            </div>
          </div>
        )}

        {/* View Selection Tabs */}
        <div className="flex border-b border-slate-200 px-6 mt-4 gap-6 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Seating Allocation Preview</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">
              {plan?.allocations.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unallocated')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'unallocated'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5" />
              <span>Unallocated Candidates</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              (plan?.unallocatedStudentsCount || 0) > 0 
                ? 'bg-rose-100 text-rose-800 font-bold' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {plan?.unallocatedStudentsCount || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'rooms'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Hall Capacity Distribution</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {plan?.roomsSummary.length || 0} halls
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Running collision-free seating optimizer...</p>
              <p className="text-xs text-slate-400">Balancing hall capacities and interleaving departments</p>
            </div>
          ) : !plan ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No allocation preview generated yet.
            </div>
          ) : activeTab === 'preview' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Previewing proposed seat placements. Click <strong>Confirm Allocation</strong> to commit changes to Firestore.</span>
                </span>
                <span className="font-mono text-slate-600">
                  {plan.allocations.length} seats mapped
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Candidate Name</th>
                      <th className="px-4 py-3">Department / Group</th>
                      <th className="px-4 py-3">Assigned Hall</th>
                      <th className="px-4 py-3 text-center">Seat No</th>
                      <th className="px-4 py-3 text-right">Alternating Seq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {plan.allocations.map((alloc, idx) => (
                      <tr key={alloc.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700">{alloc.student_reg_no}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{alloc.student_name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {alloc.course_code || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <div className="font-semibold">{alloc.room_number}</div>
                          <div className="text-[10px] text-slate-400">{alloc.building}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block font-mono font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded-lg">
                            {alloc.seat_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                          {idx % 2 === 0 ? 'Col-A / Even' : 'Col-B / Odd'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'unallocated' ? (
            <div className="space-y-4">
              {plan.unallocatedStudents.length === 0 ? (
                <div className="py-16 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200 p-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-950 text-sm">100% Candidates Successfully Allocated</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Every eligible candidate has been assigned a unique, collision-free seat within active halls. Zero candidates left unplaced.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-rose-700">
                      {plan.unallocatedStudents.length} candidate(s) could not be accommodated:
                    </span>
                    <span className="text-slate-400">Action: Register or activate additional halls</span>
                  </div>

                  <div className="border border-rose-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rose-50/70 text-rose-700 font-semibold uppercase tracking-wider border-b border-rose-200">
                        <tr>
                          <th className="px-4 py-3">Roll No</th>
                          <th className="px-4 py-3">Candidate Name</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Section</th>
                          <th className="px-4 py-3">Unallocation Reason (Requirement 10)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 font-medium">
                        {plan.unallocatedStudents.map(({ student, reason }, idx) => (
                          <tr key={student.id || idx} className="hover:bg-rose-50/40">
                            <td className="px-4 py-3 font-mono font-bold text-rose-700">{student.reg_no}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{student.full_name}</td>
                            <td className="px-4 py-3 text-slate-700">{student.department}</td>
                            <td className="px-4 py-3 text-slate-600">{student.section}</td>
                            <td className="px-4 py-3 text-rose-800 font-medium">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100/80 border border-rose-200 text-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                {reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.roomsSummary.map((r) => {
                  const percent = r.capacity > 0 ? Math.round((r.allocatedCount / r.capacity) * 100) : 0;
                  const isFull = r.allocatedCount >= r.capacity;

                  return (
                    <div key={r.roomId} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{r.roomNumber}</h4>
                          <span className="text-xs text-slate-500">{r.building}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isFull 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {isFull ? '100% Full' : `${r.remainingSeats} Seats Available`}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Utilization:</span>
                          <span className="font-bold text-slate-800 font-mono">{r.allocatedCount} / {r.capacity} seats ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Requirement 9: Confirm or Cancel) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={isCommitting}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel & Discard Preview
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Commits seating matrix to Cloud Firestore
            </span>
            <button
              onClick={onConfirm}
              disabled={isCommitting || !plan || plan.allocations.length === 0}
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCommitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Committing Allocations to Firestore...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Apply Allocation ({plan?.allocations.length || 0} Seats)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
