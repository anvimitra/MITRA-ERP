import { School, User, Student, AttendanceRecord, ExamReport, FeeItem, NotificationItem, AppUpdateInfo, TimetablePeriod, StudentLog, CertificateItem, StudentTransportItem, LibraryIssueItem, StaffLeaveItem } from './types';

// Dynamic API Base URL detection
export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem('anvimitra_api_url');
  if (customUrl) return customUrl;

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
    return 'https://anvimitra-erp.onrender.com/api';
  }

  return 'http://localhost:4000/api';
}

export function getMobileToken(): string | null {
  return localStorage.getItem('anvimitra_mobile_token');
}

export function setMobileToken(token: string | null) {
  if (token) {
    localStorage.setItem('anvimitra_mobile_token', token);
  } else {
    localStorage.removeItem('anvimitra_mobile_token');
  }
}

// Default LSK Academy School Data
export const LSK_SCHOOL_DEFAULT: School = {
  id: 'school-lsk-01',
  code: 'LSK01',
  name: 'LSK Academy',
  domain: 'lsk.anvimitra.com',
  logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150',
  primaryColor: '#7c3aed',
  secondaryColor: '#4c1d95',
  phone: '+91 99887 76655',
  email: 'info@lskacademy.edu',
  address: '42-B, Shivaji Nagar, Bhopal, M.P.',
  affiliationNo: 'CBSE/AFF/1032890',
  principalName: 'Dr. Meena Joshi',
  city: 'Bhopal',
  state: 'Madhya Pradesh',
  pincode: '462016',
};

export const DEFAULT_STUDENT: Student = {
  id: 'lsk-stu-aryan-01',
  admissionNo: 'LSK/2026/2001',
  rollNo: 1,
  firstName: 'Aryan',
  lastName: 'Mishra',
  className: 'Class 8',
  sectionName: 'A',
  bloodGroup: 'A+',
  photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  fatherName: 'Mr. Rohit Mishra',
  motherName: 'Mrs. Anita Mishra',
  parentPhone: '+91 98333 44556',
};

