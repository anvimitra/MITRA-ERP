import { initializeDatabase } from './init.js';
import { db, schema, eq } from './index.js';
import { hashPassword } from '../services/auth.js';
import crypto from 'crypto';

export async function seedDatabase() {
  console.log('🌱 Seeding ANVIMITRA-ERP Database with rich multi-tenant sample data...');
  initializeDatabase();

  const now = new Date().toISOString();

  // 1. Schools / Tenants
  const dpsId = 'school-dps-01';
  const stxId = 'school-stx-02';
  const lskId = 'school-lsk-01';

  db.insert(schema.schools).values([
    {
      id: dpsId,
      name: 'Delhi Public Global Academy',
      code: 'DPS01',
      domain: 'dps.anvimitra.com',
      logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',
      primaryColor: '#1e40af', // Indigo Blue
      secondaryColor: '#172554',
      phone: '+91 98765 43210',
      email: 'info@dpsglobal.edu',
      address: 'Sector 14, Knowledge Park',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      affiliationNo: 'CBSE/AFF/1030948',
      principalName: 'Dr. R. K. Sharma',
      website: 'https://dpsglobal.edu',
      establishedYear: '2004',
      tagline: 'Empowering Minds, Inspiring Futures',
      apiSyncKey: 'ANVI_SYNC_DPS01_SECRET_KEY_9988',
      isActive: 1,
      createdAt: now,
    },
    {
      id: stxId,
      name: 'St. Xavier International School',
      code: 'STX02',
      domain: 'stx.anvimitra.com',
      logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150',
      primaryColor: '#059669', // Emerald Green
      secondaryColor: '#064e3b',
      phone: '+91 98123 45678',
      email: 'admissions@stxaviers.edu',
      address: 'Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006',
      affiliationNo: 'CBSE/AFF/1730412',
      principalName: 'Sr. Maria Fernandes',
      website: 'https://stxaviers.edu',
      establishedYear: '1995',
      tagline: 'Faith, Excellence, and Character',
      apiSyncKey: 'ANVI_SYNC_STX02_SECRET_KEY_7744',
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskId,
      name: 'LSK Academy',
      code: 'LSK01',
      domain: 'lsk.anvimitra.com',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150',
      primaryColor: '#7c3aed', // Royal Purple
      secondaryColor: '#4c1d95',
      phone: '+91 99887 76655',
      email: 'info@lskacademy.edu',
      address: '42-B, Shivaji Nagar',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462016',
      affiliationNo: 'CBSE/AFF/1032890',
      principalName: 'Dr. Meena Joshi',
      website: 'https://lskacademy.edu',
      establishedYear: '2012',
      tagline: 'Leading with Knowledge, Growing with Values',
      apiSyncKey: 'ANVI_SYNC_LSK01_SECRET_KEY_5566',
      isActive: 1,
      createdAt: now,
    },
  ]).onConflictDoNothing().run();

  // 2. Users (Super Admin, Principal, Teachers, Staff, Parents)
  const superAdminId = 'user-superadmin';
  const principalId = 'user-principal-dps';
  const teacher1Id = 'user-teacher-sharma';
  const teacher2Id = 'user-teacher-verma';
  const staffId = 'user-accountant-dps';
  const parent1UserId = 'user-parent-rahul';
  const parent2UserId = 'user-parent-priya';

  db.insert(schema.users).values([
    {
      id: superAdminId,
      schoolId: null, // Global access
      role: 'super_admin',
      name: 'Super Administrator',
      email: 'superadmin@anvimitra.com',
      phone: '+91 90000 00001',
      passwordHash: hashPassword('admin123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: principalId,
      schoolId: dpsId,
      role: 'principal',
      name: 'Dr. Rajesh Khanna (Principal)',
      email: 'principal@dps.edu',
      phone: '+91 98765 00001',
      passwordHash: hashPassword('principal123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: teacher1Id,
      schoolId: dpsId,
      role: 'teacher',
      name: 'Mrs. Sunita Sharma (Class Teacher 10-A & Math)',
      email: 'sharma@dps.edu',
      phone: '+91 98765 00002',
      passwordHash: hashPassword('teacher123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: teacher2Id,
      schoolId: dpsId,
      role: 'teacher',
      name: 'Mr. Amit Verma (Science Faculty)',
      email: 'verma@dps.edu',
      phone: '+91 98765 00003',
      passwordHash: hashPassword('teacher123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: staffId,
      schoolId: dpsId,
      role: 'accountant',
      name: 'Vikram Mehta (Accounts & Fees)',
      email: 'accountant@dps.edu',
      phone: '+91 98765 00004',
      passwordHash: hashPassword('staff123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: parent1UserId,
      schoolId: dpsId,
      role: 'parent',
      name: 'Manoj Sharma (Rahul\'s Father)',
      email: 'parent.rahul@gmail.com',
      phone: '+91 98111 22334',
      passwordHash: hashPassword('parent123'),
      appInstalled: 1, // ACTIVE ON APP -> Will receive Push Notifications
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: parent2UserId,
      schoolId: dpsId,
      role: 'parent',
      name: 'Suresh Patel (Priya\'s Father)',
      email: 'parent.priya@gmail.com',
      phone: '+91 98222 33445',
      passwordHash: hashPassword('parent123'),
      appInstalled: 0, // INACTIVE ON APP -> Will receive AUTOMATED TEXT SMS FALLBACK!
      lastActiveAt: null,
      isActive: 1,
      createdAt: now,
    },
  ]).onConflictDoNothing().run();

  // 3. Classes and Sections (Grades 1 to 12 for all schools)
  const schoolIds = [dpsId, stxId, lskId];
  const allGeneratedClasses: Array<{ id: string; schoolId: string; name: string; gradeLevel: number }> = [];
  const allGeneratedSections: Array<{ id: string; schoolId: string; classId: string; name: string }> = [];

  const class10Id = 'class-10';
  const class9Id = 'class-9';
  const sec10AId = 'sec-10-a';
  const sec10BId = 'sec-10-b';
  const sec9AId = 'sec-9-a';

  // Seed baseline DPS IDs for test suite & sample students
  allGeneratedClasses.push(
    { id: class10Id, schoolId: dpsId, name: 'Class 10', gradeLevel: 10 },
    { id: class9Id, schoolId: dpsId, name: 'Class 9', gradeLevel: 9 }
  );
  allGeneratedSections.push(
    { id: sec10AId, schoolId: dpsId, classId: class10Id, name: 'A' },
    { id: sec10BId, schoolId: dpsId, classId: class10Id, name: 'B' },
    { id: sec9AId, schoolId: dpsId, classId: class9Id, name: 'A' }
  );

  // Generate Classes 1 to 12 for all schools
  schoolIds.forEach((schId) => {
    for (let g = 1; g <= 12; g++) {
      if (schId === dpsId && (g === 9 || g === 10)) {
        continue;
      }
      const cId = `class-${schId}-${g}`;
      const cName = g === 11 ? 'Class 11 (Sci/Comm)' : g === 12 ? 'Class 12 (Sci/Comm)' : `Class ${g}`;
      allGeneratedClasses.push({
        id: cId,
        schoolId: schId,
        name: cName,
        gradeLevel: g,
      });

      allGeneratedSections.push(
        { id: `sec-${cId}-a`, schoolId: schId, classId: cId, name: 'A' },
        { id: `sec-${cId}-b`, schoolId: schId, classId: cId, name: 'B' }
      );
    }
  });

  db.insert(schema.classes).values(allGeneratedClasses).onConflictDoNothing().run();
  db.insert(schema.sections).values(allGeneratedSections).onConflictDoNothing().run();

  // 4. Subjects
  const subMath = 'sub-math';
  const subSci = 'sub-sci';
  const subEng = 'sub-eng';
  const subSSt = 'sub-sst';
  const subHindi = 'sub-hindi';

  db.insert(schema.subjects).values([
    { id: subMath, schoolId: dpsId, name: 'Mathematics', code: 'MATH-041' },
    { id: subSci, schoolId: dpsId, name: 'Science & Tech', code: 'SCI-086' },
    { id: subEng, schoolId: dpsId, name: 'English Communicative', code: 'ENG-101' },
    { id: subSSt, schoolId: dpsId, name: 'Social Studies', code: 'SST-087' },
    { id: subHindi, schoolId: dpsId, name: 'Hindi Course A', code: 'HIN-002' },
  ]).onConflictDoNothing().run();

  // 5. Strict Class Teacher Assignment:
  // Sunita Sharma is strictly the Class Teacher of Class 10-A
  db.insert(schema.classTeachers).values([
    {
      id: 'ct-10-a',
      schoolId: dpsId,
      classId: class10Id,
      sectionId: sec10AId,
      teacherId: teacher1Id,
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // 6. Strict Subject Allocations:
  // Sunita Sharma -> Mathematics for Class 10-A
  // Amit Verma -> Science for Class 10-A
  db.insert(schema.subjectAllocations).values([
    {
      id: 'sub-alloc-math-10a',
      schoolId: dpsId,
      teacherId: teacher1Id,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subMath,
      academicYear: '2026-2027',
    },
    {
      id: 'sub-alloc-sci-10a',
      schoolId: dpsId,
      teacherId: teacher2Id,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subSci,
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // 7. Parents
  const parent1Id = 'parent-record-rahul';
  const parent2Id = 'parent-record-priya';

  db.insert(schema.parents).values([
    {
      id: parent1Id,
      schoolId: dpsId,
      userId: parent1UserId,
      fatherName: 'Mr. Manoj Sharma',
      motherName: 'Mrs. Neeta Sharma',
      primaryPhone: '+91 98111 22334',
      email: 'parent.rahul@gmail.com',
      address: 'Flat 402, Royal Palms, New Delhi',
    },
    {
      id: parent2Id,
      schoolId: dpsId,
      userId: parent2UserId,
      fatherName: 'Mr. Suresh Patel',
      motherName: 'Mrs. Rekha Patel',
      primaryPhone: '+91 98222 33445',
      email: 'parent.priya@gmail.com',
      address: 'House 12, Gulmohar Enclave, New Delhi',
    },
  ]).onConflictDoNothing().run();

  // 8. Students
  const stuRahulId = 'stu-rahul-01';
  const stuPriyaId = 'stu-priya-02';
  const stuAaravId = 'stu-aarav-03';
  const stuAnanyaId = 'stu-ananya-04';

  db.insert(schema.students).values([
    {
      id: stuRahulId,
      schoolId: dpsId,
      admissionNo: 'DPS/2026/1001',
      rollNo: 1,
      firstName: 'Rahul',
      lastName: 'Sharma',
      classId: class10Id,
      sectionId: sec10AId,
      parentId: parent1Id,
      gender: 'Male',
      dob: '2011-04-15',
      bloodGroup: 'B+',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      isActive: 1,
    },
    {
      id: stuPriyaId,
      schoolId: dpsId,
      admissionNo: 'DPS/2026/1002',
      rollNo: 2,
      firstName: 'Priya',
      lastName: 'Patel',
      classId: class10Id,
      sectionId: sec10AId,
      parentId: parent2Id,
      gender: 'Female',
      dob: '2011-08-20',
      bloodGroup: 'O+',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
      isActive: 1,
    },
    {
      id: stuAaravId,
      schoolId: dpsId,
      admissionNo: 'DPS/2026/1003',
      rollNo: 3,
      firstName: 'Aarav',
      lastName: 'Singh',
      classId: class10Id,
      sectionId: sec10AId,
      parentId: null,
      gender: 'Male',
      dob: '2011-02-10',
      bloodGroup: 'A+',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
      isActive: 1,
    },
    {
      id: stuAnanyaId,
      schoolId: dpsId,
      admissionNo: 'DPS/2026/1004',
      rollNo: 4,
      firstName: 'Ananya',
      lastName: 'Gupta',
      classId: class10Id,
      sectionId: sec10AId,
      parentId: null,
      gender: 'Female',
      dob: '2011-11-05',
      bloodGroup: 'AB+',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      isActive: 1,
    },
  ]).onConflictDoNothing().run();

  // 9. Exams
  const examWeeklyId = 'exam-weekly-01';
  const examSA1Id = 'exam-sa1-term1';
  const examHalfYearlyId = 'exam-halfyearly';
  const examYearlyId = 'exam-annual-yearly';

  db.insert(schema.exams).values([
    {
      id: examWeeklyId,
      schoolId: dpsId,
      name: 'Weekly Test 1 (Mathematics & Science)',
      examType: 'weekly',
      academicYear: '2026-2027',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      isPublished: 1,
    },
    {
      id: examSA1Id,
      schoolId: dpsId,
      name: 'Summative Assessment 1 (SA1)',
      examType: 'sa1',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
      isPublished: 1,
    },
    {
      id: examHalfYearlyId,
      schoolId: dpsId,
      name: 'Half Yearly Examination 2026',
      examType: 'half_yearly',
      academicYear: '2026-2027',
      startDate: '2026-10-10',
      endDate: '2026-10-25',
      isPublished: 1,
    },
    {
      id: examYearlyId,
      schoolId: dpsId,
      name: 'Annual / Yearly Board Exam 2027',
      examType: 'yearly',
      academicYear: '2026-2027',
      startDate: '2027-02-15',
      endDate: '2027-03-05',
      isPublished: 0,
    },
  ]).onConflictDoNothing().run();

  // 10. Sample Marks for SA1
  db.insert(schema.marks).values([
    // Rahul's marks for SA1
    {
      id: 'mark-sa1-rahul-math',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuRahulId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subMath,
      marksObtained: 94,
      maxMarks: 100,
      grade: 'A1',
      remarks: 'Brilliant conceptual clarity',
      markedByTeacherId: teacher1Id,
    },
    {
      id: 'mark-sa1-rahul-sci',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuRahulId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subSci,
      marksObtained: 89,
      maxMarks: 100,
      grade: 'A2',
      remarks: 'Very good in practicals',
      markedByTeacherId: teacher2Id,
    },
    {
      id: 'mark-sa1-rahul-eng',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuRahulId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subEng,
      marksObtained: 92,
      maxMarks: 100,
      grade: 'A1',
      remarks: 'Eloquent expression',
      markedByTeacherId: teacher1Id,
    },
    {
      id: 'mark-sa1-rahul-sst',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuRahulId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subSSt,
      marksObtained: 86,
      maxMarks: 100,
      grade: 'A2',
      remarks: 'Good grasp of history',
      markedByTeacherId: teacher1Id,
    },
    {
      id: 'mark-sa1-rahul-hin',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuRahulId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subHindi,
      marksObtained: 91,
      maxMarks: 100,
      grade: 'A1',
      remarks: 'Excellent vocabulary',
      markedByTeacherId: teacher1Id,
    },

    // Priya's marks for SA1
    {
      id: 'mark-sa1-priya-math',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuPriyaId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subMath,
      marksObtained: 88,
      maxMarks: 100,
      grade: 'A2',
      remarks: 'Good accuracy',
      markedByTeacherId: teacher1Id,
    },
    {
      id: 'mark-sa1-priya-sci',
      schoolId: dpsId,
      examId: examSA1Id,
      studentId: stuPriyaId,
      classId: class10Id,
      sectionId: sec10AId,
      subjectId: subSci,
      marksObtained: 95,
      maxMarks: 100,
      grade: 'A1',
      remarks: 'Outstanding science project',
      markedByTeacherId: teacher2Id,
    },
  ]).onConflictDoNothing().run();

  // 11. Fee Structures & Payments
  const feeTuitionId = 'fee-tuition-q1';
  const feeExamId = 'fee-exam-annual';

  db.insert(schema.feeStructures).values([
    {
      id: feeTuitionId,
      schoolId: dpsId,
      classId: class10Id,
      title: 'Tuition Fee - Quarter 1 (Apr - Jun)',
      amount: 18500,
      dueDate: '2026-04-10',
      academicYear: '2026-2027',
    },
    {
      id: feeExamId,
      schoolId: dpsId,
      classId: class10Id,
      title: 'Examination & Lab Composite Fee',
      amount: 4500,
      dueDate: '2026-09-01',
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // Rahul has paid Tuition fee
  db.insert(schema.feePayments).values([
    {
      id: 'pay-001-rahul',
      schoolId: dpsId,
      studentId: stuRahulId,
      feeStructureId: feeTuitionId,
      amountPaid: 18500,
      paymentDate: '2026-04-05',
      paymentMode: 'upi',
      receiptNo: 'RCP-2026-104921',
      status: 'paid',
      remarks: 'Paid via Google Pay',
    },
  ]).onConflictDoNothing().run();

  // 12. Sample Attendance Records
  const dates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'];
  for (const d of dates) {
    db.insert(schema.attendance).values([
      {
        id: `att-rahul-${d}`,
        schoolId: dpsId,
        studentId: stuRahulId,
        classId: class10Id,
        sectionId: sec10AId,
        date: d,
        status: d === '2026-09-03' ? 'late' : 'present',
        markedByTeacherId: teacher1Id,
        remarks: d === '2026-09-03' ? 'Bus delayed' : 'On time',
        createdAt: now,
      },
      {
        id: `att-priya-${d}`,
        schoolId: dpsId,
        studentId: stuPriyaId,
        classId: class10Id,
        sectionId: sec10AId,
        date: d,
        status: d === '2026-09-06' ? 'absent' : 'present',
        markedByTeacherId: teacher1Id,
        remarks: d === '2026-09-06' ? 'Sick leave requested' : 'Present',
        createdAt: now,
      },
      {
        id: `att-aarav-${d}`,
        schoolId: dpsId,
        studentId: stuAaravId,
        classId: class10Id,
        sectionId: sec10AId,
        date: d,
        status: 'present',
        markedByTeacherId: teacher1Id,
        remarks: 'Present',
        createdAt: now,
      },
    ]).onConflictDoNothing().run();
  }

  // Sample SMS log demonstrating the SMS fallback
  db.insert(schema.smsLogs).values([
    {
      id: 'sms-log-demo-01',
      schoolId: dpsId,
      studentId: stuPriyaId,
      phoneNumber: '+91 98222 33445',
      messageText: '[ANVIMITRA-ERP] Attendance Alert: ABSENT: Priya Patel has been marked ABSENT on 2026-09-06.',
      triggerReason: 'parent_inactive_on_app',
      status: 'delivered',
      sentAt: now,
    },
  ]).onConflictDoNothing().run();

  // ============================================================
  // ====  LSK ACADEMY (LSK01)  Full School Tenant Seed  ========
  // ============================================================

  // LSK Users
  const lskPrincipalId   = 'user-principal-lsk';
  const lskTeacher1Id    = 'user-teacher-rani-lsk';
  const lskTeacher2Id    = 'user-teacher-kiran-lsk';
  const lskAccountantId  = 'user-accountant-lsk';
  const lskParent1UserId = 'user-parent-aryan-lsk';
  const lskParent2UserId = 'user-parent-zara-lsk';

  db.insert(schema.users).values([
    {
      id: lskPrincipalId,
      schoolId: lskId,
      role: 'principal',
      name: 'Dr. Meena Joshi (Principal, LSK Academy)',
      email: 'principal@lskacademy.edu',
      phone: '+91 99887 00001',
      passwordHash: hashPassword('principal123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskTeacher1Id,
      schoolId: lskId,
      role: 'teacher',
      name: 'Mrs. Rani Dubey (Class Teacher 8-A & Math)',
      email: 'rani@lskacademy.edu',
      phone: '+91 99887 00002',
      passwordHash: hashPassword('teacher123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskTeacher2Id,
      schoolId: lskId,
      role: 'teacher',
      name: 'Mr. Kiran Pande (Science Faculty)',
      email: 'kiran@lskacademy.edu',
      phone: '+91 99887 00003',
      passwordHash: hashPassword('teacher123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskAccountantId,
      schoolId: lskId,
      role: 'accountant',
      name: 'Seema Kapoor (Accounts & Fees)',
      email: 'accounts@lskacademy.edu',
      phone: '+91 99887 00004',
      passwordHash: hashPassword('staff123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskParent1UserId,
      schoolId: lskId,
      role: 'parent',
      name: 'Rohit Mishra (Aryan\'s Father)',
      email: 'parent.aryan@gmail.com',
      phone: '+91 98333 44556',
      passwordHash: hashPassword('parent123'),
      appInstalled: 1, // App active -> push notification
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: lskParent2UserId,
      schoolId: lskId,
      role: 'parent',
      name: 'Farida Shaikh (Zara\'s Mother)',
      email: 'parent.zara@gmail.com',
      phone: '+91 98444 55667',
      passwordHash: hashPassword('parent123'),
      appInstalled: 0, // Inactive -> SMS fallback
      lastActiveAt: null,
      isActive: 1,
      createdAt: now,
    },
  ]).onConflictDoNothing().run();

  // LSK Classes & Sections
  const lskClass8Id  = 'lsk-class-8';
  const lskClass7Id  = 'lsk-class-7';
  const lskSec8AId   = 'lsk-sec-8-a';
  const lskSec8BId   = 'lsk-sec-8-b';
  const lskSec7AId   = 'lsk-sec-7-a';

  db.insert(schema.classes).values([
    { id: lskClass8Id, schoolId: lskId, name: 'Class 8', gradeLevel: 8 },
    { id: lskClass7Id, schoolId: lskId, name: 'Class 7', gradeLevel: 7 },
  ]).onConflictDoNothing().run();

  db.insert(schema.sections).values([
    { id: lskSec8AId, schoolId: lskId, classId: lskClass8Id, name: 'A' },
    { id: lskSec8BId, schoolId: lskId, classId: lskClass8Id, name: 'B' },
    { id: lskSec7AId, schoolId: lskId, classId: lskClass7Id, name: 'A' },
  ]).onConflictDoNothing().run();

  // LSK Subjects
  const lskSubMath  = 'lsk-sub-math';
  const lskSubSci   = 'lsk-sub-sci';
  const lskSubEng   = 'lsk-sub-eng';
  const lskSubSSt   = 'lsk-sub-sst';
  const lskSubHindi = 'lsk-sub-hindi';

  db.insert(schema.subjects).values([
    { id: lskSubMath,  schoolId: lskId, name: 'Mathematics',          code: 'LSK-MATH-8' },
    { id: lskSubSci,   schoolId: lskId, name: 'General Science',       code: 'LSK-SCI-8'  },
    { id: lskSubEng,   schoolId: lskId, name: 'English Language',      code: 'LSK-ENG-8'  },
    { id: lskSubSSt,   schoolId: lskId, name: 'Social Science',        code: 'LSK-SST-8'  },
    { id: lskSubHindi, schoolId: lskId, name: 'Hindi (Course B)',       code: 'LSK-HIN-8'  },
  ]).onConflictDoNothing().run();

  // Class Teacher: Rani Dubey -> Class 8-A
  db.insert(schema.classTeachers).values([
    {
      id: 'lsk-ct-8-a',
      schoolId: lskId,
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      teacherId: lskTeacher1Id,
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // Subject Allocations: Rani -> Math 8-A, Kiran -> Science 8-A
  db.insert(schema.subjectAllocations).values([
    {
      id: 'lsk-sub-alloc-math-8a',
      schoolId: lskId,
      teacherId: lskTeacher1Id,
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      subjectId: lskSubMath,
      academicYear: '2026-2027',
    },
    {
      id: 'lsk-sub-alloc-sci-8a',
      schoolId: lskId,
      teacherId: lskTeacher2Id,
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      subjectId: lskSubSci,
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // LSK Parents records
  const lskParent1Id = 'lsk-parent-aryan';
  const lskParent2Id = 'lsk-parent-zara';

  db.insert(schema.parents).values([
    {
      id: lskParent1Id,
      schoolId: lskId,
      userId: lskParent1UserId,
      fatherName: 'Mr. Rohit Mishra',
      motherName: 'Mrs. Anita Mishra',
      primaryPhone: '+91 98333 44556',
      email: 'parent.aryan@gmail.com',
      address: 'Plot 7, Arera Colony, Bhopal',
    },
    {
      id: lskParent2Id,
      schoolId: lskId,
      userId: lskParent2UserId,
      fatherName: 'Mr. Imran Shaikh',
      motherName: 'Mrs. Farida Shaikh',
      primaryPhone: '+91 98444 55667',
      email: 'parent.zara@gmail.com',
      address: '12, TT Nagar, Bhopal',
    },
  ]).onConflictDoNothing().run();

  // LSK Students
  const lskStuAryanId = 'lsk-stu-aryan-01';
  const lskStuZaraId  = 'lsk-stu-zara-02';
  const lskStuDevId   = 'lsk-stu-dev-03';
  const lskStuIshId   = 'lsk-stu-ish-04';

  db.insert(schema.students).values([
    {
      id: lskStuAryanId,
      schoolId: lskId,
      admissionNo: 'LSK/2026/2001',
      rollNo: 1,
      firstName: 'Aryan',
      lastName: 'Mishra',
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      parentId: lskParent1Id,
      gender: 'Male',
      dob: '2012-06-10',
      bloodGroup: 'A+',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      isActive: 1,
    },
    {
      id: lskStuZaraId,
      schoolId: lskId,
      admissionNo: 'LSK/2026/2002',
      rollNo: 2,
      firstName: 'Zara',
      lastName: 'Shaikh',
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      parentId: lskParent2Id,
      gender: 'Female',
      dob: '2012-11-22',
      bloodGroup: 'B+',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      isActive: 1,
    },
    {
      id: lskStuDevId,
      schoolId: lskId,
      admissionNo: 'LSK/2026/2003',
      rollNo: 3,
      firstName: 'Dev',
      lastName: 'Tiwari',
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      parentId: null,
      gender: 'Male',
      dob: '2012-03-18',
      bloodGroup: 'O+',
      photoUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120',
      isActive: 1,
    },
    {
      id: lskStuIshId,
      schoolId: lskId,
      admissionNo: 'LSK/2026/2004',
      rollNo: 4,
      firstName: 'Ishita',
      lastName: 'Rai',
      classId: lskClass8Id,
      sectionId: lskSec8AId,
      parentId: null,
      gender: 'Female',
      dob: '2012-08-30',
      bloodGroup: 'AB+',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
      isActive: 1,
    },
  ]).onConflictDoNothing().run();

  // LSK Exams (all 6 types: Weekly, SA1, SA2, SA3, Half-Yearly, Yearly)
  const lskExamWeeklyId  = 'lsk-exam-weekly-01';
  const lskExamSA1Id     = 'lsk-exam-sa1';
  const lskExamSA2Id     = 'lsk-exam-sa2';
  const lskExamSA3Id     = 'lsk-exam-sa3';
  const lskExamHalfId    = 'lsk-exam-halfyearly';
  const lskExamYearlyId  = 'lsk-exam-yearly';

  db.insert(schema.exams).values([
    {
      id: lskExamWeeklyId,
      schoolId: lskId,
      name: 'Weekly Test 1 – Math & Science',
      examType: 'weekly',
      academicYear: '2026-2027',
      startDate: '2026-08-12',
      endDate: '2026-08-14',
      isPublished: 1,
    },
    {
      id: lskExamSA1Id,
      schoolId: lskId,
      name: 'Summative Assessment 1 (SA1)',
      examType: 'sa1',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2026-09-14',
      isPublished: 1,
    },
    {
      id: lskExamSA2Id,
      schoolId: lskId,
      name: 'Summative Assessment 2 (SA2)',
      examType: 'sa2',
      academicYear: '2026-2027',
      startDate: '2026-11-10',
      endDate: '2026-11-22',
      isPublished: 0,
    },
    {
      id: lskExamSA3Id,
      schoolId: lskId,
      name: 'Summative Assessment 3 (SA3)',
      examType: 'sa3',
      academicYear: '2026-2027',
      startDate: '2027-01-08',
      endDate: '2027-01-18',
      isPublished: 0,
    },
    {
      id: lskExamHalfId,
      schoolId: lskId,
      name: 'Half Yearly Examination 2026',
      examType: 'half_yearly',
      academicYear: '2026-2027',
      startDate: '2026-10-15',
      endDate: '2026-10-28',
      isPublished: 1,
    },
    {
      id: lskExamYearlyId,
      schoolId: lskId,
      name: 'Annual / Yearly Examination 2027',
      examType: 'yearly',
      academicYear: '2026-2027',
      startDate: '2027-02-20',
      endDate: '2027-03-08',
      isPublished: 0,
    },
  ]).onConflictDoNothing().run();

  // LSK Marks – SA1 for Aryan and Zara
  db.insert(schema.marks).values([
    { id: 'lsk-mark-sa1-aryan-math',  schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuAryanId, classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubMath,  marksObtained: 96, maxMarks: 100, grade: 'A1', remarks: 'Exceptional problem solving', markedByTeacherId: lskTeacher1Id },
    { id: 'lsk-mark-sa1-aryan-sci',   schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuAryanId, classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubSci,   marksObtained: 91, maxMarks: 100, grade: 'A1', remarks: 'Very good lab work',         markedByTeacherId: lskTeacher2Id },
    { id: 'lsk-mark-sa1-aryan-eng',   schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuAryanId, classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubEng,   marksObtained: 88, maxMarks: 100, grade: 'A2', remarks: 'Good comprehension',         markedByTeacherId: lskTeacher1Id },
    { id: 'lsk-mark-sa1-aryan-sst',   schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuAryanId, classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubSSt,   marksObtained: 83, maxMarks: 100, grade: 'A2', remarks: 'Needs to improve maps',      markedByTeacherId: lskTeacher1Id },
    { id: 'lsk-mark-sa1-aryan-hindi', schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuAryanId, classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubHindi, marksObtained: 90, maxMarks: 100, grade: 'A1', remarks: 'Excellent essay writing',     markedByTeacherId: lskTeacher1Id },
    { id: 'lsk-mark-sa1-zara-math',   schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuZaraId,  classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubMath,  marksObtained: 79, maxMarks: 100, grade: 'B1', remarks: 'Good effort',                markedByTeacherId: lskTeacher1Id },
    { id: 'lsk-mark-sa1-zara-sci',    schoolId: lskId, examId: lskExamSA1Id, studentId: lskStuZaraId,  classId: lskClass8Id, sectionId: lskSec8AId, subjectId: lskSubSci,   marksObtained: 85, maxMarks: 100, grade: 'A2', remarks: 'Strong in Biology part',     markedByTeacherId: lskTeacher2Id },
  ]).onConflictDoNothing().run();

  // LSK Attendance (last 6 school days)
  const lskDates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'];
  for (const d of lskDates) {
    db.insert(schema.attendance).values([
      {
        id: `lsk-att-aryan-${d}`,
        schoolId: lskId,
        studentId: lskStuAryanId,
        classId: lskClass8Id,
        sectionId: lskSec8AId,
        date: d,
        status: 'present',
        markedByTeacherId: lskTeacher1Id,
        remarks: 'Present',
        createdAt: now,
      },
      {
        id: `lsk-att-zara-${d}`,
        schoolId: lskId,
        studentId: lskStuZaraId,
        classId: lskClass8Id,
        sectionId: lskSec8AId,
        date: d,
        status: d === '2026-09-06' ? 'absent' : 'present',
        markedByTeacherId: lskTeacher1Id,
        remarks: d === '2026-09-06' ? 'Not feeling well' : 'Present',
        createdAt: now,
      },
      {
        id: `lsk-att-dev-${d}`,
        schoolId: lskId,
        studentId: lskStuDevId,
        classId: lskClass8Id,
        sectionId: lskSec8AId,
        date: d,
        status: d === '2026-09-04' ? 'late' : 'present',
        markedByTeacherId: lskTeacher1Id,
        remarks: d === '2026-09-04' ? 'Late due to rain' : 'Present',
        createdAt: now,
      },
    ]).onConflictDoNothing().run();
  }

  // LSK Fee Structures & Payments
  const lskFeeTuitionId = 'lsk-fee-tuition-q1';
  const lskFeeExamId    = 'lsk-fee-exam-2026';

  db.insert(schema.feeStructures).values([
    {
      id: lskFeeTuitionId,
      schoolId: lskId,
      classId: lskClass8Id,
      title: 'Tuition Fee – Quarter 1 (Apr–Jun)',
      amount: 12000,
      dueDate: '2026-04-15',
      academicYear: '2026-2027',
    },
    {
      id: lskFeeExamId,
      schoolId: lskId,
      classId: lskClass8Id,
      title: 'Examination & Activity Fee',
      amount: 3500,
      dueDate: '2026-09-05',
      academicYear: '2026-2027',
    },
  ]).onConflictDoNothing().run();

  // Aryan has paid tuition; exam fee is pending (reminder will trigger)
  db.insert(schema.feePayments).values([
    {
      id: 'lsk-pay-001-aryan',
      schoolId: lskId,
      studentId: lskStuAryanId,
      feeStructureId: lskFeeTuitionId,
      amountPaid: 12000,
      paymentDate: '2026-04-10',
      paymentMode: 'upi',
      receiptNo: 'LSK-RCP-2026-400101',
      status: 'paid',
      remarks: 'Paid via PhonePe',
    },
  ]).onConflictDoNothing().run();

  // SMS log for Zara's absent notification (Farida is inactive on app)
  db.insert(schema.smsLogs).values([
    {
      id: 'lsk-sms-log-001',
      schoolId: lskId,
      studentId: lskStuZaraId,
      phoneNumber: '+91 98444 55667',
      messageText: '[ANVIMITRA-ERP] Attendance Alert: ABSENT: Zara Shaikh has been marked ABSENT on 2026-09-06. – LSK Academy',
      triggerReason: 'parent_inactive_on_app',
      status: 'delivered',
      sentAt: now,
    },
  ]).onConflictDoNothing().run();

  // 12. Student User Accounts (For Student Portal)
  const studentRahulUserId = 'user-student-rahul';
  const studentAryanUserId = 'user-student-aryan';

  db.insert(schema.users).values([
    {
      id: studentRahulUserId,
      schoolId: dpsId,
      role: 'student',
      name: 'Rahul Sharma',
      email: 'student.rahul@dps.edu',
      phone: '+91 98111 22334',
      passwordHash: hashPassword('student123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
    {
      id: studentAryanUserId,
      schoolId: lskId,
      role: 'student',
      name: 'Aryan Mishra',
      email: 'student.aryan@lskacademy.edu',
      phone: '+91 98333 44556',
      passwordHash: hashPassword('student123'),
      appInstalled: 1,
      lastActiveAt: now,
      isActive: 1,
      createdAt: now,
    },
  ]).onConflictDoNothing().run();

  // Update students with extended profile data and link user_id
  db.update(schema.students)
    .set({
      userId: studentRahulUserId,
      emergencyPhone: '+91 98111 99887',
      medicalConditions: 'None',
      allergies: 'Peanuts (Mild)',
      category: 'General',
    })
    .where(eq(schema.students.id, stuRahulId))
    .run();

  db.update(schema.students)
    .set({
      userId: studentAryanUserId,
      emergencyPhone: '+91 98333 88776',
      medicalConditions: 'Asthma (Carries Inhaler)',
      allergies: 'Dust allergy',
      category: 'OBC',
    })
    .where(eq(schema.students.id, lskStuAryanId))
    .run();

  // 13. Timetable Scheduling Matrix (6 Days x 8 Periods)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // DPS Class 10-A Timetable
  const dpsTimetableEntries: any[] = [];
  const dpsScheduleTemplate = [
    { period: 1, start: '08:30', end: '09:15', subject: subMath, teacher: teacher1Id, room: 'Room 101' },
    { period: 2, start: '09:15', end: '10:00', subject: subSci, teacher: teacher2Id, room: 'Room 101' },
    { period: 3, start: '10:00', end: '10:45', subject: subEng, teacher: teacher1Id, room: 'Room 101' },
    { period: 4, start: '10:45', end: '11:30', subject: subSSt, teacher: teacher2Id, room: 'Room 101' },
    { period: 5, start: '12:00', end: '12:45', subject: subHindi, teacher: teacher1Id, room: 'Room 101' },
    { period: 6, start: '12:45', end: '01:30', subject: subSci, teacher: teacher2Id, room: 'Science Lab A' },
    { period: 7, start: '01:30', end: '02:15', subject: subMath, teacher: teacher1Id, room: 'Room 101' },
    { period: 8, start: '02:15', end: '03:00', subject: subEng, teacher: teacher2Id, room: 'Ground / Library' },
  ];

  for (const day of daysOfWeek) {
    for (const p of dpsScheduleTemplate) {
      dpsTimetableEntries.push({
        id: `dps-tt-${class10Id}-${day.toLowerCase()}-p${p.period}`,
        schoolId: dpsId,
        classId: class10Id,
        sectionId: sec10AId,
        dayOfWeek: day,
        periodNumber: p.period,
        startTime: p.start,
        endTime: p.end,
        subjectId: p.subject,
        teacherId: p.teacher,
        roomNumber: p.room,
      });
    }
  }
  db.insert(schema.timetablePeriods).values(dpsTimetableEntries).onConflictDoNothing().run();

  // LSK Class 8-A Timetable
  const lskTimetableEntries: any[] = [];
  const lskScheduleTemplate = [
    { period: 1, start: '08:30', end: '09:15', subject: lskSubMath, teacher: lskTeacher1Id, room: 'Room 204' },
    { period: 2, start: '09:15', end: '10:00', subject: lskSubSci, teacher: lskTeacher2Id, room: 'Room 204' },
    { period: 3, start: '10:00', end: '10:45', subject: lskSubEng, teacher: lskTeacher1Id, room: 'Room 204' },
    { period: 4, start: '10:45', end: '11:30', subject: lskSubSSt, teacher: lskTeacher2Id, room: 'Room 204' },
    { period: 5, start: '12:00', end: '12:45', subject: lskSubHindi, teacher: lskTeacher1Id, room: 'Room 204' },
    { period: 6, start: '12:45', end: '01:30', subject: lskSubSci, teacher: lskTeacher2Id, room: 'Junior Lab' },
    { period: 7, start: '01:30', end: '02:15', subject: lskSubMath, teacher: lskTeacher1Id, room: 'Room 204' },
    { period: 8, start: '02:15', end: '03:00', subject: lskSubSSt, teacher: lskTeacher2Id, room: 'Activity Hall' },
  ];

  for (const day of daysOfWeek) {
    for (const p of lskScheduleTemplate) {
      lskTimetableEntries.push({
        id: `lsk-tt-${lskClass8Id}-${day.toLowerCase()}-p${p.period}`,
        schoolId: lskId,
        classId: lskClass8Id,
        sectionId: lskSec8AId,
        dayOfWeek: day,
        periodNumber: p.period,
        startTime: p.start,
        endTime: p.end,
        subjectId: p.subject,
        teacherId: p.teacher,
        roomNumber: p.room,
      });
    }
  }
  db.insert(schema.timetablePeriods).values(lskTimetableEntries).onConflictDoNothing().run();

  // 14. Student Logs (Discipline, Awards, Observations, Medical)
  db.insert(schema.studentLogs).values([
    {
      id: 'log-dps-rahul-01',
      schoolId: dpsId,
      studentId: stuRahulId,
      logType: 'award',
      title: '1st Place in Regional Science Olympiad',
      description: 'Rahul secured Rank 1 in the State Level Science & Mathematics Olympiad with an exceptional score of 98%.',
      actionTaken: 'Certificate of Distinction & Trophy awarded during school morning assembly.',
      reportedByUserId: teacher2Id,
      date: '2026-09-02',
      notifyParent: 1,
      createdAt: now,
    },
    {
      id: 'log-dps-rahul-02',
      schoolId: dpsId,
      studentId: stuRahulId,
      logType: 'discipline',
      title: 'Classroom Disturbance in Mathematics Period',
      description: 'Found repeatedly talking and causing distraction during trigonometry problem-solving session.',
      actionTaken: 'Verbal warning given; seat moved to front row for closer supervision.',
      reportedByUserId: teacher1Id,
      date: '2026-09-05',
      notifyParent: 1,
      createdAt: now,
    },
    {
      id: 'log-dps-rahul-03',
      schoolId: dpsId,
      studentId: stuRahulId,
      logType: 'medical',
      title: 'Minor Ankle Sprain in Sports Period',
      description: 'Twisted left ankle while playing inter-house football match on school ground.',
      actionTaken: 'First aid ice compression applied in infirmary by school nurse; rested for 40 mins and walked comfortably.',
      reportedByUserId: teacher2Id,
      date: '2026-09-08',
      notifyParent: 1,
      createdAt: now,
    },
    {
      id: 'log-lsk-aryan-01',
      schoolId: lskId,
      studentId: lskStuAryanId,
      logType: 'award',
      title: 'Best Innovation Award - Science Exhibition',
      description: 'Built a sustainable smart solar irrigation prototype praised by external judges.',
      actionTaken: 'Awarded Gold Medal and ₹1,500 book voucher by Principal.',
      reportedByUserId: lskTeacher2Id,
      date: '2026-09-03',
      notifyParent: 1,
      createdAt: now,
    },
    {
      id: 'log-lsk-aryan-02',
      schoolId: lskId,
      studentId: lskStuAryanId,
      logType: 'observation',
      title: 'Exemplary Peer Mentoring in Algebra',
      description: 'Assisted 4 struggling classmates in mastering linear equation exercises during tutorial period.',
      actionTaken: 'Commended in class and positive behavioral credit recorded.',
      reportedByUserId: lskTeacher1Id,
      date: '2026-09-07',
      notifyParent: 1,
      createdAt: now,
    },
  ]).onConflictDoNothing().run();

  console.log('✅ Seed completed successfully! Demo accounts ready:');
  console.log('  1. Super Admin: superadmin@anvimitra.com / admin123');
  console.log('  2. Principal (DPS): principal@dps.edu / principal123');
  console.log('  3. Class Teacher (10-A & Math, DPS): sharma@dps.edu / teacher123');
  console.log('  4. Science Teacher (DPS): verma@dps.edu / teacher123');
  console.log('  5. Accountant (DPS): accountant@dps.edu / staff123');
  console.log('  6. Parent App-Active (DPS): parent.rahul@gmail.com / parent123');
  console.log('  7. Parent SMS-Fallback (DPS): parent.priya@gmail.com / parent123');
  console.log('  8. Student (DPS 10-A): student.rahul@dps.edu / student123');
  console.log('');
  console.log('  ─── LSK Academy (LSK01) ───');
  console.log('  9.  Principal: principal@lskacademy.edu / principal123');
  console.log('  10. Class Teacher (8-A & Math): rani@lskacademy.edu / teacher123');
  console.log('  11. Science Teacher: kiran@lskacademy.edu / teacher123');
  console.log('  12. Accountant: accounts@lskacademy.edu / staff123');
  console.log('  13. Parent App-Active: parent.aryan@gmail.com / parent123');
  console.log('  14. Parent SMS-Fallback: parent.zara@gmail.com / parent123');
  console.log('  15. Student (LSK 8-A): student.aryan@lskacademy.edu / student123');
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase().catch((e) => {
    console.error('Seed error:', e);
  });
}
