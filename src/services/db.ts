import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreService, sanitizeData } from './firestore';
import { 
  Profile, 
  Department, 
  Course, 
  StudentRecord, 
  Examination, 
  Room, 
  Allocation, 
  AttendanceRecord,
  AuditLog,
  SmartAllocationPlan
} from '../types';

export { FirestoreService };

// =========================================================================
// Institutional Seed Records (30 Students, 5 Rooms, 3 Exams, 2 In-Charges)
// =========================================================================

export const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE' },
  { id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH' },
];

export const SEED_COURSES: Course[] = [
  { id: 'crs-601', course_code: 'CS-601', course_name: 'Distributed Systems & Cloud Infrastructure', department: 'Computer Science & Engineering', semester: 6 },
  { id: 'crs-604', course_code: 'CS-604', course_name: 'Formal Methods & Compiler Design', department: 'Computer Science & Engineering', semester: 6 },
  { id: 'crs-607', course_code: 'CS-607', course_name: 'Applied Cryptography & Network Security', department: 'Computer Science & Engineering', semester: 6 },
  { id: 'crs-610', course_code: 'EC-601', course_name: 'Digital Signal Processing & Microcontrollers', department: 'Electronics & Communication Engineering', semester: 6 },
];

export const SEED_PROFILES: Profile[] = [
  {
    id: 'usr-admin-rushil',
    email: 'rushilsrisai5@gmail.com',
    full_name: 'Rushil Sai',
    role: 'admin',
    department: 'Controller of Examinations',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-admin-01',
    email: 'admin@examflow.edu',
    full_name: 'Dr. Arthur Mitchell',
    role: 'admin',
    department: 'Controller of Examinations',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-incharge-01',
    email: 'incharge@examflow.edu',
    full_name: 'Prof. Sarah Jenkins',
    role: 'incharge',
    department: 'Department of Computer Science',
    created_at: '2026-01-12T09:30:00Z',
  },
  {
    id: 'usr-incharge-02',
    email: 'incharge2@examflow.edu',
    full_name: 'Dr. Raymond Holt',
    role: 'incharge',
    department: 'Department of Electronics',
    created_at: '2026-01-14T09:30:00Z',
  },
  {
    id: 'usr-student-01',
    email: 'student@examflow.edu',
    full_name: 'Rushil Sai',
    role: 'student',
    reg_no: '2026-CS-042',
    department: 'Computer Science & Engineering',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'usr-norole-01',
    email: 'norole@examflow.edu',
    full_name: 'Unassigned Account',
    // @ts-expect-error test account with invalid role
    role: 'unassigned_visitor',
    created_at: '2026-02-01T12:00:00Z',
  }
];

