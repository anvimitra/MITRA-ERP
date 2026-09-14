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
  Copy,
  HeartHandshake,
  Upload,
} from 'lucide-react';
import { CertificatesDesk } from '../components/CertificatesDesk';
import { StaffPayrollDesk } from '../components/StaffPayrollDesk';
import { LibraryDesk } from '../components/LibraryDesk';
import { TransportDesk } from '../components/TransportDesk';

export const PrincipalPortal: React.FC<{ userRole?: string; school?: any }> = ({ userRole, school: initialSchool }) => {
  const [currentSchool, setCurrentSchool] = useState<any>(initialSchool || null);
  const [createdParentCreds, setCreatedParentCreds] = useState<{
    loginId: string;
    password: string;
    parentName: string;
    studentName: string;
  } | null>(null);
  const [showParentCredsModal, setShowParentCredsModal] = useState(false);
  const [copiedParentCreds, setCopiedParentCreds] = useState(false);

  useEffect(() => {
    if (initialSchool) {
      setCurrentSchool(initialSchool);
    } else {
      ApiService.getMe().then((res) => {
        if (res?.school) setCurrentSchool(res.school);
      }).catch(() => {});
    }
  }, [initialSchool]);

  // Navigation Sidebar
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'students'
    | 'parents'
    | 'academics'
    | 'timetable'
    | 'attendance'
    | 'exams'
    | 'fees'
    | 'admit_cards'
    | 'faculty'
    | 'discipline'
    | 'certificates'
    | 'payroll'
    | 'library'
    | 'transport'
    | 'notices'
    | 'settings'
  >('dashboard');

  // Core Data
  const [classesData, setClassesData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [parentsList, setParentsList] = useState<any[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Logo Settings
  // Exam Admit Cards Desk State
  const [admitCardClassId, setAdmitCardClassId] = useState('');
  const [admitCardExamTitle, setAdmitCardExamTitle] = useState('CBSE Annual / Board Examination 2026-27');
  const [admitCardCenterName, setAdmitCardCenterName] = useState('Institutional Examination Wing, Campus Block A');
  const [admitCardCenterNumber, setAdmitCardCenterNumber] = useState('8402');
  const [generatingAdmitCards, setGeneratingAdmitCards] = useState(false);
  const [classAdmitCards, setClassAdmitCards] = useState<any[]>([]);
  const [loadingAdmitCards, setLoadingAdmitCards] = useState(false);
  const [selectedAdmitCardStudent, setSelectedAdmitCardStudent] = useState<any>(null);
  const [selectedAdmitCardDetails, setSelectedAdmitCardDetails] = useState<any>(null);
  const [showAdmitCardModal, setShowAdmitCardModal] = useState(false);
  const [showBulkAdmitModal, setShowBulkAdmitModal] = useState(false);

  const loadClassAdmitCards = async (cId: string) => {
    if (!cId) return;
    setLoadingAdmitCards(true);
    try {
      const res = await ApiService.getClassAdmitCards(cId);
      setClassAdmitCards(res.admitCards || []);
    } catch (err) {
      console.warn('Error loading admit cards:', err);
    } finally {
      setLoadingAdmitCards(false);
    }
  };

  const handleGenerateClassAdmitCards = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClassId = admitCardClassId || classesData?.classes?.[0]?.id;
    if (!targetClassId) {
      alert('Please select a target class.');
      return;
    }
    setGeneratingAdmitCards(true);
    try {
      const res = await ApiService.generateClassAdmitCards({
        classId: targetClassId,
        examTitle: admitCardExamTitle,
        centerNumber: admitCardCenterNumber,
        centerName: admitCardCenterName,
      });
      alert(`🎉 ${res.message || 'Admit cards successfully generated and assigned for the entire class!'}`);
      loadClassAdmitCards(targetClassId);
    } catch (err: any) {
      alert('Error generating admit cards: ' + err.message);
    } finally {
      setGeneratingAdmitCards(false);
    }
  };

  const handleOpenStudentAdmitCard = async (student: any) => {
    setSelectedAdmitCardStudent(student);
    setShowAdmitCardModal(true);
    try {
      const res = await ApiService.getAdmitCard(student.id);
      setSelectedAdmitCardDetails(res.admitCard);
    } catch (err) {
      console.warn('Error fetching student admit card:', err);
    }
  };

  const [editingSchoolLogo, setEditingSchoolLogo] = useState(currentSchool?.logoUrl || '');
  const [savingLogo, setSavingLogo] = useState(false);

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
    photoUrl: '',
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
  const [newSubjectClassId, setNewSubjectClassId] = useState<string>('');
  const [selectedSubjectClassFilter, setSelectedSubjectClassFilter] = useState<string>('ALL');
  const [publishedStudentIds, setPublishedStudentIds] = useState<Set<string>>(new Set());
  const [showPublishClassModal, setShowPublishClassModal] = useState(false);
  const [publishTargetClassId, setPublishTargetClassId] = useState<string>('');
  const [publishTargetExamId, setPublishTargetExamId] = useState<string>('');
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
      const [cData, sData, stData, eData, pData, nData, fData, parData] = await Promise.all([
        ApiService.getClasses().catch(() => ({ classes: [], sections: [], subjects: [], teachers: [] })),
        ApiService.getStudents().catch(() => ({ students: [] })),
        ApiService.getTeachers().catch(() => ({ staff: [] })),
        ApiService.getExams().catch(() => ({ exams: [] })),
        ApiService.getPayments().catch(() => ({ payments: [] })),
        ApiService.getNotices().catch(() => ({ notices: [] })),
        ApiService.getFeeStructures().catch(() => ({ structures: [] })),
        ApiService.getParents().catch(() => ({ parents: [] })),
      ]);

      setClassesData(cData);
      setStudents(sData.students || []);
      setStaffList(stData.staff || []);
      setExams(eData.exams || []);
      setPayments(pData.payments || []);
      setNotices(nData.notices || []);
      setStructures(fData.structures || []);
      setParentsList(parData.parents || []);
      if (sData.students?.length > 0) {
        setSelectedStudentId(sData.students[0].id);
      }
      if (fData.structures?.length > 0) {
        setSelectedFeeStructId(fData.structures[0].id);
        setAmountPaid(String(fData.structures[0].amount));
      }
      if (cData.classes?.length > 0) {
        setStructClassId(cData.classes[0].id);
        setAdmitCardClassId(cData.classes[0].id);
        loadClassAdmitCards(cData.classes[0].id);
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
      photoUrl: '',
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
      photoUrl: s.photoUrl || '',
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
        const res = await ApiService.createStudent(studentForm);
        if (res.parentCredentials) {
          setCreatedParentCreds(res.parentCredentials);
          setShowParentCredsModal(true);
        } else {
          alert('✅ New Student admitted successfully!');
        }
      }
      setShowStudentModal(false);
      const [sRes, pRes] = await Promise.all([
        ApiService.getStudents(),
        ApiService.getParents(),
      ]);
      setStudents(sRes.students || []);
      setParentsList(pRes.parents || []);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}" from the system?`)) return;
    try {
      await ApiService.deleteStudent(id);
      alert('✅ Student record deleted.');
      const [sRes, pRes] = await Promise.all([
        ApiService.getStudents(),
        ApiService.getParents(),
      ]);
      setStudents(sRes.students || []);
      setParentsList(pRes.parents || []);
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
      await ApiService.createSubject({
        name: newSubjectName,
        code: newSubjectCode,
        classId: newSubjectClassId || undefined,
      });
      alert(`✅ Subject "${newSubjectName}" added to curriculum successfully!`);
      setShowAddSubjectModal(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      setNewSubjectClassId('');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteSubject = async (subId: string, subName: string) => {
    if (!confirm(`Are you sure you want to remove subject "${subName}" from the curriculum?`)) return;
    try {
      await ApiService.deleteSubject(subId);
      alert('✅ Subject deleted.');
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleTogglePublishStudent = async (studentId: string, examId: string, currentlyPublished: boolean) => {
    try {
      const res = await ApiService.publishExamResults({
        examId,
        studentId,
        isPublished: !currentlyPublished,
      });
      alert(res.message);
      setPublishedStudentIds((prev) => {
        const next = new Set(prev);
        if (!currentlyPublished) next.add(studentId);
        else next.delete(studentId);
        return next;
      });
      loadData();
    } catch (err: any) {
      alert('Error publishing result: ' + err.message);
    }
  };

  const handlePublishClassResults = async (examId: string, classId: string, isPublished: boolean) => {
    try {
      const res = await ApiService.publishExamResults({
        examId,
        classId: classId || undefined,
        isPublished,
      });
      alert(res.message);
      setShowPublishClassModal(false);
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
    const targetClassId = structClassId || classesData?.classes?.[0]?.id;
    if (!structTitle.trim() || !structAmount || !targetClassId) {
      alert('Please enter a Fee Title, Amount, and select a Target Class.');
      return;
    }

    try {
      await ApiService.createFeeStructure({
        classId: targetClassId,
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

  const handleDeleteStructure = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee head?')) return;
    try {
      await ApiService.deleteFeeStructure(id);
      alert('✅ Fee Head deleted successfully!');
      const fRes = await ApiService.getFeeStructures();
      setStructures(fRes.structures || []);
    } catch (err: any) {
      alert('Error deleting fee head: ' + err.message);
    }
  };

  const handleBroadcastDueReminders = async () => {
    if (!confirm('📢 Broadcast fee due notifications to all parents with pending dues?')) return;
    try {
      const res = await ApiService.broadcastDueFeeReminders();
      alert(`✅ Fee Reminder Broadcast Complete! ${res.notifiedCount} parent(s) notified in their Mobile App.`);
    } catch (err: any) {
      alert('Error broadcasting fee reminders: ' + err.message);
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
            {currentSchool?.logoUrl ? (
              <img
                src={currentSchool.logoUrl}
                alt={currentSchool.name || 'School Logo'}
                className="w-10 h-10 rounded-2xl object-cover bg-white border border-slate-700 shadow-lg shrink-0"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 shrink-0">
                <SchoolIcon size={20} />
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="text-sm font-black tracking-tight leading-tight truncate text-white" title={currentSchool?.name}>
                {currentSchool?.name || 'ANVIMITRA ERP'}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono block">
                Code: {currentSchool?.code || 'LSK1'} • 2026-2027
              </span>
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
              onClick={() => setActiveTab('parents')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'parents' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake size={16} />
                <span>Parents Directory</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">{parentsList.length}</span>
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
              onClick={() => {
                setActiveTab('admit_cards');
                if (classesData?.classes?.length > 0 && !admitCardClassId) {
                  const firstCls = classesData.classes[0].id;
                  setAdmitCardClassId(firstCls);
                  loadClassAdmitCards(firstCls);
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'admit_cards' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap size={16} />
                <span>Exam Admit Cards Desk</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full font-bold text-amber-300">New</span>
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
          <div className="font-bold text-slate-200">{currentSchool?.name || 'School ERP'}</div>
          <div className="text-[10px] text-emerald-400">
            {currentSchool?.affiliationNo ? `Affiliation: ${currentSchool.affiliationNo}` : (currentSchool?.code ? `Code: ${currentSchool.code}` : 'Cloud Campus')}
          </div>
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

            {/* Live Class-Wise Period Timetable Viewer */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-indigo-600" /> Live Class Period Schedule
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any class to inspect its daily periods, allotted subjects, teachers, and timings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ttClassId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setTtClassId(cId);
                      const sec = classesData?.sections?.find((s: any) => s.classId === cId)?.id || classesData?.sections?.[0]?.id || '';
                      setTtSectionId(sec);
                      loadTimetableData(cId, sec);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
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
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    {classesData?.sections
                      ?.filter((s: any) => s.classId === ttClassId)
                      ?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          Sec {s.name}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition"
                  >
                    Manage Timetable →
                  </button>
                </div>
              </div>

              {ttPeriods.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">No periods scheduled for this class yet.</p>
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Assign periods in Timetable Matrix
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-black text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Day</th>
                        <th className="px-3 py-2.5">Period 1</th>
                        <th className="px-3 py-2.5">Period 2</th>
                        <th className="px-3 py-2.5">Period 3</th>
                        <th className="px-3 py-2.5">Period 4</th>
                        <th className="px-3 py-2.5">Period 5</th>
                        <th className="px-3 py-2.5">Period 6</th>
                        <th className="px-3 py-2.5">Period 7</th>
                        <th className="px-3 py-2.5">Period 8</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                        const dayPeriods = ttPeriods.filter((p) => p.dayOfWeek === day);
                        return (
                          <tr key={day} className="hover:bg-slate-50/80">
                            <td className="px-3 py-3 font-bold text-slate-900 bg-slate-50/50">{day}</td>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                              const p = dayPeriods.find((item) => item.periodNumber === num);
                              return (
                                <td key={num} className="px-3 py-2.5 text-[11px] align-top">
                                  {p ? (
                                    <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg p-1.5 min-w-[95px]">
                                      <div className="font-bold text-blue-900 leading-tight">{p.subjectName}</div>
                                      <div className="text-[10px] text-slate-600 mt-0.5">{p.teacherName}</div>
                                      <div className="text-[9px] text-slate-400 font-mono">{p.startTime}-{p.endTime} • {p.roomNumber}</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-[10px] italic">Free</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {s.photoUrl ? (
                              <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {s.firstName?.[0] || 'S'}
                              </div>
                            )}
                            <div className="font-bold text-slate-900">
                              {s.firstName} {s.lastName}
                            </div>
                          </div>
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

        {/* ================= MODULE: PARENTS DIRECTORY ================= */}
        {activeTab === 'parents' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="text-emerald-600" size={24} />
                  Parents & Guardians Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dedicated parent management registry. View linked student wards, mobile app access status, and secure auto-generated credentials.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {parentsList.length} Active Parents
                </span>
              </div>
            </div>

            {/* Metrics & Password Rule Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Parents</span>
                <span className="text-2xl font-black text-slate-900">{parentsList.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Enrolled with students</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Linked Student Wards</span>
                <span className="text-2xl font-black text-blue-600">
                  {parentsList.reduce((acc, p) => acc + (p.totalChildren || 0), 0)}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">Active pupils</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mobile App Installed</span>
                <span className="text-2xl font-black text-emerald-600">
                  {parentsList.filter((p) => p.appInstalled).length}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Logged in on Android/iOS</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950">
                <span className="font-bold block text-purple-900 flex items-center gap-1 mb-1">
                  <Key size={14} className="text-purple-600" />
                  Auto-Credentials Rule
                </span>
                <p className="text-[11px] text-purple-800 leading-snug">
                  <strong>Login ID:</strong> Parent Mobile Number<br />
                  <strong>Password:</strong> First 4 uppercase letters of Name + Last 4 digits of Mobile
                </p>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Parent Name, Mobile, Student Name or Admission No..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <span className="text-xs text-slate-400 font-bold self-end sm:self-center">
                Showing {
                  parentsList.filter((p) => {
                    const q = parentSearch.toLowerCase();
                    if (!q) return true;
                    const matchesParent = (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
                    const matchesChild = p.children?.some((c: any) =>
                      (c.name || '').toLowerCase().includes(q) || (c.admissionNo || '').toLowerCase().includes(q)
                    );
                    return matchesParent || matchesChild;
                  }).length
                } of {parentsList.length} Parents
              </span>
            </div>

            {/* Parents Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                  <tr>
                    <th className="px-4 py-3">Parent Name</th>
                    <th className="px-4 py-3">Login ID (Mobile No)</th>
                    <th className="px-4 py-3">Linked Wards / Children</th>
                    <th className="px-4 py-3">Auto Password Preview</th>
                    <th className="px-4 py-3">Mobile App Status</th>
                    <th className="px-4 py-3">Address & Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parentsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No parents found. Parents are automatically registered when admitting students.
                      </td>
                    </tr>
                  ) : (
                    parentsList
                      .filter((p) => {
                        const q = parentSearch.toLowerCase();
                        if (!q) return true;
                        const matchesParent = (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
                        const matchesChild = p.children?.some((c: any) =>
                          (c.name || '').toLowerCase().includes(q) || (c.admissionNo || '').toLowerCase().includes(q)
                        );
                        return matchesParent || matchesChild;
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            {(p.fatherName || p.motherName) && (
                              <div className="text-[10px] text-slate-400">
                                {[p.fatherName ? `Father: ${p.fatherName}` : null, p.motherName ? `Mother: ${p.motherName}` : null]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <a
                              href={`tel:${p.phone}`}
                              className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                            >
                              <Phone size={12} className="text-blue-500" />
                              <span>{p.phone || 'No Phone'}</span>
                            </a>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Mobile Login ID</span>
                          </td>

                          <td className="px-4 py-3.5">
                            {p.children && p.children.length > 0 ? (
                              <div className="space-y-1">
                                {p.children.map((c: any) => (
                                  <div
                                    key={c.id}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] font-bold mr-1.5 mb-1"
                                  >
                                    <GraduationCap size={12} className="text-blue-600" />
                                    <span>{c.name}</span>
                                    <span className="text-[10px] text-blue-500 font-mono font-normal">({c.className})</span>
                                    <span className="text-[10px] bg-white text-blue-700 font-mono px-1 rounded border border-blue-200">{c.admissionNo}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No linked ward</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-300">
                                {p.autoPasswordPreview}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.autoPasswordPreview);
                                  alert(`Copied password for ${p.name}: ${p.autoPasswordPreview}`);
                                }}
                                title="Copy Password"
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                              {p.passwordFormula}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {p.appInstalled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={11} className="text-emerald-600" />
                                <span>App Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertCircle size={11} className="text-amber-600" />
                                <span>Pending Login</span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-[11px] text-slate-600 max-w-xs truncate">
                            <div>{p.address || 'Address not specified'}</div>
                            {p.email && <div className="text-[10px] text-slate-400 font-mono truncate">{p.email}</div>}
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                    Approved Curriculum Subjects ({classesData?.subjects?.length || 0})
                  </h3>
                  <select
                    value={selectedSubjectClassFilter}
                    onChange={(e) => setSelectedSubjectClassFilter(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="ALL">All Classes</option>
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  {(classesData?.subjects || [])
                    .filter((sub: any) => selectedSubjectClassFilter === 'ALL' || !sub.classId || sub.classId === selectedSubjectClassFilter)
                    .map((sub: any) => {
                      const designatedClass = classesData?.classes?.find((c: any) => c.id === sub.classId);
                      return (
                        <div key={sub.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{sub.name}</span>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {sub.code || 'CORE'} {designatedClass ? `• ${designatedClass.name}` : '• All Classes'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px]">
                              Curriculum
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(sub.id, sub.name)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50"
                              title="Delete Subject"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPublishTargetExamId(exams[0]?.id || '');
                    setPublishTargetClassId(classesData?.classes?.[0]?.id || '');
                    setShowPublishClassModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-xs transition flex items-center gap-1.5"
                >
                  <Award size={14} />
                  <span>Publish Class Results</span>
                </button>
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
                    + Create Exam Cycle
                  </button>
                </form>
              </div>
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
                      <th className="px-4 py-3 text-center">Result Status</th>
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
                        <td className="px-4 py-3 text-center">
                          {publishedStudentIds.has(s.id) ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ PUBLISHED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              DRAFT (UNRELEASED)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublishStudent(s.id, exams[0]?.id || 'exam-sa1', publishedStudentIds.has(s.id))}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border transition ${
                                publishedStudentIds.has(s.id)
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {publishedStudentIds.has(s.id) ? 'Unpublish' : 'Publish Result'}
                            </button>
                            <button
                              onClick={() => handleGenerateReportCard(s.id)}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                            >
                              <Printer size={12} />
                              <span>View Marksheet</span>
                            </button>
                          </div>
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
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-900/50">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  <CreditCard size={16} /> Institutional Bursar & Fee Desk
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Class-Wise Fee System & Ledger</h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                  Configure class-wise fee structures (Nursery to Class 12), track defaulter dues, accept payments with instant receipts, and broadcast bakaya notifications to parents.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowAddStructModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                >
                  <Plus size={16} />
                  <span>Add Class Fee Head</span>
                </button>
                <button
                  onClick={() => setShowCollectModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
                >
                  <CreditCard size={16} />
                  <span>Accept Fee Counter</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                onClick={() => setFeeSubTab('structures')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  feeSubTab === 'structures' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <FileText size={15} />
                <span>Class Fee Heads ({structures.length})</span>
              </button>
              <button
                onClick={() => setFeeSubTab('defaulters')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  feeSubTab === 'defaulters' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <AlertCircle size={15} />
                <span>Defaulters & Bakaya List ({
                  students.filter((s) => {
                    const sFees = structures.filter((st) => st.classId === s.classId).reduce((a, st) => a + (Number(st.amount) || 0), 0);
                    const sPaid = payments.filter((p) => p.studentId === s.id).reduce((a, p) => a + (Number(p.amountPaid) || 0), 0);
                    return sFees > sPaid;
                  }).length
                })</span>
              </button>
              <button
                onClick={() => setFeeSubTab('ledger')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                  feeSubTab === 'ledger' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <History size={15} />
                <span>Payment Transactions ({payments.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: STRUCTURES */}
            {feeSubTab === 'structures' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Class Fee Structures & Heads</h3>
                    <p className="text-xs text-slate-500">Institutional fee rates defined per class batch.</p>
                  </div>
                  <button
                    onClick={() => setShowAddStructModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Plus size={14} />
                    <span>Create Fee Head</span>
                  </button>
                </div>

                {structures.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    No fee structures defined yet. Click "Create Fee Head" to add fee rates for classes (Nursery, LKG, UKG, Class 1-12).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {structures.map((st) => {
                      const className = classesData?.classes?.find((c: any) => c.id === st.classId)?.name || `Class ${st.classId}`;
                      return (
                        <div key={st.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group hover:border-indigo-300 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-700 px-2.5 py-1 bg-indigo-100/80 border border-indigo-200 rounded-lg">
                              {className}
                            </span>
                            <button
                              onClick={() => handleDeleteStructure(st.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                              title="Delete Fee Head"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-base">{st.title}</h4>
                            <div className="text-2xl font-black text-slate-900 mt-1">₹{Number(st.amount).toLocaleString('en-IN')}</div>
                          </div>
                          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
                            <span>Due Date: {st.dueDate || 'Standard'}</span>
                            <span className="font-semibold text-slate-600">Session {st.academicYear || '2026-27'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: DEFAULTERS */}
            {feeSubTab === 'defaulters' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/70 border border-amber-200 p-5 rounded-2xl">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">Pending Bakaya Dues</span>
                    <h3 className="text-xl font-black text-amber-950 mt-0.5">
                      Total Outstanding: ₹{
                        students.reduce((total, s) => {
                          const sFees = structures.filter((st) => st.classId === s.classId).reduce((a, st) => a + (Number(st.amount) || 0), 0);
                          const sPaid = payments.filter((p) => p.studentId === s.id).reduce((a, p) => a + (Number(p.amountPaid) || 0), 0);
                          return total + Math.max(0, sFees - sPaid);
                        }, 0).toLocaleString('en-IN')
                      }
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      Students who have unpaid balances for their enrolled class fee structures.
                    </p>
                  </div>

                  <button
                    onClick={handleBroadcastDueReminders}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2 shrink-0"
                  >
                    <Bell size={15} />
                    <span>📢 Broadcast Bakaya Due Notifications to Parents</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Guardian / Phone</th>
                        <th className="px-4 py-3">Total Fee</th>
                        <th className="px-4 py-3">Paid</th>
                        <th className="px-4 py-3">Bakaya (Due)</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const defaulters = students.map((s) => {
                          const sFees = structures.filter((st) => st.classId === s.classId).reduce((a, st) => a + (Number(st.amount) || 0), 0);
                          const sPaid = payments.filter((p) => p.studentId === s.id).reduce((a, p) => a + (Number(p.amountPaid) || 0), 0);
                          const due = Math.max(0, sFees - sPaid);
                          return { ...s, totalAssignedFee: sFees, totalPaid: sPaid, dueAmount: due };
                        }).filter((s) => s.dueAmount > 0);

                        if (defaulters.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                🎉 No fee defaulters found! All enrolled students are clear of dues.
                              </td>
                            </tr>
                          );
                        }

                        return defaulters.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                {s.photoUrl ? (
                                  <img src={s.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                    {s.firstName?.[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900">{s.firstName} {s.lastName || ''}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">Adm: {s.admissionNo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {s.className} - {s.sectionName || 'A'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <div>{s.fatherName || s.motherName || 'Guardian'}</div>
                              <div className="font-mono text-[11px] text-slate-400">{s.primaryPhone || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700">₹{s.totalAssignedFee.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">₹{s.totalPaid.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-black text-rose-600">₹{s.dueAmount.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleSendReminder(s.id, s.firstName, s.dueAmount)}
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ml-auto"
                              >
                                <Bell size={12} />
                                <span>Send Alert</span>
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: LEDGER */}
            {feeSubTab === 'ledger' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <History className="text-emerald-600" size={20} />
                      Fee Ledger & Cash Collection Transactions
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review fee receipts, inspect payment modes, and reprint official receipts.
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
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
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
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setLatestReceipt(p)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition flex items-center gap-1 ml-auto"
                              >
                                <Printer size={12} />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        
        {/* ================= MODULE: EXAM ADMIT CARDS DESK ================= */}
        {activeTab === 'admit_cards' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={24} />
                  Exam Admit Cards & Hall Ticket Desk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Design, assign, and release official examination admit cards for class batches. Once released, students and parents can view and download hall tickets on their mobile app and web portals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkAdmitModal(true)}
                  disabled={classAdmitCards.length === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2"
                >
                  <Printer size={15} />
                  <span>Print All Class Admit Cards</span>
                </button>
              </div>
            </div>

            {/* Admit Card Generator Form */}
            <form onSubmit={handleGenerateClassAdmitCards} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-black text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-2">
                  <span>⚡ Batch Admit Card Generator</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Select a class to load existing hall tickets or generate new ones for the whole batch
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={admitCardClassId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setAdmitCardClassId(cId);
                      loadClassAdmitCards(cId);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-xs"
                  >
                    {classesData?.classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Schedule Title *</label>
                  <input
                    type="text"
                    required
                    value={admitCardExamTitle}
                    onChange={(e) => setAdmitCardExamTitle(e.target.value)}
                    placeholder="e.g. CBSE Annual Board Exam 2026-27"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Examination Center Name *</label>
                  <input
                    type="text"
                    required
                    value={admitCardCenterName}
                    onChange={(e) => setAdmitCardCenterName(e.target.value)}
                    placeholder="e.g. Campus Examination Hall A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Center Code *</label>
                  <input
                    type="text"
                    required
                    value={admitCardCenterNumber}
                    onChange={(e) => setAdmitCardCenterNumber(e.target.value)}
                    placeholder="e.g. 8402"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 italic">
                  * Note: Re-generating will overwrite previous roll codes for this class batch with updated center details.
                </span>

                <button
                  type="submit"
                  disabled={generatingAdmitCards}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <GraduationCap size={15} />
                  <span>{generatingAdmitCards ? 'Generating Cards...' : '⚡ Generate & Assign Entire Class Admit Cards'}</span>
                </button>
              </div>
            </form>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(() => {
                const classStudents = students.filter((s) => s.classId === admitCardClassId);
                const assignedCount = classStudents.filter((s) => classAdmitCards.some((c) => c.studentId === s.id)).length;
                const pendingCount = Math.max(0, classStudents.length - assignedCount);

                return (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Enrollment</span>
                      <span className="text-2xl font-black text-slate-900">{classStudents.length}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Enrolled pupils</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Admit Cards Assigned</span>
                      <span className="text-2xl font-black text-emerald-700">{assignedCount}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Ready for parent & student view</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Assignment</span>
                      <span className="text-2xl font-black text-amber-700">{pendingCount}</span>
                      <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">Awaiting batch generation</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Candidates Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">
                  Candidate Roster & Hall Ticket Status
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {students.filter((s) => s.classId === admitCardClassId).length} Candidates
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-4 py-3">Photo & Candidate</th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Assigned Roll Code</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const classStudents = students.filter((s) => s.classId === admitCardClassId);
                      if (classStudents.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                              No students found in this class. Select another class above or admit students.
                            </td>
                          </tr>
                        );
                      }

                      return classStudents.map((s) => {
                        const card = classAdmitCards.find((c) => c.studentId === s.id);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {s.photoUrl ? (
                                  <img
                                    src={s.photoUrl}
                                    alt={s.firstName}
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 border border-blue-200">
                                    {s.firstName?.[0] || 'S'}
                                  </div>
                                )}
                                <div>
                                  <div className="font-extrabold text-slate-900 text-sm">
                                    {s.firstName} {s.lastName || ''}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {s.fatherName ? `Father: ${s.fatherName}` : `Class ${s.className || 'General'}`}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 font-mono font-bold text-slate-700">
                              {s.admissionNo}
                            </td>

                            <td className="px-4 py-3 font-mono font-bold text-slate-900">
                              {s.rollNo || '-'}
                            </td>

                            <td className="px-4 py-3 font-mono text-[11px] text-blue-700">
                              {card?.rollCode || (
                                <span className="text-slate-400 italic">Not Assigned</span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {card ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={11} className="text-emerald-600" />
                                  <span>Assigned & Released</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertCircle size={11} className="text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleOpenStudentAdmitCard(s)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto"
                              >
                                <Printer size={13} />
                                <span>Preview Hall Ticket</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
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
                <span className="text-sm font-black text-slate-900">{currentSchool?.name || 'Educational Institution'}</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">Super Admin Managed</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">School Code / Tenant ID (Locked)</span>
                <span className="text-sm font-black text-slate-900 font-mono">{currentSchool?.code || 'SCH01'}</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">Fixed</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Board Affiliation Number (Locked)</span>
                <span className="text-sm font-black text-slate-900 font-mono">{currentSchool?.affiliationNo || 'Affiliation Pending'}</span>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">CBSE / State</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Campus Physical Address</span>
                <span className="text-sm font-bold text-slate-900">{currentSchool?.address || 'Campus Address Not Configured'}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Primary Administration Phone</span>
                <span className="text-sm font-mono font-bold text-slate-900">{currentSchool?.phone || 'Phone Not Configured'}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 font-bold block mb-1">Academic Session Cycle</span>
                <span className="text-sm font-black text-indigo-700">2026-2027 (Term 1 & Term 2 Active)</span>
              </div>
            </div>

            {/* School Logo & Branding Section */}
            <div className="p-5 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SchoolIcon size={16} className="text-blue-600" />
                    School Official Crest & Logo Branding
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Displayed on ID cards, CBSE report cards, parent mobile apps, and institutional receipts.
                  </p>
                </div>

                <label className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition self-start sm:self-auto">
                  <Upload size={13} />
                  <span>Upload Logo from PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        alert('⚠️ Image must be under 2MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setEditingSchoolLogo(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl border-2 border-blue-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {editingSchoolLogo || currentSchool?.logoUrl ? (
                    <img
                      src={editingSchoolLogo || currentSchool?.logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
                      }}
                    />
                  ) : (
                    <SchoolIcon size={28} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (PNG, JPG, SVG, WebP)..."
                      value={editingSchoolLogo}
                      onChange={(e) => setEditingSchoolLogo(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={savingLogo || !currentSchool?.id}
                      onClick={async () => {
                        if (!currentSchool?.id) return;
                        setSavingLogo(true);
                        try {
                          await ApiService.updateSchool(currentSchool.id, { logoUrl: editingSchoolLogo });
                          setCurrentSchool({ ...currentSchool, logoUrl: editingSchoolLogo });
                          alert('✅ School logo updated successfully!');
                        } catch (err: any) {
                          alert('Error saving logo: ' + err.message);
                        } finally {
                          setSavingLogo(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                    >
                      {savingLogo ? 'Saving...' : 'Save Logo'}
                    </button>
                  </div>

                  {/* Preset Badges */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
                    <span className="text-slate-400 font-semibold shrink-0">Sample Crests:</span>
                    {[
                      { name: 'CBSE Crest', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150' },
                      { name: 'Royal Academy', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150' },
                      { name: 'Global High', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150' },
                      { name: 'Tech Crest', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setEditingSchoolLogo(c.url)}
                        className={`px-2 py-0.5 rounded-lg border font-semibold transition shrink-0 ${
                          editingSchoolLogo === c.url
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
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
          <CertificatesDesk
            students={students}
            schoolInfo={classesData?.school}
            onStudentsUpdated={async () => {
              const [sRes, pRes] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getParents(),
              ]);
              setStudents(sRes.students || []);
              setParentsList(pRes.parents || []);
            }}
          />
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
      </main>

      
      {/* ================= MODAL: PREVIEW & PRINT OFFICIAL ADMIT CARD ================= */}
      {showAdmitCardModal && selectedAdmitCardStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 print:border-none print:shadow-none print:my-0 print:p-4">
            <button
              onClick={() => setShowAdmitCardModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 print:hidden"
            >
              <X size={20} />
            </button>

            {/* Printable Admit Card Document Layout */}
            <div id="admit-card-print-area" className="border-2 border-slate-900 p-6 rounded-2xl relative space-y-4">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 relative">
                <div className="flex items-center justify-center gap-4">
                  {(currentSchool?.logoUrl || classesData?.school?.logoUrl) && (
                    <img
                      src={currentSchool?.logoUrl || classesData?.school?.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 object-contain rounded-xl border border-slate-200"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      {currentSchool?.name || classesData?.school?.name || 'LSK ACADEMY SECONDARY SCHOOL'}
                    </h1>
                    <p className="text-xs font-semibold text-slate-600">
                      Affiliation No: {currentSchool?.affiliationNo || 'CBSE-REG-8402'} | School Code: {currentSchool?.code || 'LSK1'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {currentSchool?.address || 'Institutional Campus, Main Road'} • Phone: {currentSchool?.phone || '+91 9680897658'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-lg">
                  {selectedAdmitCardDetails?.examTitle || admitCardExamTitle || 'Annual Examination Hall Ticket 2026-27'}
                </div>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pt-2">
                <div className="sm:col-span-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate Name</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {selectedAdmitCardStudent.firstName} {selectedAdmitCardStudent.lastName || ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Number</span>
                    <span className="font-mono font-bold text-sm text-blue-700">{selectedAdmitCardStudent.admissionNo}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Father's Name</span>
                    <span className="font-bold text-slate-800">
                      {selectedAdmitCardStudent.fatherName || selectedAdmitCardDetails?.fatherName || 'Guardian'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number & Code</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedAdmitCardStudent.rollNo ? `Roll: ${selectedAdmitCardStudent.rollNo}` : ''} • {selectedAdmitCardDetails?.rollCode || `CBSE-LSK1-2026-${String(selectedAdmitCardStudent.rollNo || 1).padStart(4, '0')}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Section</span>
                    <span className="font-bold text-slate-800">
                      {classesData?.classes?.find((c: any) => c.id === selectedAdmitCardStudent.classId)?.name || 'Class'} (Section {classesData?.sections?.find((s: any) => s.id === selectedAdmitCardStudent.sectionId)?.name || 'A'})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Examination Center</span>
                    <span className="font-bold text-slate-800">
                      {selectedAdmitCardDetails?.centerName || admitCardCenterName} ({selectedAdmitCardDetails?.centerNumber || admitCardCenterNumber})
                    </span>
                  </div>
                </div>

                {/* Candidate Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-28 border-2 border-slate-900 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center relative">
                    {selectedAdmitCardStudent.photoUrl ? (
                      <img
                        src={selectedAdmitCardStudent.photoUrl}
                        alt="Candidate Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <GraduationCap size={28} className="mx-auto text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">Affix Photo</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Verified Candidate</span>
                </div>
              </div>

              {/* Examination Schedule / Timetable */}
              <div className="border border-slate-900 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2 border-r border-slate-800">Date</th>
                      <th className="p-2 border-r border-slate-800">Time</th>
                      <th className="p-2 border-r border-slate-800">Subject Code</th>
                      <th className="p-2 border-r border-slate-800">Subject Name</th>
                      <th className="p-2 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const subs = classesData?.subjects?.filter((s: any) => !s.classId || s.classId === selectedAdmitCardStudent.classId) || [];
                      const defaultDates = ['2026-10-10', '2026-10-12', '2026-10-14', '2026-10-16', '2026-10-18', '2026-10-20'];
                      const displayList = subs.length > 0 ? subs : [
                        { name: 'English Core', code: 'ENG-101' },
                        { name: 'Mathematics', code: 'MATH-102' },
                        { name: 'Science / Physics', code: 'SCI-103' },
                        { name: 'Social Studies / Chemistry', code: 'SST-104' },
                        { name: 'Hindi / Regional', code: 'HIN-105' },
                      ];

                      return displayList.map((sub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold border-r border-slate-200">
                            {defaultDates[idx % defaultDates.length]}
                          </td>
                          <td className="p-2 font-mono border-r border-slate-200">
                            09:00 AM – 12:00 PM
                          </td>
                          <td className="p-2 font-mono font-bold text-blue-700 border-r border-slate-200">
                            {sub.code || `SUB-${idx + 101}`}
                          </td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                            {sub.name}
                          </td>
                          <td className="p-2 text-center border-slate-200"></td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Candidate Instructions */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-[10px] text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">Candidate Rules & Examination Instructions:</span>
                <p>1. Candidates must arrive at the examination center at least 30 minutes before commencement of the exam.</p>
                <p>2. Electronic gadgets, mobile phones, and smart watches are strictly prohibited inside the hall.</p>
                <p>3. This printed Admit Card must be kept safe and produced for verification during all exam sessions.</p>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="font-bold text-slate-800 text-[11px] block mt-1">Candidate Signature</span>
                </div>

                <div>
                  <div className="h-10 border-b border-dashed border-slate-400"></div>
                  <span className="font-bold text-slate-800 text-[11px] block mt-1">Center Superintendent</span>
                </div>

                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-blue-900">Amit Tiwari</span>
                  </div>
                  <span className="font-bold text-slate-900 text-[11px] block mt-1">Principal / Examination Controller</span>
                  <span className="text-[9px] text-slate-400 block">Seal & Signature</span>
                </div>
              </div>
            </div>

            {/* Print & Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setShowAdmitCardModal(false)}
                className="px-5 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Printer size={15} />
                <span>Print Official Admit Card (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BULK PRINT ALL CLASS ADMIT CARDS ================= */}
      {showBulkAdmitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 print:border-none print:shadow-none print:my-0 print:p-0">
            <button
              onClick={() => setShowBulkAdmitModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 print:hidden"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Bulk Class Admit Cards Printing
                </h3>
                <p className="text-xs text-slate-500">
                  Ready to print {students.filter((s) => s.classId === admitCardClassId).length} hall tickets. Each candidate is rendered on an individual printable page.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2"
              >
                <Printer size={15} />
                <span>Print All ({students.filter((s) => s.classId === admitCardClassId).length} Students)</span>
              </button>
            </div>

            {/* Render each student admit card */}
            <div className="space-y-8 print:space-y-0">
              {students
                .filter((s) => s.classId === admitCardClassId)
                .map((st) => {
                  const card = classAdmitCards.find((c) => c.studentId === st.id);
                  return (
                    <div key={st.id} className="border-2 border-slate-900 p-6 rounded-2xl relative space-y-4 print:page-break-after-always">
                      <div className="text-center border-b-2 border-slate-900 pb-4">
                        <h2 className="text-xl font-black uppercase text-slate-900">
                          {currentSchool?.name || 'LSK ACADEMY SECONDARY SCHOOL'}
                        </h2>
                        <p className="text-xs font-semibold text-slate-600">
                          {card?.examTitle || admitCardExamTitle || 'Annual Examination Hall Ticket 2026-27'}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate Name</span>
                            <span className="font-extrabold text-slate-900">{st.firstName} {st.lastName || ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission No</span>
                            <span className="font-mono font-bold text-blue-700">{st.admissionNo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Roll No & Code</span>
                            <span className="font-mono font-bold">{st.rollNo || 1} • {card?.rollCode || `CBSE-LSK1-2026-${String(st.rollNo || 1).padStart(4, '0')}`}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Examination Center</span>
                            <span className="font-bold">{card?.centerName || admitCardCenterName} ({card?.centerNumber || admitCardCenterNumber})</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="w-20 h-24 border-2 border-slate-900 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                            {st.photoUrl ? (
                              <img src={st.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <GraduationCap size={24} className="text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 pt-4 border-t-2 border-slate-900 text-center text-xs">
                        <div>
                          <div className="h-8 border-b border-dashed border-slate-400"></div>
                          <span className="text-[10px] font-bold text-slate-700 block mt-1">Candidate Sign</span>
                        </div>
                        <div>
                          <div className="h-8 border-b border-dashed border-slate-400"></div>
                          <span className="text-[10px] font-bold text-slate-700 block mt-1">Center Superintendent</span>
                        </div>
                        <div>
                          <div className="h-8 border-b border-dashed border-slate-400 flex items-center justify-center">
                            <span className="font-serif italic text-blue-900 font-bold">Amit Tiwari</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-900 block mt-1">Principal / Controller</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}


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
              {/* Student Photo Picker */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="relative">
                  <img
                    src={studentForm.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-400 shadow-sm bg-slate-200"
                  />
                  {studentForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setStudentForm({ ...studentForm, photoUrl: '' })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-slate-800 mb-0.5">Student Photograph</label>
                  <p className="text-[11px] text-slate-500 mb-1.5">Upload student passport photo directly from computer / phone camera</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setStudentForm({ ...studentForm, photoUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
              </div>

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
                <span className="font-black text-sm uppercase tracking-wider">{currentSchool?.name || 'School ERP'}</span>
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
                  <option value="staff">Administrative / Support Staff</option>
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
                <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                <select
                  value={newSubjectClassId}
                  onChange={(e) => setNewSubjectClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="">All Classes / Common Curriculum</option>
                  {classesData?.classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
                  {currentSchool?.name || 'Educational Institution'}
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">
                  {currentSchool?.affiliationNo ? `Affiliation: ${currentSchool.affiliationNo}` : 'Recognized Educational Institution'}
                </p>
                <p className="text-[10px] text-slate-500 font-sans">
                  {currentSchool?.address ? `${currentSchool.address} • Phone: ${currentSchool.phone || 'N/A'}` : (currentSchool?.phone ? `Phone: ${currentSchool.phone}` : '')}
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
                  <strong className="font-mono">{latestReceipt.admissionNo || 'ADM'}</strong>
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
                  <tr className="border-b border-slate-800 text-slate-600 font-bold">
                    <th className="text-left py-2 px-2">PARTICULAR DETAILS</th>
                    <th className="text-right py-2 px-2">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2.5 px-2 font-medium">
                      {latestReceipt.feeTitle || 'Academic Composite Institutional Fee'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">
                      ₹{Number(latestReceipt.amountPaid).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-800 font-black text-sm">
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

      {/* ================= MODAL: PARENT CREDENTIALS AUTO-GENERATED ================= */}
      {showParentCredsModal && createdParentCreds && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-200 space-y-5 animate-slide-up relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Student Admitted Successfully!</h3>
                <p className="text-xs text-emerald-600 font-bold">✓ Parent Login Credentials Auto-Generated</p>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-slate-600 font-bold">Student Name:</span>
                <span className="font-extrabold text-slate-900 uppercase">{createdParentCreds.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-slate-600 font-bold">Parent / Guardian:</span>
                <span className="font-bold text-slate-800">{createdParentCreds.parentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-slate-600 font-bold">Parent Login ID (Mobile):</span>
                <span className="font-mono font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-lg text-sm">
                  {createdParentCreds.loginId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-bold">Auto-Password (Name+Phone):</span>
                <span className="font-mono font-black text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-lg text-sm">
                  {createdParentCreds.password}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Parents can log into the <strong>Mobile App</strong> or <strong>Web Portal</strong> using their <strong>Mobile Number</strong> as Login ID and the above password.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `🎓 *${currentSchool?.name || 'School ERP'}*\nDear ${createdParentCreds.parentName},\nYour ward ${createdParentCreds.studentName} has been enrolled successfully.\n\n📱 *Parent Portal / Mobile App Login Details:*\n- *Login ID (Mobile)*: ${createdParentCreds.loginId}\n- *Password*: ${createdParentCreds.password}\n- *School Code*: ${currentSchool?.code || ''}\n\nPlease keep these credentials secure.`;
                  navigator.clipboard.writeText(msg);
                  setCopiedParentCreds(true);
                  setTimeout(() => setCopiedParentCreds(false), 2500);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                {copiedParentCreds ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedParentCreds ? 'Copied Details to Clipboard!' : '📋 Copy Parent Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowParentCredsModal(false)}
                className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
