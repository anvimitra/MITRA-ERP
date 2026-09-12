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
  affiliationNo?: string;
  principalName?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  establishedYear?: string;
  tagline?: string;
  apiSyncKey?: string;
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
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
  category?: string;
  userId?: string;
}

export interface AttendanceRecord {
  studentId: string;
  admissionNo: string;
  rollNo?: number;
  name: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'excused' | 'unmarked';
  remarks?: string;
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
  subjectCode?: string;
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

export interface CertificateItem {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  rollNo?: number;
  className?: string;
  sectionName?: string;
  certificateType: 'TRANSFER_CERTIFICATE' | 'BONAFIDE_CERTIFICATE' | 'CHARACTER_CERTIFICATE' | 'ADMIT_CARD' | 'APPRECIATION_AWARD';
  certificateNo: string;
  issueDate: string;
  academicYear: string;
  reason?: string;
  conduct?: string;
  status: string;
  extra?: any;
}

export interface VisitorItem {
  id: string;
  schoolId: string;
  visitorName: string;
  phone: string;
  purpose: string;
  whomToMeet: string;
  idCardType?: string;
  idCardNo?: string;
  checkIn: string;
  checkOut?: string;
  badgeNumber: string;
  status: 'IN' | 'OUT';
  date: string;
}

export interface InquiryItem {
  id: string;
  schoolId: string;
  studentName: string;
  parentName: string;
  phone: string;
  email?: string;
  classSeeking: string;
  source: string;
  status: 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED';
  followUpDate?: string;
  notes?: string;
  createdAt: string;
}

export interface PostalComplaintItem {
  id: string;
  schoolId: string;
  type: 'POSTAL_DISPATCH' | 'POSTAL_RECEIVE' | 'COMPLAINT' | 'CALL_LOG';
  title: string;
  referenceNo?: string;
  fromName?: string;
  toName?: string;
  contactPhone?: string;
  description?: string;
  actionTaken?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISPATCHED' | 'RECEIVED';
  date: string;
}

export interface StaffLeaveItem {
  id: string;
  schoolId: string;
  staffUserId: string;
  staffName?: string;
  staffRole?: string;
  staffEmail?: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'DUTY';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewRemarks?: string;
  appliedAt: string;
}

export interface StaffPayrollItem {
  id: string;
  schoolId: string;
  staffUserId: string;
  staffName?: string;
  staffRole?: string;
  monthYear: string;
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  deductionPf: number;
  deductionTax: number;
  deductionLeave: number;
  netSalary: number;
  paymentStatus: 'PAID' | 'GENERATED' | 'HOLD';
  paymentDate?: string;
  paymentMode: string;
  slipNo: string;
}

export interface LibraryBookItem {
  id: string;
  schoolId: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  subject?: string;
  rackNumber?: string;
  totalCopies: number;
  availableCopies: number;
  price?: number;
}

export interface LibraryIssueItem {
  id: string;
  schoolId: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  isbn?: string;
  studentId?: string;
  staffUserId?: string;
  borrowerName?: string;
  borrowerType?: string;
  admissionNo?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface TransportVehicleItem {
  id: string;
  schoolId: string;
  vehicleNo: string;
  vehicleModel?: string;
  seatingCapacity: number;
  driverName: string;
  driverPhone: string;
  driverLicense?: string;
  status: string;
}

export interface TransportStopItem {
  id: string;
  routeId: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  sequenceOrder: number;
}

export interface TransportRouteItem {
  id: string;
  schoolId: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  vehicleId?: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  monthlyFare: number;
  stops?: TransportStopItem[];
}

export interface StudentTransportItem {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  sectionName?: string;
  routeName: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  monthlyFare: number;
}

export interface InventoryItem {
  id: string;
  schoolId: string;
  name: string;
  category: 'STATIONERY' | 'UNIFORMS' | 'BOOKS' | 'LAB_EQUIPMENT' | 'SPORTS' | 'FURNITURE' | 'OTHER';
  unit: string;
  currentQuantity: number;
  minimumAlertQuantity: number;
  isLowStock?: boolean;
}

export interface InventoryTransactionItem {
  id: string;
  schoolId: string;
  itemId: string;
  itemName?: string;
  category?: string;
  unit?: string;
  transactionType: 'INWARD' | 'OUTWARD';
  quantity: number;
  unitPrice?: number;
  supplierOrRecipient: string;
  invoiceOrSlipNo?: string;
  date: string;
  notes?: string;
  creatorName?: string;
}