// 30 registered students across CSE and ECE (Clearly marked as DEMO DATA)
export const SEED_STUDENTS: StudentRecord[] = [
  { id: 'usr-student-01', full_name: 'Rushil Sai', email: 'student@examflow.edu', reg_no: '2026-CS-042', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-002', full_name: 'Aisha Al-Mansoor', email: 'aisha.m@examflow.edu', reg_no: '2026-CS-015', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-003', full_name: 'Marcus Vance', email: 'marcus.v@examflow.edu', reg_no: '2026-CS-028', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-004', full_name: 'Elena Rostova', email: 'elena.r@examflow.edu', reg_no: '2026-CS-033', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-005', full_name: 'Kavita Patel', email: 'kavita.p@examflow.edu', reg_no: '2026-CS-051', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-006', full_name: 'Liam O\'Connor', email: 'liam.o@examflow.edu', reg_no: '2026-CS-064', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-007', full_name: 'Zhen Chen', email: 'zhen.c@examflow.edu', reg_no: '2026-CS-077', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-008', full_name: 'Sofia Ramirez', email: 'sofia.r@examflow.edu', reg_no: '2026-CS-089', department: 'Computer Science & Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-009', full_name: 'David Kim', email: 'david.k@examflow.edu', reg_no: '2026-CS-092', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-010', full_name: 'Fatima Zahra', email: 'fatima.z@examflow.edu', reg_no: '2026-CS-104', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-011', full_name: 'Ethan Wright', email: 'ethan.w@examflow.edu', reg_no: '2026-CS-112', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-012', full_name: 'Maya Lin', email: 'maya.l@examflow.edu', reg_no: '2026-CS-120', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-013', full_name: 'Alexander Novak', email: 'alex.n@examflow.edu', reg_no: '2026-CS-127', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-014', full_name: 'Chloe Dupont', email: 'chloe.d@examflow.edu', reg_no: '2026-CS-134', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-015', full_name: 'Rohan Sharma', email: 'rohan.s@examflow.edu', reg_no: '2026-CS-141', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-016', full_name: 'Ananya Gupta', email: 'ananya.g@examflow.edu', reg_no: '2026-CS-148', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-017', full_name: 'Lucas Silva', email: 'lucas.s@examflow.edu', reg_no: '2026-CS-155', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-018', full_name: 'Sara Lindqvist', email: 'sara.l@examflow.edu', reg_no: '2026-CS-162', department: 'Computer Science & Engineering', section: 'Sec-B', semester: 6, status: 'Active', is_demo: true },
  // 12 ECE Students
  { id: 'std-019', full_name: 'Arjun Menon', email: 'arjun.m@examflow.edu', reg_no: '2026-EC-011', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-020', full_name: 'Beatriz Costa', email: 'beatriz.c@examflow.edu', reg_no: '2026-EC-019', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-021', full_name: 'Cedric Dubois', email: 'cedric.d@examflow.edu', reg_no: '2026-EC-027', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-022', full_name: 'Devika Pillai', email: 'devika.p@examflow.edu', reg_no: '2026-EC-034', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-023', full_name: 'Gabriel Becker', email: 'gabriel.b@examflow.edu', reg_no: '2026-EC-041', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-024', full_name: 'Hana Takahashi', email: 'hana.t@examflow.edu', reg_no: '2026-EC-048', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-025', full_name: 'Ibrahim Al-Fassi', email: 'ibrahim.f@examflow.edu', reg_no: '2026-EC-055', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-026', full_name: 'Jessica Taylor', email: 'jessica.t@examflow.edu', reg_no: '2026-EC-062', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-027', full_name: 'Kenji Sato', email: 'kenji.s@examflow.edu', reg_no: '2026-EC-069', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-028', full_name: 'Layla Mansour', email: 'layla.m@examflow.edu', reg_no: '2026-EC-076', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-029', full_name: 'Matteo Rossi', email: 'matteo.r@examflow.edu', reg_no: '2026-EC-083', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
  { id: 'std-030', full_name: 'Noor Jahan', email: 'noor.j@examflow.edu', reg_no: '2026-EC-090', department: 'Electronics & Communication Engineering', section: 'Sec-A', semester: 6, status: 'Active', is_demo: true },
];

// 5 Rooms with differing capacities
export const SEED_ROOMS: Room[] = [
  {
    id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    capacity: 8,
    rows: 4,
    columns: 2,
    is_active: true,
    incharge_id: 'usr-incharge-01',
    incharge_name: 'Prof. Sarah Jenkins',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'room-102',
    room_number: 'Hall 102 - Lovelace Auditorium',
    building: 'Science & Engineering Complex',
    capacity: 10,
    rows: 5,
    columns: 2,
    is_active: true,
    incharge_id: 'usr-incharge-02',
    incharge_name: 'Dr. Raymond Holt',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'room-201',
    room_number: 'Hall 201 - von Neumann Gallery',
    building: 'Main Academic Block',
    capacity: 12,
    rows: 4,
    columns: 3,
    is_active: true,
    incharge_id: '',
    incharge_name: 'Unassigned',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'room-202',
    room_number: 'Hall 202 - Hopper Computing Lab',
    building: 'Main Academic Block',
    capacity: 6,
    rows: 3,
    columns: 2,
    is_active: true,
    incharge_id: '',
    incharge_name: 'Unassigned',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'room-301',
    room_number: 'Hall 301 - Shannon Seminar Hall',
    building: 'Electronics Block',
    capacity: 8,
    rows: 4,
    columns: 2,
    is_active: true,
    incharge_id: '',
    incharge_name: 'Unassigned',
    created_at: '2026-02-01T08:00:00Z',
  },
];

// 3 Examinations / sessions
export const SEED_EXAMINATIONS: Examination[] = [
  {
    id: 'exam-2026-01',
    title: 'Advanced Distributed Systems & Cloud Infrastructure',
    course_code: 'CS-601',
    course_name: 'Distributed Systems',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    department: 'Computer Science & Engineering',
    semester: 6,
    status: 'Scheduled',
    total_students: 30,
    is_published: true,
    created_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'exam-2026-02',
    title: 'Formal Methods & Compiler Design',
    course_code: 'CS-604',
    course_name: 'Compiler Architecture',
    exam_date: '2026-10-21',
    session: 'Afternoon (02:00 PM - 05:00 PM)',
    department: 'Computer Science & Engineering',
    semester: 6,
    status: 'Scheduled',
    total_students: 30,
    is_published: true,
    created_at: '2026-02-16T11:00:00Z',
  },
  {
    id: 'exam-2026-03',
    title: 'Applied Cryptography & Network Security',
    course_code: 'CS-607',
    course_name: 'Cybersecurity',
    exam_date: '2026-10-24',
    session: 'Morning (09:30 AM - 12:30 PM)',
    department: 'Computer Science & Engineering',
    semester: 6,
    status: 'Scheduled',
    total_students: 30,
    is_published: true,
    created_at: '2026-02-17T09:00:00Z',
  },
];

// Seed allocations for exam-2026-01 across rooms
export const SEED_ALLOCATIONS: Allocation[] = [
  // Room 101 (8 seats)
  {
    id: 'alloc-01',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'usr-student-01',
    seat_number: 'A-01',
    student_name: 'Rushil Sai',
    student_reg_no: '2026-CS-042',
    student_email: 'student@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-02',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-002',
    seat_number: 'A-02',
    student_name: 'Aisha Al-Mansoor',
    student_reg_no: '2026-CS-015',
    student_email: 'aisha.m@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-03',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-003',
    seat_number: 'B-01',
    student_name: 'Marcus Vance',
    student_reg_no: '2026-CS-028',
    student_email: 'marcus.v@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-04',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-004',
    seat_number: 'B-02',
    student_name: 'Elena Rostova',
    student_reg_no: '2026-CS-033',
    student_email: 'elena.r@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-05',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-005',
    seat_number: 'C-01',
    student_name: 'Kavita Patel',
    student_reg_no: '2026-CS-051',
    student_email: 'kavita.p@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-06',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-006',
    seat_number: 'C-02',
    student_name: 'Liam O\'Connor',
    student_reg_no: '2026-CS-064',
    student_email: 'liam.o@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-07',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-007',
    seat_number: 'D-01',
    student_name: 'Zhen Chen',
    student_reg_no: '2026-CS-077',
    student_email: 'zhen.c@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-08',
    examination_id: 'exam-2026-01',
    room_id: 'room-101',
    student_id: 'std-008',
    seat_number: 'D-02',
    student_name: 'Sofia Ramirez',
    student_reg_no: '2026-CS-089',
    student_email: 'sofia.r@examflow.edu',
    course_code: 'CS-601',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-18',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  // Allocations for Rushil Sai in other published exams so their schedule is complete
  {
    id: 'alloc-09',
    examination_id: 'exam-2026-02',
    room_id: 'room-101',
    student_id: 'usr-student-01',
    seat_number: 'B-04',
    student_name: 'Rushil Sai',
    student_reg_no: '2026-CS-042',
    student_email: 'student@examflow.edu',
    course_code: 'CS-604',
    room_number: 'Hall 101 - Turing Wing',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-21',
    session: 'Afternoon (02:00 PM - 05:00 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'alloc-10',
    examination_id: 'exam-2026-03',
    room_id: 'room-102',
    student_id: 'usr-student-01',
    seat_number: 'C-02',
    student_name: 'Rushil Sai',
    student_reg_no: '2026-CS-042',
    student_email: 'student@examflow.edu',
    course_code: 'CS-607',
    room_number: 'Hall 102 - Lovelace Auditorium',
    building: 'Science & Engineering Complex',
    exam_date: '2026-10-24',
    session: 'Morning (09:30 AM - 12:30 PM)',
    is_published: true,
    created_at: '2026-03-01T10:00:00Z',
  },
];

// Room 101 attendance records: 5 Present, 2 Absent, 1 Pending
export const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-01',
    allocation_id: 'alloc-01',
    examination_id: 'exam-2026-01',
    student_id: 'usr-student-01',
    student_name: 'Rushil Sai',
    student_reg_no: '2026-CS-042',
    student_email: 'student@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'A-01',
    status: 'Present',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:45:00Z',
    is_finalized: false,
  },
  {
    id: 'att-02',
    allocation_id: 'alloc-02',
    examination_id: 'exam-2026-01',
    student_id: 'std-002',
    student_name: 'Aisha Al-Mansoor',
    student_reg_no: '2026-CS-015',
    student_email: 'aisha.m@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'A-02',
    status: 'Present',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:46:00Z',
    is_finalized: false,
  },
  {
    id: 'att-03',
    allocation_id: 'alloc-03',
    examination_id: 'exam-2026-01',
    student_id: 'std-003',
    student_name: 'Marcus Vance',
    student_reg_no: '2026-CS-028',
    student_email: 'marcus.v@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'B-01',
    status: 'Absent',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:47:00Z',
    remarks: 'Medical leave approved by Dean',
    is_finalized: false,
  },
  {
    id: 'att-04',
    allocation_id: 'alloc-04',
    examination_id: 'exam-2026-01',
    student_id: 'std-004',
    student_name: 'Elena Rostova',
    student_reg_no: '2026-CS-033',
    student_email: 'elena.r@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'B-02',
    status: 'Present',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:48:00Z',
    is_finalized: false,
  },
  {
    id: 'att-05',
    allocation_id: 'alloc-05',
    examination_id: 'exam-2026-01',
    student_id: 'std-005',
    student_name: 'Kavita Patel',
    student_reg_no: '2026-CS-051',
    student_email: 'kavita.p@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'C-01',
    status: 'Present',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:49:00Z',
    is_finalized: false,
  },
  {
    id: 'att-06',
    allocation_id: 'alloc-06',
    examination_id: 'exam-2026-01',
    student_id: 'std-006',
    student_name: 'Liam O\'Connor',
    student_reg_no: '2026-CS-064',
    student_email: 'liam.o@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'C-02',
    status: 'Absent',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:50:00Z',
    remarks: 'Unreported absence',
    is_finalized: false,
  },
  {
    id: 'att-07',
    allocation_id: 'alloc-07',
    examination_id: 'exam-2026-01',
    student_id: 'std-007',
    student_name: 'Zhen Chen',
    student_reg_no: '2026-CS-077',
    student_email: 'zhen.c@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'D-01',
    status: 'Present',
    verified_by: 'usr-incharge-01',
    verified_by_name: 'Prof. Sarah Jenkins',
    verified_at: '2026-10-18T09:51:00Z',
    is_finalized: false,
  },
  {
    id: 'att-08',
    allocation_id: 'alloc-08',
    examination_id: 'exam-2026-01',
    student_id: 'std-008',
    student_name: 'Sofia Ramirez',
    student_reg_no: '2026-CS-089',
    student_email: 'sofia.r@examflow.edu',
    room_id: 'room-101',
    room_number: 'Hall 101 - Turing Wing',
    seat_number: 'D-02',
    status: 'Pending',
    verified_by: '',
    is_finalized: false,
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    action: 'SYSTEM_INITIALIZED',
    entity_type: 'system',
    entity_id: 'sys-01',
    performed_by: 'admin@examflow.edu',
    performed_by_name: 'Dr. Arthur Pendelton',
    details: 'ExamFlow database initialized with institutional master datasets and examination catalogs.',
    timestamp: '2026-03-01T08:00:00Z',
  },
  {
    id: 'log-02',
    action: 'EXAM_CREATED',
    entity_type: 'examination',
    entity_id: 'exam-2026-01',
    performed_by: 'admin@examflow.edu',
    performed_by_name: 'Dr. Arthur Pendelton',
    details: 'Scheduled examination CS-601: Advanced Operating Systems & Distributed Architectures.',
    timestamp: '2026-03-01T09:00:00Z',
  },
  {
    id: 'log-03',
    action: 'ROOMS_PROVISIONED',
    entity_type: 'room',
    entity_id: 'room-101',
    performed_by: 'admin@examflow.edu',
    performed_by_name: 'Dr. Arthur Pendelton',
    details: 'Provisioned 5 examination venues with calibrated seating matrices across SEC Complex.',
    timestamp: '2026-03-01T09:15:00Z',
  },
  {
    id: 'log-04',
    action: 'ALLOCATION_GENERATED',
    entity_type: 'allocation',
    entity_id: 'exam-2026-01',
    performed_by: 'admin@examflow.edu',
    performed_by_name: 'Dr. Arthur Pendelton',
    details: 'Auto-allocated 8 candidates into Hall 101 with collision-free seat assignments.',
    timestamp: '2026-03-01T10:00:00Z',
  },
  {
    id: 'log-05',
    action: 'SCHEDULE_PUBLISHED',
    entity_type: 'examination',
    entity_id: 'exam-2026-01',
    performed_by: 'admin@examflow.edu',
    performed_by_name: 'Dr. Arthur Pendelton',
    details: 'Published official examination schedule and hall tickets for CS-601 to student portals.',
    timestamp: '2026-03-01T10:15:00Z',
  },
  {
    id: 'log-06',
    action: 'ATTENDANCE_DRAFT_SAVED',
    entity_type: 'attendance',
    entity_id: 'exam-2026-01_room-101',
    performed_by: 'incharge@examflow.edu',
    performed_by_name: 'Prof. Sarah Jenkins',
    details: 'Invigilator recorded draft attendance: 5 Present, 2 Absent, 1 Unmarked.',
    timestamp: '2026-10-18T09:55:00Z',
  },
];

// Write seed data directly to Firestore collections
export async function seedFirestoreDatabase(force: boolean = false): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'examinations'));
    if (!snap.empty && !force) {
      return; // Already populated
    }

    console.log('Populating Firestore collections with institutional seed records...');
    
    // Batch 1: Profiles, Departments, Courses, Students
    const batch1 = writeBatch(db);
    for (const p of SEED_PROFILES) {
      batch1.set(doc(db, 'profiles', p.id), sanitizeData(p));
      batch1.set(doc(db, 'users', p.id), sanitizeData(p));
    }
    for (const d of SEED_DEPARTMENTS) {
      batch1.set(doc(db, 'departments', d.id), sanitizeData(d));
    }
    for (const c of SEED_COURSES) {
      batch1.set(doc(db, 'courses', c.id), sanitizeData(c));
    }
    for (const s of SEED_STUDENTS) {
      batch1.set(doc(db, 'students', s.id), sanitizeData(s));
    }
    await batch1.commit();

    // Batch 2: Rooms, Examinations, Allocations, Attendance, Audit Logs
    const batch2 = writeBatch(db);
    for (const r of SEED_ROOMS) {
      batch2.set(doc(db, 'rooms', r.id), sanitizeData(r));
    }
    for (const e of SEED_EXAMINATIONS) {
      batch2.set(doc(db, 'examinations', e.id), sanitizeData(e));
    }
    for (const a of SEED_ALLOCATIONS) {
      batch2.set(doc(db, 'allocations', a.id), sanitizeData(a));
    }
    for (const at of SEED_ATTENDANCE) {
      batch2.set(doc(db, 'attendance', at.id), sanitizeData(at));
    }
    for (const log of SEED_AUDIT_LOGS) {
      batch2.set(doc(db, 'audit_logs', log.id), sanitizeData(log));
    }
    await batch2.commit();
    console.log('Firestore seed data committed successfully.');
  } catch (err) {
    console.warn('Firestore seeding note:', err);
    throw err;
  }
}

