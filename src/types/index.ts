export type UserRole = 'admin' | 'incharge' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  reg_no?: string;
  department?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  semester: number;
  created_at?: string;
}

export interface StudentRecord {
  id: string;
  full_name: string;
  email?: string;
  reg_no: string;
  department: string;
  section: string;
  semester: number;
  year?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentCSVImportResult {
  totalRows: number;
  validStudents: Omit<StudentRecord, 'id'>[];
  duplicateRegNos: string[];
  invalidRows: Array<{ rowNumber: number; reason: string; data: Record<string, string> }>;
}

export interface Examination {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  exam_date: string;
  session: 'Morning (09:30 AM - 12:30 PM)' | 'Afternoon (02:00 PM - 05:00 PM)';
  department: string;
  semester: number;
  academic_year?: string;
  student_year?: string;
  section?: string;
  eligible_student_ids?: string[];
  assigned_room_ids?: string[];
  assigned_incharge_ids?: string[];
  status?: 'Scheduled' | 'In Progress' | 'Completed';
  total_students?: number;
  is_published: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  building: string;
  capacity: number;
  rows: number;
  columns: number;
  is_active: boolean;
  incharge_id?: string;
  incharge_name?: string;
  created_at: string;
}

export interface Allocation {
  id: string;
  examination_id: string;
  room_id: string;
  student_id: string;
  seat_number: string;
  student_name: string;
  student_reg_no: string;
  student_email?: string;
  course_code: string;
  room_number: string;
  building: string;
  exam_date: string;
  session: string;
  is_published: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  allocation_id: string;
  examination_id: string;
  student_id: string;
  student_name: string;
  student_reg_no: string;
  student_email?: string;
  department?: string;
  section?: string;
  room_id: string;
  room_number: string;
  seat_number: string;
  status: 'Present' | 'Absent' | 'Pending' | 'Unmarked';
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  remarks?: string;
  is_finalized: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: 'examination' | 'room' | 'allocation' | 'attendance' | 'system';
  entity_id?: string;
  performed_by: string;
  performed_by_name?: string;
  details: string;
  timestamp: string;
}

// Module Smart Allocation Optimizer Types
export interface SmartAllocationPlan {
  examinationId: string;
  examinationTitle: string;
  courseCode: string;
  totalStudents: number;
  allocatedStudentsCount: number;
  unallocatedStudentsCount: number;
  totalAvailableSeats: number;
  insufficientCapacityWarning: string | null;
  allocations: Allocation[];
  attendance: AttendanceRecord[];
  unallocatedStudents: Array<{
    student: StudentRecord;
    reason: string;
  }>;
  roomsSummary: Array<{
    roomId: string;
    roomNumber: string;
    building: string;
    capacity: number;
    allocatedCount: number;
    remainingSeats: number;
  }>;
}

// Visual Examination Room Seating Map Types
export type SeatingStatus = 'Allocated' | 'Present' | 'Absent' | 'Unallocated';

export interface SeatingSeat {
  seatNumber: string;
  rowLabel: string;
  colNumber: number;
  status: SeatingStatus;
  allocation?: Allocation;
  attendance?: AttendanceRecord;
  studentName?: string;
  studentRegNo?: string;
  department?: string;
  section?: string;
}

// Exam-Day Exception Radar Types
export type RadarIssueSeverity = 'Critical' | 'Warning' | 'Info' | 'Resolved';
export type RadarIssueType = 
  | 'unallocated_students'
  | 'room_over_capacity'
  | 'attendance_unsubmitted'
  | 'attendance_unmarked'
  | 'incomplete_allocations'
  | 'inconsistent_records';

export interface RadarIssue {
  id: string;
  type: RadarIssueType;
  title: string;
  severity: RadarIssueSeverity;
  description: string;
  affectedExamId?: string;
  affectedExamTitle?: string;
  affectedCourseCode?: string;
  affectedExamDate?: string;
  affectedRoomId?: string;
  affectedRoomNumber?: string;
  affectedStudentId?: string;
  affectedStudentName?: string;
  affectedDepartment?: string;
  suggestedAction: string;
  actionTarget: 'allocations' | 'rooms' | 'attendance' | 'seating_map' | 'exams';
  resolved: boolean;
  count?: number;
}
