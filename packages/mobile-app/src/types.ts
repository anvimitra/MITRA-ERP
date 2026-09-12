export type Role = 'parent' | 'teacher' | 'principal' | 'student';

export interface School {
  id: string;
  code: string;
  name: string;
  domain: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  phone?: string;
  email?: string;
  address?: string;
  affiliationNo?: string;
  principalName?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  establishedYear?: string;
  tagline?: string;
}

export interface User {
  id: string;
  schoolId: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  appInstalled: number;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: number;
  firstName: string;
  lastName: string;
  className: string;
  sectionName: string;
  bloodGroup: string;
  photoUrl: string;
  fatherName?: string;
  motherName?: string;
  parentPhone?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
  category?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'excused';
  remarks: string;
}

export interface TimetablePeriod {
  id: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  roomNumber?: string;
  className?: string;
  sectionName?: string;
}

export interface StudentLog {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  rollNo?: number;
  className?: string;
  sectionName?: string;
  logType: 'discipline' | 'award' | 'observation' | 'medical' | 'attendance';
  title: string;
  description: string;
  actionTaken?: string;
  reportedByUserId: string;
  reportedByName?: string;
  date: string;
  notifyParent: number;
  createdAt: string;
}

export interface SubjectMark {
  subjectName: string;
  subjectCode: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  remarks: string;
}

export interface ExamReport {
  examId: string;
  examName: string;
  examType: 'weekly' | 'sa1' | 'sa2' | 'sa3' | 'half_yearly' | 'yearly';
  academicYear: string;
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  overallGrade: string;
  resultStatus: 'PASSED' | 'FAILED';
  subjects: SubjectMark[];
}

export interface FeeItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending';
  receiptNo?: string;
  paymentDate?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: 'APP_PUSH_NOTIFICATION' | 'AUTOMATED_SMS_FALLBACK';
  timestamp: string;
  read: boolean;
}

export interface AppUpdateInfo {
  appName: string;
  version: string;
  versionCode: number;
  minSupportedVersion: string;
  latestApkUrl: string;
  releaseNotes: string;
  publishedAt: string;
  isMandatory: boolean;
  autoUpdateSupported: boolean;
}

export interface CertificateItem {
  id: string;
  certificateType: string;
  certificateNo: string;
  studentName?: string;
  admissionNo?: string;
  issueDate: string;
  academicYear: string;
  reason?: string;
  conduct?: string;
  status: string;
}

export interface StudentTransportItem {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  routeName: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  vehicleNo: string;
}

export interface LibraryBookItem {
  id: string;
  title: string;
  author: string;
  subject?: string;
  rackNumber?: string;
  availableCopies: number;
}

export interface LibraryIssueItem {
  id: string;
  bookTitle?: string;
  bookAuthor?: string;
  issueDate: string;
  dueDate: string;
  fineAmount: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface StaffLeaveItem {
  id: string;
  staffUserId: string;
  staffName?: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'DUTY';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewRemarks?: string;
}
