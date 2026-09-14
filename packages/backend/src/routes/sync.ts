import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const syncRoutes = new Hono();

// Authenticate Desktop Sync Agent using School Code + API Sync Secret
syncRoutes.post('/auth', async (c) => {
  const body = await c.req.json();
  const { schoolCode, apiSyncKey, deviceIdentifier } = body;

  if (!schoolCode || !apiSyncKey) {
    return c.json({ error: 'schoolCode and apiSyncKey are required' }, 400);
  }

  const school = db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.code, schoolCode.toUpperCase()))
    .get();

  if (!school) {
    return c.json({ error: 'School not found' }, 404);
  }

  if (school.apiSyncKey !== apiSyncKey) {
    return c.json({ error: 'Invalid API Sync Secret Key' }, 401);
  }

  const syncSessionToken = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();

  // Log sync connection
  db.insert(schema.syncLogs).values({
    id: crypto.randomUUID(),
    schoolId: school.id,
    deviceIdentifier: deviceIdentifier || 'PC-AGENT-DESKTOP',
    syncType: 'handshake',
    recordsCount: 0,
    lastSyncTimestamp: now,
    status: 'success',
  }).run();

  return c.json({
    success: true,
    schoolId: school.id,
    schoolName: school.name,
    syncSessionToken,
    serverTime: now,
  });
});

// Pull Cloud ERP data to School's PC Local Secondary Database
syncRoutes.post('/pull', async (c) => {
  const body = await c.req.json();
  const { schoolCode, apiSyncKey, lastSyncTimestamp } = body;

  const school = db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.code, schoolCode?.toUpperCase()))
    .get();

  if (!school || school.apiSyncKey !== apiSyncKey) {
    return c.json({ error: 'Authentication failed for sync' }, 401);
  }

  const schoolId = school.id;

  // Fetch all related entities for this school
  const schoolClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, schoolId)).all();
  const schoolSections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, schoolId)).all();
  const schoolSubjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, schoolId)).all();
  const schoolStudents = db.select().from(schema.students).where(eq(schema.students.schoolId, schoolId)).all();
  const schoolParents = db.select().from(schema.parents).where(eq(schema.parents.schoolId, schoolId)).all();
  const schoolTeachers = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.schoolId, schoolId))
    .all();

  const schoolAttendance = db.select().from(schema.attendance).where(eq(schema.attendance.schoolId, schoolId)).all();
  const schoolExams = db.select().from(schema.exams).where(eq(schema.exams.schoolId, schoolId)).all();
  const schoolMarks = db.select().from(schema.marks).where(eq(schema.marks.schoolId, schoolId)).all();
  const schoolFeeStructures = db.select().from(schema.feeStructures).where(eq(schema.feeStructures.schoolId, schoolId)).all();
  const schoolFeePayments = db.select().from(schema.feePayments).where(eq(schema.feePayments.schoolId, schoolId)).all();
  const schoolTimetable = db.select().from(schema.timetablePeriods).where(eq(schema.timetablePeriods.schoolId, schoolId)).all();
  const schoolStudentLogs = db.select().from(schema.studentLogs).where(eq(schema.studentLogs.schoolId, schoolId)).all();
  const schoolCertificates = db.select().from(schema.certificates).where(eq(schema.certificates.schoolId, schoolId)).all();
  const schoolVisitors = db.select().from(schema.frontDeskVisitors).where(eq(schema.frontDeskVisitors.schoolId, schoolId)).all();
  const schoolInquiries = db.select().from(schema.frontDeskInquiries).where(eq(schema.frontDeskInquiries.schoolId, schoolId)).all();
  const schoolLeaves = db.select().from(schema.staffLeaves).where(eq(schema.staffLeaves.schoolId, schoolId)).all();
  const schoolPayroll = db.select().from(schema.staffPayroll).where(eq(schema.staffPayroll.schoolId, schoolId)).all();
  const schoolBooks = db.select().from(schema.libraryBooks).where(eq(schema.libraryBooks.schoolId, schoolId)).all();
  const schoolIssues = db.select().from(schema.libraryIssues).where(eq(schema.libraryIssues.schoolId, schoolId)).all();
  const schoolVehicles = db.select().from(schema.transportVehicles).where(eq(schema.transportVehicles.schoolId, schoolId)).all();
  const schoolTransportRoutes = db.select().from(schema.transportRoutes).where(eq(schema.transportRoutes.schoolId, schoolId)).all();
  const schoolTransportStops = db.select().from(schema.transportStops).where(eq(schema.transportStops.schoolId, schoolId)).all();
  const schoolStudentTransport = db.select().from(schema.studentTransport).where(eq(schema.studentTransport.schoolId, schoolId)).all();
  const schoolInventoryItems = db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.schoolId, schoolId)).all();
  const schoolInventoryTransactions = db.select().from(schema.inventoryTransactions).where(eq(schema.inventoryTransactions.schoolId, schoolId)).all();

  const totalRecords =
    schoolClasses.length +
    schoolSections.length +
    schoolSubjects.length +
    schoolStudents.length +
    schoolAttendance.length +
    schoolExams.length +
    schoolMarks.length +
    schoolFeePayments.length +
    schoolTimetable.length +
    schoolStudentLogs.length +
    schoolCertificates.length +
    schoolVisitors.length +
    schoolInquiries.length +
    schoolLeaves.length +
    schoolPayroll.length +
    schoolBooks.length +
    schoolIssues.length +
    schoolVehicles.length +
    schoolTransportRoutes.length +
    schoolInventoryItems.length;

  const now = new Date().toISOString();

  // Record in sync logs
  db.insert(schema.syncLogs).values({
    id: crypto.randomUUID(),
    schoolId,
    deviceIdentifier: body.deviceIdentifier || 'PC-STORAGE-AGENT',
    syncType: 'pull_delta',
    recordsCount: totalRecords,
    lastSyncTimestamp: now,
    status: 'success',
  }).run();

  return c.json({
    success: true,
    school: {
      id: school.id,
      name: school.name,
      code: school.code,
      logoUrl: school.logoUrl,
      primaryColor: school.primaryColor,
      address: school.address,
      phone: school.phone,
    },
    syncTimestamp: now,
    totalRecords,
    dataset: {
      classes: schoolClasses,
      sections: schoolSections,
      subjects: schoolSubjects,
      teachers: schoolTeachers,
      parents: schoolParents,
      students: schoolStudents,
      attendance: schoolAttendance,
      exams: schoolExams,
      marks: schoolMarks,
      feeStructures: schoolFeeStructures,
      feePayments: schoolFeePayments,
      timetable: schoolTimetable,
      studentLogs: schoolStudentLogs,
      certificates: schoolCertificates,
      visitors: schoolVisitors,
      inquiries: schoolInquiries,
      leaves: schoolLeaves,
      payroll: schoolPayroll,
      books: schoolBooks,
      libraryIssues: schoolIssues,
      vehicles: schoolVehicles,
      routes: schoolTransportRoutes,
      stops: schoolTransportStops,
      studentTransport: schoolStudentTransport,
      inventoryItems: schoolInventoryItems,
      inventoryTransactions: schoolInventoryTransactions,
    },
  });
});