// =========================================================================
// Real Cloud Firestore Database Service
// =========================================================================

export const DatabaseService = {
  // Profiles
  async getProfile(userId: string, email?: string): Promise<Profile | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        return snap.data() as Profile;
      }

      if (email) {
        const q = query(collection(db, 'profiles'), where('email', '==', email.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const docData = querySnap.docs[0].data() as Profile;
          await setDoc(doc(db, 'profiles', userId), { ...docData, id: userId });
          return { ...docData, id: userId };
        }
      }

      const seedMatch = SEED_PROFILES.find((p) => p.id === userId || (email && p.email.toLowerCase() === email.toLowerCase()));
      if (seedMatch) {
        const profileObj = { ...seedMatch, id: userId };
        await setDoc(doc(db, 'profiles', userId), profileObj);
        return profileObj;
      }

      return null;
    } catch (err) {
      console.error('Error fetching profile from Firestore:', err);
      throw err;
    }
  },

  async saveProfile(profile: Profile): Promise<void> {
    try {
      await setDoc(doc(db, 'profiles', profile.id), profile, { merge: true });
    } catch (err) {
      console.error('Error saving profile to Firestore:', err);
      throw err;
    }
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Department);
      }
    } catch (err) {
      console.error('Error getting departments from Firestore:', err);
      throw err;
    }
    return [];
  },

  async createDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
    const id = `dept-${Date.now()}`;
    const newDept: Department = { ...dept, id, created_at: new Date().toISOString() };
    await setDoc(doc(db, 'departments', id), newDept);
    return newDept;
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Course);
      }
    } catch (err) {
      console.error('Error getting courses from Firestore:', err);
      throw err;
    }
    return [];
  },

  async createCourse(course: Omit<Course, 'id'>): Promise<Course> {
    const id = `crs-${Date.now()}`;
    const newCourse: Course = { ...course, id, created_at: new Date().toISOString() };
    await setDoc(doc(db, 'courses', id), newCourse);
    return newCourse;
  },

  // Students
  async checkDuplicateRegNo(regNo: string, excludeStudentId?: string): Promise<boolean> {
    const clean = regNo.trim().toUpperCase();
    const students = await this.getStudents();
    return students.some(
      (s) => s.reg_no.trim().toUpperCase() === clean && (!excludeStudentId || s.id !== excludeStudentId)
    );
  },

  async getStudents(): Promise<StudentRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as StudentRecord);
      }
    } catch (err) {
      console.error('Error getting students from Firestore:', err);
      throw err;
    }
    return [];
  },

  async getStudentById(studentId: string): Promise<StudentRecord | null> {
    try {
      const snap = await getDoc(doc(db, 'students', studentId));
      if (snap.exists()) {
        return snap.data() as StudentRecord;
      }
    } catch (err) {
      console.error('Error fetching student by ID:', err);
    }
    const all = await this.getStudents();
    return all.find((s) => s.id === studentId) || null;
  },

  async createStudent(
    student: Omit<StudentRecord, 'id'>,
    performedBy?: { id: string; name: string }
  ): Promise<StudentRecord> {
    if (!student.full_name?.trim()) {
      throw new Error('Student Full Name is required.');
    }
    if (!student.reg_no?.trim()) {
      throw new Error('Registration / Roll Number is required.');
    }
    if (!student.department?.trim()) {
      throw new Error('Department is required.');
    }
    if (!student.section?.trim()) {
      throw new Error('Section is required.');
    }

    const cleanRegNo = student.reg_no.trim().toUpperCase();
    const isDup = await this.checkDuplicateRegNo(cleanRegNo);
    if (isDup) {
      throw new Error(`A student candidate with Registration Number "${cleanRegNo}" already exists in the system.`);
    }

    const id = `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStd: StudentRecord = {
      ...student,
      id,
      reg_no: cleanRegNo,
      full_name: student.full_name.trim(),
      department: student.department.trim(),
      section: student.section.trim(),
      semester: Number(student.semester) || 1,
      status: student.status || 'Active',
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'students', id), sanitizeData(newStd));

    await this.addAuditLog({
      action: 'STUDENT_MANUAL_ENTRY',
      entity_type: 'system',
      entity_id: id,
      performed_by: performedBy?.id || 'admin',
      performed_by_name: performedBy?.name || 'Administrator',
      details: `Candidate registered: ${newStd.full_name} (${newStd.reg_no}) in ${newStd.department} - ${newStd.section}.`,
    });

    return newStd;
  },

  async updateStudent(
    studentId: string,
    updates: Partial<StudentRecord>,
    performedBy?: { id: string; name: string }
  ): Promise<void> {
    if (updates.reg_no) {
      const cleanRegNo = updates.reg_no.trim().toUpperCase();
      const isDup = await this.checkDuplicateRegNo(cleanRegNo, studentId);
      if (isDup) {
        throw new Error(`A student candidate with Registration Number "${cleanRegNo}" already exists.`);
      }
      updates.reg_no = cleanRegNo;
    }

    const cleanUpdates: Partial<StudentRecord> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (cleanUpdates.full_name) cleanUpdates.full_name = cleanUpdates.full_name.trim();
    if (cleanUpdates.department) cleanUpdates.department = cleanUpdates.department.trim();
    if (cleanUpdates.section) cleanUpdates.section = cleanUpdates.section.trim();
    if (cleanUpdates.semester) cleanUpdates.semester = Number(cleanUpdates.semester);

    await updateDoc(doc(db, 'students', studentId), sanitizeData(cleanUpdates));

    await this.addAuditLog({
      action: 'STUDENT_RECORD_UPDATED',
      entity_type: 'system',
      entity_id: studentId,
      performed_by: performedBy?.id || 'admin',
      performed_by_name: performedBy?.name || 'Administrator',
      details: `Student record updated: ${studentId}. Fields: ${Object.keys(updates).join(', ')}.`,
    });
  },

  async toggleStudentStatus(
    studentId: string,
    newStatus: 'Active' | 'Inactive',
    performedBy?: { id: string; name: string }
  ): Promise<void> {
    await this.updateStudent(studentId, { status: newStatus }, performedBy);
  },

  async bulkImportStudents(
    studentsList: Omit<StudentRecord, 'id'>[],
    performedBy?: { id: string; name: string }
  ): Promise<{ importedCount: number; errors: string[] }> {
    const currentStudents = await this.getStudents();
    const existingRegNos = new Set(currentStudents.map((s) => s.reg_no.trim().toUpperCase()));
    const seenInBatch = new Set<string>();

    const validList: StudentRecord[] = [];
    const errors: string[] = [];

    for (let i = 0; i < studentsList.length; i++) {
      const s = studentsList[i];
      const rowNum = i + 1;
      const cleanRegNo = s.reg_no ? s.reg_no.trim().toUpperCase() : '';

      if (!s.full_name?.trim()) {
        errors.push(`Row ${rowNum}: Student Full Name is missing.`);
        continue;
      }
      if (!cleanRegNo) {
        errors.push(`Row ${rowNum}: Registration/Roll Number is missing.`);
        continue;
      }
      if (!s.department?.trim()) {
        errors.push(`Row ${rowNum}: Department is missing.`);
        continue;
      }
      if (existingRegNos.has(cleanRegNo)) {
        errors.push(`Row ${rowNum}: Registration Number "${cleanRegNo}" already exists in the system.`);
        continue;
      }
      if (seenInBatch.has(cleanRegNo)) {
        errors.push(`Row ${rowNum}: Duplicate Registration Number "${cleanRegNo}" within the imported CSV file.`);
        continue;
      }

      seenInBatch.add(cleanRegNo);
      const id = `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`;
      validList.push({
        ...s,
        id,
        reg_no: cleanRegNo,
        full_name: s.full_name.trim(),
        department: s.department.trim(),
        section: (s.section || 'Sec-A').trim(),
        semester: Number(s.semester) || 1,
        status: s.status || 'Active',
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    if (validList.length > 0) {
      const batch = writeBatch(db);
      for (const student of validList) {
        batch.set(doc(db, 'students', student.id), sanitizeData(student));
      }
      await batch.commit();

      await this.addAuditLog({
        action: 'STUDENTS_BULK_IMPORTED',
        entity_type: 'system',
        performed_by: performedBy?.id || 'admin',
        performed_by_name: performedBy?.name || 'Administrator',
        details: `Bulk imported ${validList.length} candidate student record(s) via CSV.`,
      });
    }

    return { importedCount: validList.length, errors };
  },

  async deleteStudent(
    studentId: string,
    performedBy?: { id: string; name: string }
  ): Promise<void> {
    // Check if student has active examination allocations
    const allocs = await this.getAllocations();
    const studentAllocs = allocs.filter((a) => a.student_id === studentId);
    if (studentAllocs.length > 0) {
      throw new Error(`Cannot delete candidate: student has ${studentAllocs.length} active examination seating allocation(s). Remove allocations first.`);
    }

    await deleteDoc(doc(db, 'students', studentId));

    await this.addAuditLog({
      action: 'STUDENT_RECORD_DELETED',
      entity_type: 'system',
      entity_id: studentId,
      performed_by: performedBy?.id || 'admin',
      performed_by_name: performedBy?.name || 'Administrator',
      details: `Student record ID ${studentId} removed from institutional registry.`,
    });
  },

  // Module 2 & 4: Manual Attendance Recording with Audit Trail
  async recordAttendanceManual(params: {
    examinationId: string;
    roomId: string;
    studentId: string;
    status: 'Present' | 'Absent';
    remarks?: string;
    verifiedBy: string;
    verifiedByName: string;
    isCorrection?: boolean;
    correctionReason?: string;
  }): Promise<{ record: AttendanceRecord; isCorrection: boolean }> {
    const { examinationId, roomId, studentId, status, remarks, verifiedBy, verifiedByName, correctionReason } = params;

    const students = await this.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error('Student record not found in system.');
    }

    // Module 3 Requirement: Student MUST be allocated to this exam and hall before recording attendance
    const allocs = await this.getAllocations(examinationId);
    const studentAlloc = allocs.find((a) => a.student_id === studentId && a.room_id === roomId);
    if (!studentAlloc) {
      throw new Error(`Student ${student.full_name} (${student.reg_no}) is NOT allocated to room ${roomId} for this examination. Please allocate the student first.`);
    }

    const existingAtt = await this.getAttendance(examinationId, roomId);
    const currentRecord = existingAtt.find((a) => a.student_id === studentId);

    const now = new Date().toISOString();
    const attendanceId = currentRecord ? currentRecord.id : `att-${Date.now()}-${studentId}`;
    const previousStatus = currentRecord ? currentRecord.status : 'Unmarked';
    const isStatusChange = currentRecord && currentRecord.status !== status && currentRecord.status !== 'Pending' && currentRecord.status !== 'Unmarked';

    const updatedRecord: AttendanceRecord = {
      id: attendanceId,
      allocation_id: studentAlloc.id,
      examination_id: examinationId,
      student_id: studentId,
      student_name: student.full_name,
      student_reg_no: student.reg_no,
      student_email: student.email,
      department: student.department,
      section: student.section,
      room_id: roomId,
      room_number: studentAlloc.room_number,
      seat_number: studentAlloc.seat_number,
      status,
      verified_by: verifiedBy,
      verified_by_name: verifiedByName,
      verified_at: now,
      remarks: remarks !== undefined ? remarks : currentRecord?.remarks || '',
      is_finalized: currentRecord?.is_finalized ?? false,
    };

    await setDoc(doc(db, 'attendance', attendanceId), sanitizeData(updatedRecord));

    if (isStatusChange) {
      await this.addAuditLog({
        action: 'ATTENDANCE_CORRECTION',
        entity_type: 'attendance',
        entity_id: attendanceId,
        performed_by: verifiedBy,
        performed_by_name: verifiedByName,
        details: `Attendance corrected for ${student.full_name} (${student.reg_no}) in hall ${studentAlloc.room_number}: Changed from "${previousStatus}" to "${status}".${correctionReason ? ` Reason: ${correctionReason}` : remarks ? ` Remarks: ${remarks}` : ''}`,
      });
    } else {
      await this.addAuditLog({
        action: 'ATTENDANCE_RECORDED',
        entity_type: 'attendance',
        entity_id: attendanceId,
        performed_by: verifiedBy,
        performed_by_name: verifiedByName,
        details: `Attendance marked as "${status}" for ${student.full_name} (${student.reg_no}) in hall ${studentAlloc.room_number}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      });
    }

    return { record: updatedRecord, isCorrection: !!isStatusChange };
  },

  // Module 3: Allocate Unallocated Student Manually
  async allocateUnallocatedStudent(params: {
    examinationId: string;
    roomId: string;
    studentId: string;
    seatNumber?: string;
    allocatedBy: string;
    allocatedByName: string;
  }): Promise<Allocation> {
    const allocation = await this.manualAllocateStudent({
      examinationId: params.examinationId,
      roomId: params.roomId,
      studentId: params.studentId,
      seatNumber: params.seatNumber,
    });

    await this.addAuditLog({
      action: 'STUDENT_UNALLOCATED_ADDED',
      entity_type: 'allocation',
      entity_id: allocation.id,
      performed_by: params.allocatedBy,
      performed_by_name: params.allocatedByName,
      details: `Unallocated candidate ${allocation.student_name} (${allocation.student_reg_no}) officially allocated to Hall ${allocation.room_number}, Seat ${allocation.seat_number}.`,
    });

    return allocation;
  },

  // Examinations
  async getExaminations(): Promise<Examination[]> {
    try {
      const list = await FirestoreService.getExaminations();
      return list;
    } catch (err) {
      console.error('Error loading examinations from Firestore:', err);
      throw err;
    }
  },

  // Duplicate examination check
  async checkDuplicateExamination(
    courseCode: string,
    examDate: string,
    session: string,
    department: string,
    excludeExamId?: string
  ): Promise<boolean> {
    const exams = await this.getExaminations();
    return exams.some((e) => {
      if (excludeExamId && e.id === excludeExamId) return false;
      return (
        e.course_code.toLowerCase().trim() === courseCode.toLowerCase().trim() &&
        e.exam_date === examDate &&
        e.session === session &&
        e.department.toLowerCase().trim() === department.toLowerCase().trim()
      );
    });
  },

  async createExamination(exam: Omit<Examination, 'id' | 'created_at'>): Promise<Examination> {
    const isDup = await this.checkDuplicateExamination(
      exam.course_code,
      exam.exam_date,
      exam.session,
      exam.department
    );
    if (isDup) {
      throw new Error(`An examination for course ${exam.course_code} is already scheduled on ${exam.exam_date} (${exam.session}) in ${exam.department}.`);
    }
    return FirestoreService.createExamination(exam);
  },

  async updateExamination(examId: string, updates: Partial<Examination>): Promise<void> {
    if (updates.course_code && updates.exam_date && updates.session && updates.department) {
      const isDup = await this.checkDuplicateExamination(
        updates.course_code,
        updates.exam_date,
        updates.session,
        updates.department,
        examId
      );
      if (isDup) {
        throw new Error(`Duplicate examination detected for course ${updates.course_code} on ${updates.exam_date}.`);
      }
    }
    await FirestoreService.updateExamination(examId, updates);
  },

  async deleteExamination(examId: string): Promise<void> {
    await FirestoreService.deleteExamination(examId);
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    try {
      const list = await FirestoreService.getRooms();
      return list;
    } catch (err) {
      console.error('Error loading rooms from Firestore:', err);
      throw err;
    }
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at'>): Promise<Room> {
    const existing = await this.getRooms();
    const isDup = existing.some(
      (r) => r.room_number.toLowerCase().trim() === room.room_number.toLowerCase().trim() &&
             r.building.toLowerCase().trim() === room.building.toLowerCase().trim()
    );
    if (isDup) {
      throw new Error(`A room named "${room.room_number}" in building "${room.building}" already exists.`);
    }
    return FirestoreService.createRoom(room);
  },

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    if (updates.capacity !== undefined) {
      // Check if current allocations in any scheduled exam exceed the new capacity
      const allAllocations = await this.getAllocations();
      const roomAllocs = allAllocations.filter((a) => a.room_id === roomId);
      if (roomAllocs.length > updates.capacity) {
        throw new Error(`Cannot reduce room capacity to ${updates.capacity}: ${roomAllocs.length} candidates are currently allocated to this hall.`);
      }
    }
    await FirestoreService.updateRoom(roomId, updates);
  },

  async deleteRoom(roomId: string): Promise<void> {
    // Prevent deletion if allocations depend on this room
    const allAllocations = await this.getAllocations();
    const roomAllocs = allAllocations.filter((a) => a.room_id === roomId);
    if (roomAllocs.length > 0) {
      throw new Error(`Cannot delete room: ${roomAllocs.length} candidate allocation(s) depend on this hall. Remove or reassign candidates first.`);
    }
    await FirestoreService.deleteRoom(roomId);
  },

  // Allocations
  async getAllocations(examinationId?: string): Promise<Allocation[]> {
    try {
      const list = await FirestoreService.getAllocations(examinationId);
      return list;
    } catch (err) {
      console.error('Error loading allocations from Firestore:', err);
      throw err;
    }
  },

  // Smart student room allocation with capacity validation & Minimum Room mode
  async autoAllocateStudents(
    examinationId: string,
    options: { useMinimumRooms?: boolean; resetExisting?: boolean } = {}
  ): Promise<{
    allocatedCount: number;
    unallocatedCount: number;
    allocations: Allocation[];
    roomsUsed: number;
  }> {
    const exams = await this.getExaminations();
    const exam = exams.find((e) => e.id === examinationId);
    if (!exam) throw new Error('Examination not found');

    let rooms = (await this.getRooms()).filter((r) => r.is_active);
    if (rooms.length === 0) {
      throw new Error('No active examination halls available for allocation.');
    }

    const students = await this.getStudents();
    if (students.length === 0) {
      throw new Error('No registered candidates found.');
    }

    // Filter to eligible students if specified on the exam, else all students in department/year
    const eligibleStudents = exam.eligible_student_ids && exam.eligible_student_ids.length > 0
      ? students.filter((s) => exam.eligible_student_ids!.includes(s.id))
      : students;

    // Handle existing allocations
    let currentAllocations = await this.getAllocations(examinationId);
    if (options.resetExisting) {
      // Clear previous allocations and attendance for this exam
      await FirestoreService.deleteAllocationsByExam(examinationId);
      currentAllocations = [];
    }

    const allocatedStudentIds = new Set(currentAllocations.map((a) => a.student_id));
    const studentsToAllocate = eligibleStudents.filter((s) => !allocatedStudentIds.has(s.id));

    // Calculate occupied seats in active rooms
    const occupiedPerRoom: Record<string, number> = {};
    for (const a of currentAllocations) {
      occupiedPerRoom[a.room_id] = (occupiedPerRoom[a.room_id] || 0) + 1;
    }

    // Module 2 Algorithm: "Use Minimum Number of Rooms"
    if (options.useMinimumRooms) {
      // Sort rooms by remaining available capacity descending (prefer higher capacity rooms)
      rooms = [...rooms].sort((a, b) => {
        const remA = a.capacity - (occupiedPerRoom[a.id] || 0);
        const remB = b.capacity - (occupiedPerRoom[b.id] || 0);
        return remB - remA;
      });
    }

    const newAllocations: Allocation[] = [];
    const newAttendance: AttendanceRecord[] = [];
    let currentRoomIndex = 0;

    for (const student of studentsToAllocate) {
      while (currentRoomIndex < rooms.length) {
        const room = rooms[currentRoomIndex];
        const occupied = occupiedPerRoom[room.id] || 0;
        if (occupied < room.capacity) {
          const seatIndex = occupied;
          const rowIndex = String.fromCharCode(65 + Math.floor(seatIndex / room.columns));
          const colIndex = String((seatIndex % room.columns) + 1).padStart(2, '0');
          const seatNumber = `${rowIndex}-${colIndex}`;

          const allocId = `alloc-${Date.now()}-${student.id}`;
          const allocation: Allocation = {
            id: allocId,
            examination_id: exam.id,
            room_id: room.id,
            student_id: student.id,
            seat_number: seatNumber,
            student_name: student.full_name,
            student_reg_no: student.reg_no,
            student_email: student.email,
            course_code: exam.course_code,
            room_number: room.room_number,
            building: room.building,
            exam_date: exam.exam_date,
            session: exam.session,
            is_published: exam.is_published ?? false,
            created_at: new Date().toISOString(),
          };

          newAllocations.push(allocation);
          occupiedPerRoom[room.id] = occupied + 1;

          newAttendance.push({
            id: `att-${Date.now()}-${student.id}`,
            allocation_id: allocId,
            examination_id: exam.id,
            student_id: student.id,
            student_name: student.full_name,
            student_reg_no: student.reg_no,
            student_email: student.email,
            room_id: room.id,
            room_number: room.room_number,
            seat_number: seatNumber,
            status: 'Pending',
            is_finalized: false,
          });

          break;
        } else {
          currentRoomIndex++;
        }
      }

      if (currentRoomIndex >= rooms.length) {
        break; // Rooms completely filled
      }
    }

    // Save batch to Firestore
    if (newAllocations.length > 0) {
      const batch = writeBatch(db);
      for (const a of newAllocations) {
        batch.set(doc(db, 'allocations', a.id), sanitizeData(a));
      }
      for (const att of newAttendance) {
        batch.set(doc(db, 'attendance', att.id), sanitizeData(att));
      }
      await batch.commit();
    }

    const allAllocations = [...currentAllocations, ...newAllocations];
    const unallocatedCount = Math.max(0, eligibleStudents.length - allAllocations.length);
    const roomsUsed = new Set(allAllocations.map((a) => a.room_id)).size;

    return {
      allocatedCount: allAllocations.length,
      unallocatedCount,
      allocations: allAllocations,
      roomsUsed,
    };
  },

  // Smart Seat Allocation Optimizer with Alternating Seating & Preview
  async generateSmartAllocationPlan(params: {
    examinationId: string;
    interleaveDepartments?: boolean;
    useMinimumRooms?: boolean;
    resetExisting?: boolean;
  }): Promise<SmartAllocationPlan> {
    const exams = await this.getExaminations();
    const exam = exams.find((e) => e.id === params.examinationId);
    if (!exam) throw new Error('Examination not found');

    let rooms = (await this.getRooms()).filter((r) => r.is_active);
    if (rooms.length === 0) {
      throw new Error('No active examination halls available for allocation. Please activate or register a hall.');
    }

    const students = await this.getStudents();
    if (students.length === 0) {
      throw new Error('No registered student candidates found.');
    }

    // Determine eligible candidates for this exam
    let eligibleStudents: StudentRecord[] = [];
    if (exam.eligible_student_ids && exam.eligible_student_ids.length > 0) {
      eligibleStudents = students.filter((s) => exam.eligible_student_ids!.includes(s.id));
    } else {
      const deptMatches = students.filter((s) => s.department === exam.department);
      eligibleStudents = deptMatches.length > 0 ? deptMatches : students;
    }

    // Calculate current allocations if not resetting
    let currentAllocations = await this.getAllocations(params.examinationId);
    if (params.resetExisting) {
      currentAllocations = [];
    }

    const allocatedStudentIds = new Set(currentAllocations.map((a) => a.student_id));
    const studentsToAllocate = eligibleStudents.filter((s) => !allocatedStudentIds.has(s.id));

    // Calculate total available seats across all active rooms
    const totalAvailableSeats = rooms.reduce((sum, r) => sum + r.capacity, 0);

    // Warning if total room capacity is insufficient
    let insufficientCapacityWarning: string | null = null;
    if (totalAvailableSeats < eligibleStudents.length) {
      const shortage = eligibleStudents.length - totalAvailableSeats;
      insufficientCapacityWarning = `Warning: Total active room capacity (${totalAvailableSeats} seats) is insufficient for ${eligibleStudents.length} eligible candidates. A minimum of ${shortage} candidate(s) cannot be accommodated until additional halls are registered or activated.`;
    }

    // Alternating arrangement: interleave students from different departments or sections
    let orderedStudents: StudentRecord[] = [...studentsToAllocate];
    if (params.interleaveDepartments !== false) {
      const groups: Record<string, StudentRecord[]> = {};
      for (const s of studentsToAllocate) {
        const groupKey = `${s.department || 'General'}__${s.section || 'Sec-A'}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(s);
      }

      const keys = Object.keys(groups);
      orderedStudents = [];
      let round = 0;
      let hasMore = true;
      while (hasMore) {
        hasMore = false;
        for (const key of keys) {
          if (groups[key][round]) {
            orderedStudents.push(groups[key][round]);
            hasMore = true;
          }
        }
        round++;
      }
    }

    // Room ordering: if Minimum Rooms mode is enabled, sort rooms by capacity descending
    if (params.useMinimumRooms) {
      rooms = [...rooms].sort((a, b) => b.capacity - a.capacity);
    }

    // Track occupied seats per room
    const occupiedPerRoom: Record<string, number> = {};
    for (const a of currentAllocations) {
      occupiedPerRoom[a.room_id] = (occupiedPerRoom[a.room_id] || 0) + 1;
    }

    const newAllocations: Allocation[] = [];
    const newAttendance: AttendanceRecord[] = [];
    const unallocatedStudents: Array<{ student: StudentRecord; reason: string }> = [];

    let currentRoomIndex = 0;

    for (const student of orderedStudents) {
      // Check if student already allocated
      if (allocatedStudentIds.has(student.id)) {
        unallocatedStudents.push({
          student,
          reason: 'Student is already assigned to a hall for this examination.',
        });
        continue;
      }

      let placed = false;
      while (currentRoomIndex < rooms.length) {
        const room = rooms[currentRoomIndex];
        const occupied = occupiedPerRoom[room.id] || 0;

        if (occupied < room.capacity) {
          const seatIndex = occupied;
          const cols = room.columns || 4;
          const rowIndex = String.fromCharCode(65 + Math.floor(seatIndex / cols));
          const colIndex = String((seatIndex % cols) + 1).padStart(2, '0');
          const seatNumber = `${rowIndex}-${colIndex}`;

          const allocId = `alloc-${Date.now()}-${student.id}`;
          const allocation: Allocation = {
            id: allocId,
            examination_id: exam.id,
            room_id: room.id,
            student_id: student.id,
            seat_number: seatNumber,
            student_name: student.full_name,
            student_reg_no: student.reg_no,
            student_email: student.email,
            course_code: exam.course_code,
            room_number: room.room_number,
            building: room.building,
            exam_date: exam.exam_date,
            session: exam.session,
            is_published: exam.is_published ?? false,
            created_at: new Date().toISOString(),
          };

          newAllocations.push(allocation);
          occupiedPerRoom[room.id] = occupied + 1;
          allocatedStudentIds.add(student.id);

          newAttendance.push({
            id: `att-${Date.now()}-${student.id}`,
            allocation_id: allocId,
            examination_id: exam.id,
            student_id: student.id,
            student_name: student.full_name,
            student_reg_no: student.reg_no,
            student_email: student.email,
            department: student.department,
            section: student.section,
            room_id: room.id,
            room_number: room.room_number,
            seat_number: seatNumber,
            status: 'Pending',
            is_finalized: false,
          });

          placed = true;
          break;
        } else {
          currentRoomIndex++;
        }
      }

      if (!placed) {
        unallocatedStudents.push({
          student,
          reason: `Hall capacity exhausted: All active halls reached maximum capacity (${totalAvailableSeats} total capacity).`,
        });
      }
    }

    const roomsSummary = rooms.map((r) => {
      const allocCount = occupiedPerRoom[r.id] || 0;
      return {
        roomId: r.id,
        roomNumber: r.room_number,
        building: r.building,
        capacity: r.capacity,
        allocatedCount: allocCount,
        remainingSeats: Math.max(0, r.capacity - allocCount),
      };
    });

    return {
      examinationId: exam.id,
      examinationTitle: exam.title,
      courseCode: exam.course_code,
      totalStudents: eligibleStudents.length,
      allocatedStudentsCount: newAllocations.length + currentAllocations.length,
      unallocatedStudentsCount: unallocatedStudents.length,
      totalAvailableSeats,
      insufficientCapacityWarning,
      allocations: [...currentAllocations, ...newAllocations],
      attendance: newAttendance,
      unallocatedStudents,
      roomsSummary,
    };
  },

  // Commit Smart Allocation Plan to Firestore
  async commitSmartAllocation(plan: SmartAllocationPlan): Promise<void> {
    try {
      // 1. Delete previous allocations for this examination to prevent duplicates
      await FirestoreService.deleteAllocationsByExam(plan.examinationId);

      // 2. Write new allocations and attendance records to Firestore
      if (plan.allocations.length > 0) {
        const batch = writeBatch(db);
        for (const a of plan.allocations) {
          batch.set(doc(db, 'allocations', a.id), sanitizeData(a));
        }
        for (const att of plan.attendance) {
          batch.set(doc(db, 'attendance', att.id), sanitizeData(att));
        }
        await batch.commit();
      }

      // 3. Record audit log
      await this.addAuditLog({
        action: 'SMART_ALLOCATION_COMMITTED',
        entity_type: 'allocation',
        entity_id: plan.examinationId,
        performed_by: 'admin',
        performed_by_name: 'Administrator',
        details: `Smart Seat Allocation Optimizer committed ${plan.allocations.length} candidate seat assignments across ${plan.roomsSummary.filter(r => r.allocatedCount > 0).length} halls with collision-free alternating seating.`,
      });
    } catch (err) {
      console.error('Error committing smart allocation:', err);
      throw err;
    }
  },

  // Manual allocation module: Assign or update single student seat with live capacity verification
  async manualAllocateStudent(params: {
    examinationId: string;
    studentId: string;
    roomId: string;
    seatNumber?: string;
  }): Promise<Allocation> {
    const exams = await this.getExaminations();
    const exam = exams.find((e) => e.id === params.examinationId);
    if (!exam) throw new Error('Examination not found');

    const rooms = await this.getRooms();
    const room = rooms.find((r) => r.id === params.roomId);
    if (!room) throw new Error('Room not found');
    if (!room.is_active) throw new Error(`Room ${room.room_number} is deactivated.`);

    const students = await this.getStudents();
    const student = students.find((s) => s.id === params.studentId);
    if (!student) throw new Error('Student record not found');

    // Live validation against Firestore
    const currentAllocations = await this.getAllocations(params.examinationId);
    
    // Check if student already allocated
    const existingStudentAlloc = currentAllocations.find((a) => a.student_id === params.studentId);

    // Check room capacity
    const roomAllocs = currentAllocations.filter((a) => a.room_id === params.roomId && a.student_id !== params.studentId);
    if (roomAllocs.length >= room.capacity) {
      throw new Error(`Hall ${room.room_number} is at maximum seating capacity (${room.capacity} seats).`);
    }

    // Determine seat number or validate custom seat
    let seatNumber = params.seatNumber;
    if (seatNumber) {
      // Validate uniqueness
      const isTaken = roomAllocs.some((a) => a.seat_number.toLowerCase() === seatNumber!.toLowerCase());
      if (isTaken) {
        throw new Error(`Seat ${seatNumber} in ${room.room_number} is already occupied.`);
      }
    } else {
      // Auto compute next vacant seat in room
      const takenSeats = new Set(roomAllocs.map((a) => a.seat_number));
      for (let i = 0; i < room.capacity; i++) {
        const row = String.fromCharCode(65 + Math.floor(i / room.columns));
        const col = String((i % room.columns) + 1).padStart(2, '0');
        const candidateSeat = `${row}-${col}`;
        if (!takenSeats.has(candidateSeat)) {
          seatNumber = candidateSeat;
          break;
        }
      }
    }

    if (!seatNumber) {
      throw new Error('No vacant seat available in this hall.');
    }

    const allocId = existingStudentAlloc ? existingStudentAlloc.id : `alloc-${Date.now()}-${student.id}`;
    const allocation: Allocation = {
      id: allocId,
      examination_id: exam.id,
      room_id: room.id,
      student_id: student.id,
      seat_number: seatNumber,
      student_name: student.full_name,
      student_reg_no: student.reg_no,
      student_email: student.email,
      course_code: exam.course_code,
      room_number: room.room_number,
      building: room.building,
      exam_date: exam.exam_date,
      session: exam.session,
      is_published: exam.is_published ?? false,
      created_at: existingStudentAlloc?.created_at || new Date().toISOString(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'allocations', allocId), sanitizeData(allocation));

    // Update or create attendance record
    const attId = `att-${Date.now()}-${student.id}`;
    batch.set(doc(db, 'attendance', attId), sanitizeData({
      id: attId,
      allocation_id: allocId,
      examination_id: exam.id,
      student_id: student.id,
      student_name: student.full_name,
      student_reg_no: student.reg_no,
      student_email: student.email,
      room_id: room.id,
      room_number: room.room_number,
      seat_number: seatNumber,
      status: 'Pending',
      is_finalized: false,
    }));

    await batch.commit();
    return allocation;
  },

  // Remove individual allocation
  async removeAllocation(allocationId: string): Promise<void> {
    await FirestoreService.deleteAllocation(allocationId);
  },

  // Publish allocations for examination
  async publishExaminationSchedule(examinationId: string, isPublished: boolean): Promise<void> {
    try {
      // Update examination document
      await updateDoc(doc(db, 'examinations', examinationId), { is_published: isPublished });
      
      // Update allocations
      const snap = await getDocs(query(collection(db, 'allocations'), where('examination_id', '==', examinationId)));
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(doc(db, 'allocations', d.id), { is_published: isPublished });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error publishing schedule in Firestore:', err);
    }
  },

  // Attendance
  async getAttendance(examinationId?: string, roomId?: string): Promise<AttendanceRecord[]> {
    try {
      let q = collection(db, 'attendance');
      if (examinationId && roomId) {
        // @ts-expect-error query
        q = query(collection(db, 'attendance'), where('examination_id', '==', examinationId), where('room_id', '==', roomId));
      } else if (examinationId) {
        // @ts-expect-error query
        q = query(collection(db, 'attendance'), where('examination_id', '==', examinationId));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as AttendanceRecord);
      }
    } catch (err) {
      console.error('Error loading attendance from Firestore:', err);
      throw err;
    }

    return [];
  },

  async updateAttendance(
    attendanceId: string,
    status: 'Present' | 'Absent' | 'Pending' | 'Unmarked',
    verifiedBy?: string,
    verifiedByName?: string,
    remarks?: string
  ): Promise<void> {
    try {
      const updateData: Partial<AttendanceRecord> = {
        status,
        verified_by: verifiedBy,
        verified_by_name: verifiedByName,
        verified_at: new Date().toISOString(),
      };
      if (remarks !== undefined) updateData.remarks = remarks;
      await updateDoc(doc(db, 'attendance', attendanceId), updateData);

      // Audit trail
      await this.addAuditLog({
        action: 'ATTENDANCE_STATUS_UPDATED',
        entity_type: 'attendance',
        entity_id: attendanceId,
        performed_by: verifiedBy || 'incharge',
        performed_by_name: verifiedByName || 'Invigilator',
        details: `Candidate status marked as ${status}${remarks ? ` (${remarks})` : ''}`,
      });
    } catch (err) {
      console.error('Error updating attendance in Firestore:', err);
    }
  },

  async saveAttendanceDraft(
    records: Array<{
      id: string;
      status: 'Present' | 'Absent' | 'Pending' | 'Unmarked';
      remarks?: string;
      verified_by?: string;
      verified_by_name?: string;
    }>,
    examId?: string,
    roomId?: string
  ): Promise<void> {
    try {
      await FirestoreService.batchUpdateAttendance(records);
      if (examId && roomId) {
        await this.addAuditLog({
          action: 'ATTENDANCE_DRAFT_SAVED',
          entity_type: 'attendance',
          entity_id: `${examId}_${roomId}`,
          performed_by: records[0]?.verified_by || 'incharge',
          performed_by_name: records[0]?.verified_by_name || 'Invigilator',
          details: `Draft progress recorded for ${records.length} candidates in room ${roomId}.`,
        });
      }
    } catch (err) {
      console.error('Error saving attendance draft:', err);
    }
  },

  async finalizeRoomAttendance(
    examinationId: string,
    roomId: string,
    verifiedById: string,
    verifiedByName: string
  ): Promise<void> {
    const records = await this.getAttendance(examinationId, roomId);
    const unmarkedCandidates = records.filter(r => r.status === 'Pending' || r.status === 'Unmarked');
    if (unmarkedCandidates.length > 0) {
      throw new Error(`Cannot submit final attendance: ${unmarkedCandidates.length} candidate(s) still Unmarked in this hall. Every seated student must be accounted for.`);
    }

    try {
      await FirestoreService.finalizeRoomAttendance(
        examinationId,
        roomId,
        verifiedById,
        verifiedByName
      );

      const presentCount = records.filter(r => r.status === 'Present').length;
      const absentCount = records.filter(r => r.status === 'Absent').length;

      await this.addAuditLog({
        action: 'ATTENDANCE_FINALIZED',
        entity_type: 'attendance',
        entity_id: `${examinationId}_${roomId}`,
        performed_by: verifiedById,
        performed_by_name: verifiedByName,
        details: `Official attendance locked for hall ${roomId}: ${presentCount} Present, ${absentCount} Absent.`,
      });
    } catch (err) {
      console.error('Error finalizing room attendance in Firestore:', err);
      throw err;
    }
  },

  async unlockRoomAttendance(
    examinationId: string,
    roomId: string,
    unlockedById: string,
    unlockedByName: string,
    reason: string
  ): Promise<void> {
    try {
      await FirestoreService.unlockRoomAttendance(
        examinationId,
        roomId,
        unlockedById,
        unlockedByName,
        reason
      );
    } catch (err) {
      console.error('Error unlocking room attendance:', err);
      throw err;
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const logs = await FirestoreService.getAuditLogs();
      return logs;
    } catch (err) {
      console.warn('Error reading audit logs:', err);
      throw err;
    }
  },

  async addAuditLog(
    log: Omit<AuditLog, 'id' | 'timestamp'> & { timestamp?: string; id?: string }
  ): Promise<AuditLog> {
    try {
      return await FirestoreService.addAuditLog(log);
    } catch (err) {
      console.error('Error writing audit log to Firestore:', err);
      throw err;
    }
  },

  // Student schedule retrieval from Firestore
  // Matches by studentId, studentEmail, or studentRegNo, and ensures is_published == true
  async getStudentSchedule(studentId: string, studentEmail?: string, regNo?: string): Promise<Allocation[]> {
    return FirestoreService.getAllocationsByStudent(studentId, studentEmail, regNo);
  },
};
