import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Save, 
  RotateCcw, 
  DoorOpen, 
  Calendar, 
  UserCheck, 
  Loader2, 
  Edit3, 
  ShieldCheck,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { 
  Examination, 
  Room, 
  StudentRecord, 
  Allocation, 
  AttendanceRecord,
  UserRole 
} from '../types';
import { DatabaseService } from '../services/db';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceUpdated: () => void;
  exams: Examination[];
  rooms: Room[];
  currentExamId: string;
  currentRoomId: string;
  userRole?: UserRole;
  currentUser?: { id: string; name: string };
  isFinalized?: boolean;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onAttendanceUpdated,
  exams,
  rooms,
  currentExamId,
  currentRoomId,
  userRole = 'incharge',
  currentUser = { id: 'usr-incharge-01', name: 'Hall In-Charge' },
  isFinalized = false,
}) => {
  // Selected Exam & Hall
  const [selectedExamId, setSelectedExamId] = useState<string>(currentExamId);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoomId);

  // Student Search
  const [searchQuery, setSearchQuery] = useState('');
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Allocations & Attendance State for current Exam & Room
  const [currentAllocations, setCurrentAllocations] = useState<Allocation[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord[]>([]);

  // Attendance Form Fields
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent'>('Present');
  const [remarks, setRemarks] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Module 3: Allocate Unallocated Student Dialog State
  const [isAllocatingModalOpen, setIsAllocatingModalOpen] = useState(false);
  const [customSeatNumber, setCustomSeatNumber] = useState('');
  const [isAllocatingStudent, setIsAllocatingStudent] = useState(false);

  // Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync exam and room when props change
  useEffect(() => {
    if (currentExamId) setSelectedExamId(currentExamId);
    if (currentRoomId) setSelectedRoomId(currentRoomId);
  }, [currentExamId, currentRoomId]);

  // Load students, allocations, and attendance records on open
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, selectedExamId, selectedRoomId]);

  const loadInitialData = async () => {
    try {
      const students = await DatabaseService.getStudents();
      setAllStudents(students);

      if (selectedExamId) {
        const allocs = await DatabaseService.getAllocations(selectedExamId);
        setCurrentAllocations(allocs);

        if (selectedRoomId) {
          const att = await DatabaseService.getAttendance(selectedExamId, selectedRoomId);
          setCurrentAttendance(att);
        }
      }
    } catch (err) {
      console.error('Error loading data for manual attendance modal:', err);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Filter students based on query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter(
      (s) =>
        s.reg_no.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [searchQuery, allStudents]);

  // Check if currently selected student is allocated to this exam and room
  const studentAllocation = useMemo(() => {
    if (!selectedStudent || !selectedExamId) return null;
    return currentAllocations.find(
      (a) => a.student_id === selectedStudent.id && a.room_id === selectedRoomId
    );
  }, [selectedStudent, selectedExamId, selectedRoomId, currentAllocations]);

  // Check if student is allocated to a DIFFERENT room in the same exam
  const studentOtherRoomAllocation = useMemo(() => {
    if (!selectedStudent || !selectedExamId) return null;
    return currentAllocations.find(
      (a) => a.student_id === selectedStudent.id && a.room_id !== selectedRoomId
    );
  }, [selectedStudent, selectedExamId, selectedRoomId, currentAllocations]);

  // Existing attendance record if already marked
  const existingRecord = useMemo(() => {
    if (!selectedStudent) return null;
    return currentAttendance.find((att) => att.student_id === selectedStudent.id);
  }, [selectedStudent, currentAttendance]);

  // When a student is selected, pre-populate if existing record exists
  const handleSelectStudent = (student: StudentRecord) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.full_name} (${student.reg_no})`);
    setErrorMessage(null);
    setSuccessMessage(null);

    const existing = currentAttendance.find((att) => att.student_id === student.id);
    if (existing && existing.status !== 'Pending' && existing.status !== 'Unmarked') {
      setAttendanceStatus(existing.status === 'Absent' ? 'Absent' : 'Present');
      setRemarks(existing.remarks || '');
      setIsEditingExisting(true);
    } else {
      setAttendanceStatus('Present');
      setRemarks('');
      setIsEditingExisting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setAttendanceStatus('Present');
    setRemarks('');
    setCorrectionReason('');
    setIsEditingExisting(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Record or Update Attendance (MODULE 2 & 4)
  const handleSaveAttendance = async (isDraft: boolean = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedStudent) {
      setErrorMessage('Please search and select a student candidate.');
      return;
    }
    if (!selectedExamId) {
      setErrorMessage('Please select an examination.');
      return;
    }
    if (!selectedRoomId) {
      setErrorMessage('Please select an examination hall.');
      return;
    }

    // MODULE 3 REQUIREMENT: If student is unallocated, do not silently add to attendance!
    if (!studentAllocation) {
      setErrorMessage(
        `Student ${selectedStudent.full_name} (${selectedStudent.reg_no}) is NOT allocated to ${selectedRoom?.room_number || 'this hall'} for ${selectedExam?.course_code || 'this exam'}. You must allocate the student first.`
      );
      return;
    }

    if (isFinalized && !correctionReason.trim()) {
      setErrorMessage('This attendance sheet is finalized & locked. You must provide a formal audit reason to correct this record.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await DatabaseService.recordAttendanceManual({
        examinationId: selectedExamId,
        roomId: selectedRoomId,
        studentId: selectedStudent.id,
        status: attendanceStatus,
        remarks: remarks.trim() || undefined,
        verifiedBy: currentUser.id,
        verifiedByName: currentUser.name,
        isCorrection: isEditingExisting,
        correctionReason: correctionReason.trim() || undefined,
      });

      const actionText = res.isCorrection ? 'corrected' : isDraft ? 'saved as draft' : 'recorded';
      setSuccessMessage(
        `Attendance ${actionText} for ${selectedStudent.full_name} (${selectedStudent.reg_no}): Marked ${attendanceStatus} in Seat ${studentAllocation.seat_number}.`
      );

      // Refresh parent dashboard counts and lists
      onAttendanceUpdated();
      await loadInitialData();

      // Clear or close after 1.5 seconds
      setTimeout(() => {
        handleResetForm();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error recording manual attendance:', err);
      setErrorMessage(err.message || 'Failed to record attendance in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Module 3: Authorized Administrator Allocation of Unallocated Student
  const handleAllocateStudent = async () => {
    if (!selectedStudent || !selectedExamId || !selectedRoomId) return;

    setIsAllocatingStudent(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const alloc = await DatabaseService.allocateUnallocatedStudent({
        examinationId: selectedExamId,
        roomId: selectedRoomId,
        studentId: selectedStudent.id,
        seatNumber: customSeatNumber.trim() || undefined,
        allocatedBy: currentUser.id,
        allocatedByName: currentUser.name,
      });

      setSuccessMessage(
        `Candidate ${selectedStudent.full_name} successfully allocated to Hall ${alloc.room_number}, Seat ${alloc.seat_number}!`
      );
      setIsAllocatingModalOpen(false);
      setCustomSeatNumber('');

      // Refresh allocations and attendance
      await loadInitialData();
      onAttendanceUpdated();
    } catch (err: any) {
      console.error('Error allocating student:', err);
      setErrorMessage(err.message || 'Failed to allocate candidate to this hall.');
    } finally {
      setIsAllocatingStudent(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Manual Attendance Entry & Verification</h2>
              <p className="text-[11px] text-slate-400">
                Authorized Invigilation Recording · Real-Time Firestore Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* 1. Exam & Room Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned Examination</span>
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSelectedStudent(null);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.course_code} - {ex.title} ({ex.session.startsWith('Morning') ? 'FN' : 'AN'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assigned Hall / Venue</span>
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(e.target.value);
                  setSelectedStudent(null);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {rooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.room_number} (Cap: {rm.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Candidate Search Box */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Student Candidate <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedStudent && e.target.value !== selectedStudent.full_name) {
                    setSelectedStudent(null);
                  }
                }}
                placeholder="Type Registration / Roll number (e.g. 2026-CS-042) or candidate name..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Live Autocomplete Dropdown */}
            {filteredStudents.length > 0 && !selectedStudent && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isAllocatedInCurrentRoom = currentAllocations.some(
                    (a) => a.student_id === s.id && a.room_id === selectedRoomId
                  );
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{s.full_name}</span>
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {s.reg_no}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.department} · {s.section}
                        </div>
                      </div>

                      <div>
                        {isAllocatedInCurrentRoom ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Allocated in this Hall
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unallocated
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Selected Student Status Card & Allocation Verification */}
          {selectedStudent && (
            <div className="space-y-4">
              
              {/* If student IS allocated to THIS room */}
              {studentAllocation ? (
                <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950 text-sm">
                          Allocation Confirmed: {selectedStudent.full_name}
                        </span>
                      </div>
                      <div className="mt-1 text-emerald-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        <div>
                          <span className="text-slate-500 block">Roll Number:</span>
                          <strong className="font-mono text-slate-900">{selectedStudent.reg_no}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Hall:</span>
                          <strong className="text-slate-900">{studentAllocation.room_number}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Seat Assigned:</span>
                          <strong className="font-mono text-indigo-700 text-xs">{studentAllocation.seat_number}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Department:</span>
                          <strong className="text-slate-900">{selectedStudent.department.split(' ')[0]} ({selectedStudent.section})</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Existing attendance badge if already marked */}
                  {existingRecord && existingRecord.status !== 'Pending' && existingRecord.status !== 'Unmarked' && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Current Status:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          existingRecord.status === 'Present' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-rose-600 text-white'
                        }`}>
                          {existingRecord.status}
                        </span>
                        {existingRecord.verified_at && (
                          <span className="text-[10px] text-slate-500">
                            (Recorded at {new Date(existingRecord.verified_at).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ready to Correct / Update</span>
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* MODULE 3: STUDENT IS NOT ALLOCATED TO THIS ROOM! */
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-950 text-sm">
                        Warning: Candidate is Unallocated to this Hall
                      </h4>
                      <p className="mt-1 text-amber-900 leading-relaxed text-[11px]">
                        Student <strong>{selectedStudent.full_name}</strong> ({selectedStudent.reg_no}) exists in Cloud Firestore but has <strong>NOT been allocated</strong> to <strong>{selectedRoom?.room_number}</strong> for <strong>{selectedExam?.title}</strong>.
                      </p>
                      {studentOtherRoomAllocation && (
                        <p className="mt-1 font-semibold text-rose-800 text-[11px]">
                          Notice: This candidate is currently assigned to {studentOtherRoomAllocation.room_number} (Seat {studentOtherRoomAllocation.seat_number}).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Module 3 Rule: Do not silently add to attendance sheet */}
                  <div className="bg-white/80 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                    <strong className="block text-amber-950 mb-0.5">Examination Security Rule:</strong>
                    Attendance cannot be recorded for an unallocated candidate. The student must first be formally allocated according to hall capacity and seat availability.
                  </div>

                  {/* Allocate Action (Allowed for Admin or authorized staff) */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500">
                      Hall Capacity: {selectedRoom?.capacity || 0} seats · Currently Occupied: {currentAllocations.filter(a => a.room_id === selectedRoomId).length}
                    </div>

                    {userRole === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => setIsAllocatingModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Allocate Student to this Hall</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 italic">
                        Contact Administrator to Allocate
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Attendance Marking Controls (Only enabled if allocated) */}
              {studentAllocation && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Mark Candidate Attendance <span className="text-rose-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAttendanceStatus('Present')}
                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-all ${
                          attendanceStatus === 'Present'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${attendanceStatus === 'Present' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttendanceStatus('Absent')}
                        className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-all ${
                          attendanceStatus === 'Absent'
                            ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <XCircle className={`w-4 h-4 ${attendanceStatus === 'Absent' ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Remarks / Reason <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g., Arrived with Dean's permission, Verified hall ticket, etc."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Module 4 Audit Trail: If sheet is finalized or editing an existing status */}
                  {(isFinalized || isEditingExisting) && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                        Audit Reason for Status Correction <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        placeholder="e.g., In-charge recount correction, Late admitted candidate, etc."
                        className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-amber-800">
                        This correction will be permanently recorded in the Cloud Firestore audit trail.
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* Module 3 Dialog: Allocate unallocated candidate */}
          {isAllocatingModalOpen && selectedStudent && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Allocate Candidate: {selectedStudent.full_name}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAllocatingModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-indigo-800">
                You are about to assign this candidate to <strong>{selectedRoom?.room_number}</strong>. The algorithm will automatically assign the next collision-free seat or use a custom seat.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Custom Seat Number (Leave empty to auto-assign)
                </label>
                <input
                  type="text"
                  value={customSeatNumber}
                  onChange={(e) => setCustomSeatNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., A-03"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg text-indigo-700 bg-white uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAllocatingModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAllocateStudent}
                  disabled={isAllocatingStudent}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAllocatingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Form</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            {studentAllocation && (
              <button
                type="button"
                onClick={() => handleSaveAttendance(true)}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveAttendance(false)}
              disabled={isSaving || !selectedStudent || !studentAllocation}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{isEditingExisting ? 'Update Attendance' : 'Add Attendance'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
