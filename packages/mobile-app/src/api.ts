import { School, User, Student, AttendanceRecord, ExamReport, FeeItem, NotificationItem, AppUpdateInfo, TimetablePeriod, StudentLog, CertificateItem, StudentTransportItem, LibraryIssueItem, StaffLeaveItem, StaffMember, FeeStructureItem, FeePaymentRecord, ExamItem, MarksSheetStudent, ParentInfo, DriverBusInfo, ParentLiveBusTracking, FleetLiveInfo, HomeworkItem, ExamSubmissionMatrix, TeacherMarksSubmissionItem } from './types';

// Canonical Live Production Render API Endpoint
export const PRODUCTION_RENDER_API_URL = 'https://mitra-erp.onrender.com/api';

// Dynamic API Base URL detection - Guaranteed cloud connectivity for mobile devices
export function getApiBaseUrl(): string {
  // 1. Explicit user override from settings
  const customUrl = localStorage.getItem('anvimitra_api_url');
  if (customUrl && customUrl.trim()) return customUrl.trim();

  // 2. Vite build-time environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 3. Detect Capacitor Native App (Android/iOS APK)
  // In Capacitor, hostname is 'localhost' or 'capacitor:', but there is NO local server on the phone!
  // Any phone MUST connect directly to the Cloud Render backend.
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    const isCapacitorNative =
      (window as any).Capacitor !== undefined ||
      protocol === 'capacitor:' ||
      (hostname === 'localhost' && (!port || port === '80' || port === '443'));

    if (isCapacitorNative) {
      return PRODUCTION_RENDER_API_URL;
    }

    // 4. Local Vite Dev Server on PC (port 5174)
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5174') {
      return 'http://localhost:4000/api';
    }

    // 5. Any mobile device or external browser opening the webapp
    return PRODUCTION_RENDER_API_URL;
  }

  return PRODUCTION_RENDER_API_URL;
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
  const cleanCode = (schoolCode || '').trim().toUpperCase();
  const cleanEmail = (email || '').trim();

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password, schoolCode: cleanCode, isMobileApp: true }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please check credentials and school code.');
    }

    if (data.token) {
      setMobileToken(data.token);
    }
    return data;
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error('Unable to reach Institutional ERP Cloud Server. Please check your internet connection or server status.');
  }
}

