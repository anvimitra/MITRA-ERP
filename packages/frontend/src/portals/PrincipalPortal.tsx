import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { CbseOfficialTemplate } from '../templates/CbseOfficialTemplate';
import { TimetablePeriod, StudentLog } from '../types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  UserCheck,
  ShieldAlert,
  Award,
  Plus,
  Check,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserPlus,
  Sparkles,
  X,
  CreditCard,
  Receipt,
  Bell,
  Settings,
  Printer,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  School as SchoolIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Bus,
  Package,
  Briefcase,
  Bookmark,
} from 'lucide-react';
import { CertificatesDesk } from '../components/CertificatesDesk';
import { FrontDeskReception } from '../components/FrontDeskReception';
import { StaffPayrollDesk } from '../components/StaffPayrollDesk';
import { LibraryDesk } from '../components/LibraryDesk';
import { TransportDesk } from '../components/TransportDesk';
import { InventoryDesk } from '../components/InventoryDesk';

export const PrincipalPortal: React.FC<{ userRole?: string }> = ({ userRole }) => {
  // Navigation Sidebar
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'students'
    | 'academics'
    | 'timetable'
    | 'attendance'
    | 'exams'
    | 'fees'
    | 'faculty'
    | 'discipline'
    | 'certificates'
    | 'frontdesk'
    | 'payroll'
    | 'library'
    | 'transport'
    | 'inventory'
    | 'notices'
    | 'settings'
  >(userRole === 'accountant' ? 'fees' : 'dashboard');

  // Core Data
  const [classesData, setClassesData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Student search & filter
  // Fees & Accounts Management Suite (Merged Principal & Accountant Desk)
  const [structures, setStructures] = useState<any[]>([]);
  const [feeSubTab, setFeeSubTab] = useState<'ledger' | 'defaulters' | 'structures'>('ledger');
  const [feeSearch, setFeeSearch] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedFeeStructId, setSelectedFeeStructId] = useState('');
  const [amountPaid, setAmountPaid] = useState('15000');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRemarks, setPaymentRemarks] = useState('Quarter 1 Tuition Fee Paid');
  const [showAddStructModal, setShowAddStructModal] = useState(false);
  const [structTitle, setStructTitle] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structClassId, setStructClassId] = useState('');
  const [structDueDate, setStructDueDate] = useState('2026-10-15');
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');

  // Modals & Drawers
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Student Form
  const [studentForm, setStudentForm] = useState({
    admissionNo: '',
    rollNo: '',
    firstName: '',
    lastName: '',
    classId: '',
    sectionId: '',
    gender: 'Male',
    dob: '2012-05-15',
    bloodGroup: 'B+',
    emergencyPhone: '',
    medicalConditions: '',
    allergies: '',
    category: 'General',
    fatherName: '',
    motherName: '',
    primaryPhone: '',
    email: '',
    address: '',
  });

  // Staff Form
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    password: '',
  });

  // Academic Masters Modal
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('9');

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Class Teacher assignment state
  const [ctClassId, setCtClassId] = useState('');
  const [ctSectionId, setCtSectionId] = useState('');
  const [ctTeacherId, setCtTeacherId] = useState('');

  // Subject assignment state
  const [subTeacherId, setSubTeacherId] = useState('');
  const [subClassId, setSubClassId] = useState('');
  const [subSectionId, setSubSectionId] = useState('');
  const [subSubjectId, setSubSubjectId] = useState('');

  // Exam state
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('sa2');
  const [selectedReportCard, setSelectedReportCard] = useState<any | null>(null);

  // Notice broadcast state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  // Attendance quick test
  const [attClassId, setAttClassId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState<any[]>([]);

  // Timetable State
  const [ttClassId, setTtClassId] = useState('');
  const [ttSectionId, setTtSectionId] = useState('');
  const [ttPeriods, setTtPeriods] = useState<TimetablePeriod[]>([]);
  const [loadingTt, setLoadingTt] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    id: '',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '08:30',
    endTime: '09:15',
    subjectId: '',
    teacherId: '',
    roomNumber: 'Room 101',
  });

  // Discipline & Behavioral Desk State
  const [schoolLogs, setSchoolLogs] = useState<StudentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [logForm, setLogForm] = useState({
    studentId: '',
    logType: 'award',
    title: '',
    description: '',
    actionTaken: '',
    date: new Date().toISOString().split('T')[0],
    notifyParent: true,
  });

  const loadTimetableData = async (cId: string, sId: string) => {
    if (!cId || !sId) return;
    setLoadingTt(true);
    try {
      const res = await ApiService.getTimetableByClass(cId, sId);
      setTtPeriods(res.periods || []);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoadingTt(false);
    }
  };

  const loadSchoolLogsData = async () => {
    setLoadingLogs(true);
    try {
      const res = await ApiService.getSchoolStudentLogs();
      setSchoolLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load school student logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttClassId || !ttSectionId || !periodForm.subjectId || !periodForm.teacherId) {
      alert('Please select both a subject and teacher');
      return;
    }
    try {
      await ApiService.saveTimetablePeriod({
        classId: ttClassId,
        sectionId: ttSectionId,
        dayOfWeek: periodForm.dayOfWeek,
        periodNumber: Number(periodForm.periodNumber),
        startTime: periodForm.startTime,
        endTime: periodForm.endTime,
        subjectId: periodForm.subjectId,
        teacherId: periodForm.teacherId,
        roomNumber: periodForm.roomNumber,
      });
      alert('✅ Period schedule saved successfully!');
      setShowPeriodModal(false);
      loadTimetableData(ttClassId, ttSectionId);
    } catch (err: any) {
      alert('Error saving period: ' + err.message);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Remove this period slot from timetable?')) return;
    try {
      await ApiService.deleteTimetablePeriod(id);
      loadTimetableData(ttClassId, ttSectionId);
    } catch (err: any) {
      alert('Error deleting period: ' + err.message);
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.studentId || !logForm.title || !logForm.description) {
      alert('Please select a student and provide a title & description');
      return;
    }
    try {
      await ApiService.createStudentLog(logForm);
      alert('✅ Observation log saved and parent notified via in-app alert!');
      setShowLogModal(false);
      setLogForm({
        studentId: '',
        logType: 'award',
        title: '',
        description: '',
        actionTaken: '',
        date: new Date().toISOString().split('T')[0],
        notifyParent: true,
      });
      loadSchoolLogsData();
    } catch (err: any) {
      alert('Error saving log: ' + err.message);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this observation log?')) return;
    try {
      await ApiService.deleteStudentLog(id);
      loadSchoolLogsData();
    } catch (err: any) {
      alert('Error deleting log: ' + err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, sData, stData, eData, pData, nData, fData] = await Promise.all([
        ApiService.getClasses().catch(() => ({ classes: [], sections: [], subjects: [], teachers: [] })),
        ApiService.getStudents().catch(() => ({ students: [] })),
        ApiService.getTeachers().catch(() => ({ staff: [] })),
        ApiService.getExams().catch(() => ({ exams: [] })),
        ApiService.getPayments().catch(() => ({ payments: [] })),
        ApiService.getNotices().catch(() => ({ notices: [] })),
        ApiService.getFeeStructures().catch(() => ({ structures: [] })),
      ]);

      setClassesData(cData);
      setStudents(sData.students || []);
      setStaffList(stData.staff || []);
      setExams(eData.exams || []);
      setPayments(pData.payments || []);
      setNotices(nData.notices || []);
      setStructures(fData.structures || []);
      if (sData.students?.length > 0) {
        setSelectedStudentId(sData.students[0].id);
      }
      if (fData.structures?.length > 0) {
        setSelectedFeeStructId(fData.structures[0].id);
        setAmountPaid(String(fData.structures[0].amount));
      }
      if (cData.classes?.length > 0) {
        setStructClassId(cData.classes[0].id);
      }

      if (cData?.classes?.length > 0) {
        setCtClassId(cData.classes[0].id);
        setSubClassId(cData.classes[0].id);
        setAttClassId(cData.classes[0].id);
      }
      if (cData?.sections?.length > 0) {
        setCtSectionId(cData.sections[0].id);
        setSubSectionId(cData.sections[0].id);
      }
      if (stData?.staff?.length > 0) {
        const teachers = stData.staff.filter((t: any) => t.role === 'teacher');
        if (teachers.length > 0) {
          setCtTeacherId(teachers[0].id);
          setSubTeacherId(teachers[0].id);
        }
      }
      if (cData?.subjects?.length > 0) {
        setSubSubjectId(cData.subjects[0].id);
      }

      if (cData?.classes?.length > 0 && cData?.sections?.length > 0) {
        const firstClass = cData.classes[0].id;
        const firstSec = cData.sections.find((s: any) => s.classId === firstClass)?.id || cData.sections[0].id;
        setTtClassId(firstClass);
        setTtSectionId(firstSec);
        loadTimetableData(firstClass, firstSec);
      }
      loadSchoolLogsData();
    } catch (err) {
      console.error('Error loading principal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Student Handlers ---
  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      admissionNo: `ADM-${Date.now().toString().slice(-4)}`,
      rollNo: String(students.length + 1),
      firstName: '',
      lastName: '',
      classId: classesData?.classes?.[0]?.id || '',
      sectionId: classesData?.sections?.[0]?.id || '',
      gender: 'Male',
      dob: '2012-05-15',
      bloodGroup: 'B+',
      emergencyPhone: '',
      medicalConditions: '',
      allergies: '',
      category: 'General',
      fatherName: '',
      motherName: '',
      primaryPhone: '',
      email: '',
      address: '',
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (s: any) => {
    setEditingStudentId(s.id);
    setStudentForm({
      admissionNo: s.admissionNo || '',
      rollNo: s.rollNo !== null ? String(s.rollNo) : '',
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      classId: s.classId || classesData?.classes?.[0]?.id || '',
      sectionId: s.sectionId || classesData?.sections?.[0]?.id || '',
      gender: s.gender || 'Male',
      dob: s.dob || '',
      bloodGroup: s.bloodGroup || 'B+',
      emergencyPhone: s.emergencyPhone || '',
      medicalConditions: s.medicalConditions || '',
      allergies: s.allergies || '',
      category: s.category || 'General',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      primaryPhone: s.primaryPhone || '',
      email: s.email || '',
      address: s.address || '',
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await ApiService.updateStudent(editingStudentId, studentForm);
        alert('✅ Student details updated successfully!');
      } else {
        await ApiService.createStudent(studentForm);
        alert('✅ New Student admitted successfully!');
      }
      setShowStudentModal(false);
      const res = await ApiService.getStudents();
      setStudents(res.students || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}" from the system?`)) return;
    try {
      await ApiService.deleteStudent(id);
      alert('✅ Student record deleted.');
      const res = await ApiService.getStudents();
      setStudents(res.students || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- Staff Handlers ---
  const handleOpenEditStaff = (st: any) => {
    setEditingStaffId(st.id);
    setStaffForm({
      name: st.name || '',
      email: st.email || '',
      phone: st.phone || '',
      role: st.role || 'teacher',
      password: '',
    });
    setShowStaffModal(true);
  };

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({ name: '', email: '', phone: '', role: 'teacher', password: '' });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaffId) {
        await ApiService.updateTeacher(editingStaffId, staffForm);
        alert('✅ Faculty/Staff member updated successfully!');
      } else {
        await ApiService.createTeacher(staffForm);
        alert('✅ Faculty/Staff member registered successfully!');
      }
      setShowStaffModal(false);
      setEditingStaffId(null);
      setStaffForm({ name: '', email: '', phone: '', role: 'teacher', password: '' });
      const res = await ApiService.getTeachers();
      setStaffList(res.staff || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeactivateStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate staff member "${name}"?`)) return;
    try {
      await ApiService.deleteTeacher(id);
      alert('✅ Staff deactivated.');
      const res = await ApiService.getTeachers();
      setStaffList(res.staff || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- Academic Masters Handlers ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      await ApiService.createClass({ name: newClassName, gradeLevel: Number(newClassGrade) });
      alert(`✅ Class "${newClassName}" created with default Section A!`);
      setShowAddClassModal(false);
      setNewClassName('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    try {
      await ApiService.createSubject({ name: newSubjectName, code: newSubjectCode });
      alert(`✅ Subject "${newSubjectName}" added to curriculum!`);
      setShowAddSubjectModal(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.assignClassTeacher(ctClassId, ctSectionId, ctTeacherId);
      alert('✅ Class Teacher assigned successfully! Attendance permission updated.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAssignSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.assignSubjectTeacher(subTeacherId, subClassId, subSectionId, subSubjectId);
      alert('✅ Subject Teacher allocated successfully! Marks entry permission updated.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName) return;
    try {
      await ApiService.createExam({
        name: newExamName,
        examType: newExamType as any,
        academicYear: '2026-2027',
      });
      alert('✅ Exam schedule added successfully!');
      setNewExamName('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMessage) return;
    try {
      await ApiService.broadcastNotice({ title: noticeTitle, message: noticeMessage });
      alert('✅ Circular published to school notice board & mobile apps!');
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeMessage('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // View Report Card
  const handleGenerateReportCard = async (studentId: string) => {
    try {
      const res = await ApiService.getReportCard(studentId, exams[0]?.id || 'exam-sa1-term1');
      if (res.reportCard) {
        setSelectedReportCard(res.reportCard);
      }
    } catch (err: any) {
      alert('Report Card Generation: ' + err.message);
    }
  };

// --- Merged Fee Handlers ---
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFeeStructId) {
      alert('Please select both a student and a fee structure');
      return;
    }

    if (paymentMode === 'upi') {
      alert('⚠️ UPI / QR Payment Gateway is currently under development (Coming Soon). Please collect fee via Cash, Cheque, or Bank Transfer.');
      return;
    }

    try {
      const res = await ApiService.collectFee({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructId,
        amountPaid: Number(amountPaid),
        paymentMode,
        remarks: paymentRemarks,
      });

      const selectedStudent = students.find((s) => s.id === selectedStudentId);
      const selectedStruct = structures.find((st) => st.id === selectedFeeStructId);

      setLatestReceipt({
        ...res.payment,
        studentName: selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName || ''}`.trim() : 'Student',
        admissionNo: selectedStudent?.admissionNo || 'N/A',
        className: selectedStudent?.className || 'Class 10',
        feeTitle: selectedStruct?.title || 'Tuition Fee',
        paymentMode,
        remarks: paymentRemarks,
      });

      setShowCollectModal(false);
      alert('✅ Fee payment recorded & official receipt generated!');
      const pRes = await ApiService.getPayments();
      setPayments(pRes.payments || []);
    } catch (err: any) {
      alert('Error collecting fee: ' + err.message);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structTitle || !structAmount || !structClassId) return;

    try {
      await ApiService.createFeeStructure({
        classId: structClassId,
        title: structTitle,
        amount: Number(structAmount),
        dueDate: structDueDate,
        academicYear: '2026-2027',
      });

      alert('✅ New Fee Head added to institutional ledger!');
      setShowAddStructModal(false);
      setStructTitle('');
      setStructAmount('');
      const fRes = await ApiService.getFeeStructures();
      setStructures(fRes.structures || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSendReminder = async (studentId: string, name: string, dueAmount: number) => {
    try {
      const res = await ApiService.sendFeeReminder(studentId, dueAmount, '2026-10-15');
      setReminderStatus(
        `✅ Automated fee reminder sent to ${name} (${res.dispatchResult?.recipientPhone || 'App Notification'})`
      );
    } catch (err: any) {
      alert('Error sending reminder: ' + err.message);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      studentSearch === '' ||
      s.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.admissionNo?.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClass = selectedClassFilter === '' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans">
      {/* ================= LEFT ERP MODULE SIDEBAR ================= */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              <SchoolIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight leading-tight">ANVIMITRA ERP</h2>
              <span className="text-[10px] text-slate-400 font-mono">Session 2026-2027</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] uppercase font-black text-slate-500 tracking-wider px-2">
            Institutional Modules
          </div>

          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap size={16} />
                <span>Student Directory</span>
              </div>
              <span className="text-[10px] bg-blue-500/30 px-2 py-0.5 rounded-full">{students.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('academics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'academics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen size={16} />
              <span>Academics Master</span>
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'timetable' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Clock size={16} />
              <span>Timetable Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar size={16} />
              <span>Attendance Register</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'exams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Award size={16} />
              <span>Exams & Report Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('fees')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'fees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard size={16} />
              <span>Fees & Accounts Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('faculty')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'faculty' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={16} />
                <span>Faculty & Staff Roster</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">{staffList.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('discipline')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'discipline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={16} />
                <span>Conduct & Discipline Desk</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">{schoolLogs.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'certificates' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Award size={16} />
              <span>Certificates Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('frontdesk')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'frontdesk' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building2 size={16} />
              <span>Front Desk & Reception</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Briefcase size={16} />
              <span>Staff HR & Payroll</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'library' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen size={16} />
              <span>Library Management</span>
            </button>

            <button
              onClick={() => setActiveTab('transport')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'transport' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bus size={16} />
              <span>Transport & Fleet</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Package size={16} />
              <span>Stock & Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'notices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bell size={16} />
              <span>Notice Board</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Settings size={16} />
              <span>School Settings</span>
            </button>
          </nav>
        </div>

        {/* Institution Badge */}
        <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="font-bold text-slate-200">LSK ACADEMY</div>
          <div className="text-[10px] text-emerald-400">CBSE Affiliation: 2130099</div>
        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT WORKSPACE ================= */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* ================= MODULE 1: EXECUTIVE DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest inline-block mb-2">
                  Academic Head Workspace
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Institutional Command Center</h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                  Full control over student admissions, academic rosters, attendance verifications, fee ledger, and CBSE marksheet cycles.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenAddStudent}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
                >
                  <UserPlus size={15} />
                  <span>Admit Student</span>
                </button>
                <button
                  onClick={() => setShowNoticeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Bell size={15} />
                  <span>Post Notice</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{students.length} Pupils</div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% Active in Database</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase">Faculty Roster</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{staffList.length} Staff</div>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">Teaching & Admin Active</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase">Academic Batches</div>
                <div className="text-3xl font-black text-slate-900 mt-1">{classesData?.classes?.length || 0} Classes</div>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">{classesData?.sections?.length || 0} Active Sections</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase">Fee Revenue (INR)</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">{payments.length} Validated Receipts</p>
              </div>
            </div>

            {/* Timetable Weekly Snapshot */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-indigo-600" /> Academic Class Schedule (Monday - Saturday)
                </h3>
                <span className="text-xs font-bold text-slate-500">Working Hours: 08:30 AM - 02:30 PM</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-black text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Day</th>
                      <th className="px-3 py-2.5">Period 1 (08:30)</th>
                      <th className="px-3 py-2.5">Period 2 (09:15)</th>
                      <th className="px-3 py-2.5">Period 3 (10:00)</th>
                      <th className="px-3 py-2.5">Period 4 (11:00)</th>
                      <th className="px-3 py-2.5">Period 5 (12:00)</th>
                      <th className="px-3 py-2.5">Period 6 (12:45)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <tr key={day} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-bold text-slate-900 bg-slate-50/50">{day}</td>
                        <td className="px-3 py-3 font-medium text-slate-700">Mathematics (Room 101)</td>
                        <td className="px-3 py-3 font-medium text-slate-700">Science Lab</td>
                        <td className="px-3 py-3 font-medium text-slate-700">English Literature</td>
                        <td className="px-3 py-3 font-medium text-slate-700">Social Science</td>
                        <td className="px-3 py-3 font-medium text-slate-700">Computer Science</td>
                        <td className="px-3 py-3 font-medium text-slate-700">Physical Education</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODULE 2: STUDENT DIRECTORY (SIS) ================= */}
        {activeTab === 'students' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={24} />
                  Student Information System (SIS Directory)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete central enrollment directory. Admit new students, edit profiles, print official ID cards, and manage records.
                </p>
              </div>

              <button
                onClick={handleOpenAddStudent}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                <UserPlus size={16} />
                <span>Admit New Student</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="w-full sm:w-64">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  {classesData?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Roll</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3">Parent Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Blood Group</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No students found matching current query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.admissionNo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{s.rollNo || '-'}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[11px]">
                            {s.className} - {s.sectionName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {s.fatherName || s.motherName || <span className="text-slate-400 italic">Not set</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {s.primaryPhone || <span className="text-slate-400 italic">Not set</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] border border-rose-200">
                            {s.bloodGroup || 'O+'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setViewingStudent(s);
                                setShowIdCardModal(true);
                              }}
                              title="Print Student ID Card"
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1"
                            >
                              <Printer size={12} />
                              <span>ID Card</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              title="Edit Details"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id, `${s.firstName} ${s.lastName}`)}
                              title="Remove Record"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODULE 3: ACADEMICS MASTER ================= */}
        {activeTab === 'academics' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={24} /> Academic Architecture & Allocations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure grade levels, sections, curriculum subjects, class teachers (attendance), and subject teachers (grading).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Class</span>
                </button>
                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* Two Column Grid: Classes and Subjects Master */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classes & Sections */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  Enrolled Classes & Sections ({classesData?.classes?.length || 0})
                </h3>
                <div className="space-y-2">
                  {classesData?.classes?.map((c: any) => (
                    <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-[11px] text-slate-400 block">Grade Level: {c.gradeLevel || 'Standard'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px]">
                        Section A, B Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects Master */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  Approved Curriculum Subjects ({classesData?.subjects?.length || 0})
                </h3>
                <div className="space-y-2">
                  {classesData?.subjects?.map((sub: any) => (
                    <div key={sub.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 block">{sub.code || 'CORE-GEN'}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px]">
                        Theory & Practical
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Class Teacher RBAC Allocation Form */}
            <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-blue-950">Designate Class Teacher for Attendance</h3>
                <p className="text-xs text-blue-800/80">Only designated class teachers have authorization to mark attendance.</p>
              </div>

              <form onSubmit={handleAssignClassTeacher} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={ctClassId}
                  onChange={(e) => setCtClassId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {classesData?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={ctSectionId}
                  onChange={(e) => setCtSectionId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {classesData?.sections?.map((s: any) => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>

                <select
                  value={ctTeacherId}
                  onChange={(e) => setCtTeacherId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                >
                  {classesData?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition"
                >
                  Authorize Class Teacher
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODULE 4: ATTENDANCE REGISTER ================= */}
        {activeTab === 'attendance' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="text-blue-600" size={24} />
                  Institutional Daily Attendance Register
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live attendance register. Track presence, absences, and instant In-App Push notifications to parents.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">Roll</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Status Today</th>
                    <th className="px-4 py-3">Parent Phone</th>
                    <th className="px-4 py-3 text-right">In-App Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-600">{s.rollNo || idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{s.className}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-[10px]">
                          Present (Verified)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{s.primaryPhone || '9876543210'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] font-bold text-emerald-600">Delivered</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODULE 5: EXAMINATIONS & REPORT CARDS ================= */}
        {activeTab === 'exams' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Award className="text-indigo-600" size={24} />
                  Examinations & CBSE Marksheet Generator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish evaluation cycles and generate authentic CBSE-compliant printable report cards for pupils.
                </p>
              </div>

              <form onSubmit={handleCreateExam} className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="e.g. Unit Test 2 / SA-2"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition"
                >
                  Publish Exam
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {exams.map((ex) => (
                <div key={ex.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[10px] font-mono text-indigo-600 font-bold uppercase">{ex.examType}</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{ex.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Session: 2026-2027</div>
                </div>
              ))}
            </div>

            {/* Students Marksheet Generation Desk */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Student Report Cards Roster</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Exam Term</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.admissionNo}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.firstName} {s.lastName}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{s.className}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{exams[0]?.name || 'SA-1 (Term 1)'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleGenerateReportCard(s.id)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ml-auto"
                          >
                            <Printer size={12} />
                            <span>View Marksheet</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODULE 6: FEES & BILLING DESK ================= */}
        {activeTab === 'fees' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-emerald-600" size={24} />
                  Fee Ledger & Cash Collection Desk
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review fee transactions, print duplicate receipts, and inspect fee heads.
                </p>
              </div>

              <span className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-black text-sm">
                Total Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Fee Category</th>
                    <th className="px-4 py-3">Amount Paid</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.receiptNo}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.studentName}</td>
                        <td className="px-4 py-3 text-slate-600">{p.feeTitle}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">₹{Number(p.amountPaid).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 uppercase font-bold text-slate-700">{p.paymentMode}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.paymentDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODULE 7: FACULTY & STAFF ROSTER ================= */}
        {activeTab === 'faculty' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} />
                  Faculty & Staff Administration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appoint teachers, configure login credentials, and manage active roles.
                </p>
              </div>

              <button
                onClick={handleOpenAddStaff}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <UserPlus size={16} />
                <span>Register Faculty / Staff</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">Faculty Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{st.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border uppercase ${
                            st.role === 'principal'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : st.role === 'teacher'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{st.email}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{st.phone || '-'}</td>
                      <td className="px-4 py-3">
                        {st.isActive ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditStaff(st)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 p-1"
                          >
                            Edit
                          </button>
                          {st.role !== 'principal' && st.isActive ? (
                            <button
                              onClick={() => handleDeactivateStaff(st.id, st.name)}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 p-1"
                            >
                              Deactivate
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODULE 8: NOTICE BOARD ================= */}
        {activeTab === 'notices' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Bell className="text-blue-600" size={24} />
                  Institutional Notice Board & Circulars
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish announcements, holiday schedules, and event circulars broadcasted to parent mobile apps.
                </p>
              </div>

              <button
                onClick={() => setShowNoticeModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <Plus size={16} />
                <span>Broadcast New Notice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.length === 0 ? (
                <div className="p-8 text-center text-slate-400 col-span-2">
                  No circulars posted yet. Broadcast your first notice above.
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        Official Announcement
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.createdAt?.split('T')[0]}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= MODULE 9: SCHOOL SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Settings className="text-slate-600" size={24} /> Institutional Profile & Affiliation Parameters
              </h2>
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs rounded-full flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-600" />
                <span>Super Admin Protected</span>
              </span>
            </div>

            {/* Core Details Policy Alert */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
              <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-amber-900">Institutional Identity Security Policy</span>
                <p className="text-xs text-amber-800 mt-0.5">
                  Core institutional parameters (Legal Name, School Tenant Code, CBSE Affiliation Number, and Custom Domain) are governed at the platform level and can only be modified by the <strong>Super Administrator</strong> from the master control plane.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Institution Legal Name (Locked)</span>
                <span className="text-sm font-black text-slate-900">LSK ACADEMY</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">Super Admin Managed</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">School Code / Tenant ID (Locked)</span>
                <span className="text-sm font-black text-slate-900 font-mono">LSK01</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">Fixed</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Board Affiliation Number (Locked)</span>
                <span className="text-sm font-black text-slate-900 font-mono">CBSE-2130099</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">CBSE</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Campus Physical Address</span>
                <span className="text-sm font-bold text-slate-900">42-B, Shivaji Nagar, Bhopal, M.P.</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Primary Administration Phone</span>
                <span className="text-sm font-mono font-bold text-slate-900">+91 99887 76655</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Academic Session Cycle</span>
                <span className="text-sm font-black text-indigo-700">2026-2027 (Term 1 & Term 2 Active)</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODULE: TIMETABLE MATRIX ================= */}
        {activeTab === 'timetable' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="text-blue-600" size={24} /> Academic Period Matrix & Scheduling
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Design and manage weekly period timetables (Mon–Sat, Periods 1–8), faculty allocations, and classrooms
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Class & Section pickers */}
                <select
                  value={ttClassId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setTtClassId(cId);
                    const sec = classesData?.sections?.find((s: any) => s.classId === cId)?.id || classesData?.sections?.[0]?.id || '';
                    setTtSectionId(sec);
                    loadTimetableData(cId, sec);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {classesData?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={ttSectionId}
                  onChange={(e) => {
                    setTtSectionId(e.target.value);
                    loadTimetableData(ttClassId, e.target.value);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {classesData?.sections
                    ?.filter((s: any) => s.classId === ttClassId)
                    ?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={() => {
                    setPeriodForm({
                      id: '',
                      dayOfWeek: 'Monday',
                      periodNumber: 1,
                      startTime: '08:30',
                      endTime: '09:15',
                      subjectId: classesData?.subjects?.[0]?.id || '',
                      teacherId: staffList?.find((st: any) => st.role === 'teacher')?.id || '',
                      roomNumber: 'Room 101',
                    });
                    setShowPeriodModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>Assign Period Slot</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            {loadingTt ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading timetable matrix...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black text-center">
                      <th className="py-3 px-3 border border-slate-800 text-left w-24">Day</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <th key={p} className="py-3 px-2 border border-slate-800">
                          <span className="block font-bold">Period {p}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            {p === 1 ? '08:30-09:15' : p === 2 ? '09:15-10:00' : p === 3 ? '10:00-10:45' : p === 4 ? '10:45-11:30' : p === 5 ? '12:00-12:45' : p === 6 ? '12:45-01:30' : p === 7 ? '01:30-02:15' : '02:15-03:00'}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <tr key={day} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-extrabold text-slate-900 bg-slate-100/70 border border-slate-200">
                          {day}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => {
                          const slot = ttPeriods.find(
                            (p) => p.dayOfWeek.toLowerCase() === day.toLowerCase() && Number(p.periodNumber) === pNum
                          );
                          return (
                            <td key={pNum} className="p-2 border border-slate-200 align-top min-w-[130px]">
                              {slot ? (
                                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-slate-800 space-y-1 relative group">
                                  <div className="font-extrabold text-xs text-blue-950 line-clamp-1">
                                    {slot.subjectName || 'Subject'}
                                  </div>
                                  <div className="text-[11px] text-slate-600 line-clamp-1">
                                    👤 {slot.teacherName || 'Faculty'}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold">
                                      {slot.roomNumber || 'R101'}
                                    </span>
                                    <button
                                      onClick={() => handleDeletePeriod(slot.id)}
                                      title="Delete Period"
                                      className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setPeriodForm({
                                      id: '',
                                      dayOfWeek: day,
                                      periodNumber: pNum,
                                      startTime: pNum === 1 ? '08:30' : pNum === 2 ? '09:15' : pNum === 3 ? '10:00' : pNum === 4 ? '10:45' : pNum === 5 ? '12:00' : pNum === 6 ? '12:45' : pNum === 7 ? '01:30' : '02:15',
                                      endTime: pNum === 1 ? '09:15' : pNum === 2 ? '10:00' : pNum === 3 ? '10:45' : pNum === 4 ? '11:30' : pNum === 5 ? '12:45' : pNum === 6 ? '01:30' : pNum === 7 ? '02:15' : '03:00',
                                      subjectId: classesData?.subjects?.[0]?.id || '',
                                      teacherId: staffList?.find((st: any) => st.role === 'teacher')?.id || '',
                                      roomNumber: 'Room 101',
                                    });
                                    setShowPeriodModal(true);
                                  }}
                                  className="w-full h-16 border border-dashed border-slate-200 hover:border-blue-400 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition"
                                >
                                  + Add
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= MODULE: CONDUCT & DISCIPLINE DESK ================= */}
        {activeTab === 'discipline' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={24} /> Student Conduct, Discipline & Awards Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  RosarioSIS & Frappe Education architecture: Document awards, commendations, medical room visits, and disciplinary logs
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowLogModal(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Log New Observation / Incident</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {['all', 'award', 'discipline', 'observation', 'medical'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setLogTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-xl uppercase text-[10px] transition ${
                      logTypeFilter === type
                        ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search student or title..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Logs List */}
            {loadingLogs ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading behavioral records...</div>
            ) : (
              <div className="space-y-3">
                {schoolLogs
                  .filter((l) => logTypeFilter === 'all' || l.logType === logTypeFilter)
                  .filter((l) =>
                    logSearch === '' ||
                    l.title.toLowerCase().includes(logSearch.toLowerCase()) ||
                    (l.studentName && l.studentName.toLowerCase().includes(logSearch.toLowerCase()))
                  )
                  .map((log) => {
                    const isAward = log.logType === 'award';
                    const isDiscipline = log.logType === 'discipline';
                    const isMedical = log.logType === 'medical';
                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-2xl border transition space-y-2 ${
                          isAward
                            ? 'bg-amber-50/40 border-amber-200'
                            : isDiscipline
                            ? 'bg-rose-50/30 border-rose-200'
                            : isMedical
                            ? 'bg-blue-50/30 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isAward
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isDiscipline
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : isMedical
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {log.logType}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">{log.studentName || 'Student'}</span>
                            {log.admissionNo && (
                              <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {log.admissionNo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400 font-bold">{log.date}</span>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{log.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{log.description}</p>
                        </div>

                        {log.actionTaken && (
                          <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700">
                            <span className="font-bold text-slate-900">Corrective Action / Reward: </span>
                            {log.actionTaken}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Reported by: {log.reporterName || 'Faculty Member'}</span>
                          {log.notifyParent === 1 && (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Parent Notified via Mobile App
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ================= MODULE: CERTIFICATES & CREDENTIALS ================= */}
        {activeTab === 'certificates' && (
          <CertificatesDesk students={students} schoolInfo={classesData?.school} />
        )}

        {/* ================= MODULE: FRONT DESK & RECEPTION ================= */}
        {activeTab === 'frontdesk' && (
          <FrontDeskReception />
        )}

        {/* ================= MODULE: STAFF HR & PAYROLL ================= */}
        {activeTab === 'payroll' && (
          <StaffPayrollDesk staffList={staffList} />
        )}

        {/* ================= MODULE: LIBRARY MANAGEMENT ================= */}
        {activeTab === 'library' && (
          <LibraryDesk students={students} staffList={staffList} />
        )}

        {/* ================= MODULE: TRANSPORT FLEET ================= */}
        {activeTab === 'transport' && (
          <TransportDesk students={students} />
        )}

        {/* ================= MODULE: STOCK & INVENTORY ================= */}
        {activeTab === 'inventory' && (
          <InventoryDesk />
        )}
      </main>

      {/* ================= MODAL: ADMIT / EDIT STUDENT ================= */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowStudentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingStudentId ? 'Edit Student Record' : 'Student Admission Form'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">Enter academic enrollment and parent contact details.</p>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.admissionNo}
                    onChange={(e) => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll No</label>
                  <input
                    type="number"
                    value={studentForm.rollNo}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={studentForm.bloodGroup}
                    onChange={(e) => setStudentForm({ ...studentForm, bloodGroup: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    value={studentForm.sectionId}
                    onChange={(e) => setStudentForm({ ...studentForm, sectionId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Parent / Guardian Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={studentForm.fatherName}
                      onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={studentForm.motherName}
                      onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={studentForm.primaryPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, primaryPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Email</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Health, Emergency & Social Demographics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98111 99887"
                      value={studentForm.emergencyPhone}
                      onChange={(e) => setStudentForm({ ...studentForm, emergencyPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Caste / Social Category</label>
                    <select
                      value={studentForm.category}
                      onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Medical Conditions / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Asthma, Spectacles, Heart condition"
                      value={studentForm.medicalConditions}
                      onChange={(e) => setStudentForm({ ...studentForm, medicalConditions: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Known Allergies</label>
                    <input
                      type="text"
                      placeholder="e.g. Peanuts, Penicillin, Dust allergy"
                      value={studentForm.allergies}
                      onChange={(e) => setStudentForm({ ...studentForm, allergies: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition"
                >
                  {editingStudentId ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE STUDENT ID CARD ================= */}
      {showIdCardModal && viewingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative my-6">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-600">Student Identity Credential</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer size={12} />
                  <span>Print ID</span>
                </button>
                <button onClick={() => setShowIdCardModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Official ID Card Layout */}
            <div className="border-2 border-indigo-900 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white text-center p-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <SchoolIcon size={20} className="text-indigo-400" />
                <span className="font-black text-sm uppercase tracking-wider">LSK ACADEMY</span>
              </div>
              <p className="text-[9px] text-indigo-300 uppercase tracking-widest mb-3">Student Identity Card</p>

              <div className="w-20 h-20 rounded-full border-2 border-indigo-400 mx-auto overflow-hidden bg-white mb-3 shadow">
                <img
                  src={viewingStudent.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              </div>

              <h4 className="text-base font-black uppercase text-white">
                {viewingStudent.firstName} {viewingStudent.lastName}
              </h4>
              <p className="text-xs font-bold text-indigo-300">
                {viewingStudent.className} • Section {viewingStudent.sectionName}
              </p>

              <div className="mt-4 pt-3 border-t border-indigo-800/80 text-left text-[11px] space-y-1 text-slate-300">
                <div>
                  <span className="text-slate-400 font-bold">Admission No:</span>{' '}
                  <span className="font-mono text-white font-bold">{viewingStudent.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Roll No:</span>{' '}
                  <span className="text-white">{viewingStudent.rollNo || '1'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Blood Group:</span>{' '}
                  <span className="text-rose-400 font-bold">{viewingStudent.bloodGroup || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Emergency Phone:</span>{' '}
                  <span className="font-mono text-white">{viewingStudent.primaryPhone || '9876543210'}</span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-indigo-900 text-[9px] text-indigo-400 font-mono text-center">
                Valid for Academic Year 2026-2027
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE REPORT CARD ================= */}
      {selectedReportCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative my-6">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-600">Official CBSE Academic Performance Report Card</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Report Card</span>
                </button>
                <button onClick={() => setSelectedReportCard(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>
            </div>

            <CbseOfficialTemplate data={selectedReportCard} />
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FACULTY / STAFF ================= */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => {
                setShowStaffModal(false);
                setEditingStaffId(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingStaffId ? 'Edit Faculty / Staff' : 'Register Faculty / Staff'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {editingStaffId
                ? 'Update institutional profile, role assignments, or security credentials.'
                : 'Create an authenticated institutional login account.'}
            </p>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Role *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="teacher">Teacher / Faculty</option>
                  <option value="accountant">Accountant / Cashier</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingStaffId}
                  placeholder="teacher@school.edu"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className={`w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono ${
                    editingStaffId ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
                {editingStaffId && (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Login ID cannot be changed</span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingStaffId ? 'New Password (Leave blank to keep unchanged)' : 'Account Password *'}
                </label>
                <input
                  type="password"
                  required={!editingStaffId}
                  placeholder={editingStaffId ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setEditingStaffId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  {editingStaffId ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CLASS ================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddClassModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1">Add Academic Class</h3>
            <p className="text-xs text-slate-500 mb-4">Creates a new class level with default Section A.</p>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 9 or Class 11-Science"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grade Level</label>
                <input
                  type="number"
                  placeholder="9"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD SUBJECT ================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddSubjectModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1">Add Curriculum Subject</h3>
            <p className="text-xs text-slate-500 mb-4">Adds a new subject for examinations and report cards.</p>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science / Hindi"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS-083"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BROADCAST NOTICE ================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowNoticeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1">Publish School Notice</h3>
            <p className="text-xs text-slate-500 mb-4">Circular will be displayed on the notice board and sent to parent apps.</p>
            <form onSubmit={handleBroadcastNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination Datesheet Announcement"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Body / Circular Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full circular announcement here..."
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30"
                >
                  Broadcast Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: ASSIGN TIMETABLE PERIOD ================= */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Assign Period Slot</h3>
              <button onClick={() => setShowPeriodModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={periodForm.dayOfWeek}
                    onChange={(e) => setPeriodForm({ ...periodForm, dayOfWeek: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={periodForm.periodNumber}
                    onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Period {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={periodForm.startTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={periodForm.endTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  required
                  value={periodForm.subjectId}
                  onChange={(e) => setPeriodForm({ ...periodForm, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select Subject --</option>
                  {classesData?.subjects?.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code || 'SUB'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Faculty Member</label>
                <select
                  required
                  value={periodForm.teacherId}
                  onChange={(e) => setPeriodForm({ ...periodForm, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">-- Select Teacher --</option>
                  {staffList
                    ?.filter((s: any) => s.role === 'teacher')
                    ?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Classroom / Laboratory</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101, Science Lab A"
                  value={periodForm.roomNumber}
                  onChange={(e) => setPeriodForm({ ...periodForm, roomNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOG STUDENT INCIDENT / AWARD ================= */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />
                <span>Log Student Observation / Incident</span>
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Student</label>
                  <select
                    required
                    value={logForm.studentId}
                    onChange={(e) => setLogForm({ ...logForm, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName || ''} (#{s.rollNo || '01'} - {s.admissionNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Record Type</label>
                  <select
                    value={logForm.logType}
                    onChange={(e) => setLogForm({ ...logForm, logType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="award">Award / Recognition</option>
                    <option value="observation">Teacher Observation / Commendation</option>
                    <option value="discipline">Disciplinary Incident / Infraction</option>
                    <option value="medical">Medical Room / Health Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title / Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place in Science Quiz / Late Arrival / Headache"
                  value={logForm.title}
                  onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what happened, context, and student reaction..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Corrective Action Taken / Award Given</label>
                <input
                  type="text"
                  placeholder="e.g. Verbal reprimand / Medal presented / First aid administered"
                  value={logForm.actionTaken}
                  onChange={(e) => setLogForm({ ...logForm, actionTaken: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={logForm.notifyParent}
                    onChange={(e) => setLogForm({ ...logForm, notifyParent: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Dispatch in-app notification to parents</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow"
                >
                  Save & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: COLLECT FEE ================= */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowCollectModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <Receipt className="text-emerald-600" size={22} />
              Collect Student Fee & Print Receipt
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Record fee collection in the institutional ledger and issue official receipt.
            </p>

            <form onSubmit={handleCollectFee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNo} - {s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Head Category *</label>
                <select
                  value={selectedFeeStructId}
                  onChange={(e) => {
                    setSelectedFeeStructId(e.target.value);
                    const found = structures.find((st) => st.id === e.target.value);
                    if (found) setAmountPaid(String(found.amount));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  {structures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title} - ₹{Number(st.amount).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (INR) *</label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-black text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold uppercase"
                  >
                    <option value="cash">Cash Counter</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="dd">Demand Draft (DD)</option>
                    <option value="upi">UPI / QR Code (Coming Soon)</option>
                  </select>
                </div>
              </div>

              {paymentMode === 'upi' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  ⚠️ UPI Payment Gateway integration is marked "Coming Soon". Please select Cash, Cheque, or Bank Transfer to complete collection.
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full with receipt voucher"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FEE STRUCTURE ================= */}
      {showAddStructModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddStructModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">New Fee Structure Head</h3>
            <p className="text-xs text-slate-500 mb-5">Define an institutional fee head for a class batch.</p>

            <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fee Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Composite Fee 2026-27"
                  value={structTitle}
                  onChange={(e) => setStructTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={structAmount}
                    onChange={(e) => setStructAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-black text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={structClassId}
                    onChange={(e) => setStructClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStructModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  Create Fee Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE RECEIPT ================= */}
      {latestReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 relative my-6">
            <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Payment Verified & Stamped
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setLatestReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div className="border-2 border-slate-800 p-6 rounded-2xl font-serif text-slate-900 bg-amber-50/20">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                <span className="text-[10px] font-sans font-black tracking-widest text-slate-500 uppercase block">
                  Official Institutional Fee Challan & Receipt
                </span>
                <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-950 font-serif mt-1">
                  LSK ACADEMY
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">
                  CBSE Affiliated Senior Secondary School • Affiliation: 2130099
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  42-B, Shivaji Nagar, Bhopal, M.P. • Phone: +91 99887 76655
                </p>
              </div>

              <div className="grid grid-cols-2 text-xs font-sans mb-4 border-b border-slate-300 pb-3 gap-y-1.5">
                <div>
                  <span className="text-slate-500">Receipt No:</span>{' '}
                  <strong className="font-mono">{latestReceipt.receiptNo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong>{latestReceipt.paymentDate || new Date().toISOString().split('T')[0]}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Student:</span>{' '}
                  <strong className="uppercase">{latestReceipt.studentName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Admission No:</span>{' '}
                  <strong className="font-mono">{latestReceipt.admissionNo || 'LSK-ADM'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class:</span>{' '}
                  <strong>{latestReceipt.className || 'Standard Batch'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Payment Mode:</span>{' '}
                  <strong className="uppercase">{latestReceipt.paymentMode || 'CASH'}</strong>
                </div>
              </div>

              <table className="w-full text-xs font-sans border-collapse mb-4">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100">
                    <th className="py-2 text-left px-2">Description</th>
                    <th className="py-2 text-right px-2">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-2 font-medium">{latestReceipt.feeTitle}</td>
                    <td className="py-2.5 px-2 text-right font-bold">
                      ₹{Number(latestReceipt.amountPaid).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-800 font-black text-sm bg-emerald-50/50">
                    <td className="py-2.5 px-2">TOTAL RECEIVED</td>
                    <td className="py-2.5 px-2 text-right text-emerald-800">
                      ₹{Number(latestReceipt.amountPaid).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end pt-8 font-sans text-[11px] text-slate-600">
                <div>
                  <p className="italic">Computer Generated Validated Counter Receipt</p>
                  <p className="text-[10px] text-slate-400">Preserve this copy for annual tax rebate claim.</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-800 w-36 mb-1"></div>
                  <span className="font-bold text-slate-900">Bursar / Accounts Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
