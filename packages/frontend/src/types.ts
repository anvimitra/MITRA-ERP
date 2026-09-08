export type Role = 'super_admin' | 'principal' | 'teacher' | 'accountant' | 'parent' | 'student';

export interface School {
  id: string;
  name: string;
  code: string;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  phone?: string;
  email?: string;
  address?: string;
  studentCount?: number;
  teacherCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId?: string;
  phone?: string;
  appInstalled: number;
}

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel?: number;
}

export interface SectionItem {
  id: string;
  classId: string;
  name: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
}

export interface TeacherAllocation {
  isClassTeacher: boolean;
  classTeacherOf: Array<{
    id: string;
    classId: string;
    sectionId: string;
    teacherId: string;
    academicYear: string;
  }>;
  subjectsAssigned: Array<{
    id: string;
    classId: string;
    sectionId: string;
    subjectId: string;
    teacherId: string;
    academicYear: string;
  }>;
  allClasses: ClassItem[];
  allSections: SectionItem[];
  allSubjects: SubjectItem[];
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo?: number;
  firstName: string;
  lastName?: string;
  classId: string;
  sectionId: string;
  parentId?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  studentId: string;
  admissionNo: string;
  rollNo?: number;
  name: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'unmarked';
  remarks?: string;
}

export interface Exam {
  id: string;
  name: string;
  examType: 'weekly' | 'unit' | 'sa1' | 'sa2' | 'sa3' | 'half_yearly' | 'yearly';
  academicYear: string;
  startDate?: string;
  endDate?: string;
  isPublished: number;
}

export interface ReportCardData {
  school: {
    name: string;
    code: string;
    logoUrl?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    primaryColor: string;
  };
  student: {
    id: string;
    admissionNo: string;
    rollNo?: number | null;
    name: string;
    className: string;
    sectionName: string;
    fatherName?: string | null;
    motherName?: string | null;
    dob?: string | null;
    bloodGroup?: string | null;
    photoUrl?: string | null;
  };
  exam: {
    id: string;
    name: string;
    examType: string;
    academicYear: string;
  };
  subjects: Array<{
    subjectName: string;
    subjectCode?: string | null;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    gradePoint: number;
    remarks?: string | null;
  }>;
  summary: {
    totalMarksObtained: number;
    totalMaxMarks: number;
    overallPercentage: number;
    overallGrade: string;
    overallGradePoint: number;
    overallRemarks: string;
    division: string;
    attendancePercentage: number;
    totalWorkingDays: number;
    presentDays: number;
  };
}

export interface FeeStructure {
  id: string;
  classId: string;
  title: string;
  amount: number;
  dueDate?: string;
  academicYear: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  receiptNo: string;
  status: string;
  remarks?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: number;
  sentViaApp: number;
  sentViaSms: number;
  createdAt: string;
}

export interface SMSLogItem {
  id: string;
  studentId?: string;
  phoneNumber: string;
  messageText: string;
  triggerReason: string;
  status: string;
  sentAt: string;
}
