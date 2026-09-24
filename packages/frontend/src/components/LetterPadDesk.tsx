import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../api';
import { Student } from '../types';
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  Search,
  Save,
  CheckCircle2,
  Calendar,
  X,
  School as SchoolIcon,
  Sparkles,
  Award,
  Layers,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  History,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Globe,
  User,
  Users,
} from 'lucide-react';

interface LetterPadDeskProps {
  schoolInfo?: any;
  students?: Student[];
  staffList?: any[];
}

export type HeaderStyle = 'royal' | 'gold' | 'heritage' | 'modern' | 'preprinted';
export type TableStyle = 'grid' | 'striped' | 'formal' | 'clean';

interface TableCell {
  text: string;
}

interface TableDataState {
  enabled: boolean;
  title: string;
  style: TableStyle;
  hasHeader: boolean;
  headers: string[];
  rows: string[][];
}

interface LetterPadDocument {
  id: string;
  schoolId?: string;
  refNo: string;
  docDate: string;
  recipient: string;
  subject: string;
  salutation: string;
  bodyContent: string;
  tableData?: TableDataState | string;
  templateId: HeaderStyle;
  headerMode: 'with_header' | 'preprinted_paper';
  signatoryName: string;
  signatoryTitle: string;
  watermarkEnabled: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 8 Pre-built Official School Presets
const PRESET_TEMPLATES = [
  {
    id: 'bonafide',
    name: 'Bonafide / Recommendation Letter',
    subject: 'Recommendation & Bonafide Certificate for Scholastic Recognition',
    recipient: 'To Whom It May Concern,',
    salutation: 'Dear Sir / Madam,',
    body: 'This is to officially certify that {STUDENT_NAME}, son/daughter of Mr. {FATHER_NAME}, bearing Admission No: {ADMISSION_NO} and Roll No: {ROLL_NO}, is a bonafide student of this institution currently studying in {CLASS_SECTION} during the academic session {ACADEMIC_YEAR}.\n\nDuring his/her tenure at {SCHOOL_NAME}, the student has consistently demonstrated exemplary conduct, sincere devotion to academic pursuits, and active participation in co-curricular initiatives.\n\nWe unreservedly recommend him/her for any competitive examination, higher educational enrollment, or government scholarship. We extend our warmest wishes for his/her future endeavors.',
    table: null,
  },
  {
    id: 'conduct',
    name: 'Character & Conduct Attestation',
    subject: 'Character & Conduct Attestation Certificate',
    recipient: 'To Whom It May Concern,',
    salutation: 'Respected Authority,',
    body: 'This is to certify that {STUDENT_NAME}, a student of {CLASS_SECTION}, bearing Admission No: {ADMISSION_NO}, bears an excellent moral character and exemplary disciplinary record throughout his/her association with {SCHOOL_NAME}.\n\nTo the best of our institutional records and knowledge, he/she has never participated in any disruptive activities and has upheld the core values and dignity of this institution. His/her moral standing and obedience have earned him/her the respect of faculty and peers alike.',
    table: null,
  },
  {
    id: 'fee_notice',
    name: 'Fee Payment Advisory & Statement',
    subject: 'Important Communication: Outstanding Institutional Term Fee Statement',
    recipient: 'To,\nThe Parents / Guardians of {STUDENT_NAME},\nClass & Section: {CLASS_SECTION},\nAdmission No: {ADMISSION_NO}',
    salutation: 'Dear Parents / Guardians,',
    body: 'We express our sincere appreciation for your continued partnership with {SCHOOL_NAME} in fostering your ward\'s academic excellence.\n\nThis communication is to politely apprise you regarding the pending educational fee dues for the ongoing term as detailed below. You are requested to kindly remit the balance dues on or before the due date to avoid any late surcharge.',
    table: {
      enabled: true,
      title: 'Official Fee Dues & Assessment Statement',
      style: 'striped' as TableStyle,
      hasHeader: true,
      headers: ['S.No', 'Particulars / Fee Head', 'Due Date', 'Amount (INR)', 'Status'],
      rows: [
        ['1', 'Tuition & Academic Training Fee', '15th of Ongoing Month', '18,500.00', 'Pending'],
        ['2', 'Smart Lab & Digital IT Facility', '15th of Ongoing Month', '3,500.00', 'Pending'],
        ['3', 'Sports & Co-Curricular Assessment', '15th of Ongoing Month', '2,000.00', 'Pending'],
        ['4', 'Total Balance Payable', 'Immediate', '24,000.00', 'Due for Clearance'],
      ],
    },
  },
  {
    id: 'experience',
    name: 'Staff Experience & Service Certificate',
    subject: 'Official Experience & Professional Service Certificate',
    recipient: 'To Whom It May Concern,',
    salutation: 'Dear Sir / Madam,',
    body: 'This is to certify that Mr./Ms. [Faculty Name] served as a regular faculty member (Designation: Senior PGT Teacher) at {SCHOOL_NAME} from [Start Date] to [End Date].\n\nDuring his/her tenure, he/she demonstrated commendable instructional proficiency, pedagogical expertise, and dedication towards student mentorship. His/her classroom management, moral integrity, and cooperative spirit with the administration have been thoroughly satisfactory.\n\nHe/she has been officially relieved of all institutional responsibilities upon his/her own request. We wish him/her immense success in his/her future professional career.',
    table: null,
  },
  {
    id: 'ptm',
    name: 'Parent-Teacher Meeting (PTM) Circular',
    subject: 'Invitation: Periodic Parent-Teacher Conference & Academic Performance Review',
    recipient: 'To,\nAll Respected Parents & Guardians,\n{SCHOOL_NAME}',
    salutation: 'Respected Parents & Guardians,',
    body: 'Greetings from {SCHOOL_NAME}!\n\nWe cordially invite you to the upcoming Parent-Teacher Conference (PTM) scheduled on [Day & Date] between 09:00 AM and 01:00 PM. This meeting provides an invaluable forum to review your ward\'s progress, examination marks, attendance consistency, and holistic growth with our subject faculties.\n\nKindly refer to the schedule and classroom allocation detailed below:',
    table: {
      enabled: true,
      title: 'Parent-Teacher Conference Schedule & Venue Matrix',
      style: 'formal' as TableStyle,
      hasHeader: true,
      headers: ['Class Group', 'Reporting Time', 'Designated Venue', 'Faculty Coordinator'],
      rows: [
        ['Classes Nursery to V (Primary Wing)', '09:00 AM - 10:30 AM', 'Junior Campus Block B', 'Primary Wing In-charge'],
        ['Classes VI to VIII (Middle Wing)', '10:30 AM - 11:45 AM', 'Auditorium Hall 1', 'Middle School Head'],
        ['Classes IX to XII (Senior Secondary)', '11:45 AM - 01:00 PM', 'Senior Wing Central Labs', 'Academic Dean'],
      ],
    },
  },
  {
    id: 'disciplinary',
    name: 'Disciplinary Advisory & Warning Letter',
    subject: 'Confidential Disciplinary Notice & Immediate Parental Conference Request',
    recipient: 'To,\nThe Parents / Guardians of {STUDENT_NAME},\nClass: {CLASS_SECTION} | Admission No: {ADMISSION_NO}',
    salutation: 'Dear Parents,',
    body: 'It is with concern that we bring to your immediate notice an incident of behavioral infraction and non-compliance with the institutional code of conduct by your ward, {STUDENT_NAME}, in class on [Date].\n\nWhile {SCHOOL_NAME} firmly believes in positive reinforcement and counseling, maintaining institutional decorum and student safety remains non-negotiable. You are earnestly requested to attend a private conference with the Principal and Discipline Committee on [Meeting Date] at 10:00 AM to collectively formulate corrective guidance.',
    table: null,
  },
  {
    id: 'leave_sanction',
    name: 'Staff Duty / Leave Sanction Order',
    subject: 'Official Order: Sanction of Duty Leave & Temporary Charge Handover',
    recipient: 'To,\n[Staff Member Name],\nDesignation: [Teacher / Department Head],\n{SCHOOL_NAME}',
    salutation: 'Dear Colleague,',
    body: 'In reference to your application dated [Application Date], the Competent Authority is pleased to sanction your Duty Leave / Earned Leave for the period mentioned below. You are advised to ensure that your classroom instructional periods and examination invigilation responsibilities are seamlessly handed over to the alternate faculty.',
    table: {
      enabled: true,
      title: 'Sanctioned Leave Details & Alternate Delegation',
      style: 'grid' as TableStyle,
      hasHeader: true,
      headers: ['Type of Leave', 'From Date', 'To Date', 'Total Days', 'Alternate Faculty Assigned'],
      rows: [
        ['Duty Leave (CBSE Workshop)', '[Start Date]', '[End Date]', '3 Days', '[Substitute Teacher Name]'],
      ],
    },
  },
  {
    id: 'blank',
    name: 'Blank Official School Letterhead',
    subject: 'Subject: Official Institutional Communication',
    recipient: 'To,\n[Recipient Name / Organization],\n[Address Line 1],\n[City, State, PIN]',
    salutation: 'Respected Sir / Madam,',
    body: 'Write your official letter content here. You can format text, insert dynamic tokens, and add custom tables using the tools on the left panel.',
    table: null,
  },
];

export const LetterPadDesk: React.FC<LetterPadDeskProps> = ({
  schoolInfo,
  students = [],
  staffList = [],
}) => {
  // Document State
  const [refNo, setRefNo] = useState(`AMIS/OFFICE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('To Whom It May Concern,');
  const [subject, setSubject] = useState('Recommendation & Bonafide Certificate for Scholastic Recognition');
  const [salutation, setSalutation] = useState('Dear Sir / Madam,');
  const [bodyContent, setBodyContent] = useState(PRESET_TEMPLATES[0].body);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('royal');
  const [headerMode, setHeaderMode] = useState<'with_header' | 'preprinted_paper'>('with_header');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [signatoryName, setSignatoryName] = useState(schoolInfo?.principalName || 'Dr. Arvind K. Sharma');
  const [signatoryTitle, setSignatoryTitle] = useState('Principal & Academic Director');

  // Table Add-on State
  const [tableState, setTableState] = useState<TableDataState>({
    enabled: false,
    title: '',
    style: 'grid',
    hasHeader: true,
    headers: ['S.No', 'Particulars / Subject', 'Details', 'Remarks'],
    rows: [
      ['1', 'Academic Assessment', 'Grade A1 (94%)', 'Outstanding'],
      ['2', 'Attendance Record', '98.4%', 'Consistent'],
      ['3', 'Disciplinary Conduct', 'Exemplary', 'Verified'],
    ],
  });

  // UI & Drawer States
  const [activeTab, setActiveTab] = useState<'editor' | 'table_tools' | 'presets' | 'archive'>('editor');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedLetters, setSavedLetters] = useState<LetterPadDocument[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [activePresetId, setActivePresetId] = useState('bonafide');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fallback school branding
  const schoolName = schoolInfo?.name || 'ANVI MITRA INTERNATIONAL SCHOOL';
  const schoolLogo = schoolInfo?.logoUrl;
  const affiliationNo = schoolInfo?.affiliationNo || '1030982';
  const schoolCode = schoolInfo?.code || '50942';
  const schoolAddress = schoolInfo?.address || schoolInfo?.city
    ? `${schoolInfo.address || ''}, ${schoolInfo.city || ''} ${schoolInfo.state ? `, ${schoolInfo.state}` : ''} ${schoolInfo.pincode ? `- ${schoolInfo.pincode}` : ''}`
    : 'Knowledge City Campus, Ring Road Phase II, Indore, M.P. - 452010';
  const schoolPhone = schoolInfo?.phone || '+91 98765 43210';
  const schoolEmail = schoolInfo?.email || 'principal@anvimitra.edu.in';
  const schoolWebsite = schoolInfo?.website || 'www.anvimitra.edu.in';
  const schoolTagline = schoolInfo?.tagline || 'Excellence in Education • Character • Leadership';

  // Load Archive on Mount
  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    setLoadingArchive(true);
    try {
      const list = await ApiService.fetchLetterPadDocuments();
      setSavedLetters(list || []);
    } catch (e) {
      console.warn('Failed loading archive:', e);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleGenerateRefNo = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = schoolInfo?.code ? schoolInfo.code.toUpperCase() : 'AMIS';
    setRefNo(`${code}/OFFICE/${year}/${rand}`);
  };

  // Substitute Tokens into Text
  const resolveTokens = (text: string) => {
    if (!text) return '';
    let res = text;
    res = res.replaceAll('{SCHOOL_NAME}', schoolName);
    res = res.replaceAll('{DATE}', new Date(docDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
    res = res.replaceAll('{REF_NO}', refNo);
    res = res.replaceAll('{AFFILIATION_NO}', affiliationNo);
    res = res.replaceAll('{SCHOOL_CODE}', schoolCode);
    res = res.replaceAll('{ACADEMIC_YEAR}', `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

    // If a student is selected, substitute real student attributes
    if (selectedStudentId) {
      const stu = students.find((s) => s.id === selectedStudentId);
      if (stu) {
        res = res.replaceAll('{STUDENT_NAME}', `${stu.firstName} ${stu.lastName || ''}`.trim());
        res = res.replaceAll('{FATHER_NAME}', stu.fatherName || stu.guardianName || 'Guardian');
        res = res.replaceAll('{MOTHER_NAME}', stu.motherName || 'Parent');
        res = res.replaceAll('{CLASS_SECTION}', `Class ${stu.className || ''} ${stu.sectionName || ''}`.trim());
        res = res.replaceAll('{ROLL_NO}', stu.rollNo ? String(stu.rollNo) : 'N/A');
        res = res.replaceAll('{ADMISSION_NO}', stu.admissionNo || 'N/A');
      }
    }
    return res;
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setActivePresetId(preset.id);
    setSubject(preset.subject);
    setRecipient(preset.recipient);
    setSalutation(preset.salutation);
    setBodyContent(preset.body);
    if (preset.table) {
      setTableState(JSON.parse(JSON.stringify(preset.table)));
    } else {
      setTableState((prev) => ({ ...prev, enabled: false }));
    }
    setActiveTab('editor');
  };

  const handleSubstituteStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) return;
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return;

