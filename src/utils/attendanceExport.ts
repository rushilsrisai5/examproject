import { Examination, Room, AttendanceRecord } from '../types';
import { downloadCSV } from './csvExport';

/**
 * Downloads a structured CSV file for Room Attendance
 */
export function downloadAttendanceCSV(
  exam: Examination | undefined,
  room: Room | undefined,
  attendanceRecords: AttendanceRecord[],
  inchargeName?: string,
  isFinalized?: boolean
): void {
  const roomNumber = room?.room_number || 'Room';
  const courseCode = exam?.course_code || 'Course';
  const examDate = exam?.exam_date || new Date().toISOString().split('T')[0];
  const filename = `Attendance_${roomNumber}_${courseCode}_${examDate}.csv`;

  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absent = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const unmarked = total - (present + absent);
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  const rows: string[][] = [
    ['EXAMNOVA INSTITUTIONAL ATTENDANCE ROLL SHEET'],
    ['Controller of Examinations - Room Invigilation Record'],
    [''],
    ['Examination:', exam?.title || exam?.course_name || 'N/A'],
    ['Course Code:', exam?.course_code || 'N/A'],
    ['Date:', exam?.exam_date || 'N/A', 'Session:', exam?.session || 'N/A'],
    ['Hall / Room:', `${room?.room_number || 'N/A'} - ${room?.building || 'Main Block'}`],
    ['Invigilator In-Charge:', inchargeName || room?.incharge_name || 'N/A'],
    ['Status:', isFinalized ? 'FINALIZED & SUBMITTED' : 'DRAFT / IN PROGRESS'],
    ['Total Allocated:', String(total), 'Present:', String(present), 'Absent:', String(absent), 'Unmarked:', String(unmarked)],
    ['Attendance Rate:', `${percentage}%`],
    [''],
    [
      'S.No',
      'Seat No',
      'Registration Number',
      'Candidate Name',
      'Department & Section',
      'Attendance Status',
      'Verification Timestamp',
      'Remarks'
    ],
  ];

  // Sort by seat number
  const sorted = [...attendanceRecords].sort((a, b) => a.seat_number.localeCompare(b.seat_number));

  sorted.forEach((rec, idx) => {
    rows.push([
      String(idx + 1),
      rec.seat_number || 'N/A',
      rec.student_reg_no || 'N/A',
      rec.student_name || 'N/A',
      `${rec.department || ''} ${rec.section || ''}`.trim() || 'N/A',
      rec.status,
      rec.verified_at ? new Date(rec.verified_at).toLocaleString() : 'N/A',
      rec.remarks || ''
    ]);
  });

  downloadCSV(filename, rows);
}

/**
 * Generates an official printable HTML document for the Attendance Sheet
 */
