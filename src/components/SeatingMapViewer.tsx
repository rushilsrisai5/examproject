import React, { useState, useMemo } from 'react';
import { 
  DoorOpen, 
  Printer, 
  X, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Building, 
  Info, 
  UserCheck, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Room, Examination, Allocation, AttendanceRecord, SeatingSeat, SeatingStatus } from '../types';

interface SeatingMapViewerProps {
  rooms: Room[];
  examinations: Examination[];
  allocations: Allocation[];
  attendance: AttendanceRecord[];
  initialRoomId?: string;
  initialExamId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const SeatingMapViewer: React.FC<SeatingMapViewerProps> = ({
  rooms,
  examinations,
  allocations,
  attendance,
  initialRoomId,
  initialExamId,
  onClose,
  isModal = false,
}) => {
  // Active selection states
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (initialRoomId && rooms.some(r => r.id === initialRoomId)) return initialRoomId;
    return rooms.length > 0 ? rooms[0].id : '';
  });

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (initialExamId && examinations.some(e => e.id === initialExamId)) return initialExamId;
    return examinations.length > 0 ? examinations[0].id : '';
  });

  const [hoveredSeat, setHoveredSeat] = useState<SeatingSeat | null>(null);

  // Active room and exam objects
  const activeRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  const activeExam = useMemo(() => {
    return examinations.find(e => e.id === selectedExamId) || examinations[0] || null;
  }, [examinations, selectedExamId]);

  // Current allocations and attendance for this room & exam
  const relevantAllocations = useMemo(() => {
    if (!activeRoom || !activeExam) return [];
    return allocations.filter(
      a => a.room_id === activeRoom.id && a.examination_id === activeExam.id
    );
  }, [allocations, activeRoom, activeExam]);

  const relevantAttendance = useMemo(() => {
    if (!activeRoom || !activeExam) return [];
    return attendance.filter(
      a => a.room_id === activeRoom.id && a.examination_id === activeExam.id
    );
  }, [attendance, activeRoom, activeExam]);

  // Build grid map based on room rows and columns
  const seatingGrid = useMemo(() => {
    if (!activeRoom) return [];

    const rowsCount = activeRoom.rows || Math.max(1, Math.ceil(activeRoom.capacity / 4));
    const colsCount = activeRoom.columns || Math.max(1, Math.min(6, Math.ceil(activeRoom.capacity / rowsCount)));
    const totalCapacity = activeRoom.capacity;

    // Map allocation by seatNumber (e.g. 'A-01' or standard indexing)
    const allocMap = new Map<string, Allocation>();
    relevantAllocations.forEach(a => {
      allocMap.set(a.seat_number.toUpperCase().trim(), a);
    });

    // Map attendance by allocation_id or seat_number
    const attMap = new Map<string, AttendanceRecord>();
    relevantAttendance.forEach(att => {
      if (att.seat_number) {
        attMap.set(att.seat_number.toUpperCase().trim(), att);
      }
      if (att.allocation_id) {
        attMap.set(`ALLOC_${att.allocation_id}`, att);
      }
    });

    const grid: SeatingSeat[][] = [];
    let seatIndex = 0;

    for (let r = 0; r < rowsCount; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      const rowSeats: SeatingSeat[] = [];

      for (let c = 1; c <= colsCount; c++) {
        seatIndex++;
        if (seatIndex > totalCapacity) {
          // Extra slot beyond room capacity
          break;
        }

        const seatNumber = `${rowLetter}-${String(c).padStart(2, '0')}`;
        const alloc = allocMap.get(seatNumber) || relevantAllocations[seatIndex - 1];
        
        let status: SeatingStatus = 'Unallocated';
        let attRecord: AttendanceRecord | undefined = undefined;

        if (alloc) {
          attRecord = attMap.get(seatNumber) || attMap.get(`ALLOC_${alloc.id}`);
          if (attRecord) {
            if (attRecord.status === 'Present') {
              status = 'Present';
            } else if (attRecord.status === 'Absent') {
              status = 'Absent';
            } else {
              status = 'Allocated';
            }
          } else {
            status = 'Allocated';
          }
        }

        rowSeats.push({
          seatNumber,
          rowLabel: rowLetter,
          colNumber: c,
          status,
          allocation: alloc,
          attendance: attRecord,
          studentName: alloc?.student_name,
          studentRegNo: alloc?.student_reg_no,
          department: alloc?.course_code,
        });
      }

      if (rowSeats.length > 0) {
        grid.push(rowSeats);
      }
    }

    return grid;
  }, [activeRoom, relevantAllocations, relevantAttendance]);

  // Statistics calculation for the header
  const totalSeats = activeRoom?.capacity || 0;
  const occupiedSeats = relevantAllocations.length;
  const availableSeats = Math.max(0, totalSeats - occupiedSeats);
  const presentCount = relevantAttendance.filter(a => a.status === 'Present').length;
  const absentCount = relevantAttendance.filter(a => a.status === 'Absent').length;
  const unallocatedCount = totalSeats - occupiedSeats;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Top Banner / Navigation Selector */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Visual Examination Room Seating Map</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrated hall layout with individual desk attendance status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
              title="Print official room seating layout"
            >
              <Printer className="w-4 h-4" />
              <span>Print Seating Chart</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns for selecting Examination and Hall (Requirement 7) */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Select Examination:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {examinations.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.course_code} - {exam.title} ({exam.exam_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Select Examination Hall (Requirement 7):
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.room_number} ({room.building}) — Cap: {room.capacity} seats
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Official Header (Shows when printing) */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-4 print-area text-black">
        <div className="text-center pb-4 border-b border-slate-300">
          <h1 className="text-xl font-bold uppercase tracking-wider">ExamNova — Smart Examination Section</h1>
          <p className="text-xs uppercase font-semibold text-slate-600">Official Examination Hall Seating Arrangement & Attendance Chart</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
          <div>
            <div><strong>Examination:</strong> {activeExam?.title} ({activeExam?.course_code})</div>
            <div><strong>Date & Timing:</strong> {activeExam?.exam_date} · {activeExam?.session}</div>
          </div>
          <div>
            <div><strong>Hall Number:</strong> {activeRoom?.room_number}</div>
            <div><strong>Building / Block:</strong> {activeRoom?.building}</div>
            <div><strong>Capacity / Seated:</strong> {totalSeats} Total / {occupiedSeats} Seated</div>
          </div>
        </div>
      </div>

      {/* Hall Details & Statistics Bar (Requirement 6) */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {activeRoom?.room_number || 'Room'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">
              {activeRoom?.building || 'Main Block'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-indigo-600 font-semibold">
              Grid: {activeRoom?.rows || 4}R × {activeRoom?.columns || 3}C
            </span>
          </div>
          <div className="text-slate-500 flex items-center gap-3">
            <span>Faculty In-Charge: <strong>{activeRoom?.incharge_name || 'Prof. Sarah Jenkins'}</strong></span>
            <span>·</span>
            <span>Date: <strong>{activeExam?.exam_date || 'N/A'}</strong></span>
            <span>·</span>
            <span>Session: <strong>{activeExam?.session.startsWith('Morning') ? 'Forenoon (FN)' : 'Afternoon (AN)'}</strong></span>
          </div>
        </div>

        {/* Counts summary (Requirement 6) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold shadow-2xs">
            <span className="text-slate-500 mr-1.5">Total Seats:</span>
            <span className="font-bold font-mono text-slate-900">{totalSeats}</span>
          </div>
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-semibold shadow-2xs">
            <span className="text-indigo-600 mr-1.5">Occupied:</span>
            <span className="font-bold font-mono text-indigo-800">{occupiedSeats}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-semibold shadow-2xs">
            <span className="text-emerald-600 mr-1.5">Present:</span>
            <span className="font-bold font-mono text-emerald-800">{presentCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl font-semibold shadow-2xs">
            <span className="text-rose-600 mr-1.5">Absent:</span>
            <span className="font-bold font-mono text-rose-800">{absentCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold shadow-2xs">
            <span className="text-slate-500 mr-1.5">Vacant:</span>
            <span className="font-bold font-mono text-slate-700">{availableSeats}</span>
          </div>
        </div>
      </div>

      {/* Visual Legend (Requirement 5) */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
          Seating Status Legend (Requirement 5):
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-600" />
            <span className="font-medium text-slate-700">Allocated (Awaiting / Draft)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600" />
            <span className="font-medium text-slate-700">Present (Confirmed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600" />
            <span className="font-medium text-slate-700">Absent (Confirmed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-100 border border-dashed border-slate-300" />
            <span className="font-medium text-slate-500">Unallocated / Vacant</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid Layout (Requirement 2 & 3) */}
      <div className="p-6 overflow-x-auto flex-1 bg-slate-50/50">
        {/* Invigilator Podium / Front of Hall */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-slate-800 text-slate-200 text-center py-2.5 rounded-2xl shadow-inner border border-slate-700 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
            <span>✦ FRONT OF EXAMINATION HALL / PODIUM & INVIGILATOR DESK ✦</span>
          </div>
        </div>

        {/* Desks Grid */}
        <div className="max-w-4xl mx-auto space-y-4">
          {seatingGrid.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic">
              No seating configuration available for this hall.
            </div>
          ) : (
            seatingGrid.map((rowSeats, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-3">
                {/* Row Label (A, B, C...) */}
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {rowSeats[0]?.rowLabel || String.fromCharCode(65 + rowIdx)}
                </div>

                {/* Seats in this row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 flex-1">
                  {rowSeats.map((seat) => {
                    const isAlloc = seat.status === 'Allocated';
                    const isPres = seat.status === 'Present';
                    const isAbs = seat.status === 'Absent';
                    const isVac = seat.status === 'Unallocated';

                    let cardClasses = 'bg-slate-100/80 border-dashed border-slate-300 text-slate-400 hover:border-slate-400';
                    let badgeClass = 'bg-slate-200 text-slate-600';

                    if (isPres) {
                      cardClasses = 'bg-emerald-500 text-white border-emerald-600 shadow-sm hover:ring-2 hover:ring-emerald-400';
                      badgeClass = 'bg-emerald-600 text-emerald-100';
                    } else if (isAbs) {
                      cardClasses = 'bg-rose-500 text-white border-rose-600 shadow-sm hover:ring-2 hover:ring-rose-400';
                      badgeClass = 'bg-rose-600 text-rose-100';
                    } else if (isAlloc) {
                      cardClasses = 'bg-indigo-600 text-white border-indigo-700 shadow-sm hover:ring-2 hover:ring-indigo-400';
                      badgeClass = 'bg-indigo-700 text-indigo-100';
                    }

                    return (
                      <div
                        key={seat.seatNumber}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        className={`relative rounded-2xl p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[92px] ${cardClasses}`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                            {seat.seatNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isPres ? 'Present' : isAbs ? 'Absent' : isAlloc ? 'Seated' : 'Empty'}
                          </span>
                        </div>

                        {seat.studentName ? (
                          <div className="mt-2 space-y-0.5">
                            <div className="font-bold text-xs truncate leading-tight" title={seat.studentName}>
                              {seat.studentName}
                            </div>
                            <div className="text-[10px] font-mono opacity-90 truncate">
                              {seat.studentRegNo}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-[10px] text-center text-slate-400 italic">
                            Vacant Seat
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hover Inspector Card */}
        {hoveredSeat && hoveredSeat.studentName && (
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-between text-xs animate-in fade-in duration-150 no-print">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-white ${
                hoveredSeat.status === 'Present' ? 'bg-emerald-600' :
                hoveredSeat.status === 'Absent' ? 'bg-rose-600' : 'bg-indigo-600'
              }`}>
                {hoveredSeat.seatNumber}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{hoveredSeat.studentName}</div>
                <div className="text-slate-500 font-mono">
                  Roll: {hoveredSeat.studentRegNo} · {hoveredSeat.department || activeExam?.course_code}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block font-bold px-2.5 py-1 rounded-full text-xs ${
                hoveredSeat.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                hoveredSeat.status === 'Absent' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                Status: {hoveredSeat.status}
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {hoveredSeat.attendance?.is_finalized ? 'Finalized Record' : 'Draft / Scheduled'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Desk Slips and Roster Table (Shows only during print) */}
      <div className="hidden print:block p-6 print-area text-black">
        <h3 className="font-bold text-sm uppercase mb-2 border-b border-slate-300 pb-1">
          Allocated Candidate Attendance Verification Sheet
        </h3>
        <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-1.5">Seat No</th>
              <th className="border border-slate-300 p-1.5">Roll No</th>
              <th className="border border-slate-300 p-1.5">Candidate Name</th>
              <th className="border border-slate-300 p-1.5">Course</th>
              <th className="border border-slate-300 p-1.5 text-center">Status</th>
              <th className="border border-slate-300 p-1.5">Candidate Signature</th>
            </tr>
          </thead>
          <tbody>
            {relevantAllocations.map((alloc) => {
              const att = relevantAttendance.find(a => a.student_id === alloc.student_id);
              return (
                <tr key={alloc.id} className="print-row">
                  <td className="border border-slate-300 p-1.5 font-mono font-bold">{alloc.seat_number}</td>
                  <td className="border border-slate-300 p-1.5 font-mono">{alloc.student_reg_no}</td>
                  <td className="border border-slate-300 p-1.5 font-semibold">{alloc.student_name}</td>
                  <td className="border border-slate-300 p-1.5">{alloc.course_code}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold">
                    {att?.status === 'Present' ? 'PRESENT' : att?.status === 'Absent' ? 'ABSENT' : 'ALLOCATED'}
                  </td>
                  <td className="border border-slate-300 p-1.5 w-32"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 pt-4 flex justify-between text-xs">
          <div>
            <div>Hall In-Charge Signature: _________________________</div>
            <div>Date & Time: _________________________</div>
          </div>
          <div>
            <div>Chief Superintendent Signature: _________________________</div>
            <div>Institutional Examination Seal</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl my-8 max-h-[92vh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
