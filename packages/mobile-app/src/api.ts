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
export async function fetchSchoolByCode(schoolCode: string): Promise<School | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/schools/branding/${schoolCode}`);
    if (res.ok) {
      const data = await res.json();
      return data.school;
    }
  } catch (err) {
    console.warn('API fetchSchoolByCode offline', err);
  }
  return null;
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
  return [];
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
  return [];
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
  return [];
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
  return null;
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
    console.warn('Live notices offline', err);
  }
  return [];
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
  return [];
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
  return null;
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
  return null;
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
  return [];
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