    // Auto substitute in recipient & subject if tokens exist
    const fullName = `${stu.firstName} ${stu.lastName || ''}`.trim();
    setRecipient((prev) => {
      if (prev.includes('{STUDENT_NAME}') || prev.includes('{CLASS_SECTION}')) {
        return prev
          .replaceAll('{STUDENT_NAME}', fullName)
          .replaceAll('{CLASS_SECTION}', `Class ${stu.className || ''} ${stu.sectionName || ''}`.trim())
          .replaceAll('{ADMISSION_NO}', stu.admissionNo || '');
      }
      return prev;
    });

    setSubject((prev) => {
      if (prev.includes('{STUDENT_NAME}')) {
        return prev.replaceAll('{STUDENT_NAME}', fullName);
      }
      return prev;
    });
  };

  // Table Management Actions
  const handleAddTableRow = () => {
    const colCount = tableState.headers.length;
    const newRow = Array(colCount).fill('');
    newRow[0] = String(tableState.rows.length + 1);
    setTableState((prev) => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));
  };

  const handleRemoveTableRow = (rowIndex: number) => {
    if (tableState.rows.length <= 1) return;
    setTableState((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, idx) => idx !== rowIndex),
    }));
  };

  const handleAddTableCol = () => {
    setTableState((prev) => ({
      ...prev,
      headers: [...prev.headers, `Col ${prev.headers.length + 1}`],
      rows: prev.rows.map((r) => [...r, '']),
    }));
  };

  const handleRemoveTableCol = (colIndex: number) => {
    if (tableState.headers.length <= 1) return;
    setTableState((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, idx) => idx !== colIndex),
      rows: prev.rows.map((r) => r.filter((_, idx) => idx !== colIndex)),
    }));
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    setTableState((prev) => {
      const updatedRows = prev.rows.map((row, rIdx) => {
        if (rIdx !== rowIndex) return row;
        const newRow = [...row];
        newRow[colIndex] = val;
        return newRow;
      });
      return { ...prev, rows: updatedRows };
    });
  };

  const handleHeaderChange = (colIndex: number, val: string) => {
    setTableState((prev) => {
      const newHeaders = [...prev.headers];
      newHeaders[colIndex] = val;
      return { ...prev, headers: newHeaders };
    });
  };

  // Save to Archive
  const handleSaveToArchive = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const payload: Partial<LetterPadDocument> = {
        refNo,
        docDate,
        recipient,
        subject,
        salutation,
        bodyContent,
        tableData: tableState,
        templateId: headerStyle,
        headerMode,
        signatoryName,
        signatoryTitle,
        watermarkEnabled,
        status: 'ISSUED',
      };

      const saved = await ApiService.saveLetterPadDocument(payload);
      setSaveSuccessMsg('✓ Letterhead document saved successfully to ERP Archive!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      loadArchive();
    } catch (e) {
      alert('Failed saving letter document. Check network or permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load Document from Archive
  const handleLoadFromArchive = (doc: LetterPadDocument) => {
    setRefNo(doc.refNo || refNo);
    setDocDate(doc.docDate || docDate);
    setRecipient(doc.recipient || '');
    setSubject(doc.subject || '');
    setSalutation(doc.salutation || 'Dear Sir / Madam,');
    setBodyContent(doc.bodyContent || '');
    setHeaderStyle(doc.templateId || 'royal');
    setHeaderMode(doc.headerMode || 'with_header');
    setSignatoryName(doc.signatoryName || signatoryName);
    setSignatoryTitle(doc.signatoryTitle || signatoryTitle);
    setWatermarkEnabled(doc.watermarkEnabled !== undefined ? doc.watermarkEnabled : true);

    if (doc.tableData) {
      try {
        const parsed = typeof doc.tableData === 'string' ? JSON.parse(doc.tableData) : doc.tableData;
        setTableState(parsed);
      } catch (e) {
        setTableState((prev) => ({ ...prev, enabled: false }));
      }
    } else {
      setTableState((prev) => ({ ...prev, enabled: false }));
    }

    setActiveTab('editor');
  };

  // Delete from Archive
  const handleDeleteFromArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this letter from archive?')) return;
    try {
      await ApiService.deleteLetterPadDocument(id);
      setSavedLetters((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Could not delete document.');
    }
  };

  // 1-Click Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print Specific CSS to isolate A4 Sheet perfectly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-letter-sheet, #official-letter-sheet * {
            visibility: visible !important;
          }
          #official-letter-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <FileText className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Official School Letter Pad & Letterhead Service
                </h2>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Principal Desk
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Generate, format, table-compose, and print certified institutional letters on A4 letterhead paper.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {/* Nav Tabs */}
            <div className="bg-white/10 p-1 rounded-2xl flex items-center space-x-1 border border-white/10">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'editor' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Letter Editor</span>
              </button>

              <button
                onClick={() => setActiveTab('table_tools')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'table_tools' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table Maker ({tableState.enabled ? 'Active' : 'Off'})</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'presets' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Presets (8)</span>
              </button>

              <button
                onClick={() => setActiveTab('archive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'archive' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Archive ({savedLetters.length})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleSaveToArchive}
              disabled={isSaving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Official Letter (A4)</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Split Grid: Controls on Left, Realistic A4 Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT CONTROLS PANE (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* TAB 1: Main Letter Editor */}
          {activeTab === 'editor' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Letterhead Parameters & Content</span>
                </h3>
                <span className="text-[11px] text-slate-400">Step 1 of 3</span>
              </div>

              {/* Letterhead Header & Paper Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Top School Details & Header Style:</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">{headerStyle} style</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setHeaderStyle('royal'); setHeaderMode('with_header'); }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition ${
                      headerStyle === 'royal' && headerMode === 'with_header'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Royal Blue
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderStyle('gold'); setHeaderMode('with_header'); }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition ${
                      headerStyle === 'gold' && headerMode === 'with_header'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Gold Executive
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderStyle('heritage'); setHeaderMode('with_header'); }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition ${
                      headerStyle === 'heritage' && headerMode === 'with_header'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Heritage Crest
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeaderStyle('modern'); setHeaderMode('with_header'); }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition ${
                      headerStyle === 'modern' && headerMode === 'with_header'
                        ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Modern Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderMode('preprinted_paper')}
                    className={`col-span-2 p-2 rounded-xl text-center border text-xs font-bold transition ${
                      headerMode === 'preprinted_paper'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                    title="For schools with physical pre-printed letterhead paper"
                  >
                    📄 Pre-Printed Stationary Mode (No Header)
                  </button>
                </div>
              </div>

              {/* Watermark toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Faint School Watermark in Center:</span>
                <button
                  type="button"
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    watermarkEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {watermarkEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Reference & Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Ref No:</label>
                    <button
                      type="button"
                      onClick={handleGenerateRefNo}
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Date:</label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Dynamic Student Auto-Populate Selector */}
              {students.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Insert Student Data (Data Type Add-on):</span>
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Auto-Tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleSubstituteStudent(e.target.value)}
                      className="flex-1 text-xs font-bold p-2 bg-white border border-blue-300 rounded-xl"
                    >
                      <option value="">-- Choose Student to Auto-Populate --</option>
                      {students.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.firstName} {stu.lastName} ({stu.className || 'Class'} | Adm: {stu.admissionNo})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Token chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      '{STUDENT_NAME}',
                      '{CLASS_SECTION}',
                      '{ROLL_NO}',
                      '{ADMISSION_NO}',
                      '{FATHER_NAME}',
                      '{DATE}',
                      '{REF_NO}',
                      '{SCHOOL_NAME}',
                    ].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setBodyContent((prev) => prev + ' ' + token)}
                        className="text-[10px] font-mono font-bold bg-white text-blue-800 border border-blue-300 px-1.5 py-0.5 rounded hover:bg-blue-100"
                        title="Click to insert token into body"
                      >
                        +{token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">To / Recipient Address:</label>
                <textarea
                  rows={2}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. To, The Regional Officer, CBSE..."
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subject Line:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject of the official letter"
                  className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Salutation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Salutation:</label>
                <input
                  type="text"
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  placeholder="e.g. Respected Sir / Madam,"
                  className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Letter Body Text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Letter Main Content:</label>
                  <span className="text-[10px] text-slate-400">Paragraphs & Line breaks supported</span>
                </div>
                <textarea
                  rows={7}
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white leading-relaxed"
                />
              </div>

              {/* Signatory Settings */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Signatory Name:</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Signatory Title:</label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Table Maker Add-on */}
          {activeTab === 'table_tools' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <TableIcon className="w-4 h-4 text-purple-600" />
                  <span>Table Maker & Data Grid Add-on</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setTableState((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                    tableState.enabled ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tableState.enabled ? '✓ Table Active' : '+ Enable Table'}
                </button>
              </div>

              {tableState.enabled ? (
                <div className="space-y-4">
                  {/* Table Caption */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Table Header / Title (Optional):</label>
                    <input
                      type="text"
                      value={tableState.title}
                      onChange={(e) => setTableState({ ...tableState, title: e.target.value })}
                      placeholder="e.g. Schedule of Term Assessments / Fee Summary"
                      className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Table Styling */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Table Visual Style:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['grid', 'striped', 'formal', 'clean'] as TableStyle[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setTableState({ ...tableState, style: st })}
                          className={`p-2 rounded-xl text-xs font-bold capitalize border transition ${
                            tableState.style === st
                              ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Controls */}
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">
                      Grid Dimensions: {tableState.rows.length} Rows × {tableState.headers.length} Cols
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleAddTableRow}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg border shadow-sm"
                      >
                        + Row
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTableCol}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg border shadow-sm"
                      >
                        + Column
                      </button>
                    </div>
                  </div>

                  {/* Interactive Cell Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Direct Table Content Editor:</label>
                      <span className="text-[10px] text-slate-400">Edit cells directly</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                          <tr>
                            {tableState.headers.map((h, cIdx) => (
                              <th key={cIdx} className="p-1.5 border border-slate-200 min-w-[90px]">
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) => handleHeaderChange(cIdx, e.target.value)}
                                    className="w-full p-1 bg-white border border-slate-300 rounded font-black text-slate-800 text-[11px]"
                                  />
                                  {tableState.headers.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTableCol(cIdx)}
                                      className="text-rose-500 hover:text-rose-700 font-bold p-0.5"
                                      title="Delete Column"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th className="w-8 p-1 text-center bg-slate-100 border border-slate-200">Act</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableState.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-1 border border-slate-200">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                                  />
                                </td>
                              ))}
                              <td className="p-1 text-center border border-slate-200">
                                {tableState.rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTableRow(rIdx)}
                                    className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                                    title="Delete Row"
                                  >
                                    ×
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <TableIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-700 text-xs">Table Maker is currently turned off</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enable table to insert structured schedules, marks, or fee statements inside your letter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTableState((prev) => ({ ...prev, enabled: true }))}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    + Insert Table in Letter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Pre-made Presets */}
          {activeTab === 'presets' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>8 Official School Letter Presets</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select any preset to instantly populate standard letterhead formats.
                </p>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {PRESET_TEMPLATES.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition text-left space-y-1 ${
                      activePresetId === p.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{p.name}</span>
                      {p.table && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                          Includes Table
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{p.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Saved Letters Archive */}
          {activeTab === 'archive' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Issued Letters Archive</span>
                </h3>
                <button
                  type="button"
                  onClick={loadArchive}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  title="Reload archive"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Ref No or Subject..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full text-xs p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {loadingArchive ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading saved letters...</div>
              ) : savedLetters.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No letters issued yet. Click 'Save Draft' to archive documents.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {savedLetters
                    .filter((d) => {
                      if (!archiveSearch.trim()) return true;
                      const q = archiveSearch.toLowerCase();
                      return (
                        (d.refNo && d.refNo.toLowerCase().includes(q)) ||
                        (d.subject && d.subject.toLowerCase().includes(q)) ||
                        (d.recipient && d.recipient.toLowerCase().includes(q))
                      );
                    })
                    .map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleLoadFromArchive(doc)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition text-left space-y-1 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-blue-900">{doc.refNo}</span>
                          <span className="text-[10px] text-slate-400">{doc.docDate}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{doc.subject}</h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1">To: {doc.recipient}</p>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteFromArchive(doc.id, e)}
                          className="absolute right-2.5 bottom-2.5 text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Delete from archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT PREVIEW PANE (7 Cols): A4 SHEET CANVAS ================= */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Top Preview Canvas Notice */}
          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span className="flex items-center space-x-1.5 font-bold">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Live A4 Letterhead Preview (210mm × 297mm Standard)</span>
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              Print Ready
            </span>
          </div>

          {/* Actual Printable A4 Sheet Paper */}
          <div
            id="official-letter-sheet"
            ref={printAreaRef}
            className="w-full bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-12 relative min-h-[842px] flex flex-col justify-between overflow-hidden"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              lineHeight: 1.6,
            }}
          >
            {/* Center Faint Watermark */}
            {watermarkEnabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Watermark" className="w-96 h-96 object-contain grayscale" />
                ) : (
                  <SchoolIcon className="w-96 h-96" />
                )}
              </div>
            )}

            {/* TOP SECTION: School Details Header (if with_header) */}
            <div>
              {headerMode === 'with_header' && (
                <div className="pb-4 mb-4 border-b-2 border-slate-900">
                  {/* HEADER STYLE: Royal Blue */}
                  {headerStyle === 'royal' && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1 border border-slate-200 rounded-lg">
                        {schoolLogo ? (
                          <img src={schoolLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-blue-900 text-white rounded flex items-center justify-center font-bold text-2xl font-sans">
                            {schoolName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <h1 className="text-xl sm:text-2xl font-black text-blue-950 uppercase tracking-tight font-sans">
                          {schoolName}
                        </h1>
                        <p className="text-xs font-bold text-slate-700 mt-0.5 font-sans">
                          CBSE Affiliated Senior Secondary Institution • Affiliation No. {affiliationNo} • School Code: {schoolCode}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-sans">{schoolAddress}</p>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                          📞 {schoolPhone} | ✉️ {schoolEmail} | 🌐 {schoolWebsite}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HEADER STYLE: Gold Executive */}
                  {headerStyle === 'gold' && (
                    <div>
                      <div className="flex items-center justify-center space-x-3 mb-1">
                        {schoolLogo && (
                          <img src={schoolLogo} alt="Logo" className="w-12 h-12 object-contain" />
                        )}
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide font-serif">
                          {schoolName}
                        </h1>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 rounded-full mb-1"></div>
                      <p className="text-[11px] text-center text-slate-700 font-bold font-sans">
                        Recognized & Affiliated by CBSE New Delhi (Affiliation: {affiliationNo}) • {schoolAddress}
                      </p>
                      <p className="text-[10px] text-center text-slate-500 font-sans">
                        Phone: {schoolPhone} • Email: {schoolEmail}
                      </p>
                    </div>
                  )}

                  {/* HEADER STYLE: Heritage Crest */}
                  {headerStyle === 'heritage' && (
                    <div className="text-center space-y-1">
                      {schoolLogo && (
                        <img src={schoolLogo} alt="Logo" className="w-14 h-14 mx-auto object-contain mb-1" />
                      )}
                      <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wider font-serif">
                        {schoolName}
                      </h1>
                      <div className="text-xs italic text-slate-600 font-serif">"{schoolTagline}"</div>
                      <div className="text-[11px] text-slate-700 font-sans font-bold">
                        Affiliation No: {affiliationNo} | School Code: {schoolCode}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">{schoolAddress}</div>
                    </div>
                  )}

                  {/* HEADER STYLE: Modern Line */}
                  {headerStyle === 'modern' && (
                    <div className="flex items-start justify-between border-b pb-3">
                      <div>
                        <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight font-sans">
                          {schoolName}
                        </h1>
                        <p className="text-[11px] text-slate-600 font-sans mt-0.5">{schoolAddress}</p>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Ph: {schoolPhone} | Email: {schoolEmail}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block">
                          Affiliation: {affiliationNo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block mt-1">
                          Code: {schoolCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pre-printed mode spacer */}
              {headerMode === 'preprinted_paper' && (
                <div className="h-28 border border-dashed border-slate-300 rounded mb-4 flex items-center justify-center text-xs text-slate-400 font-sans">
                  [ Blank Area for Physical Pre-Printed School Letterhead Stationary ]
                </div>
              )}

              {/* Reference Number & Date Header Bar */}
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-300 pb-2 mb-4 font-sans text-slate-800">
                <div>
                  <span className="text-slate-500 font-normal">Ref No: </span>
                  <span className="font-mono font-bold text-slate-950">{refNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-normal">Date: </span>
                  <span className="font-bold text-slate-950">
                    {new Date(docDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Recipient Address Block */}
              {recipient && (
                <div className="mb-4 text-xs font-serif whitespace-pre-line text-slate-900 leading-relaxed">
                  {resolveTokens(recipient)}
                </div>
              )}

              {/* Subject Line */}
              {subject && (
                <div className="mb-4">
                  <div className="text-xs font-bold font-serif text-slate-950 underline decoration-slate-900 underline-offset-4 tracking-wide">
                    Subject: {resolveTokens(subject)}
                  </div>
                </div>
              )}

              {/* Salutation */}
              {salutation && (
                <div className="mb-3 text-xs font-bold font-serif text-slate-900">
                  {salutation}
                </div>
              )}

              {/* Body Content */}
              <div className="text-xs font-serif text-slate-900 leading-relaxed whitespace-pre-line text-justify mb-5">
                {resolveTokens(bodyContent)}
              </div>

              {/* Table Maker Render */}
              {tableState.enabled && (
                <div className="my-5">
                  {tableState.title && (
                    <div className="text-xs font-bold font-sans text-slate-900 mb-1.5 tracking-tight">
                      {resolveTokens(tableState.title)}
                    </div>
                  )}

                  <table
                    className={`w-full text-xs text-left border-collapse font-sans ${
                      tableState.style === 'grid'
                        ? 'border border-slate-900'
                        : tableState.style === 'striped'
                        ? 'border border-slate-300'
                        : tableState.style === 'formal'
                        ? 'border-2 border-slate-900'
                        : 'border-b border-slate-300'
                    }`}
                  >
                    {tableState.hasHeader && (
                      <thead
                        className={
                          tableState.style === 'striped'
                            ? 'bg-slate-100 text-slate-950'
                            : tableState.style === 'formal'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-200 text-slate-950'
                        }
                      >
                        <tr>
                          {tableState.headers.map((h, i) => (
                            <th
                              key={i}
                              className={`p-2 font-bold text-[11px] ${
                                tableState.style === 'grid'
                                  ? 'border border-slate-900'
                                  : 'border-b border-slate-300'
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {tableState.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            tableState.style === 'striped' && rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                          }
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2 text-[11px] text-slate-800 ${
                                tableState.style === 'grid'
                                  ? 'border border-slate-900'
                                  : 'border-b border-slate-200'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* BOTTOM SECTION: Signatures, Seal & Institutional Authority */}
            <div className="pt-8 mt-6">
              <div className="flex items-end justify-between">
                {/* School Seal / Stamp Area */}
                <div className="w-32 h-24 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-2">
                  <ShieldCheck className="w-6 h-6 text-slate-400 mb-0.5" />
                  <span className="text-[10px] text-slate-500 font-sans font-bold uppercase tracking-wider">
                    Official Seal / Stamp
                  </span>
                </div>

                {/* Signatory Signature Block */}
                <div className="text-right space-y-1">
                  <div className="h-10"></div>
                  <div className="font-bold text-xs font-serif text-slate-950 border-t border-slate-900 pt-1 min-w-[180px]">
                    {signatoryName}
                  </div>
                  <div className="text-[11px] text-slate-600 font-sans font-medium">{signatoryTitle}</div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold uppercase">{schoolName}</div>
                </div>
              </div>

              {/* Official Footnote */}
              <div className="text-center border-t border-slate-200 pt-2 mt-4 text-[9px] text-slate-400 font-sans">
                Issued with the authority of the Office of the Principal • {schoolName} • Verify: {schoolWebsite}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