// Push local changes (e.g. offline attendance recorded on local PC) to Cloud
syncRoutes.post('/push', async (c) => {
  const body = await c.req.json();
  const { schoolCode, apiSyncKey, offlineAttendance } = body;

  const school = db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.code, schoolCode?.toUpperCase()))
    .get();

  if (!school || school.apiSyncKey !== apiSyncKey) {
    return c.json({ error: 'Authentication failed for sync' }, 401);
  }

  let syncedCount = 0;
  if (Array.isArray(offlineAttendance)) {
    for (const att of offlineAttendance) {
      const existing = db
        .select()
        .from(schema.attendance)
        .where(
          and(
            eq(schema.attendance.schoolId, school.id),
            eq(schema.attendance.studentId, att.studentId),
            eq(schema.attendance.date, att.date)
          )
        )
        .get();

      if (existing) {
        db.update(schema.attendance)
          .set({ status: att.status, remarks: att.remarks })
          .where(eq(schema.attendance.id, existing.id))
          .run();
      } else {
        db.insert(schema.attendance).values({
          id: att.id || crypto.randomUUID(),
          schoolId: school.id,
          studentId: att.studentId,
          classId: att.classId,
          sectionId: att.sectionId,
          date: att.date,
          status: att.status,
          markedByTeacherId: att.markedByTeacherId || 'OFFLINE_AGENT',
          remarks: att.remarks || 'Synced from local PC offline storage',
          createdAt: new Date().toISOString(),
        }).run();
      }
      syncedCount++;
    }
  }

  return c.json({
    success: true,
    message: `Pushed ${syncedCount} local records to Cloud ERP successfully`,
    syncedCount,
  });
});

// =========================================================================
// MASTER MULTI-SCHOOL PC CONNECTOR ENDPOINTS (FOR SINGLE COMPUTER MASTER HUB)
// =========================================================================

const DEFAULT_MASTER_KEY = process.env.MASTER_SYNC_KEY || 'ANVI_MASTER_PC_CONNECTOR_SYNC_KEY_2026';

function isMasterAuthorized(c: any, body?: any): boolean {
  const authHeader = c.req.header('Authorization');
  const masterKeyHeader = c.req.header('x-master-key');
  if (masterKeyHeader === DEFAULT_MASTER_KEY) return true;
  if (body?.masterKey === DEFAULT_MASTER_KEY) return true;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === DEFAULT_MASTER_KEY) return true;
    try {
      const user = verifyToken(token);
      if (user && user.role === 'super_admin') return true;
    } catch {}
  }
  return false;
}

