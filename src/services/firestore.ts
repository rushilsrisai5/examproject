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
  writeBatch,
  orderBy,
  limit
} from 'firebase/firestore';
import { app, db } from '../lib/firebase';
export { app, db };
import { 
  Profile, 
  UserRole, 
  Examination, 
  Room, 
  Allocation, 
  AttendanceRecord,
  AuditLog
} from '../types';

/**
 * Strips all `undefined` fields from objects recursively before writing to Firestore.
 * Firestore rejects documents containing `undefined` values with WriteBatch or setDoc.
 */
export function sanitizeData<T extends Record<string, any>>(data: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = sanitizeData(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result as Partial<T>;
}

// =========================================================================
// 3. 'users' Collection CRUD Operations
// =========================================================================

/**
 * Create or overwrite a user profile document in Firestore.
 * Synchronously writes to both 'users' and 'profiles' collections.
 */
export async function createUser(userData: Profile): Promise<Profile> {
  const userDoc: Profile = {
    ...userData,
    email: userData.email.toLowerCase().trim(),
    created_at: userData.created_at || new Date().toISOString(),
  };

  const cleanDoc = sanitizeData(userDoc);
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', userDoc.id), cleanDoc);
  batch.set(doc(db, 'profiles', userDoc.id), cleanDoc);
  await batch.commit();

  return userDoc;
}

/**
 * Retrieve a user profile by Document ID (Firebase Auth UID or institutional ID).
 */
export async function getUser(userId: string): Promise<Profile | null> {
  try {
    const snap = await getDoc(doc(db, 'profiles', userId));
    if (snap.exists()) {
      return snap.data() as Profile;
    }
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
      return userSnap.data() as Profile;
    }
  } catch (err) {
    console.warn('Firestore: getUser error:', err);
    throw err;
  }
  return null;
}

export const getUserById = getUser;

/**
 * Retrieve a user profile by institutional email address.
 */
export async function getUserByEmail(email: string): Promise<Profile | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const qProfiles = query(collection(db, 'profiles'), where('email', '==', cleanEmail));
    const snapProfiles = await getDocs(qProfiles);
    if (!snapProfiles.empty) {
      return snapProfiles.docs[0].data() as Profile;
    }

    const qUsers = query(collection(db, 'users'), where('email', '==', cleanEmail));
    const snapUsers = await getDocs(qUsers);
    if (!snapUsers.empty) {
      return snapUsers.docs[0].data() as Profile;
    }
  } catch (err) {
    console.warn('Firestore: getUserByEmail error:', err);
    throw err;
  }
  return null;
}

/**
 * Retrieve users filtered by assigned institutional role ('admin' | 'incharge' | 'student').
 */
export async function getUsersByRole(role: UserRole): Promise<Profile[]> {
  try {
    const q = query(collection(db, 'profiles'), where('role', '==', role));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Profile);
    }
  } catch (err) {
    console.warn('Firestore: getUsersByRole error:', err);
    throw err;
  }
  return [];
}

/**
 * Retrieve all user accounts.
 */
export async function getAllUsers(): Promise<Profile[]> {
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Profile);
    }
  } catch (err) {
    console.warn('Firestore: getAllUsers error:', err);
    throw err;
  }
  return [];
}

/**
 * Update fields of an existing user profile in Firestore.
 */
export async function updateUser(userId: string, data: Partial<Profile>): Promise<void> {
  const cleanData = sanitizeData(data);
  const batch = writeBatch(db);
  batch.update(doc(db, 'profiles', userId), cleanData);
  batch.update(doc(db, 'users', userId), cleanData);
  await batch.commit();
}

/**
 * Delete a user document from Firestore.
 */
export async function deleteUser(userId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'profiles', userId));
  batch.delete(doc(db, 'users', userId));
  await batch.commit();
}

// =========================================================================
// 4. 'examinations' Collection CRUD Operations
// =========================================================================

/**
 * Create an institutional examination record in Firestore.
 */
export async function createExamination(
  exam: Omit<Examination, 'id' | 'created_at'> & { id?: string }
): Promise<Examination> {
  const id = exam.id || `exam-${Date.now()}`;
  const newExam: Examination = {
    ...exam,
    id,
    is_published: exam.is_published ?? true,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'examinations', id), sanitizeData(newExam));
  return newExam;
}

/**
 * Retrieve all examinations sorted by exam date.
 */
export async function getExaminations(): Promise<Examination[]> {
  try {
    const snap = await getDocs(collection(db, 'examinations'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as Examination);
      return list.sort((a, b) => a.exam_date.localeCompare(b.exam_date));
    }
  } catch (err) {
    console.warn('Firestore: getExaminations error:', err);
    throw err;
  }
  return [];
}