export const DEFAULT_STUDENTS_LIST: Student[] = [
  DEFAULT_STUDENT,
  {
    id: 'lsk-stu-zara-02',
    admissionNo: 'LSK/2026/2002',
    rollNo: 2,
    firstName: 'Zara',
    lastName: 'Shaikh',
    className: 'Class 8',
    sectionName: 'A',
    bloodGroup: 'B+',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    fatherName: 'Mr. Imran Shaikh',
    motherName: 'Mrs. Farida Shaikh',
    parentPhone: '+91 98444 55667',
  },
  {
    id: 'lsk-stu-dev-03',
    admissionNo: 'LSK/2026/2003',
    rollNo: 3,
    firstName: 'Dev',
    lastName: 'Tiwari',
    className: 'Class 8',
    sectionName: 'A',
    bloodGroup: 'O+',
    photoUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150',
  },
  {
    id: 'lsk-stu-ish-04',
    admissionNo: 'LSK/2026/2004',
    rollNo: 4,
    firstName: 'Ishita',
    lastName: 'Rai',
    className: 'Class 8',
    sectionName: 'A',
    bloodGroup: 'AB+',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', date: '2026-09-08', status: 'present', remarks: 'On time' },
  { id: '2', date: '2026-09-07', status: 'present', remarks: 'On time' },
  { id: '3', date: '2026-09-06', status: 'present', remarks: 'On time' },
  { id: '4', date: '2026-09-05', status: 'late', remarks: 'Heavy traffic delay' },
  { id: '5', date: '2026-09-04', status: 'present', remarks: 'On time' },
  { id: '6', date: '2026-09-03', status: 'present', remarks: 'On time' },
  { id: '7', date: '2026-09-02', status: 'absent', remarks: 'Fever sick leave' },
  { id: '8', date: '2026-09-01', status: 'present', remarks: 'On time' },
];

export const MOCK_REPORTS: Record<string, ExamReport> = {
  sa1: {
    examId: 'lsk-exam-sa1',
    examName: 'Summative Assessment 1 (SA1)',
    examType: 'sa1',
    academicYear: '2026-2027',
    totalMarks: 448,
    maxTotalMarks: 500,
    percentage: 89.6,
    overallGrade: 'A1',
    resultStatus: 'PASSED',
    subjects: [
      { subjectName: 'Mathematics', subjectCode: 'LSK-MATH-8', marksObtained: 96, maxMarks: 100, grade: 'A1', remarks: 'Exceptional analytical ability' },
      { subjectName: 'General Science', subjectCode: 'LSK-SCI-8', marksObtained: 91, maxMarks: 100, grade: 'A1', remarks: 'Great practical lab understanding' },
      { subjectName: 'English Language', subjectCode: 'LSK-ENG-8', marksObtained: 88, maxMarks: 100, grade: 'A2', remarks: 'Excellent creative writing' },
      { subjectName: 'Social Science', subjectCode: 'LSK-SST-8', marksObtained: 83, maxMarks: 100, grade: 'A2', remarks: 'Good grasp of Indian History' },
      { subjectName: 'Hindi (Course B)', subjectCode: 'LSK-HIN-8', marksObtained: 90, maxMarks: 100, grade: 'A1', remarks: 'Very neat calligraphy & grammar' },
    ],
  },
  weekly: {
    examId: 'lsk-exam-weekly-01',
    examName: 'Weekly Test 1 (Math & Science)',
    examType: 'weekly',
    academicYear: '2026-2027',
    totalMarks: 48,
    maxTotalMarks: 50,
    percentage: 96.0,
    overallGrade: 'A1',
    resultStatus: 'PASSED',
    subjects: [
      { subjectName: 'Mathematics', subjectCode: 'LSK-MATH-8', marksObtained: 25, maxMarks: 25, grade: 'A1', remarks: 'Full marks' },
      { subjectName: 'General Science', subjectCode: 'LSK-SCI-8', marksObtained: 23, maxMarks: 25, grade: 'A1', remarks: 'Good diagrams' },
    ],
  },
  half_yearly: {
    examId: 'lsk-exam-halfyearly',
    examName: 'Half Yearly Examination 2026',
    examType: 'half_yearly',
    academicYear: '2026-2027',
    totalMarks: 455,
    maxTotalMarks: 500,
    percentage: 91.0,
    overallGrade: 'A1',
    resultStatus: 'PASSED',
    subjects: [
      { subjectName: 'Mathematics', subjectCode: 'LSK-MATH-8', marksObtained: 98, maxMarks: 100, grade: 'A1', remarks: 'Brilliant conceptual speed' },
      { subjectName: 'General Science', subjectCode: 'LSK-SCI-8', marksObtained: 92, maxMarks: 100, grade: 'A1', remarks: 'Outstanding experiment presentation' },
      { subjectName: 'English Language', subjectCode: 'LSK-ENG-8', marksObtained: 86, maxMarks: 100, grade: 'A2', remarks: 'Well structured essays' },
      { subjectName: 'Social Science', subjectCode: 'LSK-SST-8', marksObtained: 87, maxMarks: 100, grade: 'A2', remarks: 'Precise map work' },
      { subjectName: 'Hindi (Course B)', subjectCode: 'LSK-HIN-8', marksObtained: 92, maxMarks: 100, grade: 'A1', remarks: 'High accuracy in literature questions' },
    ],
  },
};

export const MOCK_FEES: FeeItem[] = [
  {
    id: '1',
    title: 'Tuition Fee - Quarter 1 (Apr - Jun)',
    amount: 12000,
    dueDate: '2026-04-15',
    status: 'paid',
    receiptNo: 'LSK-RCP-2026-400101',
    paymentDate: '2026-04-10',
  },
  {
    id: '2',
    title: 'Examination & Activity Composite Fee',
    amount: 3500,
    dueDate: '2026-09-05',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Tuition Fee - Quarter 2 (Jul - Sep)',
    amount: 12000,
    dueDate: '2026-10-15',
    status: 'pending',
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Attendance Alert: Present',
    message: 'Aryan Mishra marked PRESENT today at 08:05 AM. – LSK Academy',
    channel: 'APP_PUSH_NOTIFICATION',
    timestamp: 'Today, 08:06 AM',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Fee Reminder: Exam & Activity Fee',
    message: 'Fee of Rs. 3,500 is due on 05-Sep-2026. Please pay to avoid late fine.',
    channel: 'APP_PUSH_NOTIFICATION',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: 'notif-3',
    title: 'Report Card Published: SA1',
    message: 'Summative Assessment 1 (SA1) results are now available. Aryan secured 89.6% (Grade A1).',
    channel: 'APP_PUSH_NOTIFICATION',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Automated SMS Fallback Notice',
    message: 'Absence SMS sent to parent contact (+91 98444 55667) for Zara Shaikh (App Inactive).',
    channel: 'AUTOMATED_SMS_FALLBACK',
    timestamp: '06-Sep-2026',
    read: true,
  },
];

// Helper for authenticated requests
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = getMobileToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
  });
}