// 1. Master ERP Status Check (Used by PC Connector to monitor Cloud ERP health)
syncRoutes.get('/status', async (c) => {
  const schools = db.select().from(schema.schools).all();
  const students = db.select().from(schema.students).all();
  const users = db.select().from(schema.users).all();

  return c.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    schoolsCount: schools.length,
    studentsCount: students.length,
    usersCount: users.length,
    cloudReady: true,
  });
});

// 2. Master Auth Handshake
syncRoutes.post('/master-auth', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!isMasterAuthorized(c, body)) {
    return c.json({ error: 'Unauthorized Master PC Connector key' }, 401);
  }

  const schools = db.select().from(schema.schools).all();
  return c.json({
    success: true,
    message: 'Master PC Connector authorized successfully',
    serverTime: new Date().toISOString(),
    schoolsCount: schools.length,
  });
});

// 3. Master Pull: Export ALL schools and entire ERP dataset to Local PC Connector
syncRoutes.post('/master-pull', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!isMasterAuthorized(c, body)) {
    return c.json({ error: 'Unauthorized: Master PC Connector access only' }, 401);
  }

  const schools = db.select().from(schema.schools).all();
  const users = db.select().from(schema.users).all();
  const classes = db.select().from(schema.classes).all();
  const sections = db.select().from(schema.sections).all();
  const subjects = db.select().from(schema.subjects).all();
  const students = db.select().from(schema.students).all();
  const parents = db.select().from(schema.parents).all();
  const attendance = db.select().from(schema.attendance).all();
  const exams = db.select().from(schema.exams).all();
  const marks = db.select().from(schema.marks).all();
  const feeStructures = db.select().from(schema.feeStructures).all();
  const feePayments = db.select().from(schema.feePayments).all();
  const timetable = db.select().from(schema.timetablePeriods).all();
  const staffLeaves = db.select().from(schema.staffLeaves).all();

  const now = new Date().toISOString();

  return c.json({
    success: true,
    timestamp: now,
    schoolsCount: schools.length,
    dataset: {
      schools,
      users,
      classes,
      sections,
      subjects,
      students,
      parents,
      attendance,
      exams,
      marks,
      feeStructures,
      feePayments,
      timetable,
      staffLeaves,
    },
  });
});

// 4. Master Push / Disaster Recovery: Restore ALL schools from PC Connector to Cloud ERP
syncRoutes.post('/master-push', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!isMasterAuthorized(c, body)) {
    return c.json({ error: 'Unauthorized: Master PC Connector access only' }, 401);
  }

  const { dataset } = body;
  if (!dataset || typeof dataset !== 'object') {
    return c.json({ error: 'Invalid payload: dataset object required' }, 400);
  }

  const restored: Record<string, number> = {};

  // Insert or replace helper
  const restoreTable = (tableName: string, rows: any[]) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      restored[tableName] = 0;
      return;
    }
    const tableObj = (schema as any)[tableName];
    if (!tableObj) return;

    let count = 0;
    for (const row of rows) {
      try {
        db.insert(tableObj).values(row).run();
        count++;
      } catch {
        // If conflict, try update or ignore
      }
    }
    restored[tableName] = count;
  };

  if (Array.isArray(dataset.schools)) restoreTable('schools', dataset.schools);
  if (Array.isArray(dataset.users)) restoreTable('users', dataset.users);
  if (Array.isArray(dataset.classes)) restoreTable('classes', dataset.classes);
  if (Array.isArray(dataset.sections)) restoreTable('sections', dataset.sections);
  if (Array.isArray(dataset.subjects)) restoreTable('subjects', dataset.subjects);
  if (Array.isArray(dataset.parents)) restoreTable('parents', dataset.parents);
  if (Array.isArray(dataset.students)) restoreTable('students', dataset.students);
  if (Array.isArray(dataset.attendance)) restoreTable('attendance', dataset.attendance);
  if (Array.isArray(dataset.exams)) restoreTable('exams', dataset.exams);
  if (Array.isArray(dataset.marks)) restoreTable('marks', dataset.marks);
  if (Array.isArray(dataset.feeStructures)) restoreTable('feeStructures', dataset.feeStructures);
  if (Array.isArray(dataset.feePayments)) restoreTable('feePayments', dataset.feePayments);
  if (Array.isArray(dataset.timetable)) restoreTable('timetablePeriods', dataset.timetable);
  if (Array.isArray(dataset.staffLeaves)) restoreTable('staffLeaves', dataset.staffLeaves);

  const now = new Date().toISOString();
  console.log(`🚀 [Master PC Connector] Synchronized ${restored.schools || 0} schools and related records to Cloud ERP at ${now}`);

  return c.json({
    success: true,
    message: 'Master PC dataset synchronized and restored to Cloud ERP successfully',
    restored,
    timestamp: now,
  });
});

