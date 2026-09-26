import React, { useState, useEffect } from 'react';
import { User, School, Student, StaffMember, FeePaymentRecord, FeeStructureItem, StaffLeaveItem, NotificationItem, ParentInfo, ExamItem, ExamSubmissionMatrix, ClassSubmissionStatus, SubjectSubmissionStatus } from '../types';
import {
  fetchLiveStudents,
  fetchLiveClasses,
  fetchStaffMembers,
  createStaffMember,
  deleteStaffMember,
  fetchFeePayments,
  fetchFeeStructures,
  collectFeePayment,
  fetchStaffLeaves,
  reviewStaffLeave,
  fetchLiveNotices,
  broadcastLiveNotice,
  createStudent,
  deleteStudent,
  fetchParents,
  fetchExamsList,
  fetchExamSubmissionStatus,
  publishExamResults,
  sendMarksSubmissionReminder,
} from '../api';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  BellRing,
  Database,
  Radio,
  Briefcase,
  Check,
  X,
  Plus,
  Search,
  Trash2,
  Copy,
  CreditCard,
  Receipt,
  UserPlus,
  Shield,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  UserCheck,
  Bus,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  FileCheck,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { LiveBusMapModal } from './LiveBusMapModal';

interface Props {
  principal: User;
  school: School;
  activeSubTab?: 'overview' | 'students' | 'parents' | 'staff' | 'fees' | 'operations' | 'exams';
  onSubTabChange?: (tab: 'overview' | 'students' | 'parents' | 'staff' | 'fees' | 'operations' | 'exams') => void;
}