export function generateAttendanceHTML(
  exam: Examination | undefined,
  room: Room | undefined,
  attendanceRecords: AttendanceRecord[],
  inchargeName?: string,
  isFinalized?: boolean
): string {
  const roomNumber = room?.room_number || 'Hall 101';
  const building = room?.building || 'Science & Engineering Complex';
  const examTitle = exam?.title || exam?.course_name || 'Semester Examination';
  const courseCode = exam?.course_code || 'CS-601';
  const examDate = exam?.exam_date || new Date().toISOString().split('T')[0];
  const session = exam?.session || 'Morning (09:30 AM - 12:30 PM)';

  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absent = attendanceRecords.filter((r) => r.status === 'Absent').length;
  const unmarked = total - (present + absent);
  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

  const sorted = [...attendanceRecords].sort((a, b) => a.seat_number.localeCompare(b.seat_number));

  const tableRowsHtml = sorted
    .map((rec, idx) => {
      const isAbsent = rec.status === 'Absent';
      const isPresent = rec.status === 'Present';
      const statusColor = isPresent ? '#15803d' : isAbsent ? '#b91c1c' : '#b45309';
      const statusBg = isPresent ? '#dcfce7' : isAbsent ? '#fee2e2' : '#fef3c7';

      return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; text-align: center; color: #1e3a8a;">${rec.seat_number}</td>
          <td style="font-family: monospace; font-weight: bold;">${rec.student_reg_no}</td>
          <td style="font-weight: 600;">${rec.student_name}</td>
          <td>${rec.department || 'CSE'} ${rec.section ? `· Sec ${rec.section}` : ''}</td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${rec.status.toUpperCase()}
            </span>
          </td>
          <td style="border-bottom: 1px dashed #cbd5e1; width: 100px;"></td>
          <td style="color: #64748b; font-size: 11px;">${rec.remarks || ''}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Exam Attendance Sheet - ${roomNumber} - ${courseCode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          line-height: 1.4;
          font-size: 12px;
          margin: 0;
          padding: 20px;
          background: #ffffff;
        }
        .header {
          border-bottom: 2px solid #1e293b;
          padding-bottom: 12px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title-block h1 {
          font-size: 18px;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          color: #0f172a;
        }
        .title-block p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #475569;
          font-weight: 500;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
        }
        .badge-finalized {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .badge-draft {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 1px;
        }
        .stats-bar {
          display: flex;
          gap: 16px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 14px;
          margin-bottom: 16px;
          font-size: 11px;
          font-weight: 600;
        }
        .stat {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .stat-val {
          font-weight: 800;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 11.5px;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        td {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .signature-section {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          page-break-inside: avoid;
        }
        .sig-box {
          border-top: 1px solid #475569;
          padding-top: 6px;
          font-size: 11px;
        }
        .cert-statement {
          font-size: 10px;
          color: #64748b;
          font-style: italic;
          margin-bottom: 16px;
          line-height: 1.4;
          page-break-inside: avoid;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-block">
          <h1>ExamNova · Controller of Examinations</h1>
          <p>Official Hall Attendance & Candidate Verification Roll Sheet</p>
        </div>
        <div>
          <span class="badge ${isFinalized ? 'badge-finalized' : 'badge-draft'}">
            ${isFinalized ? 'Finalized & Submitted' : 'Draft Copy'}
          </span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Examination Paper</span>
          <span class="info-value">${examTitle}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Course Code & Date</span>
          <span class="info-value">${courseCode} · ${examDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Examination Hall</span>
          <span class="info-value">${roomNumber} (${building})</span>
        </div>
        <div class="info-item">
          <span class="info-label">Hall In-Charge</span>
          <span class="info-value">${inchargeName || 'Assigned Invigilator'}</span>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat"><span>Total Candidates:</span> <span class="stat-val" style="color: #1e3a8a;">${total}</span></div>
        <div class="stat"><span>Present:</span> <span class="stat-val" style="color: #15803d;">${present}</span></div>
        <div class="stat"><span>Absent:</span> <span class="stat-val" style="color: #b91c1c;">${absent}</span></div>
        <div class="stat"><span>Unmarked:</span> <span class="stat-val" style="color: #b45309;">${unmarked}</span></div>
        <div class="stat" style="margin-left: auto;"><span>Attendance Rate:</span> <span class="stat-val">${percentage}%</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">S.No</th>
            <th style="width: 65px; text-align: center;">Seat</th>
            <th style="width: 120px;">Reg. Number</th>
            <th>Candidate Name</th>
            <th style="width: 110px;">Department</th>
            <th style="width: 90px; text-align: center;">Status</th>
            <th style="width: 100px;">Student Signature</th>
            <th style="width: 80px;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="cert-statement">
        <strong>Invigilator Certification:</strong> I hereby certify that the examination attendance recorded above has been physically verified against the official seating layout matrix in hall ${roomNumber}. Candidate identity credentials and hall tickets have been authenticated.
      </div>

      <div class="signature-section">
        <div class="sig-box">
          <strong>Invigilator In-Charge Signature:</strong><br />
          <span>Name: ${inchargeName || 'Invigilator In-Charge'}</span><br />
          <span>Date & Time: ${new Date().toLocaleString()}</span>
        </div>
        <div class="sig-box">
          <strong>Chief Superintendent / CoE Observer:</strong><br />
          <span>Seal & Signature: ___________________________________</span><br />
          <span>Verified at Examination Control Room</span>
        </div>
      </div>

      <script>
        // Automatic print trigger when opened in dedicated window or printable tab
        if (!window.frameElement) {
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Downloads a standalone printable HTML document for the Attendance Sheet
 */
export function downloadPrintableAttendanceHTML(
  exam: Examination | undefined,
  room: Room | undefined,
  attendanceRecords: AttendanceRecord[],
  inchargeName?: string,
  isFinalized?: boolean
): void {
  const roomNumber = room?.room_number || 'Room';
  const courseCode = exam?.course_code || 'Course';
  const html = generateAttendanceHTML(exam, room, attendanceRecords, inchargeName, isFinalized);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Printable_Attendance_${roomNumber}_${courseCode}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PrintResult {
  success: boolean;
  action: 'printed' | 'downloaded';
  message: string;
}

/**
 * Triggers safe print using an isolated iframe with reliable download fallback for sandboxed iframes
 */
export function triggerPrintWithIframe(
  exam: Examination | undefined,
  room: Room | undefined,
  attendanceRecords: AttendanceRecord[],
  inchargeName?: string,
  isFinalized?: boolean
): PrintResult {
  const isInsideIframe = window.self !== window.top;
  const html = generateAttendanceHTML(exam, room, attendanceRecords, inchargeName, isFinalized);

  if (isInsideIframe) {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '1024px';
      iframe.style.height = '768px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            // Silently caught if sandboxed
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }, 500);
      }
    } catch (e) {
      console.warn('Iframe print warning:', e);
    }

    // Always guarantee download in sandboxed iframe environments
    downloadPrintableAttendanceHTML(exam, room, attendanceRecords, inchargeName, isFinalized);
    return {
      success: true,
      action: 'downloaded',
      message: 'Print sheet prepared! File downloaded for printing or saving as PDF.',
    };
  }

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '768px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        } catch {
          window.print();
        }
      }, 500);
      return {
        success: true,
        action: 'printed',
        message: 'Opening official print dialog...',
      };
    } else {
      window.print();
      return {
        success: true,
        action: 'printed',
        message: 'Opening official print dialog...',
      };
    }
  } catch (err) {
    console.warn('Printing error, falling back to direct download:', err);
    downloadPrintableAttendanceHTML(exam, room, attendanceRecords, inchargeName, isFinalized);
    return {
      success: true,
      action: 'downloaded',
      message: 'Print sheet prepared! File downloaded for printing.',
    };
  }
}