// 1. Fetch School Details & Branding
export async function fetchSchoolByCode(schoolCode: string): Promise<School> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/schools/branding/${schoolCode}`);
    if (res.ok) {
      const data = await res.json();
      return data.school;
    }
  } catch (err) {
    console.warn('API fetchSchoolByCode offline, using fallback', err);
  }
  return LSK_SCHOOL_DEFAULT;
}

// 2. Real Login to ERP with credentials
export async function loginUser(
  email: string,
  password: string,
  schoolCode: string
): Promise<{ token: string; user: User; school: School; linkedStudents?: any[] }> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, schoolCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed. Please check credentials and school code.');
  }

  if (data.token) {
    setMobileToken(data.token);
  }
  return data;
}

// 3. Verify Active Session (/api/auth/me)
export async function fetchMe(): Promise<{ user: User; school: School; linkedStudents?: any[] } | null> {
  const token = getMobileToken();
  if (!token) return null;

  try {
    const res = await authFetch('/auth/me');
    if (res.ok) {
      return await res.json();
    } else {
      setMobileToken(null);
    }
  } catch {
    // Keep cached session if offline
  }
  return null;
}

// 4. Fetch Live Students from ERP
export async function fetchLiveStudents(): Promise<Student[]> {
  try {
    const res = await authFetch('/students');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students) && data.students.length > 0) {
        return data.students.map((s: any) => ({
          id: s.id,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          firstName: s.firstName,
          lastName: s.lastName,
          className: s.className || `Class ${s.gradeLevel || 8}`,
          sectionName: s.sectionName || 'A',
          bloodGroup: s.bloodGroup || 'B+',
          photoUrl: s.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          fatherName: s.fatherName || 'Father',
          motherName: s.motherName || 'Mother',
          parentPhone: s.primaryPhone || '',
        }));
      }
    }
  } catch (err) {
    console.warn('Live students offline:', err);
  }
  return DEFAULT_STUDENTS_LIST;
}

// 5. Fetch Live Classes (Classes 1-12 & Sections A & B)
export async function fetchLiveClasses(): Promise<any> {
  try {
    const res = await authFetch('/classes');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Live classes offline:', err);
  }
  return { classes: [], sections: [], subjects: [], teachers: [] };
}

// 6. Fetch Student Attendance from ERP
export async function fetchStudentAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
  try {
    const res = await authFetch(`/attendance/student/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.records) && data.records.length > 0) {
        return data.records.map((r: any) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          remarks: r.remarks || '',
        }));
      }
    }
  } catch (err) {
    console.warn('Student attendance offline:', err);
  }
  return MOCK_ATTENDANCE;
}

// 7. Fetch Student Fees from ERP
export async function fetchStudentFeesLedger(studentId: string): Promise<FeeItem[]> {
  try {
    const res = await authFetch(`/fees/student/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      const items: FeeItem[] = [];

      if (Array.isArray(data.classFees)) {
        for (const cf of data.classFees) {
          const isPaid = (data.payments || []).some((p: any) => p.feeStructureId === cf.id);
          items.push({
            id: cf.id,
            title: cf.title,
            amount: cf.amount,
            dueDate: cf.dueDate || '2026-09-30',
            status: isPaid ? 'paid' : 'pending',
          });
        }
      }

      if (items.length > 0) return items;
    }
  } catch (err) {
    console.warn('Student fees offline:', err);
  }
  return MOCK_FEES;
}

// 8. Fetch Student Report Card from ERP
export async function fetchStudentExamReport(studentId: string, examId: string = 'exam-sa1-term1'): Promise<ExamReport | null> {
  try {
    const res = await authFetch(`/exams/report-card/${studentId}/${examId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.reportCard) {
        const rc = data.reportCard;
        return {
          examId: rc.examId,
          examName: rc.examName,
          examType: rc.examType,
          academicYear: rc.academicYear,
          totalMarks: rc.totalMarksObtained,
          maxTotalMarks: rc.totalMaxMarks,
          percentage: rc.percentage,
          overallGrade: rc.overallGrade,
          resultStatus: rc.resultStatus,
          subjects: (rc.subjects || []).map((sub: any) => ({
            subjectName: sub.subjectName,
            subjectCode: sub.subjectCode,
            marksObtained: sub.totalObtained,
            maxMarks: sub.maxMarks,
            grade: sub.grade,
            remarks: sub.remarks || '',
          })),
        };
      }
    }
  } catch (err) {
    console.warn('Student report card offline:', err);
  }
  return MOCK_REPORTS.sa1;
}

