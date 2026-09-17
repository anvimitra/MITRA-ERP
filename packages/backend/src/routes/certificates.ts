import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isStudentAccessibleByUser, resolveLinkedStudentsForParent } from '../services/rbac.js';

export const certificateRoutes = new Hono();

// List all certificates for current school
certificateRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  let certs = db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.schoolId, user.schoolId))
    .all();

  // STRICT PRIVACY RULE: Certificates are visible ONLY in Principal Desk!
  // Parents and students must NOT see certificates on app or portal.
  if (user.role === 'parent' || user.role === 'student') {
    return c.json({ certificates: [] });
  }

  const students = db
    .select({
      id: schema.students.id,
      firstName: schema.students.firstName,
      lastName: schema.students.lastName,
      admissionNo: schema.students.admissionNo,
      rollNo: schema.students.rollNo,
      classId: schema.students.classId,
      sectionId: schema.students.sectionId,
      gender: schema.students.gender,
      dob: schema.students.dob,
    })
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  const classes = db
    .select()
    .from(schema.classes)
    .where(eq(schema.classes.schoolId, user.schoolId))
    .all();

  const sections = db
    .select()
    .from(schema.sections)
    .where(eq(schema.sections.schoolId, user.schoolId))
    .all();

  const enriched = certs.map((cert: any) => {
    const student = students.find((s: any) => s.id === cert.studentId);
    const cls = student ? classes.find((c: any) => c.id === student.classId) : null;
    const sec = student ? sections.find((s: any) => s.id === student.sectionId) : null;

    let parsedExtra: any = {};
    try {
      if (cert.extraFields) {
        parsedExtra = typeof cert.extraFields === 'string' ? JSON.parse(cert.extraFields) : cert.extraFields;
      }
    } catch {
      parsedExtra = {};
    }

    return {
      ...cert,
      studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown Student',
      admissionNo: student?.admissionNo || '',
      rollNo: student?.rollNo,
      className: cls?.name || '',
      sectionName: sec?.name || '',
      dob: student?.dob || '',
      extra: parsedExtra,
    };
  });

  return c.json({ certificates: enriched });
});

// List certificates for a specific student (Principal Desk only)
certificateRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  // STRICT PRIVACY RULE: Certificates are visible ONLY in Principal Desk!
  if (user.role === 'parent' || user.role === 'student') {
    return c.json({ certificates: [] });
  }

  const studentId = c.req.param('studentId');
  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student certificates' }, 403);
  }

  const certs = db
    .select()
    .from(schema.certificates)
    .where(
      and(
        eq(schema.certificates.schoolId, user.schoolId),
        eq(schema.certificates.studentId, studentId)
      )
    )
    .all();

  const school = db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.id, user.schoolId))
    .get();

  const student = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.id, studentId))
    .get();

  const enriched = certs.map((cert: any) => {
    let parsedExtra: any = {};
    try {
      if (cert.extraFields) {
        parsedExtra = typeof cert.extraFields === 'string' ? JSON.parse(cert.extraFields) : cert.extraFields;
      }
    } catch {
      parsedExtra = {};
    }
    return {
      ...cert,
      studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : '',
      admissionNo: student?.admissionNo || '',
      schoolName: school?.name || '',
      schoolLogo: school?.logoUrl || '',
      schoolAffiliation: school?.affiliationNo || '',
      extra: parsedExtra,
    };
  });

  return c.json({ certificates: enriched });
});

