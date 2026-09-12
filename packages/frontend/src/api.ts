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
  TimetablePeriod,
  StudentLog,
  Student,
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
      studentRecord?: Student | null;
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
      studentRecord?: Student | null;
    }>('/auth/me');
  }

  // Auth
  static async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Schools (Super Admin & Institution management)
  static async getSchools() {
    return this.request<{ schools: School[] }>('/schools');
  }

  static async createSchool(schoolData: Partial<School>) {
    return this.request<{ schoolId: string; apiSyncKey: string }>('/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData),
    });
  }

  static async updateSchool(schoolId: string, data: Partial<School>) {
    return this.request<{ success: boolean; message: string }>(`/schools/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteSchool(schoolId: string) {
    return this.request<{ success: boolean; message: string }>(`/schools/${schoolId}`, {
      method: 'DELETE',
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

  static async createFeeStructure(data: { classId: string; title: string; amount: number; dueDate?: string; academicYear?: string }) {
    return this.request<{ success: boolean; message: string; id: string }>('/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Academic Masters: Classes, Sections, Subjects
  static async createClass(data: { name: string; gradeLevel?: number }) {
    return this.request<{ success: boolean; message: string; id: string }>('/classes/class', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async createSection(data: { classId: string; name: string }) {
    return this.request<{ success: boolean; message: string; id: string }>('/classes/section', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async createSubject(data: { name: string; code?: string }) {
    return this.request<{ success: boolean; message: string; id: string }>('/classes/subject', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Fee Collection Transactions
  static async getPayments() {
    return this.request<{ payments: any[] }>('/fees/payments');
  }

  // Notice Board / Circulars
  static async getNotices() {
    return this.request<{ notices: any[] }>('/notifications/notices');
  }

  static async broadcastNotice(data: { title: string; message: string }) {
    return this.request<{ success: boolean; message: string }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Timetable Scheduling Matrix
  static async getTimetableByClass(classId: string, sectionId: string) {
    return this.request<{ periods: TimetablePeriod[] }>(`/timetable/class/${classId}/${sectionId}`);
  }

  static async getTimetableByTeacher(teacherId: string) {
    return this.request<{ periods: TimetablePeriod[] }>(`/timetable/teacher/${teacherId}`);
  }

  static async saveTimetablePeriod(data: Partial<TimetablePeriod>) {
    return this.request<{ success: boolean; message: string; period: TimetablePeriod }>('/timetable/period', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteTimetablePeriod(id: string) {
    return this.request<{ success: boolean; message: string }>(`/timetable/period/${id}`, {
      method: 'DELETE',
    });
  }

  // Student Behavioral & Incident Logs
  static async getSchoolStudentLogs() {
    return this.request<{ logs: StudentLog[] }>('/student-logs/school');
  }

  static async getStudentLogs(studentId: string) {
    return this.request<{ logs: StudentLog[] }>(`/student-logs/student/${studentId}`);
  }

  static async createStudentLog(data: {
    studentId: string;
    logType: string;
    title: string;
    description: string;
    actionTaken?: string;
    date?: string;
    notifyParent?: boolean | number;
  }) {
    return this.request<{ success: boolean; message: string; logId: string }>('/student-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteStudentLog(id: string) {
    return this.request<{ success: boolean; message: string }>(`/student-logs/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== CERTIFICATES ====================
  static async getCertificates() {
    return this.request<{ certificates: any[] }>('/certificates');
  }

  static async getStudentCertificates(studentId: string) {
    return this.request<{ certificates: any[] }>(`/certificates/student/${studentId}`);
  }

  static async getCertificateDetail(id: string) {
    return this.request<{ certificate: any }>(`/certificates/${id}`);
  }

  static async getAdmitCardData(studentId: string) {
    return this.request<{ admitCard: any }>(`/certificates/admit-card/${studentId}`);
  }

  static async createCertificate(data: {
    studentId: string;
    certificateType: string;
    academicYear?: string;
    issueDate?: string;
    reason?: string;
    conduct?: string;
    extraFields?: any;
  }) {
    return this.request<{ success: boolean; message: string; certificateId: string; certificateNo: string }>('/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteCertificate(id: string) {
    return this.request<{ success: boolean; message: string }>(`/certificates/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FRONT DESK & RECEPTION ====================
  static async getVisitors() {
    return this.request<{ visitors: any[] }>('/front-desk/visitors');
  }

  static async createVisitor(data: {
    visitorName: string;
    phone: string;
    purpose: string;
    whomToMeet?: string;
    idCardType?: string;
    idCardNo?: string;
    badgeNumber?: string;
  }) {
    return this.request<{ success: boolean; message: string; visitorId: string }>('/front-desk/visitors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async checkoutVisitor(id: string) {
    return this.request<{ success: boolean; message: string }>(`/front-desk/visitors/${id}/checkout`, {
      method: 'PUT',
    });
  }

  static async getInquiries() {
    return this.request<{ inquiries: any[] }>('/front-desk/inquiries');
  }

  static async createInquiry(data: {
    studentName: string;
    parentName: string;
    phone: string;
    email?: string;
    classSeeking: string;
    source?: string;
    followUpDate?: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; message: string; inquiryId: string }>('/front-desk/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateInquiry(id: string, data: { status?: string; followUpDate?: string; notes?: string }) {
    return this.request<{ success: boolean; message: string }>(`/front-desk/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getPostalComplaints() {
    return this.request<{ items: any[] }>('/front-desk/postal-complaints');
  }

  static async createPostalComplaint(data: {
    type: string;
    title: string;
    referenceNo?: string;
    fromName?: string;
    toName?: string;
    contactPhone?: string;
    description?: string;
    actionTaken?: string;
    status?: string;
    date?: string;
  }) {
    return this.request<{ success: boolean; message: string; itemId: string }>('/front-desk/postal-complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updatePostalComplaint(id: string, data: { actionTaken?: string; status?: string }) {
    return this.request<{ success: boolean; message: string }>(`/front-desk/postal-complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== HR & PAYROLL ====================
  static async getStaffLeaves() {
    return this.request<{ leaves: any[] }>('/payroll/leaves');
  }

  static async applyStaffLeave(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }) {
    return this.request<{ success: boolean; message: string; leaveId: string }>('/payroll/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async reviewStaffLeave(id: string, status: 'APPROVED' | 'REJECTED', reviewRemarks?: string) {
    return this.request<{ success: boolean; message: string }>(`/payroll/leaves/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewRemarks }),
    });
  }

  static async getPayrollSlips() {
    return this.request<{ slips: any[] }>('/payroll/slips');
  }

  static async getPayrollSlipDetail(id: string) {
    return this.request<{ slip: any }>(`/payroll/slips/${id}`);
  }

  static async generatePayrollSlip(data: {
    staffUserId: string;
    monthYear: string;
    basicSalary: number;
    hra?: number;
    da?: number;
    specialAllowance?: number;
    deductionPf?: number;
    deductionTax?: number;
    deductionLeave?: number;
    paymentMode?: string;
    paymentStatus?: string;
  }) {
    return this.request<{ success: boolean; message: string; slipId: string; slipNo: string; netSalary: number }>('/payroll/generate-slip', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== LIBRARY MANAGEMENT ====================
  static async getLibraryBooks() {
    return this.request<{ books: any[] }>('/library/books');
  }

  static async createLibraryBook(data: {
    isbn?: string;
    title: string;
    author: string;
    publisher?: string;
    subject?: string;
    rackNumber?: string;
    totalCopies: number;
    price?: number;
  }) {
    return this.request<{ success: boolean; message: string; bookId: string }>('/library/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateLibraryBook(id: string, data: any) {
    return this.request<{ success: boolean; message: string }>(`/library/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteLibraryBook(id: string) {
    return this.request<{ success: boolean; message: string }>(`/library/books/${id}`, {
      method: 'DELETE',
    });
  }

  static async getLibraryIssues() {
    return this.request<{ issues: any[] }>('/library/issues');
  }

  static async getStudentLibraryIssues(studentId: string) {
    return this.request<{ issues: any[] }>(`/library/student/${studentId}`);
  }

  static async issueLibraryBook(data: {
    bookId: string;
    studentId?: string;
    staffUserId?: string;
    issueDate?: string;
    dueDate?: string;
  }) {
    return this.request<{ success: boolean; message: string; issueId: string }>('/library/issue-book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async returnLibraryBook(id: string, returnDate?: string, fineAmount?: number) {
    return this.request<{ success: boolean; message: string }>(`/library/return-book/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ returnDate, fineAmount }),
    });
  }

  // ==================== TRANSPORT FLEET ====================
  static async getTransportVehicles() {
    return this.request<{ vehicles: any[] }>('/transport/vehicles');
  }

  static async createTransportVehicle(data: {
    vehicleNo: string;
    vehicleModel?: string;
    seatingCapacity?: number;
    driverName: string;
    driverPhone: string;
    driverLicense?: string;
  }) {
    return this.request<{ success: boolean; message: string; vehicleId: string }>('/transport/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getTransportRoutes() {
    return this.request<{ routes: any[] }>('/transport/routes');
  }

  static async createTransportRoute(data: {
    routeName: string;
    startLocation: string;
    endLocation: string;
    vehicleId?: string;
    monthlyFare?: number;
  }) {
    return this.request<{ success: boolean; message: string; routeId: string }>('/transport/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async createTransportStop(data: {
    routeId: string;
    stopName: string;
    pickupTime: string;
    dropTime?: string;
    sequenceOrder?: number;
  }) {
    return this.request<{ success: boolean; message: string; stopId: string }>('/transport/stops', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getStudentTransportAllocations() {
    return this.request<{ allocations: any[] }>('/transport/student-allocations');
  }

  static async allocateStudentTransport(data: {
    studentId: string;
    routeId: string;
    stopId: string;
    academicYear?: string;
  }) {
    return this.request<{ success: boolean; message: string; allocId: string }>('/transport/student-allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getStudentTransport(studentId: string) {
    return this.request<{ transport: any }>(`/transport/student/${studentId}`);
  }

  // ==================== STOCK & INVENTORY ====================
  static async getInventoryItems() {
    return this.request<{ items: any[] }>('/inventory/items');
  }

  static async createInventoryItem(data: {
    name: string;
    category: string;
    unit?: string;
    currentQuantity?: number;
    minimumAlertQuantity?: number;
  }) {
    return this.request<{ success: boolean; message: string; itemId: string }>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateInventoryItem(id: string, data: any) {
    return this.request<{ success: boolean; message: string }>(`/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getInventoryTransactions() {
    return this.request<{ transactions: any[] }>('/inventory/transactions');
  }

  static async createInventoryTransaction(data: {
    itemId: string;
    transactionType: 'INWARD' | 'OUTWARD';
    quantity: number;
    unitPrice?: number;
    supplierOrRecipient: string;
    invoiceOrSlipNo?: string;
    date?: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; message: string; transactionId: string; newQuantity: number }>('/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}


