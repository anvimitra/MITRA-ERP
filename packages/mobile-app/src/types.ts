export type Role = 'parent' | 'teacher' | 'principal' | 'accountant' | 'student' | 'super_admin' | 'driver';

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
  board?: string;
  servicesEnabled?: boolean | number;
  apiSyncKey?: string;
  studentCount?: number;
  teacherCount?: number;
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
  classId?: string;
  sectionId?: string;
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
  id?: string;
  allocationId?: string;
  studentId?: string;
  studentName?: string;
  admissionNo?: string;
  routeName: string;
  startLocation?: string;
  endLocation?: string;
  monthlyFare?: number;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  vehicleNo: string;
  vehicleModel?: string;
  driverName?: string;
  driverPhone?: string;
  currentLat?: number | null;
  currentLng?: number | null;
  currentSpeed?: number;
  currentHeading?: number;
  lastLocationUpdate?: string | null;
  isTripActive?: boolean;
}

export interface LiveVehicleTelemetry {
  id: string;
  vehicleNo: string;
  vehicleModel?: string;
  driverName: string;
  driverPhone: string;
  driverLicense?: string;
  status: string;
  currentLat?: number | null;
  currentLng?: number | null;
  currentSpeed?: number;
  currentHeading?: number;
  lastLocationUpdate?: string | null;
  isTripActive?: boolean;
}

export interface TransportStopItem {
  id: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  sequenceOrder: number;
}

export interface DriverBusInfo {
  assigned: boolean;
  message?: string;
  vehicle?: LiveVehicleTelemetry;
  route?: {
    id: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    monthlyFare: number;
  } | null;
  stops?: TransportStopItem[];
}

export interface ParentLiveBusTracking {
  hasTransport: boolean;
  message?: string;
  studentId?: string;
  vehicle?: LiveVehicleTelemetry | null;
  route?: {
    id: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    monthlyFare: number;
  } | null;
  studentStop?: TransportStopItem | null;
  allStops?: TransportStopItem[];
}

export interface FleetLiveInfo {
  schoolId: string;
  totalVehicles: number;
  activeTrips: number;
  vehicles: Array<LiveVehicleTelemetry & {
    routeName?: string;
    routeId?: string;
    stopsCount?: number;
    stops?: TransportStopItem[];
  }>;
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

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'teacher' | 'principal' | 'accountant' | 'super_admin';
  appInstalled?: number;
  isActive: number;
  createdAt: string;
}

export interface ParentChildLink {
  id: string;
  name: string;
  admissionNo: string;
  rollNo?: number;
  className?: string;
  sectionName?: string;
  gender?: string;
}

export interface ParentInfo {
  id: string;
  userId?: string | null;
  name: string;
  fatherName?: string;
  motherName?: string;
  phone: string;
  email?: string;
  address?: string;
  loginId?: string;
  passwordFormula?: string;
  autoPasswordPreview?: string;
  appInstalled?: number;
  lastActiveAt?: string | null;
  isActive?: number;
  children: ParentChildLink[];
  totalChildren: number;
}

export interface FeeStructureItem {
  id: string;
  schoolId?: string;
  classId: string;
  title: string;
  amount: number;
  dueDate?: string;
  academicYear?: string;
}

export interface FeePaymentRecord {
  id: string;
  studentId: string;
  studentName?: string;
  feeStructureId: string;
  feeTitle?: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  receiptNo: string;
  status: string;
  remarks?: string;
}

export interface ExamItem {
  id: string;
  name: string;
  examType: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
}

export interface MarksSheetStudent {
  studentId: string;
  admissionNo: string;
  rollNo?: number | null;
  name: string;
  marksObtained: number | '';
  maxMarks: number;
  grade: string;
  remarks: string;
}

export interface HomeworkItem {
  id: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  className?: string;
  sectionName?: string;
  subjectId?: string;
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate?: string;
  attachmentUrl?: string;
  createdAt: string;
}

