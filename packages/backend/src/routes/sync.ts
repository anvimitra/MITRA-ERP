import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';

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
    schoolStudentLogs.length;

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