/**
 * Retrieve an examination by ID.
 */
export async function getExamination(examId: string): Promise<Examination | null> {
  try {
    const snap = await getDoc(doc(db, 'examinations', examId));
    if (snap.exists()) {
      return snap.data() as Examination;
    }
  } catch (err) {
    console.warn('Firestore: getExamination error:', err);
    throw err;
  }
  return null;
}

export const getExaminationById = getExamination;

/**
 * Update an examination document in Firestore.
 */
export async function updateExamination(
  examId: string, 
  updates: Partial<Examination>
): Promise<void> {
  await updateDoc(doc(db, 'examinations', examId), sanitizeData(updates));
}

/**
 * Delete an examination document and cascade-delete its associated allocations & attendance.
 */
export async function deleteExamination(examId: string): Promise<void> {
  const allocSnap = await getDocs(
    query(collection(db, 'allocations'), where('examination_id', '==', examId))
  );
  const attSnap = await getDocs(
    query(collection(db, 'attendance'), where('examination_id', '==', examId))
  );

  const batch = writeBatch(db);
  batch.delete(doc(db, 'examinations', examId));
  allocSnap.forEach((d) => batch.delete(doc(db, 'allocations', d.id)));
  attSnap.forEach((d) => batch.delete(doc(db, 'attendance', d.id)));

  await batch.commit();
}

/**
 * Toggle publication state for an examination and its student seating allocations.
 */
export async function publishExamination(examId: string, isPublished: boolean): Promise<void> {
  await updateDoc(doc(db, 'examinations', examId), { is_published: isPublished });

  const allocSnap = await getDocs(
    query(collection(db, 'allocations'), where('examination_id', '==', examId))
  );
  if (!allocSnap.empty) {
    const batch = writeBatch(db);
    allocSnap.forEach((d) => {
      batch.update(doc(db, 'allocations', d.id), { is_published: isPublished });
    });
    await batch.commit();
  }
}

// =========================================================================
// 5. 'rooms' Collection CRUD Operations
// =========================================================================

/**
 * Create an examination room/hall in Firestore.
 */
export async function createRoom(
  room: Omit<Room, 'id' | 'created_at'> & { id?: string }
): Promise<Room> {
  const id = room.id || `room-${Date.now()}`;
  const newRoom: Room = {
    ...room,
    id,
    created_at: new Date().toISOString(),
  };
  await setDoc(doc(db, 'rooms', id), sanitizeData(newRoom));
  return newRoom;
}

/**
 * Retrieve all examination rooms sorted by room number.
 */
export async function getRooms(): Promise<Room[]> {
  try {
    const snap = await getDocs(collection(db, 'rooms'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as Room);
      return list.sort((a, b) => a.room_number.localeCompare(b.room_number));
    }
  } catch (err) {
    console.warn('Firestore: getRooms error:', err);
    throw err;
  }
  return [];
}

/**
 * Retrieve an examination room by ID.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  try {
    const snap = await getDoc(doc(db, 'rooms', roomId));
    if (snap.exists()) {
      return snap.data() as Room;
    }
  } catch (err) {
    console.warn('Firestore: getRoom error:', err);
    throw err;
  }
  return null;
}

export const getRoomById = getRoom;

/**
 * Retrieve only active examination rooms.
 */
export async function getActiveRooms(): Promise<Room[]> {
  const rooms = await getRooms();
  return rooms.filter((r) => r.is_active);
}

/**
 * Retrieve rooms assigned to a specific invigilator/faculty member.
 */
export async function getRoomsByIncharge(inchargeIdOrName: string): Promise<Room[]> {
  const rooms = await getRooms();
  const queryTerm = inchargeIdOrName.toLowerCase().trim();
  return rooms.filter(
    (r) => r.incharge_id === inchargeIdOrName || 
           (r.incharge_name && r.incharge_name.toLowerCase().includes(queryTerm))
  );
}

/**
 * Update room capacity, layout grid, or invigilator assignment.
 */
export async function updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), sanitizeData(updates));
}

/**
 * Delete an examination room from Firestore.
 */
export async function deleteRoom(roomId: string): Promise<void> {
  await deleteDoc(doc(db, 'rooms', roomId));
}

// =========================================================================
// 6. 'allocations' Collection CRUD Operations
// =========================================================================

/**
 * Create an individual seating allocation.
 */
export async function createAllocation(allocation: Allocation): Promise<Allocation> {
  const id = allocation.id || `alloc-${Date.now()}-${allocation.student_id}`;
  const record: Allocation = {
    ...allocation,
    id,
    created_at: allocation.created_at || new Date().toISOString(),
  };
  await setDoc(doc(db, 'allocations', id), sanitizeData(record));
  return record;
}

