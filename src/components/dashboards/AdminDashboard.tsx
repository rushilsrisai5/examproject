import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  DoorOpen, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  FileText, 
  Shuffle, 
  Printer, 
  Trash2, 
  AlertTriangle,
  Building,
  Check,
  ChevronDown,
  Globe,
  Eye,
  Database,
  RefreshCw,
  Search,
  Layers,
  GraduationCap,
  SlidersHorizontal,
  UserCheck,
  AlertCircle,
  Download,
  ShieldCheck,
  History,
  BarChart3,
  Unlock,
  FileSpreadsheet,
  Sparkles,
  Radar,
  MapPin,
  Grid,
  AlertOctagon,
  UserPlus,
  Edit3,
  UserX
} from 'lucide-react';
import { DatabaseService, seedFirestoreDatabase } from '../../services/db';
import { 
  Examination, 
  Room, 
  StudentRecord, 
  Allocation, 
  AttendanceRecord,
  Department,
  Course,
  AuditLog,
  SmartAllocationPlan
} from '../../types';
import { downloadCSV } from '../../utils/csvExport';
import { SmartSeatAllocationModal } from '../SmartSeatAllocationModal';
import { SeatingMapViewer } from '../SeatingMapViewer';
import { ExceptionRadarDashboard } from '../ExceptionRadarDashboard';
import { AuditTrail } from '../AuditTrail';
import { ManualStudentEntryModal } from '../ManualStudentEntryModal';

