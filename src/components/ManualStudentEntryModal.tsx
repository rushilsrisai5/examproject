import React, { useState, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  RotateCcw, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileSpreadsheet,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { StudentRecord, Department } from '../types';
import { DatabaseService } from '../services/db';

interface ManualStudentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentSaved: () => void;
  departments: Department[];
  performedBy?: { id: string; name: string };
  editStudent?: StudentRecord | null;
}

export const ManualStudentEntryModal: React.FC<ManualStudentEntryModalProps> = ({
  isOpen,
  onClose,
  onStudentSaved,
  departments,
  performedBy,
  editStudent,
}) => {
  const [mode, setMode] = useState<'single' | 'csv'>('single');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('Sec-A');
  const [semester, setSemester] = useState<number>(6);
  const [year, setYear] = useState('3rd Year');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{
    validRows: Omit<StudentRecord, 'id'>[];
    errors: string[];
  } | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Initialize or reset form when modal opens or editStudent changes
  React.useEffect(() => {
    if (editStudent) {
      setFullName(editStudent.full_name || '');
      setRegNo(editStudent.reg_no || '');
      setDepartment(editStudent.department || (departments[0]?.name || 'Computer Science & Engineering'));
      setSection(editStudent.section || 'Sec-A');
      setSemester(editStudent.semester || 6);
      setYear(editStudent.year || '3rd Year');
      setEmail(editStudent.email || '');
      setPhone(editStudent.phone || '');
      setStatus(editStudent.status || 'Active');
    } else {
      clearForm();
      if (departments.length > 0 && !department) {
        setDepartment(departments[0].name);
      }
    }
    setSuccessMessage(null);
    setErrorMessage(null);
    setCsvPreview(null);
    setCsvFile(null);
  }, [isOpen, editStudent, departments]);

  if (!isOpen) return null;

  const clearForm = () => {
    setFullName('');
    setRegNo('');
    setDepartment(departments[0]?.name || 'Computer Science & Engineering');
    setSection('Sec-A');
    setSemester(6);
    setYear('3rd Year');
    setEmail('');
    setPhone('');
    setStatus('Active');
    setErrorMessage(null);
  };

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter the student\'s full name.');
      return false;
    }
    if (!regNo.trim()) {
      setErrorMessage('Please enter a Registration/Roll Number.');
      return false;
    }
    if (!department.trim()) {
      setErrorMessage('Please select or specify a department.');
      return false;
    }
    if (!section.trim()) {
      setErrorMessage('Please specify the section.');
      return false;
    }
    return true;
  };

  const handleSaveStudent = async (addAnother: boolean = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editStudent) {
        // Edit existing student
        await DatabaseService.updateStudent(
          editStudent.id,
          {
            full_name: fullName.trim(),
            reg_no: regNo.trim().toUpperCase(),
            department: department.trim(),
            section: section.trim(),
            semester: Number(semester),
            year: year.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
          },
          performedBy
        );
        setSuccessMessage(`Candidate ${fullName} (${regNo.trim().toUpperCase()}) updated successfully!`);
        onStudentSaved();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Add new student
        const newRecord = await DatabaseService.createStudent(
          {
            full_name: fullName.trim(),
            reg_no: regNo.trim().toUpperCase(),
            department: department.trim(),
            section: section.trim(),
            semester: Number(semester),
            year: year.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
          },
          performedBy
        );

        setSuccessMessage(`Candidate ${newRecord.full_name} (${newRecord.reg_no}) registered in Firestore!`);
        onStudentSaved();

        if (addAnother) {
          clearForm();
          // Keep same department and section for convenient bulk entry
        } else {
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      console.error('Error saving student:', err);
      setErrorMessage(err.message || 'Failed to save student record to Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const csvContent = 
      'full_name,reg_no,department,section,semester,year,email,phone,status\n' +
      'Anand Verma,2026-CS-201,Computer Science & Engineering,Sec-A,6,3rd Year,anand.v@examflow.edu,+91-9876543210,Active\n' +
      'Priya Sharma,2026-CS-202,Computer Science & Engineering,Sec-A,6,3rd Year,priya.s@examflow.edu,+91-9876543211,Active\n' +
      'Rahul Nair,2026-EC-201,Electronics & Communication Engineering,Sec-B,6,3rd Year,rahul.n@examflow.edu,+91-9876543212,Active\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ExamNova_Student_Import_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        setErrorMessage('The uploaded CSV file is empty or missing data rows.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const fullNameIdx = headers.findIndex((h) => h.includes('name'));
      const regNoIdx = headers.findIndex((h) => h.includes('reg') || h.includes('roll'));
      const deptIdx = headers.findIndex((h) => h.includes('dept'));
      const secIdx = headers.findIndex((h) => h.includes('sec'));
      const semIdx = headers.findIndex((h) => h.includes('sem'));
      const yearIdx = headers.findIndex((h) => h.includes('year'));
      const emailIdx = headers.findIndex((h) => h.includes('email'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('contact'));
      const statusIdx = headers.findIndex((h) => h.includes('status'));

      if (fullNameIdx === -1 || regNoIdx === -1 || deptIdx === -1) {
        setErrorMessage('CSV missing required header columns: "full_name", "reg_no", and "department".');
        return;
      }

      const currentStudents = await DatabaseService.getStudents();
      const existingRegNos = new Set(currentStudents.map((s) => s.reg_no.trim().toUpperCase()));
      const seenInBatch = new Set<string>();

      const validRows: Omit<StudentRecord, 'id'>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Split handling simple commas
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const rowNumber = i + 1;

        const name = cols[fullNameIdx] || '';
        const roll = cols[regNoIdx] || '';
        const dept = cols[deptIdx] || '';
        const sec = secIdx !== -1 && cols[secIdx] ? cols[secIdx] : 'Sec-A';
        const sem = semIdx !== -1 && cols[semIdx] ? parseInt(cols[semIdx], 10) || 6 : 6;
        const yr = yearIdx !== -1 && cols[yearIdx] ? cols[yearIdx] : '3rd Year';
        const em = emailIdx !== -1 ? cols[emailIdx] : '';
        const ph = phoneIdx !== -1 ? cols[phoneIdx] : '';
        const st = statusIdx !== -1 && cols[statusIdx]?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

        const cleanRoll = roll.trim().toUpperCase();

        if (!name.trim()) {
          errors.push(`Row ${rowNumber}: Student Name is missing.`);
          continue;
        }
        if (!cleanRoll) {
          errors.push(`Row ${rowNumber}: Registration Number is missing.`);
          continue;
        }
        if (!dept.trim()) {
          errors.push(`Row ${rowNumber}: Department is missing.`);
          continue;
        }
        if (existingRegNos.has(cleanRoll)) {
          errors.push(`Row ${rowNumber}: Roll No "${cleanRoll}" already exists in the institutional database (Duplicate blocked).`);
          continue;
        }
        if (seenInBatch.has(cleanRoll)) {
          errors.push(`Row ${rowNumber}: Duplicate Roll No "${cleanRoll}" found multiple times inside the CSV.`);
          continue;
        }

        seenInBatch.add(cleanRoll);
        validRows.push({
          full_name: name.trim(),
          reg_no: cleanRoll,
          department: dept.trim(),
          section: sec.trim(),
          semester: sem,
          year: yr.trim(),
          email: em.trim() || undefined,
          phone: ph.trim() || undefined,
          status: st as 'Active' | 'Inactive',
        });
      }

      setCsvPreview({
        validRows,
        errors,
      });
    };

    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (!csvPreview || csvPreview.validRows.length === 0) return;

    setIsImportingCsv(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await DatabaseService.bulkImportStudents(csvPreview.validRows, performedBy);
      setSuccessMessage(`Successfully registered ${result.importedCount} student candidates to Cloud Firestore!`);
      onStudentSaved();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('CSV import error:', err);
      setErrorMessage(err.message || 'Failed to complete CSV import.');
    } finally {
      setIsImportingCsv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editStudent ? 'Edit Student Candidate' : 'Manual Student Entry & Registration'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Authorized Examination Section Registry · Cloud Firestore
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

        {/* Tab Switcher (Single Form vs CSV Bulk) - only if not editing */}
        {!editStudent && (
          <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={() => { setMode('single'); setErrorMessage(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Single Student Form</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('csv'); setErrorMessage(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                mode === 'csv'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV Upload</span>
            </button>
          </div>
        )}

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="font-medium">{successMessage}</div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {mode === 'single' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveStudent(false); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Ananya Sharma"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* 2. Registration/Roll Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration / Roll Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    placeholder="e.g., 2026-CS-042"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg text-indigo-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique institutional identification number</p>
                </div>

                {/* 3. Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                    <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                    <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                    <option value="Information Technology">Information Technology (IT)</option>
                  </select>
                </div>

                {/* 4. Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="Sec-A">Section A</option>
                    <option value="Sec-B">Section B</option>
                    <option value="Sec-C">Section C</option>
                    <option value="Sec-D">Section D</option>
                  </select>
                </div>

                {/* 5. Year / Semester */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year / Semester <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>

                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Email Address (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@institution.edu"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 7. Phone Number (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 8. Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enrollment Status <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Active'}
                        onChange={() => setStatus('Active')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-emerald-700 font-bold">Active</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'Inactive'}
                        onChange={() => setStatus('Inactive')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-slate-500">Inactive / Suspended</span>
                    </label>
                  </div>
                </div>

              </div>
            </form>
          ) : (
            /* CSV Bulk Upload View */
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>Download CSV Template</span>
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Use our standardized CSV template to prepare candidate data with pre-configured headers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
                <div className="text-xs font-bold text-slate-800">
                  {csvFile ? csvFile.name : 'Click to select or drop CSV student roster'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Supports comma-separated (.csv) files up to 5MB
                </div>
              </div>

              {/* CSV Verification & Validation Preview */}
              {csvPreview && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">Verification Report:</span>
                    <span className="text-emerald-700">
                      {csvPreview.validRows.length} valid row(s) ready for Cloud Firestore
                    </span>
                  </div>

                  {/* Errors display */}
                  {csvPreview.errors.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 max-h-32 overflow-y-auto">
                      <div className="font-bold flex items-center gap-1 text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{csvPreview.errors.length} row(s) rejected (duplicates or invalid):</span>
                      </div>
                      {csvPreview.errors.map((err, i) => (
                        <div key={i} className="text-[11px] text-amber-800 pl-4">
                          • {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview table of valid rows */}
                  {csvPreview.validRows.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                          <tr>
                            <th className="px-3 py-2">Roll No</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Department</th>
                            <th className="px-3 py-2">Sec</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {csvPreview.validRows.slice(0, 15).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-mono font-bold text-indigo-700">{row.reg_no}</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-800">{row.full_name}</td>
                              <td className="px-3 py-1.5 text-slate-600">{row.department}</td>
                              <td className="px-3 py-1.5 text-slate-600">{row.section}</td>
                              <td className="px-3 py-1.5 text-emerald-700 font-bold">{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvPreview.validRows.length > 15 && (
                        <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50">
                          ...and {csvPreview.validRows.length - 15} more candidates
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          {mode === 'single' ? (
            <>
              <button
                type="button"
                onClick={clearForm}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Form</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                {!editStudent && (
                  <button
                    type="button"
                    onClick={() => handleSaveStudent(true)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save & Add Another</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveStudent(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editStudent ? 'Update Candidate' : 'Save Student'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setCsvPreview(null); setCsvFile(null); }}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Reset Upload
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={!csvPreview || csvPreview.validRows.length === 0 || isImportingCsv}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isImportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>
                    {isImportingCsv ? 'Importing...' : `Import ${csvPreview?.validRows.length || 0} Candidates`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