/**
 * Atomically save a batch of student allocations using a Firestore writeBatch.
 */
export async function saveAllocationsBatch(allocations: Allocation[]): Promise<void> {
  if (allocations.length === 0) return;
  const batch = writeBatch(db);
  for (const alloc of allocations) {
    batch.set(doc(db, 'allocations', alloc.id), sanitizeData(alloc));
  }
  await batch.commit();
}

/**
 * Retrieve allocations, optionally filtered by examination ID.
 */
export async function getAllocations(examinationId?: string): Promise<Allocation[]> {
  try {
    const q = examinationId 
      ? query(collection(db, 'allocations'), where('examination_id', '==', examinationId))
      : collection(db, 'allocations');
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Allocation);
    }
  } catch (err) {
    console.warn('Firestore: getAllocations error:', err);
    throw err;
  }
  return [];
}

/**
 * Retrieve a single allocation by ID.
 */
export async function getAllocation(allocationId: string): Promise<Allocation | null> {
  try {
    const snap = await getDoc(doc(db, 'allocations', allocationId));
    if (snap.exists()) {
      return snap.data() as Allocation;
    }
  } catch (err) {
    console.warn('Firestore: getAllocation error:', err);
    throw err;
  }
  return null;
}

export const getAllocationById = getAllocation;

/**
 * Retrieve allocations for an assigned examination room.
 */
export async function getAllocationsByRoom(
  examinationId: string, 
  roomId: string
): Promise<Allocation[]> {
  try {
    const q = query(
      collection(db, 'allocations'),
      where('examination_id', '==', examinationId),
      where('room_id', '==', roomId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Allocation);
    }
  } catch (err) {
    console.warn('Firestore: getAllocationsByRoom error:', err);
    throw err;
  }
  return [];
}

/**
 * Retrieve published examination schedule for a candidate student.
 * Matches by student_id or email, strictly filtering for published records.
 */
export async function getAllocationsByStudent(
  studentId: string, 
  email?: string, 
  _regNo?: string
): Promise<Allocation[]> {
  try {
    const list: Allocation[] = [];

    if (email) {
      const qEmail = query(
        collection(db, 'allocations'),
        where('student_email', '==', email.toLowerCase().trim())
      );
      const snapEmail = await getDocs(qEmail);
      snapEmail.forEach((d) => list.push(d.data() as Allocation));
    }

    if (list.length === 0 && studentId) {
      const qId = query(
        collection(db, 'allocations'),
        where('student_id', '==', studentId)
      );
      const snapId = await getDocs(qId);
      snapId.forEach((d) => list.push(d.data() as Allocation));
    }

    if (list.length > 0) {
      const unique = Array.from(new Map(list.map((a) => [a.id, a])).values());
      return unique.filter((a) => a.is_published !== false);
    }
  } catch (err) {
    console.warn('Firestore: getAllocationsByStudent error:', err);
    throw err;
  }
  return [];
}

/**
 * Update an allocation record.
 */
export async function updateAllocation(
  allocationId: string, 
  updates: Partial<Allocation>
): Promise<void> {
  await updateDoc(doc(db, 'allocations', allocationId), sanitizeData(updates));
}

/**
 * Delete an allocation.
 */
export async function deleteAllocation(allocationId: string): Promise<void> {
  await deleteDoc(doc(db, 'allocations', allocationId));
}

/**
 * Delete all allocations belonging to an examination.
 */
export async function deleteAllocationsByExam(examinationId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, 'allocations'), where('examination_id', '==', examinationId))
  );
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(doc(db, 'allocations', d.id)));
    await batch.commit();
  }
}

// =========================================================================
// 7. 'attendance' Collection Operations
// =========================================================================

/**
 * Retrieve attendance records from Firestore.
 */
export async function getAttendance(
  examinationId?: string, 
  roomId?: string
): Promise<AttendanceRecord[]> {
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
    console.warn('Firestore: getAttendance error:', err);
    throw err;
  }
  return [];
}

/**
 * Update a student's attendance record (Present, Absent, Pending).
 */
export async function updateAttendance(
  attendanceId: string,
  status: 'Present' | 'Absent' | 'Pending',
  verifiedBy?: string,
  verifiedByName?: string,
  remarks?: string
): Promise<void> {
  const updateData: Partial<AttendanceRecord> = {
    status,
    verified_by: verifiedBy,
    verified_by_name: verifiedByName,
    verified_at: new Date().toISOString(),
  };
  if (remarks !== undefined) updateData.remarks = remarks;
  await updateDoc(doc(db, 'attendance', attendanceId), sanitizeData(updateData));
}