export const PrincipalView: React.FC<Props> = ({
  principal,
  school,
  activeSubTab: externalTab,
  onSubTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'overview' | 'students' | 'parents' | 'staff' | 'fees' | 'operations' | 'exams'>('overview');
  const currentTab = externalTab || internalTab;
  const setTab = (tab: 'overview' | 'students' | 'parents' | 'staff' | 'fees' | 'operations' | 'exams') => {
    setInternalTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [classesData, setClassesData] = useState<{ classes: any[]; sections: any[] }>({ classes: [], sections: [] });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);
  const [leaves, setLeaves] = useState<StaffLeaveItem[]>([]);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Parents filter & state
  const [parentSearch, setParentSearch] = useState('');
  const [copiedParentId, setCopiedParentId] = useState<string | null>(null);

  // Student filter & modal
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showFleetTracking, setShowFleetTracking] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newStudent, setNewStudent] = useState({
    admissionNo: '',
    rollNo: '',
    firstName: '',
    lastName: '',
    classId: '',
    sectionId: '',
    gender: 'Male',
    fatherName: '',
    motherName: '',
    primaryPhone: '',
    emergencyPhone: '',
    address: '',
    photoUrl: '',
  });

  // Auto Parent Credentials Modal
  const [createdParentCreds, setCreatedParentCreds] = useState<{
    loginId: string;
    password: string;
    parentName: string;
    studentName: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Staff modal
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [recruiting, setRecruiting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    password: '',
  });

  // Fee collection modal
  const [showCollectFee, setShowCollectFee] = useState(false);
  const [feeStudentFilter, setFeeStudentFilter] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    feeStructureId: '',
    amountPaid: '15000',
    paymentMode: 'cash',
    remarks: 'Tuition Fee Payment',
  });
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  // Broadcast notice form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  // Leave review
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [copiedSyncKey, setCopiedSyncKey] = useState(false);

  // Exam & Marks submission audit states
  const [examList, setExamList] = useState<ExamItem[]>([]);
  const [selectedAuditExamId, setSelectedAuditExamId] = useState<string>('');
  const [submissionMatrix, setSubmissionMatrix] = useState<ExamSubmissionMatrix | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [expandedClasses, setExpandedClasses] = useState<{ [classKey: string]: boolean }>({});
  const [publishingClassKey, setPublishingClassKey] = useState<string | null>(null);
  const [remindingTeacherKey, setRemindingTeacherKey] = useState<string | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState<boolean>(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  const loadExamAuditData = async (targetExamId?: string) => {
    setLoadingMatrix(true);
    try {
      const exams = await fetchExamsList();
      setExamList(exams || []);
      const activeId = targetExamId || selectedAuditExamId || (exams && exams.length > 0 ? exams[0].id : '');
      if (activeId) {
        setSelectedAuditExamId(activeId);
        const matrix = await fetchExamSubmissionStatus(activeId);
        setSubmissionMatrix(matrix);
        // Expand first class by default if none expanded
        if (matrix?.classes?.length) {
          setExpandedClasses((prev) => {
            if (Object.keys(prev).length === 0) {
              const firstKey = `${matrix.classes[0].classId}_${matrix.classes[0].sectionId}`;
              return { [firstKey]: true };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn('PrincipalView loadExamAuditData error', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleAuditExamChange = async (eId: string) => {
    setSelectedAuditExamId(eId);
    setLoadingMatrix(true);
    try {
      const matrix = await fetchExamSubmissionStatus(eId);
      setSubmissionMatrix(matrix);
    } catch (err) {
      console.warn('Error fetching matrix for exam', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const toggleClassAccordion = (classKey: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classKey]: !prev[classKey],
    }));
  };

  const handlePublishClass = async (classId: string, sectionId: string, publish: boolean) => {
    if (!selectedAuditExamId) return;
    const key = `${classId}_${sectionId}`;
    setPublishingClassKey(key);
    try {
      await publishExamResults({
        examId: selectedAuditExamId,
        classId,
        sectionId,
        isPublished: publish,
      });
      setPublishFeedback(publish ? '✅ कक्षा परिणाम सफलतापूर्वक जारी (Publish) किया गया!' : '⚠️ कक्षा परिणाम अप्रकाशित (Unpublished) किया गया।');
      setTimeout(() => setPublishFeedback(null), 3500);
      const matrix = await fetchExamSubmissionStatus(selectedAuditExamId);
      setSubmissionMatrix(matrix);
    } catch (err: any) {
      alert(err.message || 'त्रुटि: परिणाम जारी करने में समस्या आई');
    } finally {
      setPublishingClassKey(null);
    }
  };

  const handlePublishEntireExam = async (publish: boolean) => {
    if (!selectedAuditExamId) return;
    if (publish) {
      const hasPending = (submissionMatrix?.summary?.totalPendingSheets || 0) > 0;
      const confirmMsg = hasPending
        ? `⚠️ ध्यान दें: अभी भी ${submissionMatrix?.summary?.totalPendingSheets} विषयों के अंक शिक्षकों द्वारा दर्ज नहीं किए गए हैं।\n\nक्या आप फिर भी सभी कक्षाओं का परिणाम प्रकाशित (Publish) करना चाहते हैं?`
        : 'क्या आप संपूर्ण विद्यालय के लिए इस परीक्षा का अंतिम परिणाम घोषित (Publish) करना चाहते हैं? सभी छात्र/अभिभावक तुरंत अपनी अंकतालिका देख सकेंगे।';
      if (!confirm(confirmMsg)) return;
    }
    setIsPublishingAll(true);
    try {
      await publishExamResults({
        examId: selectedAuditExamId,
        isPublished: publish,
      });
      setPublishFeedback(publish ? '🎉 संपूर्ण विद्यालय के परीक्षा परिणाम सफलतापूर्वक प्रकाशित हो चुके हैं!' : '⚠️ सभी कक्षाओं के परिणाम अप्रकाशित (Withheld) किए गए।');
      setTimeout(() => setPublishFeedback(null), 4000);
      const matrix = await fetchExamSubmissionStatus(selectedAuditExamId);
      setSubmissionMatrix(matrix);
    } catch (err: any) {
      alert(err.message || 'त्रुटि: परिणाम प्रकाशित करने में समस्या आई');
    } finally {
      setIsPublishingAll(false);
    }
  };

  const handleSendReminder = async (teacherId: string, subjectName: string, className: string) => {
    if (!selectedAuditExamId || !teacherId) {
      alert('इस विषय के लिए कोई शिक्षक आवंटित नहीं है।');
      return;
    }
    const currentExam = examList.find((e) => e.id === selectedAuditExamId);
    const key = `${teacherId}_${subjectName}`;
    setRemindingTeacherKey(key);
    try {
      await sendMarksSubmissionReminder({
        teacherId,
        subjectName,
        className,
        examName: currentExam?.name || 'Examination',
      });
      alert(`🔔 शिक्षक को ${className} - ${subjectName} के अंक शीघ्र दर्ज करने हेतु स्मरण पत्र (Reminder Notification) भेज दिया गया है।`);
    } catch (err: any) {
      alert(err.message || 'स्मरण पत्र भेजने में त्रुटि');
    } finally {
      setRemindingTeacherKey(null);
    }
  };

  // Load all live data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stuRes, clsRes, staffRes, payRes, feeRes, leavesRes, noticesRes, parentsRes] = await Promise.all([
        fetchLiveStudents(),
        fetchLiveClasses(),
        fetchStaffMembers(),
        fetchFeePayments(),
        fetchFeeStructures(),
        fetchStaffLeaves(),
        fetchLiveNotices(),
        fetchParents(),
      ]);

      setStudents(stuRes || []);
      setClassesData(clsRes || { classes: [], sections: [] });
      setStaffList(staffRes || []);
      setPayments(payRes || []);
      setFeeStructures(feeRes || []);
      setLeaves(leavesRes || []);
      setNotices(noticesRes || []);
      setParents(parentsRes || []);

      if (clsRes?.classes?.length > 0 && !newStudent.classId) {
        const firstCId = clsRes.classes[0].id;
        const firstSec = (clsRes.sections || []).find((s: any) => s.classId === firstCId)?.id || clsRes.sections?.[0]?.id || 'sec-a';
        setNewStudent((prev) => ({
          ...prev,
          classId: firstCId,
          sectionId: firstSec,
        }));
      }
    } catch (err) {
      console.warn('PrincipalView load data error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (currentTab === 'exams') {
      loadExamAuditData();
    }
  }, [currentTab]);

  // Total fees collected sum
  const totalFeesCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

  // Handle Add Student
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.admissionNo || !newStudent.classId) {
      alert('Please fill Admission No, First Name, and select a Class.');
      return;
    }
    setEnrolling(true);
    try {
      const res = await createStudent({
        ...newStudent,
        rollNo: newStudent.rollNo ? parseInt(newStudent.rollNo) : undefined,
        sectionId: newStudent.sectionId || classesData.sections?.[0]?.id || 'sec-a',
      });

      setShowAddStudent(false);
      const initialClassId = classesData.classes?.[0]?.id || '';
      const initialSectionId = (classesData.sections || []).find((s: any) => s.classId === initialClassId)?.id || classesData.sections?.[0]?.id || 'sec-a';
      setNewStudent({
        admissionNo: '',
        rollNo: '',
        firstName: '',
        lastName: '',
        classId: initialClassId,
        sectionId: initialSectionId,
        gender: 'Male',
        fatherName: '',
        motherName: '',
        primaryPhone: '',
        emergencyPhone: '',
        address: '',
        photoUrl: '',
      });

      if (res.parentCredentials) {
        setCreatedParentCreds(res.parentCredentials);
      } else {
        alert('✅ Student enrolled successfully!');
      }

      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error enrolling student');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}" from school records?`)) return;
    try {
      await deleteStudent(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove student');
    }
  };

  // Handle Add Staff
  const handleRecruitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      alert('Please enter Name, Email, and Password.');
      return;
    }
    setRecruiting(true);
    try {
      await createStaffMember(newStaff);
      setShowAddStaff(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'teacher', password: '' });
      alert('✅ Staff member recruited successfully!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recruiting staff');
    } finally {
      setRecruiting(false);
    }
  };

  // Handle Deactivate Staff
  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate staff member "${name}"?`)) return;
    try {
      await deleteStaffMember(staffId);
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? { ...s, isActive: 0 } : s)));
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff');
    }
  };

  // Handle Collect Fee
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.studentId || !feeForm.amountPaid) {
      alert('Please select a student and enter amount.');
      return;
    }
    setCollecting(true);
    try {
      const selectedStruct = feeStructures[0]?.id || 'struct-general';
      const res = await collectFeePayment({
        studentId: feeForm.studentId,
        feeStructureId: feeForm.feeStructureId || selectedStruct,
        amountPaid: parseFloat(feeForm.amountPaid),
        paymentMode: feeForm.paymentMode,
        remarks: feeForm.remarks,
      });

      setShowCollectFee(false);
      setLatestReceipt(res.payment);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Error recording fee payment');
    } finally {
      setCollecting(false);
    }
  };

  // Handle Review Leave
  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingLeaveId(leaveId);
    try {
      await reviewStaffLeave(leaveId, {
        status,
        reviewRemarks: status === 'APPROVED' ? 'Approved by Principal via Mobile App' : 'Declined per academic schedule',
      });
      const updated = await fetchStaffLeaves();
      setLeaves(updated || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update leave.');
    } finally {
      setReviewingLeaveId(null);
    }
  };

  // Handle Broadcast Notice
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSendingNotice(true);
    try {
      await broadcastLiveNotice(broadcastTitle.trim() || 'School Circular', broadcastMessage.trim());
      setNoticeSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setNoticeSuccess(false), 5000);
      const updated = await fetchLiveNotices();
      setNotices(updated || []);
    } catch (err: any) {
      alert(err.message || 'Notice broadcast failed.');
    } finally {
      setSendingNotice(false);
    }
  };

  // Copy Parent Credentials to Clipboard for WhatsApp/SMS
  const copyParentCredentials = () => {
    if (!createdParentCreds) return;
    const text = `🎉 Welcome to ${school.name}!\n\nYour Parent Portal & Mobile App login credentials:\n📱 Login ID (Mobile): ${createdParentCreds.loginId}\n🔑 Password: ${createdParentCreds.password}\n👨‍👩‍👧 Parent: ${createdParentCreds.parentName}\n🎓 Student: ${createdParentCreds.studentName}\n\nDownload the App or login at the School Portal to track daily attendance, report cards, and fee receipts.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  // Copy School PC Sync Key
  const copySyncKey = () => {
    if (school.apiSyncKey) {
      navigator.clipboard.writeText(school.apiSyncKey);
      setCopiedSyncKey(true);
      setTimeout(() => setCopiedSyncKey(false), 2500);
    }
  };

  // Copy Parent Credentials to Clipboard for WhatsApp/SMS
  const copyParentLogin = (parent: ParentInfo) => {
    const firstChild = parent.children?.[0];
    const text = `🎉 Welcome to ${school.name}!\n\nYour Parent Portal & Mobile App login credentials:\n📱 Login ID (Mobile): ${parent.phone}\n🔑 Password: ${parent.autoPasswordPreview || 'School@123'}\n👨‍👩‍👧 Parent: ${parent.name}\n${firstChild ? `🎓 Student: ${firstChild.name} (${firstChild.admissionNo || ''})\n` : ''}\nLogin here or download the app: https://mitra-erp.pages.dev`;
    navigator.clipboard.writeText(text);
    setCopiedParentId(parent.id);
    setTimeout(() => setCopiedParentId(null), 3000);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchQuery =
      !q ||
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.fatherName?.toLowerCase().includes(q);
    const matchClass = !classFilter || s.className?.includes(classFilter) || (s as any).classId === classFilter;
    return matchQuery && matchClass;
  });

  // Filter parents
  const filteredParents = parents.filter((p) => {
    const q = parentSearch.toLowerCase();
    if (!q) return true;
    const matchName = p.name?.toLowerCase().includes(q) || p.fatherName?.toLowerCase().includes(q) || p.motherName?.toLowerCase().includes(q);
    const matchPhone = p.phone?.includes(q) || p.loginId?.includes(q);
    const matchChild = p.children?.some(
      (c) => c.name?.toLowerCase().includes(q) || c.admissionNo?.toLowerCase().includes(q)
    );
    return matchName || matchPhone || matchChild;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Principal Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 shadow-sm">
              Executive Principal & Accounts Desk
            </span>
            <h2 className="font-black text-lg mt-1 text-white">{principal.name}</h2>
            <p className="text-xs text-purple-200">
              {school.name} <span className="font-mono text-amber-300">({school.code})</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="grid grid-cols-7 gap-1 mt-3.5 pt-3 border-t border-white/10 text-[9px] font-bold">
          <button
            onClick={() => setTab('overview')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'overview' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('students')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'students' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setTab('parents')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'parents' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Parents
          </button>
          <button
            onClick={() => setTab('staff')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'staff' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => setTab('fees')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'fees' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Fees
          </button>
          <button
            onClick={() => setTab('operations')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'operations' ? 'bg-white text-purple-900 shadow' : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            Circulars
          </button>
          <button
            onClick={() => setTab('exams')}
            className={`py-1.5 px-0.5 rounded-xl transition text-center ${
              currentTab === 'exams' ? 'bg-white text-purple-900 shadow font-extrabold' : 'text-amber-300 hover:bg-white/10'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-3">
          {/* Dynamic Live Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => setTab('students')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-300 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500">Enrolled Students</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? '...' : students.length}
              </p>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>Live in database</span>
              </span>
            </div>

            <div
              onClick={() => setTab('parents')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-300 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500">Registered Parents</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? '...' : parents.length}
              </p>
              <span className="text-[10px] font-semibold text-purple-600 flex items-center space-x-1 mt-0.5">
                <Shield className="w-3 h-3" />
                <span>Dedicated Directory</span>
              </span>
            </div>

            <div
              onClick={() => setTab('staff')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-300 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500">Active Faculty</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {loading ? '...' : staffList.filter((s) => s.isActive).length}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">Teachers & Support Staff</span>
            </div>

            <div
              onClick={() => setTab('fees')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-300 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500">Fees Collected</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-700">
                ₹{totalFeesCollected.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {payments.length} verified receipts
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2.5">
              Quick Institutional Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setTab('students');
                  setShowAddStudent(true);
                }}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs flex items-center space-x-2 transition"
              >
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>+ Enroll Student</span>
              </button>

              <button
                onClick={() => {
                  setTab('staff');
                  setShowAddStaff(true);
                }}
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs flex items-center space-x-2 transition"
              >
                <Briefcase className="w-4 h-4 text-indigo-700" />
                <span>+ Recruit Faculty</span>
              </button>

              <button
                onClick={() => {
                  setTab('fees');
                  setShowCollectFee(true);
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center space-x-2 transition"
              >
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>Collect Fee</span>
              </button>

              <button
                onClick={() => setTab('operations')}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center space-x-2 transition"
              >
                <Radio className="w-4 h-4 text-amber-700" />
                <span>Circulars ({notices.length})</span>
              </button>

              <button
                onClick={() => setTab('exams')}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-300 font-bold text-xs flex items-center space-x-2 transition col-span-2 shadow-sm"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Exam Results & Marks Audit Desk (परीक्षा व अंक नियंत्रण)</span>
              </button>

              <button
                onClick={() => setShowFleetTracking(true)}
                className="p-2.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-300 font-bold text-xs flex items-center space-x-2 transition col-span-2 shadow-sm"
              >
                <Bus className="w-4 h-4 text-amber-600" />
                <span>Live Bus Fleet Tracking (बस लाइव ट्रैकिंग)</span>
              </button>
            </div>
          </div>

          {/* PC Secondary DB Sync Key */}
          {school.apiSyncKey && (
            <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-sm space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Local PC Sync Token</span>
                </div>
                <button
                  onClick={copySyncKey}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-300 text-[10px] font-extrabold rounded-lg flex items-center space-x-1 transition"
                >
                  {copiedSyncKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSyncKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
              <p className="text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded-lg break-all">
                {school.apiSyncKey}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS HUB */}
      {currentTab === 'students' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Enrolled Students ({students.length})</span>
            </h3>
            <button
              onClick={() => setShowAddStudent(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          </div>

          {/* Search & Class Filter */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search name, admission #..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="">All Classes</option>
              {classesData.classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Students List */}
          <div className="space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border">
                {loading ? 'Loading school records...' : 'No students found matching filters.'}
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={s.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={s.firstName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-slate-900 font-bold">
                          {s.firstName} {s.lastName}
                        </strong>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800">
                          {s.className} - {s.sectionName || 'A'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Adm: <span className="font-mono text-slate-600">{s.admissionNo}</span>
                        {s.rollNo ? ` • Roll #${s.rollNo}` : ''}
                      </p>
                      {s.parentPhone && (
                        <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>Parent: {s.parentPhone} ({s.fatherName || 'Guardian'})</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStudent(s.id, `${s.firstName} ${s.lastName}`)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remove Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: PARENTS & GUARDIANS DIRECTORY */}
      {currentTab === 'parents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Parents Directory ({parents.length})</span>
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Auto-Synced
            </span>
          </div>

          {/* Info note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-start space-x-2 shadow-sm">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Dedicated Parent Directory:</strong> When students are enrolled, parent portal accounts are auto-created. Parents login with their mobile number and auto-generated password (First 4 letters of name + Last 4 digits of mobile).
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parent name, mobile, or student..."
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Parents List */}
          <div className="space-y-2">
            {filteredParents.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border">
                {loading ? 'Loading parents directory...' : 'No parents found matching search.'}
              </div>
            ) : (
              filteredParents.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-900 font-bold text-sm">{p.name}</strong>
                        {p.appInstalled === 1 ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-black uppercase">
                            App Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600 font-medium">
                            Not Installed
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${p.phone}`}
                        className="text-[11px] text-purple-700 font-bold flex items-center space-x-1 mt-0.5 hover:underline"
                      >
                        <Phone className="w-3 h-3 text-purple-600" />
                        <span>{p.phone}</span>
                      </a>
                    </div>

                    <button
                      onClick={() => copyParentLogin(p)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 border transition shadow-sm ${
                        copiedParentId === p.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                      title="Copy login credentials"
                    >
                      {copiedParentId === p.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-purple-600" />
                          <span>Share Login</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Linked Wards / Children */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                      Linked Children ({p.children?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.children && p.children.length > 0 ? (
                        p.children.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold"
                          >
                            <GraduationCap className="w-3 h-3 text-purple-600" />
                            <span>{c.name}</span>
                            <span className="text-[9px] font-mono text-purple-600">({c.admissionNo})</span>
                            {c.className && <span className="text-slate-400">• {c.className}</span>}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No student linked</span>
                      )}
                    </div>
                  </div>

                  {/* Password Formula Box */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Auto Password:</span>
                    <span className="font-mono font-black text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                      {p.autoPasswordPreview || 'School@123'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF & FACULTY */}
      {currentTab === 'staff' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>School Staff & Faculty ({staffList.length})</span>
            </h3>
            <button
              onClick={() => setShowAddStaff(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Recruit Staff</span>
            </button>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-xs text-purple-900 flex items-center justify-between">
            <span className="text-[11px]">
              Showing teachers and office staff only. Parents are in the <strong>Parents Directory</strong>.
            </span>
            <button
              onClick={() => setTab('parents')}
              className="text-[10px] font-black text-purple-700 underline shrink-0 ml-2"
            >
              View Parents
            </button>
          </div>

          <div className="space-y-2">
            {staffList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border">
                {loading ? 'Loading staff directory...' : 'No staff members recorded yet.'}
              </div>
            ) : (
              staffList.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <strong className="text-slate-900 font-bold">{m.name}</strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          m.role === 'principal'
                            ? 'bg-amber-100 text-amber-900'
                            : m.role === 'teacher'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {m.role}
                      </span>
                      {!m.isActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-100 text-rose-800 font-bold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{m.email}</span>
                    </p>
                    {m.phone && (
                      <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{m.phone}</span>
                      </p>
                    )}
                  </div>

                  {m.role !== 'principal' && m.isActive === 1 && (
                    <button
                      onClick={() => handleDeleteStaff(m.id, m.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Deactivate Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FEES & ACCOUNTS */}
      {currentTab === 'fees' && (
        <div className="space-y-3">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 text-emerald-100">
                Institutional Fee Desk
              </span>
              <h2 className="text-2xl font-black mt-1">₹{totalFeesCollected.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-emerald-200">
                {payments.length} verified collections recorded
              </p>
            </div>
            <button
              onClick={() => setShowCollectFee(true)}
              className="px-3.5 py-2 bg-white text-emerald-900 font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Collect Fee</span>
            </button>
          </div>

          {latestReceipt && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-start justify-between shadow-sm">
              <div>
                <div className="flex items-center space-x-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fee Collection Receipt Generated</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Receipt No: <span className="font-mono font-bold">{latestReceipt.receiptNo}</span> • Amount:{' '}
                  <strong>₹{latestReceipt.amountPaid}</strong>
                </p>
              </div>
              <button
                onClick={() => setLatestReceipt(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Payments list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Recent Fee Payments ({payments.length})
            </h4>
            {payments.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs border">
                No fee collection transactions yet.
              </div>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-slate-900 font-bold block">{p.studentName || 'Student'}</strong>
                    <span className="text-[10px] text-slate-400">
                      {p.feeTitle || 'Tuition Fee'} • Receipt: <span className="font-mono">{p.receiptNo}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {p.paymentDate} • Mode: <span className="font-bold uppercase">{p.paymentMode}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700 block">
                      ₹{p.amountPaid.toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONS (CIRCULARS & LEAVES) */}
      {currentTab === 'operations' && (
        <div className="space-y-4">
          {/* Broadcast Form */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 mb-2">
              <BellRing className="w-4 h-4 text-purple-600" />
              <span>Broadcast School Circular</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Dispatches instant push alerts directly to parent and teacher mobile apps.
            </p>

            {noticeSuccess && (
              <div className="p-3 mb-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Circular broadcasted to all parents and staff successfully!</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-2.5">
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Notice Subject (e.g. Annual Sports Meet 2026)"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none font-bold"
              />

              <textarea
                rows={3}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type circular announcement details here..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />

              <button
                type="submit"
                disabled={sendingNotice}
                className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:from-purple-800 hover:to-indigo-900 active:scale-98 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Radio className="w-4 h-4" />
                <span>{sendingNotice ? 'Broadcasting...' : 'Broadcast to All Apps'}</span>
              </button>
            </form>
          </div>

          {/* Faculty Leave Requests */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>Faculty Leave Requests ({leaves.length})</span>
              </h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                1-Tap Decision
              </span>
            </div>

            <div className="space-y-2">
              {leaves.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No leave applications currently awaiting decision.
                </div>
              ) : (
                leaves.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 block">{l.staffName || 'Faculty Member'}</strong>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {l.leaveType} LEAVE • {l.totalDays} Days
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">{l.reason}</p>
                    <p className="text-[10px] text-slate-400">
                      Duration: {l.startDate} to {l.endDate}
                    </p>

                    {l.status === 'PENDING' && (
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200">
                        <button
                          disabled={reviewingLeaveId === l.id}
                          onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                          className="flex-1 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={reviewingLeaveId === l.id}
                          onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                          className="flex-1 py-1.5 bg-rose-600 active:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1 shadow-sm disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: EXAMS AUDIT & RESULTS PUBLISHING DESK */}
      {currentTab === 'exams' && (
        <div className="space-y-4">
          {/* Notification Feedback Toast */}
          {publishFeedback && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-2 text-xs font-bold animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{publishFeedback}</span>
            </div>
          )}

          {/* Exam Selector & Control Header */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Exam Results & Marks Audit Desk</h3>
                  <p className="text-[10px] text-slate-500">परीक्षा व अंक नियंत्रण • कक्षा व विषयवार निगरानी</p>
                </div>
              </div>
              <button
                onClick={() => loadExamAuditData(selectedAuditExamId)}
                disabled={loadingMatrix}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition disabled:opacity-50"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMatrix ? 'animate-spin text-purple-600' : ''}`} />
                <span className="hidden sm:inline text-[11px]">Refresh</span>
              </button>
            </div>

            {/* Exam Dropdown Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Select Examination (परीक्षा चुनें)
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedAuditExamId}
                  onChange={(e) => handleAuditExamChange(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {examList.length === 0 ? (
                    <option value="">No examinations created</option>
                  ) : (
                    examList.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.examType?.toUpperCase()} • {ex.academicYear || '2026-2027'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {loadingMatrix ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Scanning School Marksheets & Submissions...</p>
              <p className="text-[10px] text-slate-400">सभी कक्षाओं और विषयों के अंक तालिकाओं का मिलान किया जा रहा है...</p>
            </div>
          ) : !submissionMatrix ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-xs">No Exam Selected or Configured</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                कृपया ऊपर दी गई सूची से परीक्षा का चयन करें या विद्यालय में नई परीक्षा बनाएं।
              </p>
            </div>
          ) : (
            <>
              {/* School-Wide Audit Meter & Publishing Card */}
              <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white rounded-2xl p-4 shadow-xl border border-purple-800/40 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-purple-950 text-[10px] font-black uppercase tracking-wider">
                      Overall School Readiness
                    </span>
                    <h3 className="text-base font-black mt-1 text-white">
                      {submissionMatrix.exam.name}
                    </h3>
                    <p className="text-xs text-purple-200">
                      Academic Year: <span className="font-bold text-white">{submissionMatrix.exam.academicYear}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-300">
                      {submissionMatrix.summary.overallCompletionPercentage}%
                    </span>
                    <span className="text-[10px] text-purple-200 block font-semibold">Marks Entered</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      submissionMatrix.summary.overallCompletionPercentage === 100
                        ? 'bg-emerald-400'
                        : submissionMatrix.summary.overallCompletionPercentage >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${submissionMatrix.summary.overallCompletionPercentage}%` }}
                  />
                </div>

                {/* Metrics 4-Box Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] uppercase font-bold text-purple-200 block">Total Classes</span>
                    <span className="font-black text-sm text-white">{submissionMatrix.summary.totalClasses}</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] uppercase font-bold text-purple-200 block">Submitted</span>
                    <span className="font-black text-sm text-emerald-400">
                      {submissionMatrix.summary.totalSubmittedSheets}
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] uppercase font-bold text-purple-200 block">Pending</span>
                    <span className={`font-black text-sm ${submissionMatrix.summary.totalPendingSheets > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-300'}`}>
                      {submissionMatrix.summary.totalPendingSheets}
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2">
                    <span className="text-[9px] uppercase font-bold text-purple-200 block">Published</span>
                    <span className="font-black text-sm text-amber-300">
                      {submissionMatrix.summary.publishedClasses} / {submissionMatrix.summary.totalClasses}
                    </span>
                  </div>
                </div>

                {/* Master Publishing Buttons */}
                <div className="pt-2 border-t border-white/10 flex items-center space-x-2">
                  <button
                    onClick={() => handlePublishEntireExam(true)}
                    disabled={isPublishingAll}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>
                      {isPublishingAll ? 'Publishing Results...' : 'Publish Entire Exam Results (सभी परिणाम जारी करें)'}
                    </span>
                  </button>

                  {submissionMatrix.summary.isExamPublished && (
                    <button
                      onClick={() => handlePublishEntireExam(false)}
                      disabled={isPublishingAll}
                      className="py-2.5 px-3 bg-rose-600/80 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition disabled:opacity-50 flex items-center space-x-1"
                      title="Unpublish entire exam"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Unpublish All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Class-Wise Marksheets Audit Accordion List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>Class-wise Audit Matrix (कक्षावार विवरण)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    {submissionMatrix.classes.length} Classes Audited
                  </span>
                </div>

                {submissionMatrix.classes.map((cls) => {
                  const classKey = `${cls.classId}_${cls.sectionId}`;
                  const isExpanded = !!expandedClasses[classKey];
                  const isPublishingThis = publishingClassKey === classKey;

                  return (
                    <div
                      key={classKey}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
                    >
                      {/* Accordion Class Header */}
                      <div
                        onClick={() => toggleClassAccordion(classKey)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 select-none transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              cls.isClassReady
                                ? 'bg-emerald-100 text-emerald-800'
                                : cls.completionPercentage > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {cls.className.replace(/class/i, '').trim()}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-black text-sm text-slate-900">{cls.classLabel}</h5>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({cls.totalStudents} Students)
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 mt-0.5">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  cls.isClassReady
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {cls.submittedSubjects}/{cls.totalSubjects} Subjects Graded ({cls.completionPercentage}%)
                              </span>

                              {cls.isClassPublished ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white flex items-center space-x-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  Unpublished
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Class Action & Expand Toggle */}
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handlePublishClass(cls.classId, cls.sectionId, !cls.isClassPublished)}
                            disabled={isPublishingThis}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition active:scale-95 disabled:opacity-50 ${
                              cls.isClassPublished
                                ? 'bg-slate-100 hover:bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-purple-700 hover:bg-purple-800 text-white'
                            }`}
                          >
                            {cls.isClassPublished ? (
                              <>
                                <X className="w-3 h-3 text-rose-600" />
                                <span className="text-[11px]">Unpublish</span>
                              </>
                            ) : (
                              <>
                                <FileCheck className="w-3.5 h-3.5 text-amber-300" />
                                <span className="text-[11px]">Publish Class</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => toggleClassAccordion(classKey)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Body: Subjects Matrix */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-3 space-y-2">
                          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 px-1">
                            Subject Marks Submission Details (विषयवार अंक स्थिति)
                          </div>

                          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {cls.subjects.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No subjects mapped to this class.
                              </div>
                            ) : (
                              cls.subjects.map((sub) => {
                                const teacherKey = `${sub.teacherId}_${sub.subjectName}`;
                                const isReminding = remindingTeacherKey === teacherKey;

                                return (
                                  <div
                                    key={sub.subjectId}
                                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-xs text-slate-900">
                                          {sub.subjectName}
                                        </span>
                                        {sub.subjectCode && (
                                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                            {sub.subjectCode}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                        <span>Teacher:</span>
                                        <strong className="text-slate-700">
                                          {sub.teacherName || 'Not Assigned (अनावंटित)'}
                                        </strong>
                                      </div>

                                      {sub.lastUpdated && (
                                        <span className="text-[9px] text-slate-400 block">
                                          अंतिम अपडेट: {new Date(sub.lastUpdated).toLocaleDateString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>

                                    {/* Status & Reminder Button */}
                                    <div className="flex items-center space-x-3 text-right">
                                      {sub.status === 'SUBMITTED' ? (
                                        <div className="space-y-0.5">
                                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Graded ({sub.gradedCount}/{sub.totalStudents})</span>
                                          </span>
                                          <div className="text-[10px] text-slate-500 font-semibold">
                                            Avg: <strong className="text-purple-700">{sub.averagePercentage}%</strong> • Max: {sub.maxMarks}
                                          </div>
                                        </div>
                                      ) : sub.status === 'PARTIAL' ? (
                                        <div className="space-y-1">
                                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                                            <span>Partial ({sub.gradedCount}/{sub.totalStudents})</span>
                                          </span>
                                          {sub.teacherId && (
                                            <button
                                              onClick={() => handleSendReminder(sub.teacherId!, sub.subjectName, cls.classLabel)}
                                              disabled={isReminding}
                                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center space-x-1 transition disabled:opacity-50"
                                            >
                                              <BellRing className="w-3 h-3" />
                                              <span>{isReminding ? 'Sending...' : 'Remind Teacher'}</span>
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                                            <AlertCircle className="w-3 h-3 text-rose-600" />
                                            <span>Pending (बाकी)</span>
                                          </span>

                                          {sub.teacherId ? (
                                            <button
                                              onClick={() => handleSendReminder(sub.teacherId!, sub.subjectName, cls.classLabel)}
                                              disabled={isReminding}
                                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center space-x-1 transition disabled:opacity-50"
                                            >
                                              <BellRing className="w-3 h-3" />
                                              <span>{isReminding ? 'Sending...' : 'Remind (याद दिलाएं)'}</span>
                                            </button>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 italic">No Teacher</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: ENROLL STUDENT */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">New Student Admission</h3>
                <p className="text-xs text-purple-700 font-semibold">Auto-generates Parent App Credentials</p>
              </div>
              <button
                onClick={() => setShowAddStudent(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="space-y-3 text-xs">
              {/* Student Photo Picker */}
              <div className="flex items-center space-x-3 p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                <div className="relative">
                  <img
                    src={newStudent.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                    alt="Student Preview"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-300 shadow-sm bg-purple-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-bold text-slate-800 text-xs block mb-0.5">Student Photograph</label>
                  <p className="text-[10px] text-slate-500 mb-1.5">Upload student passport photo from device</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewStudent({ ...newStudent, photoUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-purple-700 file:text-white hover:file:bg-purple-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Admission No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM-2026-01"
                    value={newStudent.admissionNo}
                    onChange={(e) => setNewStudent({ ...newStudent, admissionNo: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Roll No</label>
                  <input
                    type="number"
                    placeholder="e.g. 101"
                    value={newStudent.rollNo}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Student's first name"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Surname"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Class *</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const validSecs = (classesData?.sections || []).filter((s: any) => s.classId === cId);
                      setNewStudent({
                        ...newStudent,
                        classId: cId,
                        sectionId: validSecs[0]?.id || 'sec-a',
                      });
                    }}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                  >
                    {classesData.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Section</label>
                  <select
                    value={newStudent.sectionId}
                    onChange={(e) => setNewStudent({ ...newStudent, sectionId: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                  >
                    {((classesData?.sections || []).filter((s: any) => !newStudent.classId || s.classId === newStudent.classId)).length > 0 ? (
                      (classesData?.sections || [])
                        .filter((s: any) => !newStudent.classId || s.classId === newStudent.classId)
                        .map((s: any) => (
                          <option key={s.id} value={s.id}>
                            Section {s.name}
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="sec-a">Section A</option>
                        <option value="sec-b">Section B</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Parent Mobile (App Login ID) *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={newStudent.primaryPhone}
                  onChange={(e) => setNewStudent({ ...newStudent, primaryPhone: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Father's Name</label>
                  <input
                    type="text"
                    placeholder="Father Name"
                    value={newStudent.fatherName}
                    onChange={(e) => setNewStudent({ ...newStudent, fatherName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Mother's Name</label>
                  <input
                    type="text"
                    placeholder="Mother Name"
                    value={newStudent.motherName}
                    onChange={(e) => setNewStudent({ ...newStudent, motherName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={enrolling}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>{enrolling ? 'Enrolling & Creating Account...' : 'Admit Student & Generate Credentials'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AUTO-GENERATED PARENT CREDENTIALS */}
      {createdParentCreds && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border border-purple-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">Student Enrolled Successfully!</h3>
              <p className="text-xs text-slate-500">
                Parent login credentials auto-generated per formula.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">Parent Name:</span>
                <strong className="text-slate-900">{createdParentCreds.parentName}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <strong className="text-slate-900">{createdParentCreds.studentName}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="text-slate-500 font-medium">Login Mobile:</span>
                <strong className="text-purple-900 font-mono text-sm">{createdParentCreds.loginId}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Auto Password:</span>
                <strong className="text-emerald-700 font-mono text-sm font-black tracking-wider">
                  {createdParentCreds.password}
                </strong>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={copyParentCredentials}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center space-x-2 transition"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials for WhatsApp'}</span>
              </button>
              <button
                onClick={() => setCreatedParentCreds(null)}
                className="w-full py-2 text-slate-500 font-bold text-xs hover:text-slate-800"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECRUIT STAFF */}
      {showAddStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Recruit Faculty / Staff</h3>
                <p className="text-xs text-slate-500">Assign Teacher or Support Staff roles</p>
              </div>
              <button onClick={() => setShowAddStaff(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecruitStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meenakshi Sharma"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. meenakshi@school.edu"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Role *</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="staff">Support Staff</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Faculty@123"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={recruiting}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-4"
              >
                <Briefcase className="w-4 h-4" />
                <span>{recruiting ? 'Saving...' : 'Register Staff Member'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: COLLECT FEE */}
      {showCollectFee && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Collect Fee Payment</h3>
                <p className="text-xs text-emerald-700 font-semibold">Generates official verified receipt</p>
              </div>
              <button onClick={() => setShowCollectFee(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectFee} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Select Student *</label>
                <div className="relative mb-1.5">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student by name or admission #..."
                    value={feeStudentFilter}
                    onChange={(e) => setFeeStudentFilter(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 border rounded-xl bg-slate-50 text-xs focus:bg-white"
                  />
                </div>
                <select
                  required
                  value={feeForm.studentId}
                  onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                >
                  <option value="">-- Select Enrolled Student --</option>
                  {students
                    .filter((s) => {
                      if (!feeStudentFilter.trim()) return true;
                      const q = feeStudentFilter.toLowerCase().trim();
                      return (
                        `${s.firstName} ${s.lastName || ''}`.toLowerCase().includes(q) ||
                        String(s.admissionNo || '').toLowerCase().includes(q) ||
                        String(s.className || '').toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName || ''} ({s.className || 'Class'} - {s.admissionNo})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="15000"
                    value={feeForm.amountPaid}
                    onChange={(e) => setFeeForm({ ...feeForm, amountPaid: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Payment Mode *</label>
                  <select
                    value={feeForm.paymentMode}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="cash">Cash Desk</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="cheque">Cheque / DD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Tuition & Lab Fee"
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={collecting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 mt-4"
              >
                <Receipt className="w-4 h-4" />
                <span>{collecting ? 'Processing...' : 'Record Payment & Generate Receipt'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Institutional Fleet Live Map Modal */}
      {showFleetTracking && (
        <LiveBusMapModal
          isFleetView={true}
          onClose={() => setShowFleetTracking(false)}
        />
      )}
    </div>
  );
};