export const AdminDashboard: React.FC = () => {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'seating_map' | 'exams' | 'rooms' | 'students' | 'allocations' | 'manual' | 'attendance' | 'absentee' | 'reports' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Smart Seat Allocation Optimizer state
  const [isSmartAllocModalOpen, setIsSmartAllocModalOpen] = useState(false);
  const [smartAllocPlan, setSmartAllocPlan] = useState<SmartAllocationPlan | null>(null);
  const [isGeneratingSmartPlan, setIsGeneratingSmartPlan] = useState(false);
  const [isCommittingSmartPlan, setIsCommittingSmartPlan] = useState(false);
  const [interleaveDepartments, setInterleaveDepartments] = useState(true);

  // Seating Map modal state for opening from any room button
  const [isSeatingMapModalOpen, setIsSeatingMapModalOpen] = useState(false);
  const [activeSeatingMapRoomId, setActiveSeatingMapRoomId] = useState<string>('');
  
  // Filters & searches
  const [filterExamId, setFilterExamId] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [filterRoom, setFilterRoom] = useState<string>('ALL');
  const [searchStudent, setSearchStudent] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [studentSectionFilter, setStudentSectionFilter] = useState('ALL');
  const [studentYearFilter, setStudentYearFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');
  const [selectedStudentToEdit, setSelectedStudentToEdit] = useState<StudentRecord | null>(null);
  const [viewStudentModal, setViewStudentModal] = useState<StudentRecord | null>(null);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');
  const [absenteeSearch, setAbsenteeSearch] = useState('');
  const [absenteeRoomFilter, setAbsenteeRoomFilter] = useState('ALL');
  const [absenteeStatusFilter, setAbsenteeStatusFilter] = useState<'ALL' | 'Finalized' | 'Draft'>('ALL');
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Module 2 options: Minimum Rooms algorithm
  const [useMinimumRooms, setUseMinimumRooms] = useState(false);

  // Module 2 Manual allocation state
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualRoomId, setManualRoomId] = useState('');
  const [manualSeatNumber, setManualSeatNumber] = useState('');
  const [isManualAllocating, setIsManualAllocating] = useState(false);

  // Modal states
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // New exam form state (Module 1 - All mandatory fields)
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCourseCode, setNewExamCourseCode] = useState('CS-601');
  const [newExamCourseName, setNewExamCourseName] = useState('');
  const [newExamDate, setNewExamDate] = useState('2026-10-25');
  const [newExamSession, setNewExamSession] = useState<'Morning (09:30 AM - 12:30 PM)' | 'Afternoon (02:00 PM - 05:00 PM)'>('Morning (09:30 AM - 12:30 PM)');
  const [newExamDept, setNewExamDept] = useState('Computer Science & Engineering');
  const [newExamAcademicYear, setNewExamAcademicYear] = useState('2025-2026');
  const [newExamStudentYear, setNewExamStudentYear] = useState('3rd Year (VI Semester)');
  const [newExamSection, setNewExamSection] = useState('Sec-A & Sec-B');

  // New room form state (Module 2)
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomBuilding, setNewRoomBuilding] = useState('Science & Engineering Complex');
  const [newRoomCapacity, setNewRoomCapacity] = useState(12);
  const [newRoomRows, setNewRoomRows] = useState(4);
  const [newRoomColumns, setNewRoomColumns] = useState(3);
  const [newRoomIncharge, setNewRoomIncharge] = useState('Prof. Sarah Jenkins');

  // New student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentRegNo, setNewStudentRegNo] = useState('');
  const [newStudentDept, setNewStudentDept] = useState('Computer Science & Engineering');
  const [newStudentSection, setNewStudentSection] = useState('Sec-A');

  // Load all data from Firestore
  const refreshData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [examsData, roomsData, studentsData, deptsData, coursesData, allocsData, attData, auditData] = await Promise.all([
        DatabaseService.getExaminations(),
        DatabaseService.getRooms(),
        DatabaseService.getStudents(),
        DatabaseService.getDepartments(),
        DatabaseService.getCourses(),
        DatabaseService.getAllocations(),
        DatabaseService.getAttendance(),
        DatabaseService.getAuditLogs(),
      ]);
      setExaminations(examsData);
      setRooms(roomsData);
      setStudents(studentsData);
      setDepartments(deptsData);
      setCourses(coursesData);
      setAllocations(allocsData);
      setAttendance(attData);
      setAuditLogs(auditData);

      if (!selectedExamId && examsData.length > 0) {
        setSelectedExamId(examsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load examination section data from Firestore:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to load examination data from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setActionError(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setActionNotice(null);
    setTimeout(() => setActionError(null), 5000);
  };

  // Unique filter choices
  const uniqueDates = Array.from(new Set(examinations.map(e => e.exam_date))).filter(Boolean).sort();
  const uniqueCourses = Array.from(new Set(examinations.map(e => e.course_code))).filter(Boolean).sort();
  const uniqueDepts = Array.from(new Set(departments.map(d => d.name))).filter(Boolean).sort();

  // Module 7 Dynamic Firestore-driven Filtering
  const filteredExaminations = examinations.filter(e => {
    if (filterExamId !== 'ALL' && e.id !== filterExamId) return false;
    if (filterDate !== 'ALL' && e.exam_date !== filterDate) return false;
    if (filterDept !== 'ALL' && e.department !== filterDept) return false;
    if (filterCourse !== 'ALL' && e.course_code !== filterCourse) return false;
    return true;
  });

  const filteredExamIds = new Set(filteredExaminations.map(e => e.id));

  // Examination sessions count (unique exam_date + session)
  const distinctSessions = Array.from(
    new Set(filteredExaminations.map(e => `${e.exam_date}___${e.session}`))
  );
  const totalSessionsCount = distinctSessions.length;

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (filterRoom !== 'ALL' && r.id !== filterRoom) return false;
    return true;
  });
  const activeFilteredRooms = filteredRooms.filter(r => r.is_active);
  const totalActiveCapacity = activeFilteredRooms.reduce((sum, r) => sum + r.capacity, 0);

  // Filtered allocations
  const filteredAllocations = allocations.filter(a => {
    if (!filteredExamIds.has(a.examination_id)) return false;
    if (filterRoom !== 'ALL' && a.room_id !== filterRoom) return false;
    if (filterDept !== 'ALL') {
      const st = students.find(s => s.id === a.student_id);
      if (st?.department !== filterDept) return false;
    }
    return true;
  });

  // Eligible students in filtered context
  const eligibleStudents = students.filter(s => {
    if (filterDept !== 'ALL' && s.department !== filterDept) return false;
    return true;
  });
  const totalEligibleStudentsCount = eligibleStudents.length;

  const allocatedStudentIds = new Set(filteredAllocations.map(a => a.student_id));
  const totalAllocatedStudentsCount = allocatedStudentIds.size;
  const totalAwaitingAllocationCount = Math.max(0, totalEligibleStudentsCount - totalAllocatedStudentsCount);

  // Room capacity and safety analysis (Module 7.3)
  const roomCapacityStats = activeFilteredRooms.map(room => {
    const allocCount = filteredAllocations.filter(a => a.room_id === room.id).length;
    const availableSeats = Math.max(0, room.capacity - allocCount);
    const utilizationRate = room.capacity > 0 ? Math.round((allocCount / room.capacity) * 100) : 0;
    const isOverCapacity = allocCount > room.capacity;
    return {
      room,
      allocCount,
      availableSeats,
      utilizationRate,
      isOverCapacity,
    };
  });

  const roomsExceedingCapacityCount = roomCapacityStats.filter(s => s.isOverCapacity).length;
  const roomsWithinCapacityLimitsCount = roomCapacityStats.filter(s => !s.isOverCapacity).length;

  // Filtered Attendance & Finalization metrics
  const filteredAttendance = attendance.filter(a => {
    if (!filteredExamIds.has(a.examination_id)) return false;
    if (filterRoom !== 'ALL' && a.room_id !== filterRoom) return false;
    if (filterDept !== 'ALL') {
      const st = students.find(s => s.id === a.student_id);
      if (st?.department !== filterDept) return false;
    }
    return true;
  });

  const finalizedAttendanceRecords = filteredAttendance.filter(a => a.is_finalized);
  const totalFinalizedPresent = finalizedAttendanceRecords.filter(a => a.status === 'Present').length;
  const totalFinalizedAbsent = finalizedAttendanceRecords.filter(a => a.status === 'Absent').length;

  const draftAttendanceRecords = filteredAttendance.filter(a => !a.is_finalized);
  const totalDraftPresent = draftAttendanceRecords.filter(a => a.status === 'Present').length;
  const totalDraftAbsent = draftAttendanceRecords.filter(a => a.status === 'Absent').length;
  const totalUnmarked = filteredAttendance.filter(a => a.status === 'Pending' || a.status === 'Unmarked').length;

  // Rooms attendance completion
  const roomsWithCommittedAllocations = activeFilteredRooms.filter(r => 
    filteredAllocations.some(a => a.room_id === r.id)
  );
  const roomsWithFinalizedAttendance = roomsWithCommittedAllocations.filter(r => {
    const roomAtt = filteredAttendance.filter(a => a.room_id === r.id);
    return roomAtt.length > 0 && roomAtt.every(a => a.is_finalized);
  });
  const roomsWithPendingAttendance = roomsWithCommittedAllocations.filter(r => {
    const roomAtt = filteredAttendance.filter(a => a.room_id === r.id);
    return roomAtt.length === 0 || !roomAtt.every(a => a.is_finalized);
  });
  const attendanceCompletionPercentage = roomsWithCommittedAllocations.length > 0
    ? Math.round((roomsWithFinalizedAttendance.length / roomsWithCommittedAllocations.length) * 100)
    : 0;

  const pendingAbsenteeStatementsCount = roomsWithPendingAttendance.length;

  // Published vs Draft examinations
  const publishedExamsCount = filteredExaminations.filter(e => e.is_published).length;
  const draftExamsCount = filteredExaminations.filter(e => !e.is_published).length;

  const isAnyFilterActive = filterExamId !== 'ALL' || filterDate !== 'ALL' || filterDept !== 'ALL' || filterCourse !== 'ALL' || filterRoom !== 'ALL';

  const resetAllFilters = () => {
    setFilterExamId('ALL');
    setFilterDate('ALL');
    setFilterDept('ALL');
    setFilterCourse('ALL');
    setFilterRoom('ALL');
  };

  // Metrics calculated dynamically from real Firestore records
  const totalExaminations = examinations.length;
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.is_active);
  const totalCapacity = activeRooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalRegisteredStudents = students.length;

  const currentExam = examinations.find(e => e.id === selectedExamId) || examinations[0];
  const currentExamAllocations = allocations.filter(a => a.examination_id === currentExam?.id);
  const currentExamAttendance = attendance.filter(a => a.examination_id === currentExam?.id);

  const allocatedCount = currentExamAllocations.length;
  const unallocatedCount = Math.max(0, totalRegisteredStudents - allocatedCount);

  // Unallocated students list for this examination
  const allocatedStudentIdSet = new Set(currentExamAllocations.map(a => a.student_id));
  const unallocatedStudents = students.filter(s => !allocatedStudentIdSet.has(s.id));

  // Attendance metrics calculated from Firestore records
  const finalizedAttendance = currentExamAttendance.filter(a => a.is_finalized);
  const presentCount = currentExamAttendance.filter(a => a.status === 'Present').length;
  const absentCount = currentExamAttendance.filter(a => a.status === 'Absent').length;
  const pendingCount = currentExamAttendance.filter(a => a.status === 'Pending' || a.status === 'Unmarked').length;

  // Actions
  const handleAutoAllocate = async () => {
    if (!currentExam) return;
    try {
      const res = await DatabaseService.autoAllocateStudents(currentExam.id, {
        useMinimumRooms,
        resetExisting: true,
      });
      await refreshData();
      showNotification(`Allocated ${res.allocatedCount} candidates across ${res.roomsUsed} active halls${useMinimumRooms ? ' (Minimum Rooms Mode enabled)' : ''}. Unallocated: ${res.unallocatedCount}`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Allocation failed');
    }
  };

  // Smart Seat Allocation Optimizer Handlers (Requirement 1 - 10)
  const handleOpenSmartAllocation = async () => {
    if (!currentExam) {
      showError('Please choose or schedule an active examination first.');
      return;
    }
    setIsSmartAllocModalOpen(true);
    setIsGeneratingSmartPlan(true);
    try {
      const plan = await DatabaseService.generateSmartAllocationPlan({
        examinationId: currentExam.id,
        interleaveDepartments,
        useMinimumRooms,
        resetExisting: true,
      });
      setSmartAllocPlan(plan);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to generate smart allocation plan');
    } finally {
      setIsGeneratingSmartPlan(false);
    }
  };

  const handleRecomputeSmartPlan = async () => {
    if (!currentExam) return;
    setIsGeneratingSmartPlan(true);
    try {
      const plan = await DatabaseService.generateSmartAllocationPlan({
        examinationId: currentExam.id,
        interleaveDepartments,
        useMinimumRooms,
        resetExisting: true,
      });
      setSmartAllocPlan(plan);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to compute smart allocation plan');
    } finally {
      setIsGeneratingSmartPlan(false);
    }
  };

  const handleConfirmSmartAllocation = async () => {
    if (!smartAllocPlan) return;
    setIsCommittingSmartPlan(true);
    try {
      await DatabaseService.commitSmartAllocation(smartAllocPlan);
      await refreshData();
      setIsSmartAllocModalOpen(false);
      showNotification(`Smart allocation successfully committed! ${smartAllocPlan.allocatedStudentsCount} candidate seats recorded with alternating seating distribution.`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to commit smart allocation');
    } finally {
      setIsCommittingSmartPlan(false);
    }
  };

  const handleOpenSeatingMap = (roomId: string, examId?: string) => {
    setActiveSeatingMapRoomId(roomId);
    if (examId) setSelectedExamId(examId);
    setIsSeatingMapModalOpen(true);
  };

  // Critical issues count for Radar tab badge
  const radarCriticalCount = useMemo(() => {
    let count = 0;
    for (const exam of examinations) {
      for (const room of rooms) {
        const roomAllocs = allocations.filter(a => a.examination_id === exam.id && a.room_id === room.id);
        if (roomAllocs.length > room.capacity) count++;
      }
      const examAllocs = allocations.filter(a => a.examination_id === exam.id);
      const eligible = exam.eligible_student_ids && exam.eligible_student_ids.length > 0
        ? students.filter(s => exam.eligible_student_ids!.includes(s.id))
        : students.filter(s => s.department === exam.department);
      const allocatedStudentIds = new Set(examAllocs.map(a => a.student_id));
      if (eligible.some(s => !allocatedStudentIds.has(s.id))) count++;
    }
    return count;
  }, [examinations, rooms, students, allocations]);

  const handleManualAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExam || !manualStudentId || !manualRoomId) {
      showError('Please choose both a candidate and an examination hall.');
      return;
    }

    setIsManualAllocating(true);
    try {
      const alloc = await DatabaseService.manualAllocateStudent({
        examinationId: currentExam.id,
        studentId: manualStudentId,
        roomId: manualRoomId,
        seatNumber: manualSeatNumber.trim() || undefined,
      });
      await refreshData();
      showNotification(`Successfully allocated ${alloc.student_name} (${alloc.student_reg_no}) to ${alloc.room_number} at seat ${alloc.seat_number}`);
      setManualStudentId('');
      setManualSeatNumber('');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Manual allocation failed');
    } finally {
      setIsManualAllocating(false);
    }
  };

  const handleTogglePublishSchedule = async () => {
    if (!currentExam) return;
    const newStatus = !currentExam.is_published;
    try {
      await DatabaseService.publishExaminationSchedule(currentExam.id, newStatus);
      await refreshData();
      showNotification(
        newStatus 
          ? `Examination schedule & seating roster published! Accessible on student portals.` 
          : `Examination schedule unpublished (returned to draft mode).`
      );
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update publication status');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newExam = await DatabaseService.createExamination({
        title: newExamTitle,
        course_code: newExamCourseCode,
        course_name: newExamCourseName || newExamTitle,
        exam_date: newExamDate,
        session: newExamSession,
        department: newExamDept,
        academic_year: newExamAcademicYear,
        student_year: newExamStudentYear,
        section: newExamSection,
        semester: 6,
        status: 'Scheduled',
        total_students: 0,
        is_published: false,
      });
      await refreshData();
      setSelectedExamId(newExam.id);
      setIsAddExamOpen(false);
      showNotification(`Examination ${newExam.course_code} successfully scheduled in Cloud Firestore.`);
      setNewExamTitle('');
      setNewExamCourseName('');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error creating examination');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (confirm('Are you sure you want to delete this examination? All associated seating allocations will be removed.')) {
      try {
        await DatabaseService.deleteExamination(examId);
        await refreshData();
        showNotification('Examination record deleted.');
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'Failed to delete examination');
      }
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await DatabaseService.createRoom({
        room_number: newRoomNumber,
        building: newRoomBuilding,
        capacity: Number(newRoomCapacity),
        rows: Number(newRoomRows),
        columns: Number(newRoomColumns),
        is_active: true,
        incharge_name: newRoomIncharge,
      });
      await refreshData();
      setIsAddRoomOpen(false);
      showNotification(`Room ${room.room_number} (${room.capacity} seats) registered in Cloud Firestore.`);
      setNewRoomNumber('');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error creating room');
    }
  };

  const handleToggleRoomActive = async (roomId: string, currentStatus: boolean) => {
    try {
      await DatabaseService.updateRoom(roomId, { is_active: !currentStatus });
      await refreshData();
      showNotification(`Room ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update room status');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('Delete this examination room from the system?')) {
      try {
        await DatabaseService.deleteRoom(roomId);
        await refreshData();
        showNotification('Examination hall safely removed.');
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'Failed to delete room');
      }
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = await DatabaseService.createStudent({
        full_name: newStudentName,
        email: newStudentEmail || `${newStudentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@examflow.edu`,
        reg_no: newStudentRegNo,
        department: newStudentDept,
        section: newStudentSection,
        semester: 6,
      });
      await refreshData();
      setIsAddStudentOpen(false);
      showNotification(`Candidate student ${student.full_name} (${student.reg_no}) enrolled in Cloud Firestore.`);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentRegNo('');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error enrolling student');
    }
  };

  const handleRemoveAllocation = async (allocationId: string) => {
    if (confirm('Deallocate this student from this examination?')) {
      try {
        await DatabaseService.removeAllocation(allocationId);
        await refreshData();
        showNotification('Candidate deallocated.');
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'Failed to remove allocation');
      }
    }
  };

  const handleSeedDatabase = async () => {
    if (confirm('Re-seed Cloud Firestore with 30 students, 5 rooms, 3 exams, 2 In-Charges, and published schedules?')) {
      setIsSeeding(true);
      try {
        await seedFirestoreDatabase(true);
        await refreshData();
        showNotification('Cloud Firestore re-seeded with institutional records successfully.');
      } catch (err) {
        console.error('Seeding error:', err);
        showError(err instanceof Error ? err.message : 'Failed to seed Firestore.');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  // Filtered dataset helpers
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchStudent.toLowerCase().trim();
      const matchesSearch = !q || 
        s.full_name.toLowerCase().includes(q) || 
        s.reg_no.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q));
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      const matchesSection = studentSectionFilter === 'ALL' || s.section === studentSectionFilter;
      const matchesYear = studentYearFilter === 'ALL' || 
                          (s.year && s.year.includes(studentYearFilter)) || 
                          String(s.semester) === studentYearFilter;
      const matchesStatus = studentStatusFilter === 'ALL' || (s.status || 'Active') === studentStatusFilter;
      return matchesSearch && matchesDept && matchesSection && matchesYear && matchesStatus;
    });
  }, [students, searchStudent, deptFilter, studentSectionFilter, studentYearFilter, studentStatusFilter]);

  const handleOpenAddStudent = () => {
    setSelectedStudentToEdit(null);
    setIsAddStudentOpen(true);
  };

  const handleEditStudent = (student: StudentRecord) => {
    setSelectedStudentToEdit(student);
    setIsAddStudentOpen(true);
  };

  const handleToggleStudentStatus = async (student: StudentRecord) => {
    const newStatus = (student.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    try {
      await DatabaseService.toggleStudentStatus(student.id, newStatus, {
        id: 'usr-admin-01',
        name: 'Administrator',
      });
      await refreshData();
      showNotification(`Candidate ${student.full_name} status updated to ${newStatus}.`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update student status');
    }
  };

  const handleDeleteStudent = async (student: StudentRecord) => {
    if (confirm(`Are you sure you want to delete student candidate ${student.full_name} (${student.reg_no})? This action cannot be undone.`)) {
      try {
        await DatabaseService.deleteStudent(student.id, {
          id: 'usr-admin-01',
          name: 'Administrator',
        });
        await refreshData();
        showNotification(`Candidate ${student.full_name} (${student.reg_no}) removed.`);
      } catch (err: unknown) {
        showError(err instanceof Error ? err.message : 'Failed to delete student');
      }
    }
  };

  const displayedAllocations = currentExamAllocations.filter((a) => {
    return selectedRoomFilter === 'ALL' || a.room_id === selectedRoomFilter;
  });

  // Module 5 Absentee dataset
  const currentExamAbsentees = currentExamAttendance.filter((a) => {
    const isAbsent = a.status === 'Absent';
    const matchesRoom = absenteeRoomFilter === 'ALL' || a.room_id === absenteeRoomFilter;
    const matchesSearch = !absenteeSearch || 
      a.student_name.toLowerCase().includes(absenteeSearch.toLowerCase()) ||
      a.student_reg_no.toLowerCase().includes(absenteeSearch.toLowerCase()) ||
      a.room_number.toLowerCase().includes(absenteeSearch.toLowerCase());
    const matchesStatus = absenteeStatusFilter === 'ALL' || 
      (absenteeStatusFilter === 'Finalized' ? a.is_finalized : !a.is_finalized);
    return isAbsent && matchesRoom && matchesSearch && matchesStatus;
  });

  // Module 6 Audit logs filtered
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesType = auditFilter === 'ALL' || log.entity_type === auditFilter;
    const matchesSearch = !auditSearch || 
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.performed_by.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.performed_by_name && log.performed_by_name.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // CSV Export: Filter-Aware Comprehensive Attendance Roster (Module 7 Download CSV)
  const handleExportFilteredAttendanceCSV = () => {
    const headers = [
      'Serial No',
      'Roll Number',
      'Candidate Name',
      'Department',
      'Course Code',
      'Examination Name',
      'Exam Date',
      'Session',
      'Hall Number',
      'Building / Block',
      'Seat Number',
      'Attendance Status',
      'Verified By',
      'Verification Status',
      'Remarks',
    ];

    const rows = filteredAttendance.map((record, idx) => {
      const exam = examinations.find(e => e.id === record.examination_id);
      const room = rooms.find(r => r.id === record.room_id);
      const student = students.find(s => s.id === record.student_id);

      return [
        String(idx + 1),
        record.student_reg_no,
        record.student_name,
        student?.department || exam?.department || 'N/A',
        exam?.course_code || 'N/A',
        exam?.title || 'N/A',
        exam?.exam_date || 'N/A',
        exam ? (exam.session.startsWith('Morning') ? 'FN' : 'AN') : 'N/A',
        record.room_number,
        room?.building || 'Main Block',
        record.seat_number,
        record.status,
        record.verified_by_name || room?.incharge_name || 'Unassigned',
        record.is_finalized ? 'Finalized' : 'Draft / In-Progress',
        record.remarks || '—',
      ];
    });

    const filterDescriptor = [
      filterExamId !== 'ALL' ? (examinations.find(e => e.id === filterExamId)?.course_code || 'Exam') : 'AllExams',
      filterDate !== 'ALL' ? filterDate : null,
      filterDept !== 'ALL' ? filterDept : null,
      filterRoom !== 'ALL' ? (rooms.find(r => r.id === filterRoom)?.room_number || 'Room') : null,
    ].filter(Boolean).join('_');

    const fileName = `Attendance_Report_${filterDescriptor || 'AllRecords'}_${new Date().toISOString().slice(0, 10)}`;
    downloadCSV(fileName, [headers, ...rows]);
    showNotification(`Attendance Report (${rows.length} records matching active filters) exported to CSV successfully.`);
  };

  // CSV Export: Filter-Aware Absentee Report (Module 7 Download CSV)
  const handleExportFilteredAbsenteeCSV = () => {
    const headers = [
      'Serial No',
      'Roll Number',
      'Candidate Name',
      'Department',
      'Course Code',
      'Examination Name',
      'Exam Date',
      'Session',
      'Hall Number',
      'Building / Block',
      'Seat Number',
      'Hall In-Charge',
      'Attendance Status',
      'Verification Status',
      'Remarks',
    ];

    const filteredAbsentees = filteredAttendance.filter(a => a.status === 'Absent');

    const rows = filteredAbsentees.map((record, idx) => {
      const exam = examinations.find(e => e.id === record.examination_id);
      const room = rooms.find(r => r.id === record.room_id);
      const student = students.find(s => s.id === record.student_id);

      return [
        String(idx + 1),
        record.student_reg_no,
        record.student_name,
        student?.department || exam?.department || 'N/A',
        exam?.course_code || 'N/A',
        exam?.title || 'N/A',
        exam?.exam_date || 'N/A',
        exam ? (exam.session.startsWith('Morning') ? 'FN' : 'AN') : 'N/A',
        record.room_number,
        room?.building || 'Main Block',
        record.seat_number,
        record.verified_by_name || room?.incharge_name || 'Unassigned',
        'Absent',
        record.is_finalized ? 'Finalized' : 'Draft / In-Progress',
        record.remarks || 'Confirmed Absence',
      ];
    });

    const filterDescriptor = [
      filterExamId !== 'ALL' ? (examinations.find(e => e.id === filterExamId)?.course_code || 'Exam') : 'AllExams',
      filterDate !== 'ALL' ? filterDate : null,
      filterDept !== 'ALL' ? filterDept : null,
      filterRoom !== 'ALL' ? (rooms.find(r => r.id === filterRoom)?.room_number || 'Room') : null,
    ].filter(Boolean).join('_');

    const fileName = `Absentee_Report_${filterDescriptor || 'AllRecords'}_${new Date().toISOString().slice(0, 10)}`;
    downloadCSV(fileName, [headers, ...rows]);
    showNotification(`Absentee Report (${rows.length} confirmed absentees matching active filters) exported to CSV successfully.`);
  };

  // CSV Export: Absentee Statement (Module 5)
  const handleExportAbsenteeStatementCSV = () => {
    const headers = [
      'Serial No',
      'Roll Number',
      'Candidate Name',
      'Department',
      'Course Code',
      'Examination Name',
      'Date',
      'Session',
      'Allocated Hall',
      'Seat Number',
      'Hall In-Charge',
      'Attendance Status',
      'Submission Status',
      'Remarks',
    ];

    const rows = currentExamAbsentees.map((a, idx) => {
      const room = rooms.find(r => r.id === a.room_id);
      return [
        String(idx + 1),
        a.student_reg_no,
        a.student_name,
        a.department || currentExam?.department || 'CSE',
        currentExam?.course_code || '',
        currentExam?.title || '',
        currentExam?.exam_date || '',
        currentExam?.session || '',
        a.room_number,
        a.seat_number,
        room?.incharge_name || a.verified_by_name || 'Invigilator',
        'Absent',
        a.is_finalized ? 'Finalized' : 'Draft Progress',
        a.remarks || 'Unreported Absence',
      ];
    });

    downloadCSV(
      `Official_Absentee_Statement_${currentExam?.course_code || 'Exam'}_${currentExam?.exam_date || 'Date'}`,
      [headers, ...rows]
    );
    showNotification('Official Absentee Statement exported to CSV successfully.');
  };

  // CSV Export: Consolidated Examination Summary (Module 6)
  const handleExportConsolidatedExamCSV = () => {
    const headers = [
      'Hall Number',
      'Building / Block',
      'Assigned In-Charge',
      'Total Capacity',
      'Allocated Candidates',
      'Present Count',
      'Absent Count',
      'Unmarked Count',
      'Attendance Rate (%)',
      'Roster Status',
    ];

    const rows = activeRooms.map((r) => {
      const roomAllocs = currentExamAllocations.filter(a => a.room_id === r.id);
      const roomAtt = currentExamAttendance.filter(a => a.room_id === r.id);
      const pres = roomAtt.filter(a => a.status === 'Present').length;
      const abs = roomAtt.filter(a => a.status === 'Absent').length;
      const unmark = roomAtt.filter(a => a.status === 'Pending' || a.status === 'Unmarked').length;
      const rate = roomAllocs.length > 0 ? `${Math.round((pres / roomAllocs.length) * 100)}%` : '0%';
      const isFin = roomAtt.length > 0 && roomAtt.every(a => a.is_finalized);
      const status = isFin ? 'Submitted & Locked' : roomAllocs.length > 0 ? 'Draft In Progress' : 'No Candidates';

      return [
        r.room_number,
        r.building,
        r.incharge_name || 'Prof. Sarah Jenkins',
        String(r.capacity),
        String(roomAllocs.length),
        String(pres),
        String(abs),
        String(unmark),
        rate,
        status,
      ];
    });

    downloadCSV(
      `Consolidated_Examination_Report_${currentExam?.course_code || 'Summary'}_${currentExam?.exam_date || 'Date'}`,
      [headers, ...rows]
    );
    showNotification('Consolidated Examination Report exported to CSV.');
  };

  // CSV Export: Audit Trail (Module 6)
  const handleExportAuditTrailCSV = () => {
    const headers = [
      'Timestamp',
      'Action Code',
      'Entity Type',
      'Entity Identifier',
      'Performed By User',
      'User Name / Role',
      'Operation Details',
    ];

    const rows = filteredAuditLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.entity_type,
      log.entity_id || 'N/A',
      log.performed_by,
      log.performed_by_name || 'Administrator',
      log.details,
    ]);

    downloadCSV('ExamNova_Institutional_Audit_Trail_Report', [headers, ...rows]);
    showNotification('Institutional Audit Trail exported to CSV.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="bg-indigo-600 text-white text-xs font-semibold py-2.5 px-4 text-center sticky top-16 z-30 flex items-center justify-center gap-2 shadow-md no-print">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-600 text-white text-xs font-semibold py-2.5 px-4 text-center sticky top-16 z-30 flex items-center justify-center gap-2 shadow-md no-print">
          <AlertCircle className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header with Title and Examination Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 no-print">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Controller of Examinations · Institutional Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Examination Administration & Reporting System
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Smart Examination Section management: Schedules, Hall Allocations, Attendance, Absentee Statements, and Consolidated Audit Trails in Cloud Firestore.
            </p>
          </div>

          {/* Top Actions: Sync & Active Exam Context */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              title="Seed Cloud Firestore with 30 students, 5 halls, 3 exams"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSeeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync & Seed DB</span>
            </button>

            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Active Exam:
              </span>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  if (filterExamId !== 'ALL' && filterExamId !== e.target.value) {
                    setFilterExamId(e.target.value);
                  }
                }}
                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {examinations.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.course_code} - {exam.title} ({exam.session.startsWith('Morning') ? 'FN' : 'AN'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MODULE 7.2 — UNIFIED 5 DASHBOARD FILTERS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm my-6 no-print space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Administrative Filters (Module 7)
              </span>
              {isAnyFilterActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Active Filter Applied
                </span>
              )}
            </div>
            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Clear All Filters (Show All Records)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {/* Filter 1: Examination */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Examination</label>
              <select
                value={filterExamId}
                onChange={(e) => {
                  setFilterExamId(e.target.value);
                  if (e.target.value !== 'ALL') setSelectedExamId(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
              >
                <option value="ALL">All Examinations ({examinations.length})</option>
                {examinations.map(e => (
                  <option key={e.id} value={e.id}>{e.course_code} · {e.title}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Examination Date */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Exam Date</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
              >
                <option value="ALL">All Dates ({uniqueDates.length})</option>
                {uniqueDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Department */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Department</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
              >
                <option value="ALL">All Departments ({uniqueDepts.length})</option>
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Course */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Course Code</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
              >
                <option value="ALL">All Courses ({uniqueCourses.length})</option>
                {uniqueCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filter 5: Room */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Examination Hall</label>
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium"
              >
                <option value="ALL">All Examination Halls ({rooms.length})</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.room_number} ({r.building})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Module 7 Filter-Matched CSV Export Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium flex items-center gap-1.5">
              <span>Matching Filtered Dataset:</span>
              <strong className="text-slate-800">{filteredAttendance.length}</strong> attendance records ·{' '}
              <strong className="text-rose-700">{filteredAttendance.filter(a => a.status === 'Absent').length}</strong> absentees
              {isAnyFilterActive && (
                <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded ml-1">
                  (Filtered Active)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportFilteredAttendanceCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                title="Download complete attendance roster matching the active filters"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attendance CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportFilteredAbsenteeCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                title="Download confirmed absentee statements matching the active filters"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Absentee CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODULE 7.1 — LIVE DASHBOARD STATISTICS (8 COMPREHENSIVE METRIC CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6 no-print">
          {/* Stat 1: Examinations & Sessions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Exams & Sessions</span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {filteredExaminations.length} <span className="text-xs font-semibold text-slate-500">exams</span> · {totalSessionsCount} <span className="text-xs font-semibold text-slate-500">sessions</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-700">{publishedExamsCount} Published</span>
              <span>·</span>
              <span className="text-amber-700">{draftExamsCount} Draft</span>
            </div>
          </div>

          {/* Stat 2: Active Rooms & Capacity */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Active Halls & Capacity</span>
              <DoorOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {activeFilteredRooms.length} <span className="text-xs font-semibold text-slate-500">of {filteredRooms.length} halls</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <strong className="text-slate-800">{totalActiveCapacity}</strong> total active seating capacity
            </div>
          </div>

          {/* Stat 3: Candidate Allocation Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Candidate Allocations</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700">
              {totalAllocatedStudentsCount} <span className="text-xs font-semibold text-slate-500">allocated</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="text-amber-700 font-semibold">{totalAwaitingAllocationCount} awaiting</span> of {totalEligibleStudentsCount} eligible
            </div>
          </div>

          {/* Stat 4: Room Capacity Safety (Must Always Be 0 for committed allocations) */}
          <div className={`p-4 rounded-xl border shadow-sm space-y-1 ${
            roomsExceedingCapacityCount === 0 
              ? 'bg-emerald-50/50 border-emerald-200' 
              : 'bg-rose-50/70 border-rose-300'
          }`}>
            <div className="text-slate-600 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Room Capacity Safety</span>
              <ShieldCheck className={`w-4 h-4 ${roomsExceedingCapacityCount === 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
            <div className="text-2xl font-black flex items-center gap-2">
              <span className={roomsExceedingCapacityCount === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {roomsExceedingCapacityCount}
              </span>
              <span className="text-xs font-semibold text-slate-600">exceeding capacity</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              {roomsExceedingCapacityCount === 0 
                ? `✓ All ${roomsWithinCapacityLimitsCount} halls within limits (Zero overcapacity)`
                : `⚠ WARNING: ${roomsExceedingCapacityCount} halls exceed maximum capacity!`
              }
            </div>
          </div>

          {/* Stat 5: Attendance Submission Completion */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Attendance Completion</span>
              <CheckCircle className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700">
              {attendanceCompletionPercentage}%
            </div>
            <div className="text-[11px] text-slate-500">
              {roomsWithFinalizedAttendance.length} of {roomsWithCommittedAllocations.length} hall rosters finalized
            </div>
          </div>

          {/* Stat 6: Present Students (Finalized vs Draft) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Finalized Present</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {totalFinalizedPresent}
            </div>
            <div className="text-[11px] text-slate-500">
              In finalized rosters {totalDraftPresent > 0 && <span className="text-slate-400">({totalDraftPresent} draft)</span>}
            </div>
          </div>

          {/* Stat 7: Absent Students (Finalized vs Draft) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Finalized Absent</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">
              {totalFinalizedAbsent}
            </div>
            <div className="text-[11px] text-slate-500">
              In finalized rosters {totalDraftAbsent > 0 && <span className="text-slate-400">({totalDraftAbsent} draft)</span>}
            </div>
          </div>

          {/* Stat 8: Pending Halls & Absentee Reports */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Pending Roster Status</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {roomsWithPendingAttendance.length} <span className="text-xs font-semibold text-slate-500">halls</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {pendingAbsenteeStatementsCount} pending absentee reports · {totalUnmarked} unmarked
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px mb-6 overflow-x-auto no-print">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>

          {/* Module: Exam-Day Exception Radar */}
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Exception Radar</span>
            {radarCriticalCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
                {radarCriticalCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                ✓
              </span>
            )}
          </button>

          {/* Module: Visual Seating Map */}
          <button
            onClick={() => setActiveTab('seating_map')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'seating_map'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Visual Seating Map</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Examinations ({examinations.length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'allocations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Allocations ({currentExamAllocations.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Manual Seating ({unallocatedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Attendance Verification
          </button>
          <button
            onClick={() => setActiveTab('absentee')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'absentee'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Absentee Statement ({absentCount})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Consolidated Reports
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Overview & Quick Action Panels */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Operational Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  onClick={handleOpenAddStudent}
                  className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 transition-colors text-left cursor-pointer shadow-sm"
                  title="Register student candidate manually to Cloud Firestore"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Add Student Manually</div>
                    <div className="text-[11px] text-indigo-100">Manual entry & CSV bulk</div>
                  </div>
                </button>

                <button
                  onClick={handleAutoAllocate}
                  className="p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Run Smart Allocation</div>
                    <div className="text-[11px] text-indigo-700">Assign halls with overflow prevention</div>
                  </div>
                </button>

                <button
                  onClick={handleTogglePublishSchedule}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentExam?.is_published
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
                      : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-white ${
                    currentExam?.is_published ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {currentExam?.is_published ? <CheckCircle className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs">
                      {currentExam?.is_published ? 'Schedule Published' : 'Publish to Students'}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {currentExam?.is_published ? 'Live on student dashboards' : 'Draft mode (hidden)'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setIsAddExamOpen(true)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">New Examination</div>
                    <div className="text-[11px] text-slate-500">Add course & session schedule</div>
                  </div>
                </button>

                <button
                  onClick={() => setIsAddRoomOpen(true)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Register Exam Hall</div>
                    <div className="text-[11px] text-slate-500">Configure building & capacity</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Examination Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Active Examination Context
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    currentExam?.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {currentExam?.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Course / Subject:</span>
                    <span className="font-bold text-slate-900">{currentExam?.course_code} - {currentExam?.title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Date & Session:</span>
                    <span className="font-semibold text-slate-800">{currentExam?.exam_date} · {currentExam?.session}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-800">{currentExam?.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Academic Context:</span>
                    <span className="font-semibold text-slate-800">{currentExam?.academic_year || '2025-2026'} · {currentExam?.student_year || '3rd Year'} ({currentExam?.section || 'Sec-A & B'})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Allocated Candidates:</span>
                    <span className="font-bold text-indigo-700">{allocatedCount} of {totalRegisteredStudents} Students</span>
                  </div>
                </div>
              </div>

              {/* Hall Utilization Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Hall Capacity & Utilization
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {allocatedCount} / {totalCapacity} Seats ({totalCapacity > 0 ? Math.round((allocatedCount / totalCapacity) * 100) : 0}%)
                  </span>
                </div>

                <div className="space-y-3">
                  {activeRooms.map((room) => {
                    const roomAllocCount = currentExamAllocations.filter(a => a.room_id === room.id).length;
                    const percent = room.capacity > 0 ? Math.round((roomAllocCount / room.capacity) * 100) : 0;
                    return (
                      <div key={room.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800">{room.room_number}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {roomAllocCount} / {room.capacity} seats ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 100 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MODULE 7.3 — ROOM CAPACITY MONITORING TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Module 7 — Room Capacity Monitoring & Seating Limits
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live seating thresholds: Red (&gt;100% Overcapacity), Amber (80%–100% High utilization), Green (&lt;80% Available seats)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    roomsExceedingCapacityCount === 0 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    Overcapacity: {roomsExceedingCapacityCount}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Within Limits: {roomsWithinCapacityLimitsCount} / {activeFilteredRooms.length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Hall Designation</th>
                      <th className="px-5 py-3.5">Building & Block</th>
                      <th className="px-5 py-3.5 text-center">Seating Capacity</th>
                      <th className="px-5 py-3.5 text-center">Allocated Candidates</th>
                      <th className="px-5 py-3.5 text-center">Available Seats</th>
                      <th className="px-5 py-3.5">Capacity Utilization</th>
                      <th className="px-5 py-3.5 text-right">Allocation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {roomCapacityStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                          No active examination rooms match the current filter selection.
                        </td>
                      </tr>
                    ) : (
                      roomCapacityStats.map(({ room, allocCount, availableSeats, utilizationRate, isOverCapacity }) => {
                        let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                        let barColor = 'bg-emerald-600';
                        let statusLabel = 'Available';

                        if (isOverCapacity) {
                          statusColor = 'text-rose-700 bg-rose-50 border-rose-300 animate-pulse';
                          barColor = 'bg-rose-600';
                          statusLabel = 'Over Capacity';
                        } else if (utilizationRate >= 100) {
                          statusColor = 'text-amber-800 bg-amber-50 border-amber-200';
                          barColor = 'bg-amber-500';
                          statusLabel = 'Fully Occupied (100%)';
                        } else if (utilizationRate >= 80) {
                          statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
                          barColor = 'bg-amber-500';
                          statusLabel = 'High Utilization';
                        } else if (allocCount === 0) {
                          statusColor = 'text-slate-600 bg-slate-100 border-slate-200';
                          barColor = 'bg-slate-300';
                          statusLabel = 'Unallocated';
                        }

                        return (
                          <tr key={room.id} className={`hover:bg-slate-50 transition-colors ${isOverCapacity ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                              <DoorOpen className="w-4 h-4 text-indigo-600" />
                              <span>{room.room_number}</span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {room.building}
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-bold text-slate-900">
                              {room.capacity}
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-bold text-indigo-700">
                              {allocCount}
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-bold">
                              <span className={availableSeats === 0 ? 'text-amber-700' : 'text-emerald-700'}>
                                {availableSeats}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span className="font-bold text-slate-800">{utilizationRate}%</span>
                                  <span className="text-slate-500">{allocCount} / {room.capacity} seats</span>
                                </div>
                                <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                                    style={{ width: `${Math.min(100, utilizationRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <button
                                  onClick={() => handleOpenSeatingMap(room.id, selectedExamId)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="View visual seating map for this hall"
                                >
                                  <DoorOpen className="w-3.5 h-3.5" />
                                  <span>Seating Map</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {roomCapacityStats.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs text-slate-800">
                      <tr>
                        <td colSpan={2} className="px-5 py-3">Total / Average Across Halls</td>
                        <td className="px-5 py-3 text-center font-mono">{totalActiveCapacity}</td>
                        <td className="px-5 py-3 text-center font-mono text-indigo-700">{totalAllocatedStudentsCount}</td>
                        <td className="px-5 py-3 text-center font-mono text-emerald-700">
                          {Math.max(0, totalActiveCapacity - totalAllocatedStudentsCount)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-indigo-700">
                            {totalActiveCapacity > 0 ? Math.round((totalAllocatedStudentsCount / totalActiveCapacity) * 100) : 0}% Overall
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-emerald-700 font-extrabold">
                            ✓ {roomsWithinCapacityLimitsCount} / {activeFilteredRooms.length} Within Limits
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module: Exam-Day Exception Radar */}
        {activeTab === 'radar' && (
          <ExceptionRadarDashboard
            examinations={examinations}
            rooms={rooms}
            students={students}
            allocations={allocations}
            attendance={attendance}
            onNavigateTab={(tab, examId, roomId) => {
              if (examId) setSelectedExamId(examId);
              if (roomId) {
                setSelectedRoomFilter(roomId);
                setActiveSeatingMapRoomId(roomId);
              }
              setActiveTab(tab);
            }}
            onRefreshData={refreshData}
          />
        )}

        {/* Module: Visual Examination Room Seating Map */}
        {activeTab === 'seating_map' && (
          <SeatingMapViewer
            rooms={rooms}
            examinations={examinations}
            allocations={allocations}
            attendance={attendance}
            initialRoomId={activeSeatingMapRoomId || (rooms.length > 0 ? rooms[0].id : '')}
            initialExamId={selectedExamId || (examinations.length > 0 ? examinations[0].id : '')}
            isModal={false}
          />
        )}

        {/* Tab 2: Examinations Management (Module 1) */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Scheduled Examinations Roster</h3>
                <p className="text-xs text-slate-500">Persistent Firestore examinations catalog with strict duplicate prevention</p>
              </div>
              <button
                onClick={() => setIsAddExamOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Examination</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Course Code</th>
                    <th className="px-5 py-3.5">Examination Title</th>
                    <th className="px-5 py-3.5">Date & Timing</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Academic Scope</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examinations.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-700">{exam.course_code}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{exam.title}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <div>{exam.exam_date}</div>
                        <div className="text-[11px] text-slate-500">{exam.session.startsWith('Morning') ? 'FN Session' : 'AN Session'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{exam.department}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {exam.academic_year || '2025-2026'} · {exam.section || 'Sec-A & B'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                          exam.is_published 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedExamId(exam.id)}
                            className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                            title="Set as active examination"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete examination"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Rooms & Seating Capacity Management (Module 2) */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Examination Venues & Hall Seating</h3>
                <p className="text-xs text-slate-500">Manage rooms across buildings, floor limits, and invigilator assignments</p>
              </div>
              <button
                onClick={() => setIsAddRoomOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Examination Hall</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const roomAllocs = currentExamAllocations.filter(a => a.room_id === room.id);
                const isFull = roomAllocs.length >= room.capacity;
                const availableSeats = Math.max(0, room.capacity - roomAllocs.length);

                return (
                  <div key={room.id} className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 ${
                    !room.is_active ? 'opacity-60 border-slate-300 bg-slate-50' : 'border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{room.room_number}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            room.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {room.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5" />
                          <span>{room.building}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px] uppercase">Capacity</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{room.capacity}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px] uppercase">Occupied</div>
                        <div className="font-bold text-indigo-700 text-sm mt-0.5">{roomAllocs.length}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px] uppercase">Available</div>
                        <div className={`font-bold text-sm mt-0.5 ${availableSeats === 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {availableSeats}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                      <span>Faculty In-Charge:</span>
                      <span className="font-semibold text-slate-800">{room.incharge_name || 'Prof. Sarah Jenkins'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleRoomActive(room.id, room.is_active)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {room.is_active ? 'Deactivate Hall' : 'Activate Hall'}
                      </button>
                      <button
                        onClick={() => handleOpenSeatingMap(room.id, selectedExamId)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        title="View visual seating arrangement map"
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>View Seating Map</span>
                      </button>
                      <span className="text-[11px] font-mono text-slate-400">
                        Grid: {room.rows || 4}x{room.columns || 3}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Registered Students (Module 1 - Manual Entry & Registry) */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            
            {/* Header & Prominent Action Buttons */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Student Registry & Candidate Directory ({students.length})
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Cloud Firestore
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active student candidates, prevent duplicate roll numbers, and configure exam eligibility.
                </p>
              </div>

              {/* Action Buttons: Add Student Manually & Bulk CSV */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenAddStudent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02]"
                  title="Open manual candidate enrollment form"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student Manually</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentToEdit(null);
                    setIsAddStudentOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm cursor-pointer transition-colors"
                  title="Bulk import candidate students using CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Bulk CSV Upload</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="px-5 sm:px-6 pb-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search candidate name, roll no, email..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Dept Filter */}
                <div>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.code} · {d.name}
                      </option>
                    ))}
                    <option value="Mechanical Engineering">MECH · Mechanical</option>
                    <option value="Civil Engineering">CIVIL · Civil</option>
                    <option value="Information Technology">IT · Info Tech</option>
                  </select>
                </div>

                {/* Section Filter */}
                <div>
                  <select
                    value={studentSectionFilter}
                    onChange={(e) => setStudentSectionFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Sections</option>
                    <option value="Sec-A">Section A</option>
                    <option value="Sec-B">Section B</option>
                    <option value="Sec-C">Section C</option>
                    <option value="Sec-D">Section D</option>
                  </select>
                </div>

                {/* Year/Semester Filter */}
                <div>
                  <select
                    value={studentYearFilter}
                    onChange={(e) => setStudentYearFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Years / Semesters</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active Candidates</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>

              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                <span>
                  Showing <strong>{filteredStudents.length}</strong> of {students.length} registered candidate records
                </span>
                {(searchStudent || deptFilter !== 'ALL' || studentSectionFilter !== 'ALL' || studentYearFilter !== 'ALL' || studentStatusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchStudent('');
                      setDeptFilter('ALL');
                      setStudentSectionFilter('ALL');
                      setStudentYearFilter('ALL');
                      setStudentStatusFilter('ALL');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">No student records match your filters</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search criteria or register new students manually.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddStudent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Student Manually</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5 w-12 text-center">S.No</th>
                      <th className="px-4 py-3.5">Roll / Reg Number</th>
                      <th className="px-5 py-3.5">Candidate Name</th>
                      <th className="px-4 py-3.5">Department & Sec</th>
                      <th className="px-4 py-3.5">Year / Sem</th>
                      <th className="px-4 py-3.5">Contact Email</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">
                          {s.reg_no}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{s.full_name}</span>
                            {s.is_demo && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 tracking-wider">
                                DEMO DATA
                              </span>
                            )}
                          </div>
                          {s.phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ph: {s.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div>{s.department}</div>
                          <span className="text-[11px] font-bold text-slate-500">{s.section}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          <div>{s.year || '3rd Year'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Sem-{s.semester}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                          {s.email || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(s)}
                            className="cursor-pointer group"
                            title={`Click to switch status to ${s.status === 'Active' ? 'Inactive' : 'Active'}`}
                          >
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              (s.status || 'Active') === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 group-hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 group-hover:bg-rose-100'
                            }`}>
                              {(s.status || 'Active') === 'Active' ? (
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{s.status || 'Active'}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditStudent(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors"
                              title="Edit candidate record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete candidate record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Seating Allocations (Module 2 & 3) */}
        {activeTab === 'allocations' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Seating Allocation Matrix: {currentExam?.course_code} - {currentExam?.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Collision-free automated seating algorithm assigning students to rooms with capacity constraints
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenSmartAllocation}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    title="Launch automated collision-free seating optimizer with alternating seat assignment"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Smart Allocate Seats</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('seating_map')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm cursor-pointer"
                    title="Open visual room seating grid layout"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>View Seating Map</span>
                  </button>

                  <button
                    onClick={handleAutoAllocate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Quick Re-Allocate</span>
                  </button>

                  <button
                    onClick={handleTogglePublishSchedule}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-sm cursor-pointer ${
                      currentExam?.is_published
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{currentExam?.is_published ? 'Unpublish' : 'Publish Schedule'}</span>
                  </button>
                </div>
              </div>

              {/* Requirement 7: Clear warning if total available room capacity is insufficient */}
              {totalActiveCapacity < (currentExam?.eligible_student_ids?.length || filteredStudents.length) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-xs shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950 flex items-center gap-2">
                      Warning: Insufficient Examination Hall Seating Capacity
                    </h4>
                    <p className="mt-1 text-amber-800 leading-relaxed">
                      Total available capacity across all active halls ({totalActiveCapacity} seats) is insufficient to accommodate all eligible candidates ({currentExam?.eligible_student_ids?.length || filteredStudents.length} candidates). Please register or activate additional examination venues to avoid unallocated students.
                    </p>
                  </div>
                </div>
              )}

              {/* Requirement 6: Display Total Students, Allocated Students, Unallocated Students, Available Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Students</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {currentExam?.eligible_student_ids?.length || filteredStudents.length}
                    </span>
                    <span className="text-xs text-slate-500">eligible</span>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">Allocated Students</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-indigo-700 font-mono">
                      {currentExamAllocations.length}
                    </span>
                    <span className="text-xs text-indigo-600">seated</span>
                  </div>
                </div>

                <div className={`border rounded-xl p-3.5 ${
                  unallocatedCount > 0 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">Unallocated Students</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black font-mono ${unallocatedCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {unallocatedCount}
                    </span>
                    <span className="text-xs opacity-75">pending</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Available Hall Seats</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">{totalActiveCapacity}</span>
                    <span className="text-xs text-slate-500">total seats</span>
                  </div>
                </div>
              </div>

              {/* Module 2 Optimization Options */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={useMinimumRooms}
                    onChange={(e) => setUseMinimumRooms(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Module 2 Optimization: Minimum Rooms Mode (Pack highest-capacity halls first)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Filter Hall:</span>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white"
                  >
                    <option value="ALL">All Halls ({currentExamAllocations.length})</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_number} ({currentExamAllocations.filter(a => a.room_id === r.id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Allocation Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Roll No.</th>
                      <th className="px-5 py-3.5">Student Name</th>
                      <th className="px-5 py-3.5">Examination Hall</th>
                      <th className="px-5 py-3.5">Seat No.</th>
                      <th className="px-5 py-3.5">Exam Date & Session</th>
                      <th className="px-5 py-3.5">Publication</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-mono font-bold text-indigo-700">{alloc.student_reg_no}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{alloc.student_name}</td>
                        <td className="px-5 py-3.5 text-slate-800">
                          <div>{alloc.room_number}</div>
                          <div className="text-[11px] text-slate-500">{alloc.building}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-indigo-700 bg-indigo-50/40">
                          {alloc.seat_number}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {alloc.exam_date} ({alloc.session.startsWith('Morning') ? 'FN' : 'AN'})
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded ${
                            alloc.is_published 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {alloc.is_published ? 'Live on Student App' : 'Unpublished'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleRemoveAllocation(alloc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove student allocation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Requirement 10: Display unallocated students separately with the reason they could not be allocated */}
            {unallocatedStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-amber-100 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-bold text-amber-950">
                        Unallocated Candidates ({unallocatedStudents.length})
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5">
                      The following registered candidates could not be accommodated or are awaiting examination hall seating:
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs cursor-pointer"
                  >
                    <span>Manual Seat Allocation</span>
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Roll / Reg No.</th>
                        <th className="px-5 py-3">Candidate Name</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Section</th>
                        <th className="px-5 py-3">Unallocated Reason</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unallocatedStudents.map((st) => {
                        const totalCap = activeRooms.reduce((sum, r) => sum + r.capacity, 0);
                        const isCapShort = totalCap < (currentExam?.eligible_student_ids?.length || filteredStudents.length);
                        const reasonText = isCapShort 
                          ? 'Active examination hall capacity exhausted across all registered rooms'
                          : 'Awaiting seat optimizer execution or manual hall assignment';

                        return (
                          <tr key={st.id} className="hover:bg-amber-50/30">
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{st.reg_no}</td>
                            <td className="px-5 py-3.5 font-semibold text-slate-900">{st.full_name}</td>
                            <td className="px-5 py-3.5 text-slate-600">{st.department}</td>
                            <td className="px-5 py-3.5 text-slate-600">{st.section}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-100/70 text-amber-900 border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{reasonText}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setManualStudentId(st.id);
                                  if (activeRooms.length > 0) setManualRoomId(activeRooms[0].id);
                                  setActiveTab('manual');
                                }}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold cursor-pointer transition-colors"
                              >
                                Allocate Manually
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Manual Allocation (Module 2-D) */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Manual Student Seat Allocation
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Assign or reassign an individual student to an available room and seat with live capacity verification in Cloud Firestore.
              </p>

              <form onSubmit={handleManualAllocationSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Candidate ({unallocatedStudents.length} unallocated)</label>
                  <select
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    required
                  >
                    <option value="">-- Choose Candidate --</option>
                    {students.map((s) => {
                      const isAlloc = allocatedStudentIdSet.has(s.id);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.reg_no} - {s.full_name} {isAlloc ? '(Allocated)' : '(Unallocated)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Examination Hall</label>
                  <select
                    value={manualRoomId}
                    onChange={(e) => setManualRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    required
                  >
                    <option value="">-- Choose Hall --</option>
                    {activeRooms.map((r) => {
                      const occupied = currentExamAllocations.filter(a => a.room_id === r.id).length;
                      const available = r.capacity - occupied;
                      return (
                        <option key={r.id} value={r.id} disabled={available <= 0}>
                          {r.room_number} ({occupied}/{r.capacity} occupied · {available} free)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seat Number (Leave blank for auto)</label>
                  <input
                    type="text"
                    value={manualSeatNumber}
                    onChange={(e) => setManualSeatNumber(e.target.value)}
                    placeholder="e.g. A-01 or leave blank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isManualAllocating}
                    className="w-full px-4 py-2 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isManualAllocating ? 'Allocating...' : 'Assign Seat to Candidate'}
                  </button>
                </div>
              </form>
            </div>

            {/* Unallocated Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  Unallocated Candidates Roster ({unallocatedStudents.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Candidates requiring room allocation for {currentExam?.course_code} - {currentExam?.title}
                </p>
              </div>

              {unallocatedStudents.length === 0 ? (
                <div className="p-8 text-center text-emerald-700 text-xs font-semibold">
                  All {totalRegisteredStudents} eligible students have been successfully allocated to examination halls!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Roll No.</th>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Section</th>
                        <th className="px-5 py-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unallocatedStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono font-bold text-indigo-700">{s.reg_no}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{s.full_name}</td>
                          <td className="px-5 py-3 text-slate-600">{s.department}</td>
                          <td className="px-5 py-3 text-slate-600">{s.section}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => {
                                setManualStudentId(s.id);
                                if (activeRooms.length > 0) setManualRoomId(activeRooms[0].id);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold cursor-pointer"
                            >
                              Select to Seat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Attendance Verification Roster (Module 4) */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Attendance Verification Roster</h3>
                <p className="text-xs text-slate-500">Live invigilation roll verification submitted by hall in-charges</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {presentCount} Present
                  </span>
                  <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    {absentCount} Absent
                  </span>
                  <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    {pendingCount} Unmarked
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportFilteredAttendanceCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer ml-1"
                  title="Export active attendance dataset to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Roll No.</th>
                    <th className="px-5 py-3.5">Candidate Name</th>
                    <th className="px-5 py-3.5">Hall & Seat</th>
                    <th className="px-5 py-3.5">Attendance Status</th>
                    <th className="px-5 py-3.5">Verified By</th>
                    <th className="px-5 py-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentExamAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-700 font-medium">{record.student_reg_no}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{record.student_name}</td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {record.room_number} · <span className="font-mono font-bold text-indigo-700">{record.seat_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                          record.status === 'Present' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : record.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {record.verified_by_name || 'Pending Verification'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 italic">
                        {record.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Official Absentee Statement (Module 5) */}
        {activeTab === 'absentee' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Module 5 — Official Examination Absentee Statement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consolidated record of confirmed absentees for {currentExam?.course_code} - {currentExam?.title} ({currentExam?.exam_date})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportFilteredAbsenteeCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                    title="Download absentee statement matching active filter criteria"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Statement</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Search Candidate</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={absenteeSearch}
                      onChange={(e) => setAbsenteeSearch(e.target.value)}
                      placeholder="Search roll number or name..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filter by Examination Hall</label>
                  <select
                    value={absenteeRoomFilter}
                    onChange={(e) => setAbsenteeRoomFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="ALL">All Halls Combined</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.room_number}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Submission Status</label>
                  <select
                    value={absenteeStatusFilter}
                    onChange={(e) => setAbsenteeStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="ALL">All Absences</option>
                    <option value="Finalized">Finalized Records Only</option>
                    <option value="Draft">Draft Progress Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Room-wise Absent Summary Table (Module 5-2) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hall-Wise Absentee Summary
                </span>
                <span className="text-xs font-semibold text-rose-700">
                  Consolidated Absentees: {absentCount} of {currentExamAllocations.length} ({currentExamAllocations.length > 0 ? Math.round((absentCount / currentExamAllocations.length) * 100) : 0}%)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Examination Hall</th>
                      <th className="px-5 py-3">Building</th>
                      <th className="px-5 py-3">Hall In-Charge</th>
                      <th className="px-5 py-3 text-center">Allocated</th>
                      <th className="px-5 py-3 text-center">Present</th>
                      <th className="px-5 py-3 text-center">Absent</th>
                      <th className="px-5 py-3 text-center">Unmarked</th>
                      <th className="px-5 py-3">Roster Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeRooms.map((r) => {
                      const hallAllocs = currentExamAllocations.filter(a => a.room_id === r.id);
                      const hallAtt = currentExamAttendance.filter(a => a.room_id === r.id);
                      const pres = hallAtt.filter(a => a.status === 'Present').length;
                      const abs = hallAtt.filter(a => a.status === 'Absent').length;
                      const unmark = hallAtt.filter(a => a.status === 'Pending' || a.status === 'Unmarked').length;
                      const isFin = hallAtt.length > 0 && hallAtt.every(a => a.is_finalized);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-bold text-slate-900">{r.room_number}</td>
                          <td className="px-5 py-3 text-slate-600">{r.building}</td>
                          <td className="px-5 py-3 text-slate-700">{r.incharge_name || 'Prof. Sarah Jenkins'}</td>
                          <td className="px-5 py-3 text-center font-bold text-slate-900">{hallAllocs.length}</td>
                          <td className="px-5 py-3 text-center font-bold text-emerald-700">{pres}</td>
                          <td className="px-5 py-3 text-center font-bold text-rose-700">{abs}</td>
                          <td className="px-5 py-3 text-center font-bold text-amber-600">{unmark}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              isFin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isFin ? 'Finalized' : 'Draft'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Dedicated Printable Absentee Statement (Module 5-2 & 5-4) */}
            <div className="print-area bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-900">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  PIXEL TO PRODUCT 2026 · UNIVERSITY EXAMINATION SECTION
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  OFFICIAL CONSOLIDATED ABSENTEE STATEMENT
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-700 font-semibold mt-2">
                  <span>Paper: <strong className="text-slate-900">{currentExam?.course_code} - {currentExam?.title}</strong></span>
                  <span>·</span>
                  <span>Date: <strong className="text-slate-900">{currentExam?.exam_date}</strong></span>
                  <span>·</span>
                  <span>Session: <strong className="text-slate-900">{currentExam?.session}</strong></span>
                  <span>·</span>
                  <span>Department: <strong className="text-slate-900">{currentExam?.department}</strong></span>
                </div>
              </div>

              {/* Counters Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Total Candidates Seated</span>
                  <span className="text-slate-900 font-bold">{currentExamAllocations.length} Candidates</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Present Candidates</span>
                  <span className="text-emerald-700 font-bold">{presentCount} Verified</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Total Absentees</span>
                  <span className="text-rose-700 font-bold">{absentCount} Candidates</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Absentee Percentage</span>
                  <span className="text-slate-900 font-bold">
                    {currentExamAllocations.length > 0 ? `${Math.round((absentCount / currentExamAllocations.length) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Absent Students Table */}
              {currentExamAbsentees.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic border border-slate-200 rounded-xl">
                  Nil Absentees recorded for this examination session. All allocated candidates accounted for.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 border-r border-slate-300 text-center w-12">S.No</th>
                        <th className="px-4 py-2.5 border-r border-slate-300">Roll / Reg Number</th>
                        <th className="px-4 py-2.5 border-r border-slate-300">Candidate Name</th>
                        <th className="px-4 py-2.5 border-r border-slate-300">Department</th>
                        <th className="px-4 py-2.5 border-r border-slate-300">Hall & Seat</th>
                        <th className="px-4 py-2.5 border-r border-slate-300">Hall In-Charge</th>
                        <th className="px-4 py-2.5">Remarks / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentExamAbsentees.map((a, idx) => {
                        const room = rooms.find(r => r.id === a.room_id);
                        return (
                          <tr key={a.id} className="print-row hover:bg-slate-50">
                            <td className="px-3 py-3 border-r border-slate-200 text-center font-mono text-slate-600">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-200 font-mono font-bold text-rose-700">
                              {a.student_reg_no}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-200 font-semibold text-slate-900">
                              {a.student_name}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-200 text-slate-700">
                              {a.department || currentExam?.department}
                            </td>
                            <td className="px-4 py-3 border-r border-slate-200 text-slate-800">
                              {a.room_number} · <strong className="font-mono text-indigo-700">{a.seat_number}</strong>
                            </td>
                            <td className="px-4 py-3 border-r border-slate-200 text-slate-700">
                              {room?.incharge_name || a.verified_by_name || 'Prof. Sarah Jenkins'}
                            </td>
                            <td className="px-4 py-3 text-slate-600 italic">
                              {a.remarks || 'Unreported Absence'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Certification Signatures */}
              <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">Hall Invigilator Verification:</div>
                  <div className="border-b border-slate-400 h-8 mt-2"></div>
                  <div className="text-[10px] text-slate-500 mt-1">Signature & Employee Code</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">Chief Superintendent:</div>
                  <div className="border-b border-slate-400 h-8 mt-2"></div>
                  <div className="text-[10px] text-slate-500 mt-1">Examination Cell Authorization</div>
                </div>

                <div>
                  <div className="font-bold text-slate-900">Controller of Examinations:</div>
                  <div className="border-b border-slate-400 h-8 mt-2"></div>
                  <div className="text-[10px] text-slate-500 mt-1">University Seal & Date</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: Consolidated Examination Report (Module 6) */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Module 6 — Consolidated Examination Management Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consolidated operational analytics: Room attendance breakdown, department attendance comparison, and session analysis
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportConsolidatedExamCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Summary CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Consolidated Report</span>
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Exams</div>
                  <div className="text-lg font-black text-slate-900 mt-1">{totalExaminations}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Halls Used</div>
                  <div className="text-lg font-black text-slate-900 mt-1">{activeRooms.length}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Allocated</div>
                  <div className="text-lg font-black text-indigo-700 mt-1">{currentExamAllocations.length}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Present</div>
                  <div className="text-lg font-black text-emerald-700 mt-1">{presentCount}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-rose-700">Absent</div>
                  <div className="text-lg font-black text-rose-700 mt-1">{absentCount}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-amber-700">Unmarked</div>
                  <div className="text-lg font-black text-amber-600 mt-1">{pendingCount}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Attendance %</div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {currentExamAllocations.length > 0 ? `${Math.round((presentCount / currentExamAllocations.length) * 100)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Room-wise Breakdown Table (Module 6-1) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hall-Wise Seating & Attendance Breakdown
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Real-time Cloud Firestore synchronization
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Hall Designation</th>
                      <th className="px-5 py-3.5">Building</th>
                      <th className="px-5 py-3.5">Hall In-Charge</th>
                      <th className="px-5 py-3.5 text-center">Capacity</th>
                      <th className="px-5 py-3.5 text-center">Allocated</th>
                      <th className="px-5 py-3.5 text-center">Present</th>
                      <th className="px-5 py-3.5 text-center">Absent</th>
                      <th className="px-5 py-3.5 text-center">Unmarked</th>
                      <th className="px-5 py-3.5 text-center">Attendance %</th>
                      <th className="px-5 py-3.5">Roster Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeRooms.map((r) => {
                      const hallAllocs = currentExamAllocations.filter(a => a.room_id === r.id);
                      const hallAtt = currentExamAttendance.filter(a => a.room_id === r.id);
                      const pres = hallAtt.filter(a => a.status === 'Present').length;
                      const abs = hallAtt.filter(a => a.status === 'Absent').length;
                      const unmark = hallAtt.filter(a => a.status === 'Pending' || a.status === 'Unmarked').length;
                      const rate = hallAllocs.length > 0 ? Math.round((pres / hallAllocs.length) * 100) : 0;
                      const isFin = hallAtt.length > 0 && hallAtt.every(a => a.is_finalized);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{r.room_number}</td>
                          <td className="px-5 py-3.5 text-slate-600">{r.building}</td>
                          <td className="px-5 py-3.5 text-slate-700">{r.incharge_name || 'Prof. Sarah Jenkins'}</td>
                          <td className="px-5 py-3.5 text-center font-mono">{r.capacity}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-indigo-700">{hallAllocs.length}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-emerald-700">{pres}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-rose-700">{abs}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-amber-600">{unmark}</td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-bold">{rate}%</span>
                              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                              isFin 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : hallAllocs.length > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isFin ? 'Submitted & Locked' : hallAllocs.length > 0 ? 'Draft In Progress' : 'No Seated Candidates'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Breakdown & Session Comparison Grid (Module 6-1) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Attendance Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Department-Wise Attendance Performance
                </h4>
                <div className="space-y-4 text-xs">
                  {departments.map((dept) => {
                    const deptStudents = students.filter(s => s.department === dept.name);
                    const deptAllocs = currentExamAllocations.filter(a => {
                      const st = students.find(s => s.id === a.student_id);
                      return st?.department === dept.name;
                    });
                    const deptAtt = currentExamAttendance.filter(a => {
                      const st = students.find(s => s.id === a.student_id);
                      return st?.department === dept.name;
                    });
                    const pres = deptAtt.filter(a => a.status === 'Present').length;
                    const abs = deptAtt.filter(a => a.status === 'Absent').length;
                    const pct = deptAllocs.length > 0 ? Math.round((pres / deptAllocs.length) * 100) : 0;

                    return (
                      <div key={dept.id} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{dept.name} ({dept.code})</span>
                          <span className="text-slate-500 text-[11px]">
                            {pres} Present / {abs} Absent · {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session-Wise Comparison (FN vs AN) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                  Session-Wise Examination Comparison (FN vs AN)
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Morning (FN Session)</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">09:30 AM</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Papers: {examinations.filter(e => e.session.startsWith('Morning')).length} Scheduled
                    </div>
                    <div className="font-bold text-slate-900">
                      Attendance: 92% (Historical Avg)
                    </div>
                    <div className="text-[10px] text-slate-400">Regular mid-semester examinations</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>Afternoon (AN Session)</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">02:00 PM</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Papers: {examinations.filter(e => e.session.startsWith('Afternoon')).length} Scheduled
                    </div>
                    <div className="font-bold text-slate-900">
                      Attendance: 96% (Historical Avg)
                    </div>
                    <div className="text-[10px] text-slate-400">Elective & special laboratory sessions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 10: Institutional Audit Trail & Activity Logs (Module 6-2) */}
        {activeTab === 'audit' && (
          <AuditTrail 
            initialLogs={auditLogs} 
            onRefreshParent={refreshData} 
          />
        )}
      </div>

      {/* Modal: Schedule Examination (Module 1 Mandatory Fields) */}
      {isAddExamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Module 1 — Schedule New Examination</h3>
            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    value={newExamCourseCode}
                    onChange={(e) => setNewExamCourseCode(e.target.value)}
                    placeholder="e.g. CS-610"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    value={newExamAcademicYear}
                    onChange={(e) => setNewExamAcademicYear(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Examination Title *</label>
                <input
                  type="text"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Cognitive Systems"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Course Name</label>
                <input
                  type="text"
                  value={newExamCourseName}
                  onChange={(e) => setNewExamCourseName(e.target.value)}
                  placeholder="e.g. Cognitive Systems"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session Timing *</label>
                  <select
                    value={newExamSession}
                    onChange={(e) => setNewExamSession(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Morning (09:30 AM - 12:30 PM)">FN: Morning (09:30 AM - 12:30 PM)</option>
                    <option value="Afternoon (02:00 PM - 05:00 PM)">AN: Afternoon (02:00 PM - 05:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newExamDept}
                    onChange={(e) => setNewExamDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicable Sections *</label>
                  <input
                    type="text"
                    value={newExamSection}
                    onChange={(e) => setNewExamSection(e.target.value)}
                    placeholder="e.g. Sec-A & Sec-B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddExamOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  Save Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Exam Hall (Module 2) */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Module 2 — Register Examination Hall</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hall Designation *</label>
                <input
                  type="text"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g. Hall 203 - Dijkstra Wing"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Building / Block *</label>
                <input
                  type="text"
                  value={newRoomBuilding}
                  onChange={(e) => setNewRoomBuilding(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newRoomRows}
                    onChange={(e) => setNewRoomRows(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRoomColumns}
                    onChange={(e) => setNewRoomColumns(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Faculty In-Charge</label>
                <select
                  value={newRoomIncharge}
                  onChange={(e) => setNewRoomIncharge(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Prof. Sarah Jenkins">Prof. Sarah Jenkins (CSE)</option>
                  <option value="Dr. Raymond Holt">Dr. Raymond Holt (ECE)</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  Register Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module 1: Manual Student Entry & CSV Bulk Registration Modal */}
      <ManualStudentEntryModal
        isOpen={isAddStudentOpen}
        onClose={() => {
          setIsAddStudentOpen(false);
          setSelectedStudentToEdit(null);
        }}
        onStudentSaved={async () => {
          await refreshData();
          showNotification('Student candidate registry updated in Cloud Firestore.');
        }}
        departments={departments}
        performedBy={{ id: 'usr-admin-01', name: 'Administrator' }}
        editStudent={selectedStudentToEdit}
      />

      {/* Smart Seat Allocation Optimizer Modal (Requirements 1 - 10) */}
      <SmartSeatAllocationModal
        isOpen={isSmartAllocModalOpen}
        onClose={() => setIsSmartAllocModalOpen(false)}
        plan={smartAllocPlan}
        isLoading={isGeneratingSmartPlan}
        onConfirm={handleConfirmSmartAllocation}
        isCommitting={isCommittingSmartPlan}
        interleaveEnabled={interleaveDepartments}
        onToggleInterleave={setInterleaveDepartments}
        useMinimumRooms={useMinimumRooms}
        onToggleMinimumRooms={setUseMinimumRooms}
        onRecompute={handleRecomputeSmartPlan}
      />

      {/* Visual Seating Map Modal (Triggered by any View Seating Map button) */}
      {isSeatingMapModalOpen && (
        <SeatingMapViewer
          rooms={rooms}
          examinations={examinations}
          allocations={allocations}
          attendance={attendance}
          initialRoomId={activeSeatingMapRoomId}
          initialExamId={selectedExamId}
          onClose={() => setIsSeatingMapModalOpen(false)}
          isModal={true}
        />
      )}
    </div>
  );
};