/**
 * Finalize room attendance submitted by faculty in-charge.
 */
export async function finalizeRoomAttendance(
  examinationId: string,
  roomId: string,
  verifiedById: string,
  verifiedByName: string
): Promise<void> {
  const records = await getAttendance(examinationId, roomId);
  if (records.length === 0) return;

  const batch = writeBatch(db);
  for (const r of records) {
    batch.update(doc(db, 'attendance', r.id), {
      is_finalized: true,
      verified_by: verifiedById,
      verified_by_name: verifiedByName,
      verified_at: new Date().toISOString(),
    });
  }
  await batch.commit();
}

/**
 * Batch update attendance records (e.g. Save Draft).
 */
export async function batchUpdateAttendance(
  updates: Array<{ id: string; status: 'Present' | 'Absent' | 'Pending' | 'Unmarked'; remarks?: string; verified_by?: string; verified_by_name?: string }>
): Promise<void> {
  if (updates.length === 0) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  for (const u of updates) {
    const payload: Record<string, any> = {
      status: u.status,
      verified_at: now,
    };
    if (u.remarks !== undefined) payload.remarks = u.remarks;
    if (u.verified_by) payload.verified_by = u.verified_by;
    if (u.verified_by_name) payload.verified_by_name = u.verified_by_name;
    batch.update(doc(db, 'attendance', u.id), sanitizeData(payload));
  }
  await batch.commit();
}

/**
 * Re-open/unlock finalized room attendance for corrections (Audited).
 */
export async function unlockRoomAttendance(
  examinationId: string,
  roomId: string,
  unlockedById: string,
  unlockedByName: string,
  reason: string
): Promise<void> {
  const records = await getAttendance(examinationId, roomId);
  if (records.length === 0) return;

  const batch = writeBatch(db);
  for (const r of records) {
    batch.update(doc(db, 'attendance', r.id), {
      is_finalized: false,
      remarks: `Unlocked for revision by ${unlockedByName}: ${reason}`,
    });
  }
  await batch.commit();

  await addAuditLog({
    action: 'ATTENDANCE_UNLOCKED',
    entity_type: 'attendance',
    entity_id: `${examinationId}_${roomId}`,
    performed_by: unlockedById,
    performed_by_name: unlockedByName,
    details: `Room attendance unlocked for corrections. Reason: ${reason}`,
  });
}

// =========================================================================
// 8. 'audit_logs' Collection Operations
// =========================================================================

/**
 * Record an audit log entry in Firestore.
 */
export async function addAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'> & { timestamp?: string; id?: string }
): Promise<AuditLog> {
  const id = log.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record: AuditLog = {
    id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id || '',
    performed_by: log.performed_by,
    performed_by_name: log.performed_by_name || 'System User',
    details: log.details,
    timestamp: log.timestamp || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'audit_logs', id), sanitizeData(record));
  } catch (err) {
    console.warn('Failed to save audit log to Firestore:', err);
    throw err;
  }
  return record;
}

/**
 * Fetch audit logs from Firestore.
 */
export async function getAuditLogs(maxCount: number = 100): Promise<AuditLog[]> {
  try {
    let q;
    try {
      q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(maxCount));
    } catch {
      q = collection(db, 'audit_logs');
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      const logs = snap.docs.map((d) => d.data() as AuditLog);
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (err) {
    console.warn('Failed to read audit logs from Firestore:', err);
    throw err;
  }
  return [];
}

// =========================================================================
// 9. Unified Export Interface
// =========================================================================

export const FirestoreService = {
  // DB & App instance
  app,
  db,
  sanitizeData,

  // Users
  createUser,
  getUser,
  getUserById,
  getUserByEmail,
  getUsersByRole,
  getAllUsers,
  updateUser,
  deleteUser,

  // Examinations
  createExamination,
  getExaminations,
  getExamination,
  getExaminationById,
  updateExamination,
  deleteExamination,
  publishExamination,

  // Rooms
  createRoom,
  getRooms,
  getRoom,
  getRoomById,
  getActiveRooms,
  getRoomsByIncharge,
  updateRoom,
  deleteRoom,

  // Allocations
  createAllocation,
  saveAllocationsBatch,
  getAllocations,
  getAllocation,
  getAllocationById,
  getAllocationsByRoom,
  getAllocationsByStudent,
  updateAllocation,
  deleteAllocation,
  deleteAllocationsByExam,

  // Attendance
  getAttendance,
  updateAttendance,
  batchUpdateAttendance,
  finalizeRoomAttendance,
  unlockRoomAttendance,

  // Audit Logs
  addAuditLog,
  getAuditLogs,
};

export const firestoreService = FirestoreService;
export default FirestoreService;
