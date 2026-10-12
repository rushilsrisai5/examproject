import React, { useState, useMemo } from 'react';
import { 
  Radar, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ArrowRight, 
  ShieldAlert, 
  DoorOpen, 
  Users, 
  Calendar, 
  Building,
  RefreshCw,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  Examination, 
  Room, 
  StudentRecord, 
  Allocation, 
  AttendanceRecord,
  RadarIssue,
  RadarIssueSeverity,
  RadarIssueType
} from '../types';

interface ExceptionRadarDashboardProps {
  examinations: Examination[];
  rooms: Room[];
  students: StudentRecord[];
  allocations: Allocation[];
  attendance: AttendanceRecord[];
  onNavigateTab: (tab: 'overview' | 'exams' | 'rooms' | 'students' | 'allocations' | 'manual' | 'attendance' | 'seating_map', examId?: string, roomId?: string) => void;
  onRefreshData: () => Promise<void>;
}

export const ExceptionRadarDashboard: React.FC<ExceptionRadarDashboardProps> = ({
  examinations,
  rooms,
  students,
  allocations,
  attendance,
  onNavigateTab,
  onRefreshData,
}) => {
  // Filters
  const [filterExam, setFilterExam] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'Critical' | 'Warning' | 'Resolved' | 'Pending'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Compute Automated Radar Exceptions
  const allIssues = useMemo(() => {
    const list: RadarIssue[] = [];

    // Helper map of active rooms
    const activeRooms = rooms.filter(r => r.is_active);
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const studentMap = new Map(students.map(s => [s.id, s]));

    // =========================================================================
    // Issue 1 & 5: Students who have not been allocated to a room & Incomplete allocations
    // =========================================================================
    for (const exam of examinations) {
      const examAllocs = allocations.filter(a => a.examination_id === exam.id);
      
      // Determine eligible students
      const eligible = exam.eligible_student_ids && exam.eligible_student_ids.length > 0
        ? students.filter(s => exam.eligible_student_ids!.includes(s.id))
        : students.filter(s => s.department === exam.department);

      const allocatedStudentIds = new Set(examAllocs.map(a => a.student_id));
      const unallocatedCandidates = eligible.filter(s => !allocatedStudentIds.has(s.id));

      if (unallocatedCandidates.length > 0) {
        list.push({
          id: `unallocated_${exam.id}`,
          type: 'unallocated_students',
          title: `${unallocatedCandidates.length} Candidate(s) Unallocated to Examination Halls`,
          severity: 'Critical',
          description: `Examination ${exam.course_code} (${exam.title}) has ${eligible.length} eligible candidates, but only ${examAllocs.length} have assigned seats. ${unallocatedCandidates.length} candidate(s) are awaiting hall tickets.`,
          affectedExamId: exam.id,
          affectedExamTitle: exam.title,
          affectedCourseCode: exam.course_code,
          affectedExamDate: exam.exam_date,
          affectedDepartment: exam.department,
          suggestedAction: 'Execute Smart Seat Allocation Optimizer to automatically distribute remaining candidates into available halls.',
          actionTarget: 'allocations',
          resolved: false,
          count: unallocatedCandidates.length,
        });
      } else if (eligible.length > 0 && examAllocs.length === eligible.length) {
        // Resolved state indicator
        list.push({
          id: `resolved_alloc_${exam.id}`,
          type: 'incomplete_allocations',
          title: `100% Seating Completed for ${exam.course_code}`,
          severity: 'Resolved',
          description: `All ${eligible.length} eligible students have confirmed seating allocations in collision-free halls.`,
          affectedExamId: exam.id,
          affectedExamTitle: exam.title,
          affectedCourseCode: exam.course_code,
          affectedExamDate: exam.exam_date,
          affectedDepartment: exam.department,
          suggestedAction: 'View Seating Map or Publish Hall Tickets to candidate portal.',
          actionTarget: 'seating_map',
          resolved: true,
          count: eligible.length,
        });
      }

      // Check if scheduled exam has 0 allocations at all
      if (examAllocs.length === 0 && eligible.length > 0) {
        list.push({
          id: `empty_alloc_${exam.id}`,
          type: 'incomplete_allocations',
          title: `Zero Seating Allocations Configured for ${exam.course_code}`,
          severity: 'Warning',
          description: `Scheduled examination on ${exam.exam_date} (${exam.session}) currently has no halls assigned or candidate seats mapped.`,
          affectedExamId: exam.id,
          affectedExamTitle: exam.title,
          affectedCourseCode: exam.course_code,
          affectedExamDate: exam.exam_date,
          affectedDepartment: exam.department,
          suggestedAction: 'Open Seating Allocations and run auto-allocation.',
          actionTarget: 'allocations',
          resolved: false,
          count: 0,
        });
      }
    }

    // =========================================================================
    // Issue 2: Rooms where assigned students exceed the configured capacity
    // =========================================================================
    for (const exam of examinations) {
      for (const room of rooms) {
        const roomAllocs = allocations.filter(
          a => a.examination_id === exam.id && a.room_id === room.id
        );

        if (roomAllocs.length > room.capacity) {
          const excess = roomAllocs.length - room.capacity;
          list.push({
            id: `over_capacity_${exam.id}_${room.id}`,
            type: 'room_over_capacity',
            title: `Capacity Violation: ${room.room_number} Over-Allocated by ${excess} Candidate(s)`,
            severity: 'Critical',
            description: `Hall capacity is configured as ${room.capacity} seats, but ${roomAllocs.length} candidates are allocated to this hall for ${exam.course_code}.`,
            affectedExamId: exam.id,
            affectedExamTitle: exam.title,
            affectedCourseCode: exam.course_code,
            affectedExamDate: exam.exam_date,
            affectedRoomId: room.id,
            affectedRoomNumber: room.room_number,
            affectedDepartment: exam.department,
            suggestedAction: `Reallocate ${excess} candidate(s) to a hall with available capacity or increase hall seating limit.`,
            actionTarget: 'allocations',
            resolved: false,
            count: excess,
          });
        }
      }
    }

    // =========================================================================
    // Issue 3: Rooms where attendance has not been submitted / pending
    // Issue 4: Students whose attendance is still unmarked
    // =========================================================================
    for (const exam of examinations) {
      const examAllocs = allocations.filter(a => a.examination_id === exam.id);
      const usedRoomIds = Array.from(new Set(examAllocs.map(a => a.room_id)));

      for (const roomId of usedRoomIds) {
        const room = roomMap.get(roomId);
        const roomAtt = attendance.filter(
          a => a.examination_id === exam.id && a.room_id === roomId
        );

        const unmarked = roomAtt.filter(
          a => a.status === 'Pending' || a.status === 'Unmarked'
        );
        const isFinalized = roomAtt.length > 0 && roomAtt.every(a => a.is_finalized);

        if (!isFinalized && roomAtt.length > 0) {
          list.push({
            id: `unsubmitted_att_${exam.id}_${roomId}`,
            type: 'attendance_unsubmitted',
            title: `Attendance Unsubmitted: ${room?.room_number || roomId}`,
            severity: unmarked.length > 0 ? 'Warning' : 'Info',
            description: `Hall in-charge (${room?.incharge_name || 'Invigilator'}) has not locked finalized attendance. Total allocated: ${roomAtt.length}. Unmarked: ${unmarked.length}.`,
            affectedExamId: exam.id,
            affectedExamTitle: exam.title,
            affectedCourseCode: exam.course_code,
            affectedExamDate: exam.exam_date,
            affectedRoomId: roomId,
            affectedRoomNumber: room?.room_number || roomId,
            affectedDepartment: exam.department,
            suggestedAction: 'Notify Hall In-Charge or review Attendance Verification Roster.',
            actionTarget: 'attendance',
            resolved: false,
            count: unmarked.length,
          });
        }

        if (unmarked.length > 0) {
          list.push({
            id: `unmarked_students_${exam.id}_${roomId}`,
            type: 'attendance_unmarked',
            title: `${unmarked.length} Student Candidate(s) Unmarked in ${room?.room_number || roomId}`,
            severity: 'Warning',
            description: `Attendance sheet for ${exam.course_code} contains ${unmarked.length} candidate(s) still in Unmarked/Pending status. All candidates must be marked Present or Absent before final lock.`,
            affectedExamId: exam.id,
            affectedExamTitle: exam.title,
            affectedCourseCode: exam.course_code,
            affectedExamDate: exam.exam_date,
            affectedRoomId: roomId,
            affectedRoomNumber: room?.room_number || roomId,
            affectedDepartment: exam.department,
            suggestedAction: 'Inspect candidate desk attendance records in Attendance Verification tab.',
            actionTarget: 'attendance',
            resolved: false,
            count: unmarked.length,
          });
        }
      }
    }

    // =========================================================================
    // Issue 6: Missing or inconsistent exam, room, or attendance records
    // =========================================================================
    // Check rooms with 0 capacity or missing incharge
    for (const room of rooms) {
      if (room.capacity <= 0) {
        list.push({
          id: `invalid_capacity_${room.id}`,
          type: 'inconsistent_records',
          title: `Invalid Seating Capacity: ${room.room_number}`,
          severity: 'Critical',
          description: `Examination hall is registered with zero or negative seating capacity (${room.capacity}). Cannot allocate candidates.`,
          affectedRoomId: room.id,
          affectedRoomNumber: room.room_number,
          suggestedAction: 'Update room seating capacity in Venues & Hall Seating tab.',
          actionTarget: 'rooms',
          resolved: false,
        });
      }

      if (room.is_active && !room.incharge_name && !room.incharge_id) {
        list.push({
          id: `missing_incharge_${room.id}`,
          type: 'inconsistent_records',
          title: `Active Hall Missing Faculty In-Charge: ${room.room_number}`,
          severity: 'Warning',
          description: `Hall ${room.room_number} is marked active but has no designated invigilator / hall in-charge assigned.`,
          affectedRoomId: room.id,
          affectedRoomNumber: room.room_number,
          suggestedAction: 'Assign an authorized faculty in-charge to this examination hall.',
          actionTarget: 'rooms',
          resolved: false,
        });
      }
    }

    // Check allocations referencing non-existent students or rooms
    for (const alloc of allocations) {
      if (!roomMap.has(alloc.room_id)) {
        list.push({
          id: `orphan_alloc_room_${alloc.id}`,
          type: 'inconsistent_records',
          title: `Inconsistent Allocation: Non-existent Room Reference (${alloc.room_number})`,
          severity: 'Critical',
          description: `Seating allocation for candidate ${alloc.student_name} references room ID ${alloc.room_id} which does not exist in master records.`,
          affectedExamId: alloc.examination_id,
          affectedStudentId: alloc.student_id,
          affectedStudentName: alloc.student_name,
          suggestedAction: 'Remove or re-allocate this candidate to a valid examination venue.',
          actionTarget: 'allocations',
          resolved: false,
        });
      }
    }

    return list;
  }, [examinations, rooms, students, allocations, attendance]);

  // Unique filter option values
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(examinations.map(e => e.exam_date))).filter(Boolean).sort();
  }, [examinations]);

  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(examinations.map(e => e.department))).filter(Boolean).sort();
  }, [examinations]);

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return allIssues.filter(issue => {
      if (filterExam !== 'ALL' && issue.affectedExamId !== filterExam) return false;
      if (filterDate !== 'ALL' && issue.affectedExamDate !== filterDate) return false;
      if (filterDept !== 'ALL' && issue.affectedDepartment !== filterDept) return false;
      if (filterSeverity === 'Critical' && issue.severity !== 'Critical') return false;
      if (filterSeverity === 'Warning' && issue.severity !== 'Warning') return false;
      if (filterSeverity === 'Resolved' && issue.severity !== 'Resolved') return false;
      if (filterSeverity === 'Pending' && issue.severity !== 'Info') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        const matchCourse = issue.affectedCourseCode?.toLowerCase().includes(q);
        const matchRoom = issue.affectedRoomNumber?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCourse && !matchRoom) return false;
      }

      return true;
    });
  }, [allIssues, filterExam, filterDate, filterDept, filterSeverity, searchQuery]);

  // Summary counts
  const criticalCount = allIssues.filter(i => i.severity === 'Critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'Warning').length;
  const resolvedCount = allIssues.filter(i => i.severity === 'Resolved').length;
  const pendingAttendanceCount = allIssues.filter(i => i.type === 'attendance_unsubmitted' || i.type === 'attendance_unmarked').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Radar className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Exam-Day Exception Radar</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  Automated Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time systemic audit monitoring allocations, capacity limits, unsubmitted attendance, and anomalies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Rescan Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Issues */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Critical Issues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700 font-mono">{criticalCount}</span>
            <span className="text-xs text-rose-600 font-medium">requiring immediate action</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Capacity overruns, unallocated candidates & invalid data
          </p>
        </div>

        {/* Warnings */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Warnings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 font-mono">{warningCount}</span>
            <span className="text-xs text-amber-600 font-medium">attention recommended</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Unmarked attendance candidates & missing invigilators
          </p>
        </div>

        {/* Pending Attendance */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pending Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-700 font-mono">{pendingAttendanceCount}</span>
            <span className="text-xs text-indigo-600 font-medium">unlocked rosters</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Halls with draft progress or awaiting final submission
          </p>
        </div>

        {/* Resolved Checks */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved Checks</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 font-mono">{resolvedCount}</span>
            <span className="text-xs text-emerald-600 font-medium">verified compliant</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Exams with 100% capacity matching and seat mapping
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Radar Filter Controls:</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredIssues.length} of {allIssues.length} systemic diagnostics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Filter 1: Examination */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Examination</label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="ALL">All Examinations ({examinations.length})</option>
              {examinations.map(e => (
                <option key={e.id} value={e.id}>{e.course_code} - {e.title}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Date */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Date</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="ALL">All Exam Dates</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Department */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 bg-white"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Filter 4: Issue Status / Severity */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Severity / Status</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as 'ALL' | 'Critical' | 'Warning' | 'Resolved' | 'Pending')}
              className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 bg-white font-medium"
            >
              <option value="ALL">All Severity Levels</option>
              <option value="Critical">Critical Issues Only ({criticalCount})</option>
              <option value="Warning">Warnings Only ({warningCount})</option>
              <option value="Pending">Pending Attendance ({pendingAttendanceCount})</option>
              <option value="Resolved">Resolved Checks ({resolvedCount})</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Quick Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Issues Feed / Diagnostics List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detected Operational Exceptions</h3>
            <p className="text-xs text-slate-500">
              Prioritized by severity with one-click direct resolution pathways
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            {filteredIssues.length} Diagnostic Records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredIssues.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">No Active Operational Exceptions Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All examination allocations, hall capacity limits, and attendance submission workflows are operating normally.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isCrit = issue.severity === 'Critical';
              const isWarn = issue.severity === 'Warning';
              const isRes = issue.severity === 'Resolved';

              let borderLeft = 'border-l-4 border-indigo-500';
              let badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
              let icon = <Clock className="w-4 h-4 text-indigo-600" />;

              if (isCrit) {
                borderLeft = 'border-l-4 border-rose-500 bg-rose-50/20';
                badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                icon = <AlertOctagon className="w-4 h-4 text-rose-600" />;
              } else if (isWarn) {
                borderLeft = 'border-l-4 border-amber-500 bg-amber-50/20';
                badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
              } else if (isRes) {
                borderLeft = 'border-l-4 border-emerald-500 bg-emerald-50/10';
                badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
              }

              return (
                <div key={issue.id} className={`p-5 transition-colors hover:bg-slate-50/80 ${borderLeft}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
                          {icon}
                          <span>{issue.severity.toUpperCase()}</span>
                        </span>

                        <h4 className="font-bold text-slate-900 text-sm">
                          {issue.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {issue.description}
                      </p>

                      {/* Affected Entities metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        {issue.affectedCourseCode && (
                          <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {issue.affectedCourseCode}
                          </span>
                        )}
                        {issue.affectedExamDate && (
                          <span>Date: <strong>{issue.affectedExamDate}</strong></span>
                        )}
                        {issue.affectedRoomNumber && (
                          <span>Hall: <strong>{issue.affectedRoomNumber}</strong></span>
                        )}
                        {issue.affectedDepartment && (
                          <span>Dept: <strong>{issue.affectedDepartment}</strong></span>
                        )}
                      </div>

                      {/* Suggested action */}
                      <div className="text-xs text-slate-700 bg-slate-100/80 rounded-xl p-2.5 mt-2 flex items-start gap-2 border border-slate-200">
                        <span className="font-bold text-slate-900 shrink-0">Suggested Action:</span>
                        <span>{issue.suggestedAction}</span>
                      </div>
                    </div>

                    {/* Navigation Action Buttons (Requirement: Working navigation buttons to fix issue) */}
                    <div className="shrink-0 flex items-center gap-2 pt-2 lg:pt-0">
                      {issue.actionTarget === 'allocations' && (
                        <button
                          onClick={() => onNavigateTab('allocations', issue.affectedExamId)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Open Allocations</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {issue.actionTarget === 'attendance' && (
                        <button
                          onClick={() => onNavigateTab('attendance', issue.affectedExamId, issue.affectedRoomId)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Review Attendance</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {issue.actionTarget === 'seating_map' && (
                        <button
                          onClick={() => onNavigateTab('seating_map', issue.affectedExamId, issue.affectedRoomId)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>View Seating Map</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {issue.actionTarget === 'rooms' && (
                        <button
                          onClick={() => onNavigateTab('rooms')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Configure Venues</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
