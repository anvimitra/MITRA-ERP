export type Role = 'parent' | 'teacher' | 'principal' | 'student';

export interface School {
  id: string;
  code: string;
  name: string;
  domain: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
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
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks: string;
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
