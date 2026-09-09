import {
  School,
  User,
  Role,
  TeacherAllocation,
  AttendanceRecord,
  Exam,
  ReportCardData,
  FeeStructure,
  FeePayment,
  NotificationItem,
  SMSLogItem,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api';

export class ApiService {
  private static token: string | null = localStorage.getItem('anvimitra_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('anvimitra_token', token);
    } else {
      localStorage.removeItem('anvimitra_token');
    }
  }

  static getToken(): string | null {
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Request failed`);
    }

    return data as T;
  }

  // Auth
  static async login(email: string, password: string, schoolCode?: string, isMobileApp?: boolean) {
    const data = await this.request<{
      token: string;
      user: User;
      school: School | null;
      linkedStudents: any[];
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, schoolCode, isMobileApp }),
    });

    this.setToken(data.token);
    return data;
  }

  static async getMe() {
    return this.request<{
      user: User;
      school: School | null;
      linkedStudents: any[];
    }>('/auth/me');
  }

  // Schools (Super Admin)
  static async getSchools() {
    return this.request<{ schools: School[] }>('/schools');
  }

  static async createSchool(schoolData: Partial<School>) {
    return this.request<{ schoolId: string; apiSyncKey: string }>('/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
    });
  }

  static async getBranding(code: string) {
    return this.request<{ school: School }>(`/schools/branding/${code}`);
  }

  // Classes & Allocations
  static async getClasses() {
    return this.request<any>('/classes');
  }

  static async getMyAllocations() {
    return this.request<TeacherAllocation>('/classes/my-allocations');
  }

  static async assignClassTeacher(classId: string, sectionId: string, teacherId: string, academicYear?: string) {
    return this.request<any>('/classes/class-teacher', {
      method: 'POST',
      body: JSON.stringify({ classId, sectionId, teacherId, academicYear }),
    });
  }

  static async assignSubjectTeacher(teacherId: string, classId: string, sectionId: string, subjectId: string, academicYear?: string) {
    return this.request<any>('/classes/subject-allocation', {
      method: 'POST',
      body: JSON.stringify({ teacherId, classId, sectionId, subjectId, academicYear }),
    });
  }

  // Attendance (STRICT: Class Teacher only)
  static async markAttendance(classId: string, sectionId: string, date: string, records: Array<{ studentId: string; status: string; remarks?: string }>) {
    return this.request<any>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ classId, sectionId, date, records }),
    });
  }

  static async getClassAttendance(classId: string, sectionId: string, date: string) {
    return this.request<{
      date: string;
      students: AttendanceRecord[];
      summary: { total: number; present: number; absent: number; late: number; unmarked: number };
    }>(`/attendance/class?classId=${classId}&sectionId=${sectionId}&date=${date}`);
  }

  static async getStudentAttendance(studentId: string) {
    return this.request<any>(`/attendance/student/${studentId}`);
  }

  // Exams & Marks (STRICT: Subject Teacher only)
  static async getExams() {
    return this.request<{ exams: Exam[] }>('/exams');
  }

  static async createExam(examData: Partial<Exam>) {
    return this.request<any>('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  static async recordMarks(examId: string, classId: string, sectionId: string, subjectId: string, marksList: any[]) {
    return this.request<any>('/exams/marks', {
      method: 'POST',
      body: JSON.stringify({ examId, classId, sectionId, subjectId, marksList }),
    });
  }

  static async getMarksSheet(examId: string, classId: string, sectionId: string, subjectId: string) {
    return this.request<{ students: any[] }>(
      `/exams/marks-sheet?examId=${examId}&classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}`
    );
  }

  static async getReportCard(studentId: string, examId: string) {
    return this.request<{ reportCard: ReportCardData }>(`/exams/report-card/${studentId}/${examId}`);
  }

  // Fees
  static async getFeeStructures() {
    return this.request<{ structures: FeeStructure[] }>('/fees/structures');
  }

  static async collectFee(data: { studentId: string; feeStructureId: string; amountPaid: number; paymentMode: string; remarks?: string }) {
    return this.request<any>('/fees/collect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getStudentFees(studentId: string) {
    return this.request<any>(`/fees/student/${studentId}`);
  }

  static async sendFeeReminder(studentId: string, dueAmount: number, dueDate: string) {
    return this.request<any>('/fees/send-reminder', {
      method: 'POST',
      body: JSON.stringify({ studentId, dueAmount, dueDate }),
    });
  }

  // Notifications & SMS Logs
  static async getMyAlerts() {
    return this.request<{ notifications: NotificationItem[] }>('/notifications/my-alerts');
  }

  static async getSMSLogs() {
    return this.request<{ smsLogs: SMSLogItem[] }>('/notifications/sms-logs');
  }

  // Student Management CRUD
  static async getStudents(filters: { classId?: string; sectionId?: string; search?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.classId) params.set('classId', filters.classId);
    if (filters.sectionId) params.set('sectionId', filters.sectionId);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ students: any[] }>(`/students${query}`);
  }

  static async createStudent(data: any) {
    return this.request<{ success: boolean; message: string; studentId: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateStudent(id: string, data: any) {
    return this.request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteStudent(id: string) {
    return this.request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Faculty & Staff CRUD
  static async getTeachers() {
    return this.request<{ staff: any[] }>('/teachers');
  }

  static async createTeacher(data: any) {
    return this.request<{ success: boolean; message: string; staffId: string }>('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTeacher(id: string, data: any) {
    return this.request<{ success: boolean; message: string }>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteTeacher(id: string) {
    return this.request<{ success: boolean; message: string }>(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }
}