// 2.1 Check Server Health
export async function checkServerHealth(): Promise<{ online: boolean; url: string; latency?: number }> {
  const url = getApiBaseUrl();
  const start = Date.now();
  try {
    const healthEndpoint = url.endsWith('/api') ? url.replace(/\/api$/, '/health') : `${url}/health`;
    const res = await fetch(healthEndpoint, { method: 'GET' });
    if (res.ok) {
      return { online: true, url, latency: Date.now() - start };
    }
  } catch {}
  try {
    const res = await fetch(`${url}/app/version`, { method: 'GET' });
    if (res.ok) {
      return { online: true, url, latency: Date.now() - start };
    }
  } catch {}
  return { online: false, url };
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
export async function fetchLiveStudents(classId?: string, sectionId?: string): Promise<Student[]> {
  try {
    let url = '/students';
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (sectionId) params.append('sectionId', sectionId);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await authFetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students) && data.students.length > 0) {
        return data.students.map((s: any) => ({
          id: s.id,
          classId: s.classId,
          sectionId: s.sectionId,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          firstName: s.firstName,
          lastName: s.lastName,
          className: s.className || `Class ${s.gradeLevel || 8}`,
          sectionName: s.sectionName || 'A',
          bloodGroup: s.bloodGroup || 'B+',
          photoUrl: s.photoUrl || '',
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

// 4b. Fetch Daily Class Attendance Sheet from ERP (Strictly for assigned Class & Section)
export async function fetchClassAttendance(classId: string, sectionId: string, date: string): Promise<{
  date: string;
  students: Array<{
    studentId: string;
    admissionNo: string;
    rollNo: number;
    name: string;
    firstName?: string;
    lastName?: string;
    classId?: string;
    sectionId?: string;
    photoUrl?: string;
    status: 'present' | 'absent' | 'late' | 'unmarked';
    remarks?: string;
  }>;
  summary: { total: number; present: number; absent: number; late: number; unmarked: number };
}> {
  try {
    const res = await authFetch(
      `/attendance/class?classId=${encodeURIComponent(classId)}&sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(date)}`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('fetchClassAttendance offline:', err);
  }
  return {
    date,
    students: [],
    summary: { total: 0, present: 0, absent: 0, late: 0, unmarked: 0 },
  };
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
    if (res.status === 403) {
      // Evaluation in progress / unpublished
      return {
        examId,
        examName: 'Examination',
        examType: 'sa1',
        academicYear: '2026-2027',
        totalMarks: 0,
        maxTotalMarks: 0,
        percentage: 0,
        overallGrade: '',
        resultStatus: 'PASSED',
        subjects: [],
        isPublished: false,
      };
    }

    if (res.ok) {
      const data = await res.json();
      if (data.reportCard) {
        const rc = data.reportCard;
        const examObj = rc.exam || {};
        const summaryObj = rc.summary || {};

        const totalMarks = summaryObj.totalMarksObtained ?? rc.totalMarksObtained ?? rc.totalMarks ?? 0;
        const maxTotalMarks = summaryObj.totalMaxMarks ?? rc.totalMaxMarks ?? rc.maxTotalMarks ?? 0;
        const percentage = summaryObj.overallPercentage ?? rc.percentage ?? (maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 100) : 0);
        const overallGrade = summaryObj.overallGrade || rc.overallGrade || 'A';
        const resultStatus = (summaryObj.division?.toLowerCase().includes('repeat') || percentage < 33 ? 'FAILED' : 'PASSED') as 'PASSED' | 'FAILED';

        return {
          examId: examObj.id || rc.examId || examId,
          examName: examObj.name || rc.examName || 'Examination',
          examType: (examObj.examType || rc.examType || 'sa1') as any,
          academicYear: examObj.academicYear || rc.academicYear || '2026-2027',
          totalMarks,
          maxTotalMarks,
          percentage,
          overallGrade,
          resultStatus,
          isPublished: rc.isPublished !== false,
          summary: summaryObj,
          subjects: (rc.subjects || []).map((sub: any) => ({
            subjectName: sub.subjectName || 'Subject',
            subjectCode: sub.subjectCode || '',
            marksObtained: sub.marksObtained ?? sub.totalObtained ?? 0,
            maxMarks: sub.maxMarks ?? 100,
            grade: sub.grade || 'A',
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

// Fetch personal in-app user notifications (Attendance Alerts, Fee Reminders, Exam Updates)
export async function fetchUserNotifications(): Promise<NotificationItem[]> {
  try {
    const [notifRes, noticeRes] = await Promise.all([
      authFetch('/notifications').catch(() => null),
      authFetch('/notifications/notices').catch(() => null),
    ]);

    const items: NotificationItem[] = [];

    if (notifRes && notifRes.ok) {
      const data = await notifRes.json();
      if (Array.isArray(data.notifications)) {
        for (const n of data.notifications) {
          items.push({
            id: n.id,
            title: n.title,
            message: n.message,
            channel: 'APP_PUSH_NOTIFICATION',
            timestamp: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            read: n.isRead === 1,
          });
        }
      }
    }

    if (noticeRes && noticeRes.ok) {
      const data = await noticeRes.json();
      if (Array.isArray(data.notices)) {
        for (const n of data.notices) {
          if (!items.some((it) => it.id === n.id)) {
            items.push({
              id: n.id,
              title: n.title,
              message: n.message,
              channel: 'APP_PUSH_NOTIFICATION',
              timestamp: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
              read: n.isRead === 1,
            });
          }
        }
      }
    }

    return items;
  } catch (err) {
    console.warn('User notifications offline', err);
  }
  return [];
}

// Mark all user notifications as read in ERP
export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const res = await authFetch('/notifications/read-all', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
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
export const CURRENT_APP_VERSION = '1.2.1';
export const CURRENT_BUILD_NUMBER = 103;
// Baseline build release timestamp
export const CURRENT_APP_BUILD_TIME = '2026-09-25T15:25:58Z';

function isVersionNewer(remote: string, local: string): boolean {
  const pRemote = remote.split('.').map((n) => parseInt(n, 10) || 0);
  const pLocal = local.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pRemote.length, pLocal.length); i++) {
    const r = pRemote[i] || 0;
    const l = pLocal[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

export function markReleaseAsInstalled(releaseInfo: AppUpdateInfo) {
  const t = releaseInfo.assetUpdatedAt ? new Date(releaseInfo.assetUpdatedAt).getTime() : Date.now();
  localStorage.setItem('anvimitra_installed_release_time', String(t));
  if (releaseInfo.releaseId) {
    localStorage.setItem('anvimitra_installed_release_id', releaseInfo.releaseId);
  }
  if (releaseInfo.version) {
    localStorage.setItem('anvimitra_installed_version', releaseInfo.version);
  }
}

export async function checkAppUpdate(forceManualCheck = false): Promise<AppUpdateInfo | null> {
  let data: AppUpdateInfo | null = null;

  // 1. Try ERP Cloud Backend
  try {
    const res = await fetch(`${getApiBaseUrl()}/app/version`, { cache: 'no-store' });
    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.warn('Unable to reach app update server:', err);
  }

  // 2. Direct GitHub API Fallback (runs from client device with independent IP rate-limit)
  const remoteTime = data?.assetUpdatedAt ? new Date(data.assetUpdatedAt).getTime() : 0;
  const localBuildTime = new Date(CURRENT_APP_BUILD_TIME).getTime();

  if (!data || remoteTime <= localBuildTime) {
    try {
      const ghRes = await fetch('https://api.github.com/repos/anvimitra/MITRA-ERP/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (ghRes.ok) {
        const ghData: any = await ghRes.json();
        const apkAsset = Array.isArray(ghData.assets)
          ? ghData.assets.find((a: any) => a.name && a.name.endsWith('.apk'))
          : null;
        const ipaAsset = Array.isArray(ghData.assets)
          ? ghData.assets.find((a: any) => a.name && (a.name.endsWith('.ipa') || a.name.includes('iOS')))
          : null;

        const assetUpdate = apkAsset?.updated_at || ipaAsset?.updated_at || ghData.updated_at || ghData.published_at || new Date().toISOString();

        data = {
          appName: 'MITRA-ERP Mobile',
          version: '1.2.1',
          versionCode: 103,
          releaseId: String(ghData.id || 'latest'),
          assetId: apkAsset ? String(apkAsset.id) : 'latest-apk',
          assetUpdatedAt: assetUpdate,
          publishedAt: ghData.published_at || assetUpdate,
          latestApkUrl: apkAsset?.browser_download_url || 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk',
          latestIpaUrl: ipaAsset?.browser_download_url || 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP-iOS.ipa',
          releaseNotes: ghData.body || 'New features, real-time push synchronization and speed improvements.',
          sizeBytes: apkAsset?.size || 4420834,
          isMandatory: false,
          autoUpdateSupported: true,
        };
      }
    } catch (ghErr) {
      console.warn('Direct GitHub releases check error:', ghErr);
    }
  }

  if (data) {
    const finalRemoteTime = data.assetUpdatedAt ? new Date(data.assetUpdatedAt).getTime() : 0;
    const installedReleaseTime = parseInt(localStorage.getItem('anvimitra_installed_release_time') || '0', 10);

    // If user has already installed this exact release, do not auto-show banner unless forced
    if (!forceManualCheck && installedReleaseTime >= finalRemoteTime && finalRemoteTime > 0) {
      return null;
    }

    const isSemanticNewer = isVersionNewer(data.version, CURRENT_APP_VERSION);
    const isTimestampNewer = finalRemoteTime > localBuildTime;

    if (isSemanticNewer || isTimestampNewer || forceManualCheck) {
      return data;
    }
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
      if (data.transport) return data.transport;
      if (data.allocation) return data.allocation;
    }
  } catch (err) {
    console.warn('Transport offline:', err);
  }
  return null;
}

// 18b. Fetch Parent Live Bus Tracking (Strict RBAC: returns hasTransport: false if no bus assigned)
export async function fetchParentBusLiveTracking(studentId: string): Promise<ParentLiveBusTracking> {
  try {
    const res = await authFetch(`/transport/parent/live-tracking/${studentId}`);
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return {
      hasTransport: false,
      message: errData.message || errData.error || 'Failed to fetch tracking data',
    };
  } catch (err: any) {
    return {
      hasTransport: false,
      message: err?.message || 'Offline or network error',
    };
  }
}

// 18c. Driver: Fetch Assigned Vehicle, Route, and Stops
export async function fetchDriverMyBus(): Promise<DriverBusInfo> {
  try {
    const res = await authFetch('/transport/driver/my-bus');
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    return {
      assigned: false,
      message: errData.message || errData.error || 'Unable to retrieve assigned vehicle.',
    };
  } catch (err: any) {
    return {
      assigned: false,
      message: err?.message || 'Driver bus sync offline',
    };
  }
}

// 18d. Driver: Push GPS Coordinates to ERP Server (watchPosition)
export async function updateDriverLiveLocation(telemetry: {
  vehicleId?: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  isTripActive?: boolean;
}): Promise<any> {
  const res = await authFetch('/transport/driver/live-location', {
    method: 'POST',
    body: JSON.stringify(telemetry),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sync GPS location');
  }
  return data;
}

// 18e. Driver: Start or End Trip
export async function toggleDriverTrip(isTripActive: boolean, vehicleId?: string): Promise<any> {
  const res = await authFetch('/transport/driver/toggle-trip', {
    method: 'POST',
    body: JSON.stringify({ isTripActive, vehicleId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle trip status');
  }
  return data;
}

// 18f. Principal & Teachers: Fetch all active school buses with live telemetry
export async function fetchFleetLiveTracking(): Promise<FleetLiveInfo> {
  const res = await authFetch('/transport/fleet-live');
  if (res.ok) {
    return await res.json();
  }
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Failed to fetch fleet tracking data');
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

// 23. Create Student (With Auto Parent Credentials Generation)
export async function createStudent(studentData: any): Promise<{
  success: boolean;
  message: string;
  studentId: string;
  parentCredentials?: {
    loginId: string;
    password: string;
    parentName: string;
    studentName: string;
  };
}> {
  const res = await authFetch('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to enroll student');
  }
  return data;
}

// 24. Update Student
export async function updateStudent(studentId: string, studentData: any) {
  const res = await authFetch(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update student details');
  }
  return data;
}

// 25. Delete Student
export async function deleteStudent(studentId: string) {
  const res = await authFetch(`/students/${studentId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to remove student');
  }
  return data;
}

// 25b. Fetch Parents Directory
export async function fetchParents(): Promise<ParentInfo[]> {
  try {
    const res = await authFetch('/students/parents');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.parents)) {
        return data.parents;
      }
    }
  } catch (err) {
    console.warn('Parents directory offline:', err);
  }
  return [];
}

// 26. Fetch Staff / Faculty Members
export async function fetchStaffMembers(): Promise<StaffMember[]> {
  try {
    const res = await authFetch('/teachers');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.staff)) {
        return data.staff;
      }
    }
  } catch (err) {
    console.warn('Staff members offline:', err);
  }
  return [];
}

// 27. Create Staff Member
export async function createStaffMember(staffData: {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  password: string;
}) {
  const res = await authFetch('/teachers', {
    method: 'POST',
    body: JSON.stringify(staffData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to recruit staff member');
  }
  return data;
}

// 28. Update Staff Member
export async function updateStaffMember(staffId: string, staffData: any) {
  const res = await authFetch(`/teachers/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update staff member');
  }
  return data;
}

// 29. Deactivate / Delete Staff Member
export async function deleteStaffMember(staffId: string) {
  const res = await authFetch(`/teachers/${staffId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to deactivate staff member');
  }
  return data;
}

// 30. Fetch Fee Structures
export async function fetchFeeStructures(): Promise<FeeStructureItem[]> {
  try {
    const res = await authFetch('/fees/structures');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.structures)) {
        return data.structures;
      }
    }
  } catch (err) {
    console.warn('Fee structures offline:', err);
  }
  return [];
}

// 31. Create Fee Structure
export async function createFeeStructure(data: {
  classId: string;
  title: string;
  amount: number;
  dueDate?: string;
  academicYear?: string;
}) {
  const res = await authFetch('/fees/structures', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to create fee structure');
  }
  return resData;
}

// 32. Collect Fee Payment
export async function collectFeePayment(paymentData: {
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentMode: string;
  remarks?: string;
}): Promise<{
  success: boolean;
  message: string;
  payment: {
    id: string;
    receiptNo: string;
    amountPaid: number;
    paymentDate: string;
    status: string;
  };
}> {
  const res = await authFetch('/fees/collect', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record fee payment');
  }
  return data;
}

// 33. Fetch All Fee Payments
export async function fetchFeePayments(): Promise<FeePaymentRecord[]> {
  try {
    const res = await authFetch('/fees/payments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.payments)) {
        return data.payments;
      }
    }
  } catch (err) {
    console.warn('Fee payments offline:', err);
  }
  return [];
}

// 34. Send Fee Reminder Notice
export async function sendFeeReminder(data: {
  studentId: string;
  dueAmount: number;
  dueDate: string;
}) {
  const res = await authFetch('/fees/send-reminder', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to dispatch fee reminder');
  }
  return resData;
}

// 35. Fetch Exams List
export async function fetchExamsList(): Promise<ExamItem[]> {
  try {
    const res = await authFetch('/exams');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.exams)) {
        return data.exams;
      }
    }
  } catch (err) {
    console.warn('Exams list offline:', err);
  }
  return [];
}

// 36. Fetch Marks Sheet for a class & subject
export async function fetchMarksSheet(
  examId: string,
  classId: string,
  sectionId: string,
  subjectId: string
): Promise<MarksSheetStudent[]> {
  try {
    const query = new URLSearchParams({ examId, classId, sectionId, subjectId }).toString();
    const res = await authFetch(`/exams/marks-sheet?${query}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students)) {
        return data.students;
      }
    }
  } catch (err) {
    console.warn('Marks sheet offline:', err);
  }
  return [];
}

export async function fetchMarksSheetDetails(
  examId: string,
  classId: string,
  sectionId: string,
  subjectId: string
): Promise<{
  students: MarksSheetStudent[];
  maxMarks: number;
  isPublished: boolean;
  gradedCount: number;
  totalStudents: number;
}> {
  try {
    const query = new URLSearchParams({ examId, classId, sectionId, subjectId }).toString();
    const res = await authFetch(`/exams/marks-sheet?${query}`);
    if (res.ok) {
      const data = await res.json();
      return {
        students: Array.isArray(data.students) ? data.students : [],
        maxMarks: data.maxMarks || 100,
        isPublished: !!data.isPublished,
        gradedCount: data.gradedCount || 0,
        totalStudents: data.totalStudents || (Array.isArray(data.students) ? data.students.length : 0),
      };
    }
  } catch (err) {
    console.warn('Marks sheet details offline:', err);
  }
  return {
    students: [],
    maxMarks: 100,
    isPublished: false,
    gradedCount: 0,
    totalStudents: 0,
  };
}

// 37. Save Exam Marks
export async function saveExamMarks(
  examId: string,
  classId: string,
  sectionId: string,
  subjectId: string,
  marksList: Array<{ studentId: string; marksObtained: number; maxMarks: number; remarks?: string }>
) {
  const res = await authFetch('/exams/marks', {
    method: 'POST',
    body: JSON.stringify({ examId, classId, sectionId, subjectId, marksList }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save subject marks');
  }
  return data;
}

// 38. Super Admin: Fetch Schools
export async function fetchSchools(): Promise<School[]> {
  try {
    const res = await authFetch('/schools');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.schools)) {
        return data.schools;
      }
    }
  } catch (err) {
    console.warn('Schools offline:', err);
  }
  return [];
}

// 39. Super Admin: Create School
export async function createSchool(schoolData: any): Promise<{
  success: boolean;
  message: string;
  schoolId: string;
  principalCredentials?: {
    email: string;
    password: string;
    name: string;
    schoolCode: string;
  };
}> {
  const res = await authFetch('/schools', {
    method: 'POST',
    body: JSON.stringify(schoolData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create school tenant');
  }
  return data;
}

// 40. Super Admin: Delete School
export async function deleteSchool(schoolId: string) {
  const res = await authFetch(`/schools/${schoolId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to remove school');
  }
  return data;
}

// 41. Super Admin: DB Status & Master Storage
export async function fetchDbStatus(): Promise<{
  database: string;
  isPostgresConnected: boolean;
  schoolCount: number;
  studentCount: number;
  userCount: number;
  persistentStorage: string;
}> {
  const res = await authFetch('/schools/db-status');
  if (res.ok) {
    return await res.json();
  }
  return {
    database: 'sqlite',
    isPostgresConnected: false,
    schoolCount: 0,
    studentCount: 0,
    userCount: 0,
    persistentStorage: 'Local Master Storage',
  };
}

export async function fetchBackupSnapshot(): Promise<any> {
  const res = await authFetch('/schools/backup-snapshot');
  if (!res.ok) {
    throw new Error('Failed to fetch backup snapshot');
  }
  return await res.json();
}

export async function restoreBackupSnapshot(dataset: any): Promise<any> {
  const res = await authFetch('/schools/restore-snapshot', {
    method: 'POST',
    body: JSON.stringify({ dataset }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to restore backup');
  }
  return data;
}

export async function fetchMyAllocations(): Promise<{
  isClassTeacher: boolean;
  classTeacherOf: any[];
  subjectsAssigned: any[];
  allClasses: any[];
  allSections: any[];
  allSubjects: any[];
}> {
  try {
    const res = await authFetch('/classes/my-allocations');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('fetchMyAllocations offline:', err);
  }
  return {
    isClassTeacher: false,
    classTeacherOf: [],
    subjectsAssigned: [],
    allClasses: [],
    allSections: [],
    allSubjects: [],
  };
}

export async function publishExamResults(data: {
  examId: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  isPublished: boolean;
}): Promise<any> {
  const res = await authFetch('/exams/publish', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to publish results');
  }
  return resData;
}

// 43b. Fetch Exam Submission Status Matrix (Principal & Teacher Audit)
export async function fetchExamSubmissionStatus(examId: string): Promise<ExamSubmissionMatrix | null> {
  try {
    const res = await authFetch(`/exams/submission-status?examId=${encodeURIComponent(examId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('fetchExamSubmissionStatus offline:', err);
  }
  return null;
}

// 43c. Fetch Teacher Marks Submissions History (Teacher / Principal)
export async function fetchTeacherMarksSubmissions(): Promise<TeacherMarksSubmissionItem[]> {
  try {
    const res = await authFetch('/exams/teacher-submissions');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.submissions)) {
        return data.submissions;
      }
    }
  } catch (err) {
    console.warn('fetchTeacherMarksSubmissions offline:', err);
  }
  return [];
}

// 43d. Send Reminder to Teacher for Pending Exam Marks (Principal only)
export async function sendMarksSubmissionReminder(data: {
  teacherId: string;
  subjectName: string;
  className?: string;
  examName?: string;
}): Promise<any> {
  const res = await authFetch('/exams/send-reminder', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || 'Failed to dispatch marks reminder');
  }
  return resData;
}

// 44. Super Admin: Toggle School Services ON/OFF
export async function toggleSchoolServices(schoolId: string, servicesEnabled?: boolean) {
  const res = await authFetch(`/schools/${schoolId}/toggle-services`, {
    method: 'POST',
    body: JSON.stringify({ servicesEnabled }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle school services');
  }
  return data;
}

// 45. Update User Profile (Super Admin, Principal, Teacher, Parent)
export async function updateUserProfile(profileData: {
  name?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const res = await authFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }
  if (data.token) {
    setMobileToken(data.token);
  }
  return data;
}

// 46. Homework & Assignments API
export async function fetchHomeworkList(classId?: string, sectionId?: string): Promise<HomeworkItem[]> {
  try {
    let url = '/homework';
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (sectionId) params.append('sectionId', sectionId);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await authFetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.homework || [];
    }
  } catch (err) {
    console.warn('API fetchHomeworkList error:', err);
  }
  return [];
}

export async function createHomework(homeworkData: {
  classId: string;
  sectionId?: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  description: string;
  dueDate?: string;
  attachmentUrl?: string;
}): Promise<HomeworkItem> {
  const res = await authFetch('/homework', {
    method: 'POST',
    body: JSON.stringify(homeworkData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create homework assignment');
  }
  return data.homework;
}

export async function deleteHomework(id: string): Promise<void> {
  const res = await authFetch(`/homework/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete homework');
  }
}