// 9. Submit Class Attendance to ERP
export async function submitClassAttendance(
  classId: string,
  sectionId: string,
  date: string,
  records: Array<{ studentId: string; status: string; remarks?: string }>
) {
  const res = await authFetch('/attendance/mark', {
    method: 'POST',
    body: JSON.stringify({ classId, sectionId, date, records }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit attendance to ERP server.');
  }

  return data;
}

// 10. Fetch Live Notices & Circulars from ERP
export async function fetchLiveNotices(): Promise<NotificationItem[]> {
  try {
    const res = await authFetch('/notifications/notices');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notices) && data.notices.length > 0) {
        return data.notices.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          channel: 'APP_PUSH_NOTIFICATION',
          timestamp: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          read: n.isRead === 1,
        }));
      }
    }
  } catch (err) {
    console.warn('Live notices offline, fallback to cached notices', err);
  }
  return MOCK_NOTIFICATIONS;
}

// 11. Broadcast Notice / Circular to School
export async function broadcastLiveNotice(title: string, message: string) {
  const res = await authFetch('/notifications/notices', {
    method: 'POST',
    body: JSON.stringify({ title, message, targetRole: 'all' }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to broadcast notice.');
  }
  return data;
}

// 12. Fetch Class Timetable from ERP
export async function fetchClassTimetable(classId: string, sectionId: string): Promise<TimetablePeriod[]> {
  try {
    const res = await authFetch(`/timetable/class/${classId}/${sectionId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.periods)) {
        return data.periods;
      }
    }
  } catch (err) {
    console.warn('Class timetable offline:', err);
  }
  return [];
}

// 13. Fetch Teacher Timetable from ERP
export async function fetchTeacherTimetable(teacherId: string): Promise<TimetablePeriod[]> {
  try {
    const res = await authFetch(`/timetable/teacher/${teacherId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.periods)) {
        return data.periods;
      }
    }
  } catch (err) {
    console.warn('Teacher timetable offline:', err);
  }
  return [];
}

// 14. Fetch Student Logs (Awards, Discipline, Conduct)
export async function fetchStudentLogs(studentId: string): Promise<StudentLog[]> {
  try {
    const res = await authFetch(`/student-logs/student/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        return data.logs;
      }
    }
  } catch (err) {
    console.warn('Student logs offline:', err);
  }
  return [];
}

// 15. Create Student Observation / Incident Log
export async function createStudentObservationLog(data: {
  studentId: string;
  logType: string;
  title: string;
  description: string;
  actionTaken?: string;
  date?: string;
  notifyParent?: boolean;
}) {
  const res = await authFetch('/student-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to save student observation.');
  }
  return resData;
}

// Version & Auto-Update
export const CURRENT_APP_VERSION = '1.2.0';
export const CURRENT_BUILD_NUMBER = 102;

export async function checkAppUpdate(): Promise<AppUpdateInfo | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/app/version`);
    if (res.ok) {
      const data: AppUpdateInfo = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Unable to reach app update server:', err);
  }
  return null;
}

// 16. Fetch Certificates
export async function fetchCertificates(studentId?: string): Promise<CertificateItem[]> {
  try {
    const endpoint = studentId ? `/certificates/student/${studentId}` : '/certificates';
    const res = await authFetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.certificates)) return data.certificates;
    }
  } catch (err) {
    console.warn('Certificates offline:', err);
  }
  return [
    {
      id: 'cert-1',
      certificateType: 'BONAFIDE',
      certificateNo: 'BON-2026-8401',
      studentName: 'Aryan Mishra',
      admissionNo: 'LSK/2026/2001',
      issueDate: '2026-08-15',
      academicYear: '2026-2027',
      reason: 'Passport and Visa application verification',
      conduct: 'Exemplary',
      status: 'ISSUED',
    },
    {
      id: 'cert-2',
      certificateType: 'CHARACTER',
      certificateNo: 'CHAR-2026-4022',
      studentName: 'Aryan Mishra',
      admissionNo: 'LSK/2026/2001',
      issueDate: '2026-07-10',
      academicYear: '2026-2027',
      reason: 'State Talent Search Olympiad Registration',
      conduct: 'Outstanding',
      status: 'ISSUED',
    },
  ];
}