// Get Official CBSE Examination Admit Card for student
certificateRoutes.get('/admit-card/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');
  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student admit card' }, 403);
  }
  const student = db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.schoolId, user.schoolId),
        eq(schema.students.id, studentId)
      )
    )
    .get();

  if (!student) return c.json({ error: 'Student not found' }, 404);

  // Check if Admit Card has been assigned/generated by Principal
  const cardRecord = db
    .select()
    .from(schema.admitCards)
    .where(
      and(
        eq(schema.admitCards.schoolId, user.schoolId),
        eq(schema.admitCards.studentId, studentId),
        eq(schema.admitCards.isPublished, 1)
      )
    )
    .get();

  if (!cardRecord && user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({
      admitCard: null,
      isAssigned: false,
      message: 'Admit Card has not been released or assigned by the Principal yet.',
    });
  }

  const school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
  let parent = null;
  if (student.parentId) {
    parent = db.select().from(schema.parents).where(eq(schema.parents.id, student.parentId)).get();
  }

  const cls = db.select().from(schema.classes).where(eq(schema.classes.id, student.classId)).get();
  const sec = db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId)).get();

  const subjects = db
    .select()
    .from(schema.subjects)
    .where(
      and(
        eq(schema.subjects.schoolId, user.schoolId),
        eq(schema.subjects.classId, student.classId)
      )
    )
    .all();

  const timetableSchedule = subjects.map((sub: any, idx: number) => {
    const dates = ['2026-10-10', '2026-10-12', '2026-10-14', '2026-10-16', '2026-10-18', '2026-10-20'];
    return {
      subCode: sub.code,
      subName: sub.name,
      examDate: dates[idx % dates.length],
      examTime: '10:30 AM - 01:30 PM',
      roomNo: `Hall-${Math.floor(idx / 2) + 1}`,
    };
  });

  let customSchedule = null;
  if (cardRecord?.scheduleJson || cardRecord?.schedule_json) {
    try {
      const parsed = JSON.parse(cardRecord.scheduleJson || cardRecord.schedule_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customSchedule = parsed;
      }
    } catch {}
  }

  return c.json({
    admitCard: {
      rollNo: cardRecord?.rollNo || student.rollNo || 1,
      rollCode: cardRecord?.rollCode || `CBSE-${school?.code || 'SCH'}-2026-${String(student.rollNo || 1).padStart(4, '0')}`,
      admissionNo: student.admissionNo,
      studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
      fatherName: parent?.fatherName || 'Guardian Name',
      motherName: parent?.motherName || 'Mother Name',
      className: cls?.name || 'Class 10',
      sectionName: sec?.name || 'A',
      dob: student.dob || '2010-05-15',
      photoUrl: student.photoUrl,
      centerNumber: cardRecord?.centerNumber || '8402',
      centerName: cardRecord?.centerName || `${school?.name || 'National School'} Examination Center, Campus Block-A`,
      schoolName: school?.name || '',
      schoolAffiliation: school?.affiliationNo || 'CBSE/AFF/1032890',
      examTitle: cardRecord?.examTitle || 'Secondary School Examination 2026 (Annual Term)',
      isAssigned: !!cardRecord,
      instructions: [
        'Candidate must report to examination hall 30 minutes prior to test commencement.',
        'Carry this printed Admit Card along with your School Digital ID Card.',
        'Electronic gadgets, smartwatches, and study notes are strictly forbidden inside the hall.',
        'Use only blue/black ballpoint pen for filling OMR sheets and answer booklets.',
      ],
      schedule: customSchedule || (timetableSchedule.length > 0 ? timetableSchedule : [
        { subCode: 'MATH-10', subName: 'Mathematics Standard', examDate: '2026-10-10', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-1' },
        { subCode: 'SCI-10', subName: 'Science Theory', examDate: '2026-10-12', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-1' },
        { subCode: 'ENG-10', subName: 'English Language & Lit', examDate: '2026-10-14', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-2' },
        { subCode: 'SST-10', subName: 'Social Science', examDate: '2026-10-16', examTime: '10:30 AM - 01:30 PM', roomNo: 'Hall-2' },
      ]),
    },
  });
});

// Auto-generate and assign Admit Cards for an entire class (Principal only)
certificateRoutes.post('/generate-class-admit-cards', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal can generate and assign admit cards' }, 403);
  }

  const body = await c.req.json();
  const { classId, examId, examTitle, centerNumber, centerName, schedule } = body;
  if (!classId) return c.json({ error: 'classId is required' }, 400);

  const scheduleJson = schedule && Array.isArray(schedule) && schedule.length > 0 ? JSON.stringify(schedule) : null;

  const school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
  const students = db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.classId, classId)))
    .all();

  const now = new Date().toISOString();
  let count = 0;

  for (const s of students) {
    const cardId = `adm-${Date.now()}-${s.id.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rollCode = `CBSE-${school?.code || 'SCH'}-2026-${String(s.rollNo || 1).padStart(4, '0')}`;

    db.delete(schema.admitCards)
      .where(and(eq(schema.admitCards.schoolId, user.schoolId), eq(schema.admitCards.studentId, s.id)))
      .run();

    db.insert(schema.admitCards).values({
      id: cardId,
      schoolId: user.schoolId,
      examId: examId || null,
      classId,
      studentId: s.id,
      rollNo: s.rollNo || 1,
      rollCode,
      examTitle: examTitle || 'Official Annual Examination Admit Card 2026',
      centerNumber: centerNumber || '8402',
      centerName: centerName || `${school?.name || 'Institutional Campus'} Center A`,
      scheduleJson,
      isPublished: 1,
      createdAt: now,
    }).run();

    count++;
  }

  return c.json({
    success: true,
    message: `Admit cards successfully generated and released for ${count} students in this class.`,
    count,
  });
});

// Get class admit cards
certificateRoutes.get('/admit-cards/class/:classId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const classId = c.req.param('classId');
  const cards = db
    .select()
    .from(schema.admitCards)
    .where(and(eq(schema.admitCards.schoolId, user.schoolId), eq(schema.admitCards.classId, classId)))
    .all();

  return c.json({ admitCards: cards });
});

// Get single certificate with full print layout data
certificateRoutes.get('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const certId = c.req.param('id');

  // STRICT PRIVACY RULE: Certificates are visible ONLY in Principal Desk!
  if (user.role === 'parent' || user.role === 'student') {
    return c.json({ error: 'Forbidden: Certificates can only be accessed from the Principal Desk' }, 403);
  }

  const cert = db
    .select()
    .from(schema.certificates)
    .where(
      and(
        eq(schema.certificates.schoolId, user.schoolId),
        eq(schema.certificates.id, certId)
      )
    )
    .get();

  if (!cert) return c.json({ error: 'Certificate not found' }, 404);

  const school = db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.id, user.schoolId))
    .get();

  const student = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.id, cert.studentId))
    .get();

  let parent = null;
  if (student && student.parentId) {
    parent = db
      .select()
      .from(schema.parents)
      .where(eq(schema.parents.id, student.parentId))
      .get();
  }

  let cls = null;
  let sec = null;
  if (student) {
    cls = db.select().from(schema.classes).where(eq(schema.classes.id, student.classId)).get();
    sec = db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId)).get();
  }

  let parsedExtra: any = {};
  try {
    if (cert.extraFields) {
      parsedExtra = typeof cert.extraFields === 'string' ? JSON.parse(cert.extraFields) : cert.extraFields;
    }
  } catch {
    parsedExtra = {};
  }

  return c.json({
    certificate: {
      ...cert,
      extra: parsedExtra,
      student: {
        ...student,
        fullName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : '',
        className: cls?.name || '',
        sectionName: sec?.name || '',
        fatherName: parent?.fatherName || '',
        motherName: parent?.motherName || '',
        parentPhone: parent?.primaryPhone || '',
        address: parent?.address || '',
      },
      school: {
        name: school?.name || '',
        code: school?.code || '',
        affiliationNo: school?.affiliationNo || '',
        principalName: school?.principalName || '',
        address: school?.address || '',
        city: school?.city || '',
        state: school?.state || '',
        pincode: school?.pincode || '',
        phone: school?.phone || '',
        email: school?.email || '',
        logoUrl: school?.logoUrl || '',
      },
    },
  });
});

// Generate / Issue new Certificate
certificateRoutes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only Principal can issue certificates' }, 403);
  }

  const body = await c.req.json();
  const {
    studentId,
    certificateType,
    academicYear,
    issueDate,
    reason,
    conduct,
    extraFields,
  } = body;

  if (!studentId || !certificateType) {
    return c.json({ error: 'studentId and certificateType are required' }, 400);
  }

  const certId = crypto.randomUUID();
  const now = new Date().toISOString();
  const dateStr = issueDate || now.split('T')[0];
  const year = academicYear || '2026-2027';

  // Generate unique certificate serial number
  const prefixMap: Record<string, string> = {
    TRANSFER_CERTIFICATE: 'TC',
    BONAFIDE_CERTIFICATE: 'BON',
    CHARACTER_CERTIFICATE: 'CC',
    ADMIT_CARD: 'ADM',
    APPRECIATION_AWARD: 'AWD',
    MERIT_AWARD: 'MRT',
    SPORTS_AWARD: 'SPT',
    COMPLETION_CERTIFICATE: 'CMP',
    EXCELLENCE_AWARD: 'EXC',
  };
  const prefix = prefixMap[certificateType] || 'CERT';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const certificateNo = `${prefix}-${year.split('-')[0]}-${randomSuffix}`;

  const extraJson = typeof extraFields === 'object' ? JSON.stringify(extraFields) : (extraFields || '{}');

  db.insert(schema.certificates).values({
    id: certId,
    schoolId: user.schoolId,
    studentId,
    certificateType,
    certificateNo,
    issueDate: dateStr,
    academicYear: year,
    reason: reason || '',
    conduct: conduct || 'Good',
    extraFields: extraJson,
    status: 'ISSUED',
    createdAt: now,
  }).run();

  // Auto-delete student from active records upon Transfer Certificate (TC) issuance
  if (certificateType === 'TRANSFER_CERTIFICATE') {
    db.delete(schema.students)
      .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.id, studentId)))
      .run();
  }

  return c.json({
    success: true,
    message: `${certificateType} issued successfully${certificateType === 'TRANSFER_CERTIFICATE' ? ' & student transferred from active rolls' : ''}`,
    certificateId: certId,
    certificateNo,
  }, 201);
});

// Delete a Certificate
certificateRoutes.delete('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const certId = c.req.param('id');
  db.delete(schema.certificates).where(
    and(
      eq(schema.certificates.schoolId, user.schoolId),
      eq(schema.certificates.id, certId)
    )
  ).run();

  return c.json({ success: true, message: 'Certificate deleted' });
});
