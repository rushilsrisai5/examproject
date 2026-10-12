import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Check, 
  Send,
  Building,
  UserCheck,
  AlertCircle,
  Printer,
  FileText,
  X,
  Save,
  Lock,
  Unlock,
  Download,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/db';
import { Examination, Room, Allocation, AttendanceRecord } from '../../types';
import { downloadCSV } from '../../utils/csvExport';
import { SeatingMapViewer } from '../SeatingMapViewer';
import { AttendancePrintModal } from '../AttendancePrintModal';
import { ManualAttendanceModal } from '../ManualAttendanceModal';
import { downloadAttendanceCSV, triggerPrintWithIframe } from '../../utils/attendanceExport';

export const InchargeDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [assignedRooms, setAssignedRooms] = useState<Room[]>([]);
  const [assignedExams, setAssignedExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomAllocations, setRoomAllocations] = useState<Allocation[]>([]);
  const [roomAttendance, setRoomAttendance] = useState<AttendanceRecord[]>([]);
  
  // Unsaved draft changes tracking: recordId -> { status, remarks }
  const [pendingChanges, setPendingChanges] = useState<Record<string, { status: 'Present' | 'Absent'; remarks?: string }>>({});
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isAbsenteeModalOpen, setIsAbsenteeModalOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isSeatingMapOpen, setIsSeatingMapOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  // Load in-charge's data from Firestore
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const allRooms = await DatabaseService.getRooms();
      // Filter rooms assigned to current user or fallback to first room for demo
      const userAssignedRooms = allRooms.filter(
        (r) => r.incharge_id === profile?.id || 
               (profile?.full_name && r.incharge_name?.toLowerCase().includes(profile.full_name.toLowerCase())) ||
               (profile?.email?.includes('incharge') && r.room_number.includes('101'))
      );

      const activeRooms = userAssignedRooms.length > 0 ? userAssignedRooms : allRooms;
      setAssignedRooms(activeRooms);

      const defaultRoom = activeRooms[0];
      setSelectedRoomId(defaultRoom?.id || '');

      const allExams = await DatabaseService.getExaminations();
      setAssignedExams(allExams);
      if (allExams.length > 0) {
        setSelectedExamId(allExams[0].id);
      }

      if (allExams.length > 0 && defaultRoom) {
        const allocs = await DatabaseService.getAllocations(allExams[0].id);
        const filteredAllocs = allocs.filter((a) => a.room_id === defaultRoom.id);
        setRoomAllocations(filteredAllocs);

        const att = await DatabaseService.getAttendance(allExams[0].id, defaultRoom.id);
        setRoomAttendance(att);
      }
    } catch (err) {
      console.error('Failed to load incharge data from Firestore:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load examination data from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  useEffect(() => {
    if (!selectedExamId || !selectedRoomId) return;
    const fetchSpecific = async () => {
      try {
        const allocs = await DatabaseService.getAllocations(selectedExamId);
        const filtered = allocs.filter((a) => a.room_id === selectedRoomId);
        setRoomAllocations(filtered);

        const att = await DatabaseService.getAttendance(selectedExamId, selectedRoomId);
        setRoomAttendance(att);
        setPendingChanges({});
      } catch (err) {
        console.error('Failed to refresh room data from Firestore:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to refresh room data from Firestore.');
      }
    };
    fetchSpecific();
  }, [selectedExamId, selectedRoomId]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setErrorMessage(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Effective status combining loaded record with unsaved local changes
  const getEffectiveStatus = (record: AttendanceRecord): 'Present' | 'Absent' | 'Pending' | 'Unmarked' => {
    if (pendingChanges[record.id]) {
      return pendingChanges[record.id].status;
    }
    return record.status;
  };

  // Calculated numbers
  const totalAllocated = roomAttendance.length;
  const presentCount = roomAttendance.filter((r) => getEffectiveStatus(r) === 'Present').length;
  const absentCount = roomAttendance.filter((r) => getEffectiveStatus(r) === 'Absent').length;
  const unmarkedCount = roomAttendance.filter((r) => {
    const st = getEffectiveStatus(r);
    return st === 'Pending' || st === 'Unmarked';
  }).length;
  
  const isFinalized = roomAttendance.length > 0 && roomAttendance.every((r) => r.is_finalized);
  const unsavedCount = Object.keys(pendingChanges).length;

  const absenteeList = roomAttendance.filter((r) => getEffectiveStatus(r) === 'Absent');

  // Mark student Present or Absent locally
  const handleMarkStatus = (recordId: string, newStatus: 'Present' | 'Absent') => {
    if (isFinalized) return;
    setPendingChanges((prev) => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        status: newStatus,
      },
    }));
  };

  // Save draft progress to Firestore
  const handleSaveDraft = async () => {
    if (unsavedCount === 0) {
      showNotice('Attendance is already up to date with Firestore.');
      return;
    }

    setIsSavingDraft(true);
    try {
      const updates = Object.entries(pendingChanges).map(([id, change]) => ({
        id,
        status: change.status,
        remarks: change.remarks,
        verified_by: profile?.id || 'usr-incharge-01',
        verified_by_name: profile?.full_name || 'Invigilator',
      }));

      await DatabaseService.saveAttendanceDraft(updates, selectedExamId, selectedRoomId);
      
      const refreshed = await DatabaseService.getAttendance(selectedExamId, selectedRoomId);
      setRoomAttendance(refreshed);
      setPendingChanges({});
      showNotice(`Successfully saved draft progress for ${updates.length} candidate(s) to Cloud Firestore.`);
    } catch (err) {
      console.error('Error saving draft attendance:', err);
      showError('Failed to save draft progress to Firestore.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Open final submission confirmation
  const handleInitiateFinalSubmit = () => {
    if (unmarkedCount > 0) {
      showError(`Validation Error: ${unmarkedCount} candidate(s) still Unmarked in this hall. Every allocated student must be accounted for as Present or Absent before final submission.`);
      return;
    }
    setIsConfirmSubmitOpen(true);
  };

  // Confirm final submission
  const handleConfirmFinalSubmit = async () => {
    setIsConfirmSubmitOpen(false);
    setIsSubmitting(true);
    try {
      // First save any unsaved local marks
      if (unsavedCount > 0) {
        const updates = Object.entries(pendingChanges).map(([id, change]) => ({
          id,
          status: change.status,
          remarks: change.remarks,
          verified_by: profile?.id || 'usr-incharge-01',
          verified_by_name: profile?.full_name || 'Invigilator',
        }));
        await DatabaseService.saveAttendanceDraft(updates, selectedExamId, selectedRoomId);
      }

      await DatabaseService.finalizeRoomAttendance(
        selectedExamId,
        selectedRoomId,
        profile?.id || 'usr-incharge-01',
        profile?.full_name || 'Invigilator'
      );

      const refreshed = await DatabaseService.getAttendance(selectedExamId, selectedRoomId);
      setRoomAttendance(refreshed);
      setPendingChanges({});
      showNotice('Official attendance sheet locked and submitted to Examination Section in Cloud Firestore.');
    } catch (err: any) {
      console.error('Failed to finalize attendance:', err);
      showError(err.message || 'Error finalizing attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Audited unlock sheet for corrections
  const handleUnlockSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) {
      showError('A documented reason is mandatory to reopen a finalized attendance sheet.');
      return;
    }

    try {
      await DatabaseService.unlockRoomAttendance(
        selectedExamId,
        selectedRoomId,
        profile?.id || 'usr-incharge-01',
        profile?.full_name || 'Invigilator',
        unlockReason.trim()
      );
      setIsUnlockModalOpen(false);
      setUnlockReason('');
      
      const refreshed = await DatabaseService.getAttendance(selectedExamId, selectedRoomId);
      setRoomAttendance(refreshed);
      showNotice('Attendance sheet reopened for audited corrections.');
    } catch (err) {
      console.error('Error reopening attendance sheet:', err);
      showError('Failed to reopen attendance sheet.');
    }
  };

  // Export Room Absentee Statement as CSV
  const handleExportAbsenteeCSV = () => {
    const selectedRoom = assignedRooms.find((r) => r.id === selectedRoomId);
    const selectedExam = assignedExams.find((e) => e.id === selectedExamId);

    const headers = [
      'Serial No',
      'Roll / Reg Number',
      'Candidate Name',
      'Department',
      'Section',
      'Course Code',
      'Examination Title',
      'Exam Date',
      'Session',
      'Room Number',
      'Seat Number',
      'Hall In-Charge',
      'Status',
      'Remarks',
    ];

    const rows = absenteeList.map((rec, idx) => [
      String(idx + 1),
      rec.student_reg_no,
      rec.student_name,
      rec.department || 'Computer Science & Engineering',
      rec.section || 'Sec-A',
      selectedExam?.course_code || '',
      selectedExam?.title || '',
      selectedExam?.exam_date || '',
      selectedExam?.session || '',
      selectedRoom?.room_number || '',
      rec.seat_number,
      selectedRoom?.incharge_name || profile?.full_name || '',
      'Absent',
      rec.remarks || 'Unreported Absence',
    ]);

    downloadCSV(
      `Absentee_Statement_${selectedRoom?.room_number.replace(/\s+/g, '_')}_${selectedExam?.course_code || 'Exam'}`,
      [headers, ...rows]
    );
    showNotice('Absentee statement exported to CSV successfully.');
  };

  const selectedRoom = assignedRooms.find((r) => r.id === selectedRoomId);
  const selectedExam = assignedExams.find((e) => e.id === selectedExamId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {notice && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 text-center sticky top-16 z-30 flex items-center justify-center gap-2 shadow-md no-print">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-600 text-white text-xs font-semibold py-2.5 px-4 text-center sticky top-16 z-30 flex items-center justify-center gap-2 shadow-md no-print">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 no-print">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Module 4 · Invigilation & Hall In-Charge Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Examination Attendance Recording Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome, <strong className="text-slate-800">{profile?.full_name || 'Invigilator'}</strong>. Manage candidate attendance, save progress, and submit finalized rosters to Cloud Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
              title="Manual Attendance Entry & Candidate Search"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>

            <button
              onClick={() => setIsSeatingMapOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
              title="View visual examination room seating map"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>View Seating Map</span>
            </button>

            <button
              onClick={() => setIsAbsenteeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Absentee Statement ({absentCount})</span>
            </button>

            {/* Room Selector */}
            {assignedRooms.length > 1 && (
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Hall:
                </span>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {assignedRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Exam Selector */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Exam:
              </span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {assignedExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.course_code} - {exam.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 In-Charge Metrics Cards with Module 4 calculations: Total = Present + Absent + Unmarked */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-6 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Assigned Hall</span>
              <DoorOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-2 truncate">
              {selectedRoom?.room_number.split('-')[0] || 'Hall 101'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {selectedRoom?.building || 'SEC Complex'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Total Allocated</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-2">{totalAllocated}</div>
            <div className="text-[11px] text-slate-500 mt-1">Capacity: {selectedRoom?.capacity || 0} seats</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Present Candidates</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">{presentCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {totalAllocated > 0 ? `${Math.round((presentCount / totalAllocated) * 100)}% attendance` : '0%'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Absent Candidates</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-2">{absentCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Confirmed absentees</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Unmarked Candidates</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className={`text-2xl font-black mt-2 ${unmarkedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {unmarkedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {unmarkedCount === 0 ? 'All accounted for' : 'Must mark before submit'}
            </div>
          </div>
        </div>

        {/* Assigned Room Detail & Attendance Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                  Assigned Hall
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedRoom?.room_number} ({selectedRoom?.building})
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isFinalized 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}>
                  {isFinalized ? 'Finalized & Locked in Cloud' : 'Draft In Progress'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Paper: <strong className="text-slate-800">{selectedExam?.title}</strong> ({selectedExam?.course_code}) · {selectedExam?.session} · Date: {selectedExam?.exam_date}
              </p>
            </div>

            {/* Action Buttons: Manual Entry, Save Draft, Print Sheet, Download Attendance, Submit Final, Unlock */}
            <div className="flex flex-wrap items-center gap-2.5 no-print">
              <button
                type="button"
                onClick={() => setIsManualEntryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                title="Search candidate and mark or correct attendance"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 font-semibold text-xs shadow-sm cursor-pointer transition-colors"
                title="Open Printable Attendance Sheet or Print to PDF"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Print Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => downloadAttendanceCSV(selectedExam, selectedRoom, roomAttendance, profile?.full_name, isFinalized)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 font-semibold text-xs shadow-sm cursor-pointer transition-colors"
                title="Download room attendance roster as Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Attendance</span>
              </button>

              {/* Save Draft Button */}
              {!isFinalized && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || unsavedCount === 0}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer ${
                    unsavedCount > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title={unsavedCount > 0 ? `${unsavedCount} unsaved mark(s)` : 'No unsaved changes'}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {isSavingDraft 
                      ? 'Saving Draft...' 
                      : unsavedCount > 0 
                      ? `Save Draft (${unsavedCount})` 
                      : 'Draft Saved'}
                  </span>
                </button>
              )}

              {/* Finalized badge or Submit Final button */}
              {isFinalized ? (
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Locked & Submitted</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs font-semibold cursor-pointer"
                    title="Request audited correction or unlock"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen for Revision</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleInitiateFinalSubmit}
                  disabled={isSubmitting || roomAllocations.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Final Attendance</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Attendance Table */}
          {roomAttendance.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No candidates allocated to this room yet for this examination.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">S.No</th>
                    <th className="px-4 py-3.5 w-24">Seat No.</th>
                    <th className="px-5 py-3.5">Registration Number</th>
                    <th className="px-5 py-3.5">Candidate Name</th>
                    <th className="px-4 py-3.5">Dept & Sec</th>
                    <th className="px-5 py-3.5 text-center">Mark Attendance</th>
                    <th className="px-5 py-3.5">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomAttendance.map((record, idx) => {
                    const status = getEffectiveStatus(record);
                    const isDirty = !!pendingChanges[record.id];

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 text-center font-mono text-slate-500 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          {record.seat_number}
                        </td>
                        <td className="px-5 py-4 font-mono font-medium text-slate-700">
                          {record.student_reg_no}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {record.student_name}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {record.department ? `${record.department.split(' ')[0]} · ${record.section || 'Sec-A'}` : 'CSE · Sec-A'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleMarkStatus(record.id, 'Present')}
                              disabled={isFinalized}
                              className={`px-3 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                                status === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                              } disabled:cursor-not-allowed`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkStatus(record.id, 'Absent')}
                              disabled={isFinalized}
                              className={`px-3 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                                status === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                              } disabled:cursor-not-allowed`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md ${
                              status === 'Present'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : status === 'Absent'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {status === 'Absent' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              {(status === 'Pending' || status === 'Unmarked') && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              <span>{status === 'Pending' ? 'Unmarked' : status}</span>
                            </span>
                            {isDirty && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                Unsaved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Final Submission Confirmation (Module 4-4) */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Final Attendance Submission
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              You are about to lock and finalize candidate attendance for hall <strong>{selectedRoom?.room_number}</strong> for examination <strong>{selectedExam?.course_code}</strong>.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Seated Candidates:</span>
                <span className="font-bold text-slate-900">{totalAllocated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-semibold">Marked Present:</span>
                <span className="font-bold text-emerald-700">{presentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700 font-semibold">Marked Absent:</span>
                <span className="font-bold text-rose-700">{absentCount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Unmarked Candidates:</span>
                <span className="font-bold text-emerald-700">0 (All Accounted For)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
              Note: Once finalized, records are submitted to the Central Examination Section in Cloud Firestore. Re-opening will require an audited justification.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Finalizing...' : 'Yes, Lock & Submit Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audited Unlock / Correction (Module 4-4) */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Reopen Attendance Sheet</h3>
              </div>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUnlockSheet} className="space-y-4 text-xs">
              <p className="text-slate-600">
                This sheet was previously finalized. Please provide a mandatory audited explanation for unlocking it.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Justification / Reason for Revision *
                </label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="e.g. Candidate 2026-CS-028 reported late with Chief Superintendent slip."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
                >
                  Unlock with Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Absentee Statement (Module 5) */}
      {isAbsenteeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Hall Absentee Statement</h3>
                <p className="text-xs text-slate-500">
                  Hall: {selectedRoom?.room_number} | {selectedExam?.course_code} - {selectedExam?.title}
                </p>
              </div>
              <button
                onClick={() => setIsAbsenteeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {absenteeList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No absentees recorded for this hall. All candidates are accounted for as present or pending.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span>Total Absentees in Hall: {absenteeList.length} candidate(s)</span>
                  <span className="text-[11px] text-slate-500">
                    {totalAllocated > 0 ? `${Math.round((absenteeList.length / totalAllocated) * 100)}% absent` : ''}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {absenteeList.map((a) => (
                    <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{a.student_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">Roll: {a.student_reg_no}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          Seat {a.seat_number}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 italic">
                          {a.remarks || 'Unreported'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              {absenteeList.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportAbsenteeCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => triggerPrintWithIframe(selectedExam, selectedRoom, absenteeList, profile?.full_name, isFinalized)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
              <button
                onClick={() => setIsAbsenteeModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Seating Map Modal */}
      {isSeatingMapOpen && (
        <SeatingMapViewer
          rooms={assignedRooms}
          examinations={assignedExams}
          allocations={roomAllocations}
          attendance={roomAttendance}
          initialRoomId={selectedRoomId}
          initialExamId={selectedExamId}
          onClose={() => setIsSeatingMapOpen(false)}
          isModal={true}
        />
      )}

      {/* Official Printable Attendance Sheet Modal */}
      <AttendancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        exam={selectedExam}
        room={selectedRoom}
        attendance={roomAttendance}
        inchargeName={profile?.full_name}
        isFinalized={isFinalized}
      />

      {/* Manual Attendance Entry & Correction Modal */}
      <ManualAttendanceModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onAttendanceUpdated={loadData}
        exams={assignedExams}
        rooms={assignedRooms}
        currentExamId={selectedExamId}
        currentRoomId={selectedRoomId}
        userRole={profile?.role || 'incharge'}
        currentUser={{
          id: profile?.id || 'usr-incharge-01',
          name: profile?.full_name || 'Hall In-Charge'
        }}
        isFinalized={isFinalized}
      />
    </div>
  );
};