// 17. Fetch Official CBSE Admit Card
export async function fetchAdmitCard(studentId: string): Promise<any | null> {
  try {
    const res = await authFetch(`/certificates/admit-card/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.admitCard) return data.admitCard;
    }
  } catch (err) {
    console.warn('Admit Card offline:', err);
  }
  return {
    rollNo: 1,
    rollCode: 'CBSE-LSK01-2026-0001',
    admissionNo: 'LSK/2026/2001',
    studentName: 'Aryan Mishra',
    fatherName: 'Sanjay Mishra',
    motherName: 'Sunita Mishra',
    className: 'Class 8',
    sectionName: 'A',
    dob: '2012-04-12',
    centerNumber: '8402',
    centerName: 'LSK Academy Examination Center, Main Campus Block-A',
    schoolName: 'LSK Academy',
    schoolAffiliation: 'CBSE/AFF/1032890',
    examTitle: 'Secondary School Examination 2026 (Annual Term)',
    instructions: [
      'Candidate must report to examination hall 30 minutes prior to test commencement.',
      'Carry this printed Admit Card along with your School Digital ID Card.',
      'Electronic gadgets, smartwatches, and study notes are strictly forbidden inside the hall.',
      'Use only blue/black ballpoint pen for filling OMR sheets and answer booklets.',
    ],
    schedule: [
      { subCode: 'MATH-8', subName: 'Mathematics Standard', examDate: '2026-10-10', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-1' },
      { subCode: 'SCI-8', subName: 'Science Theory', examDate: '2026-10-12', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-1' },
      { subCode: 'ENG-8', subName: 'English Language & Lit', examDate: '2026-10-14', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-2' },
      { subCode: 'SST-8', subName: 'Social Science', examDate: '2026-10-16', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-2' },
    ],
  };
}

// 18. Fetch Student Transport
export async function fetchStudentTransport(studentId: string): Promise<StudentTransportItem | null> {
  try {
    const res = await authFetch(`/transport/student/${studentId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.allocation) return data.allocation;
    }
  } catch (err) {
    console.warn('Transport offline:', err);
  }
  return {
    id: 'tr-1',
    studentId,
    routeName: 'Route 1: City Center to School Campus',
    stopName: 'Shivaji Nagar Square',
    pickupTime: '07:30 AM',
    dropTime: '02:30 PM',
    vehicleNo: 'MP-04-E-1001',
  };
}

// 19. Fetch Library Issues
export async function fetchLibraryIssues(studentId?: string): Promise<LibraryIssueItem[]> {
  try {
    const res = await authFetch('/library/issues');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.issues)) {
        if (studentId) {
          return data.issues.filter((i: any) => i.studentId === studentId);
        }
        return data.issues;
      }
    }
  } catch (err) {
    console.warn('Library issues offline:', err);
  }
  return [
    {
      id: 'lib-1',
      bookTitle: 'NCERT Mathematics Class 8 Exemplar',
      bookAuthor: 'NCERT Editorial Board',
      issueDate: '2026-09-01',
      dueDate: '2026-09-25',
      fineAmount: 0,
      status: 'ISSUED',
    },
    {
      id: 'lib-2',
      bookTitle: 'General Science Encyclopedia Vol 1',
      bookAuthor: 'Oxford University Press',
      issueDate: '2026-08-10',
      dueDate: '2026-08-30',
      fineAmount: 0,
      status: 'RETURNED',
    },
  ];
}

// 20. Fetch Staff Leaves
export async function fetchStaffLeaves(): Promise<StaffLeaveItem[]> {
  try {
    const res = await authFetch('/payroll/leaves');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.leaves)) return data.leaves;
    }
  } catch (err) {
    console.warn('Staff leaves offline:', err);
  }
  return [];
}

// 21. Apply Staff Leave
export async function applyStaffLeave(data: {
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}) {
  const res = await authFetch('/payroll/leaves', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to submit leave.');
  }
  return resData;
}

// 22. Review Staff Leave (Principal)
export async function reviewStaffLeave(leaveId: string, data: { status: string; reviewRemarks?: string }) {
  const res = await authFetch(`/payroll/leaves/${leaveId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to update leave status.');
  }
  return resData;
}

