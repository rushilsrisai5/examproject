import React from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  X, 
  CheckCircle2, 
  Clock, 
  Building, 
  UserCheck, 
  ShieldCheck 
} from 'lucide-react';
import { Examination, Room, AttendanceRecord } from '../types';
import { 
  downloadAttendanceCSV, 
  downloadPrintableAttendanceHTML, 
  triggerPrintWithIframe 
} from '../utils/attendanceExport';

interface AttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | undefined;
  room: Room | undefined;
  attendance: AttendanceRecord[];
  inchargeName?: string;
  isFinalized: boolean;
}

export const AttendancePrintModal: React.FC<AttendancePrintModalProps> = ({
  isOpen,
  onClose,
  exam,
  room,
  attendance,
  inchargeName,
  isFinalized,
}) => {
  if (!isOpen) return null;

  const total = attendance.length;
  const present = attendance.filter((r) => r.status === 'Present').length;
  const absent = attendance.filter((r) => r.status === 'Absent').length;
  const unmarked = total - (present + absent);
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  const sortedAttendance = [...attendance].sort((a, b) => a.seat_number.localeCompare(b.seat_number));
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handlePrint = () => {
    const res = triggerPrintWithIframe(exam, room, attendance, inchargeName, isFinalized);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleDownloadCSV = () => {
    downloadAttendanceCSV(exam, room, attendance, inchargeName, isFinalized);
    setStatusMessage('Attendance CSV file downloaded successfully.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDownloadHTML = () => {
    downloadPrintableAttendanceHTML(exam, room, attendance, inchargeName, isFinalized);
    setStatusMessage('Official Printable HTML document saved! Open it in any browser to print or save as PDF.');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Action Toolbar (No-Print) */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Official Examination Attendance Sheet</h2>
              <p className="text-[11px] text-slate-400">
                Print document or download as CSV / Excel / Printable HTML
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="Print document or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              title="Download CSV formatted for Microsoft Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHTML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-xs cursor-pointer transition-colors hidden sm:inline-flex"
              title="Download standalone HTML print file"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-inner no-print animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-emerald-100 hover:text-white text-[11px] font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center">
          <div className="w-full max-w-4xl bg-white shadow-lg border border-slate-200 rounded-xl p-6 sm:p-8 text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
            
            {/* Institutional Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    ExamNova
                  </span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Institutional Examination Management
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                  Official Room Attendance Roll Sheet
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Office of the Controller of Examinations · Physical Candidate Verification Record
                </p>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isFinalized 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isFinalized ? 'Finalized & Locked' : 'Draft Copy'}</span>
                </span>
              </div>
            </div>

            {/* Examination & Room Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Examination Paper</span>
                <span className="font-bold text-slate-900">{exam?.title || exam?.course_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Course & Date</span>
                <span className="font-bold text-slate-900">{exam?.course_code} · {exam?.exam_date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Hall / Room</span>
                <span className="font-bold text-slate-900">{room?.room_number} ({room?.building})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Hall In-Charge</span>
                <span className="font-bold text-slate-900">{inchargeName || room?.incharge_name || 'Invigilator'}</span>
              </div>
            </div>

            {/* Attendance Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100/80 border border-slate-200 rounded-lg mb-5 text-xs font-semibold">
              <div className="flex items-center gap-4">
                <span>Total Allocated: <strong className="text-indigo-900 font-bold">{total}</strong></span>
                <span>Present: <strong className="text-emerald-700 font-bold">{present}</strong></span>
                <span>Absent: <strong className="text-rose-700 font-bold">{absent}</strong></span>
                <span>Unmarked: <strong className="text-amber-700 font-bold">{unmarked}</strong></span>
              </div>
              <div>
                <span>Attendance Rate: <strong className="text-slate-900 font-black">{percentage}%</strong></span>
              </div>
            </div>

            {/* Attendance Candidates Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center border-r border-slate-200">S.No</th>
                    <th className="px-3 py-2.5 w-20 text-center border-r border-slate-200">Seat</th>
                    <th className="px-4 py-2.5 w-32 border-r border-slate-200">Registration No</th>
                    <th className="px-4 py-2.5 border-r border-slate-200">Candidate Name</th>
                    <th className="px-3 py-2.5 w-28 border-r border-slate-200">Dept & Sec</th>
                    <th className="px-3 py-2.5 w-24 text-center border-r border-slate-200">Status</th>
                    <th className="px-4 py-2.5 w-32">Candidate Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedAttendance.map((rec, idx) => {
                    const isPresent = rec.status === 'Present';
                    const isAbsent = rec.status === 'Absent';
                    return (
                      <tr key={rec.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="px-3 py-2 text-center text-slate-500 font-semibold border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-indigo-900 bg-indigo-50/30 border-r border-slate-200">
                          {rec.seat_number}
                        </td>
                        <td className="px-4 py-2 font-mono font-bold text-slate-800 border-r border-slate-200">
                          {rec.student_reg_no}
                        </td>
                        <td className="px-4 py-2 font-semibold text-slate-900 border-r border-slate-200">
                          {rec.student_name}
                        </td>
                        <td className="px-3 py-2 text-slate-600 border-r border-slate-200">
                          {rec.department || 'CSE'} {rec.section ? `· Sec ${rec.section}` : ''}
                        </td>
                        <td className="px-3 py-2 text-center border-r border-slate-200">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isPresent 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : isAbsent 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-b border-dashed border-slate-300">
                          {/* Signature line placeholder for physical sign-off */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Certification Statement */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 italic leading-relaxed mb-6">
              <strong>Invigilator Attestation:</strong> I hereby certify that the examination attendance marked above has been verified against the student identity cards and candidate seating arrangement in examination hall {room?.room_number}.
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Hall In-Charge Invigilator Signature:</span>
                <div className="h-10 border-b border-slate-400 mb-1"></div>
                <span className="text-[11px] text-slate-600 block">Name: {inchargeName || 'Invigilator'}</span>
                <span className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Chief Superintendent / Examination Controller:</span>
                <div className="h-10 border-b border-slate-400 mb-1"></div>
                <span className="text-[11px] text-slate-600 block">Signature & Institutional Stamp</span>
                <span className="text-[10px] text-slate-500">Verification Seal</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {total} candidate records in {room?.room_number} · Ready for institutional archiving
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet Now</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
