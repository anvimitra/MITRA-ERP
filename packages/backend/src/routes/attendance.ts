import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isDesignatedClassTeacher, isStudentAccessibleByUser } from '../services/rbac.js';
import { dispatchStudentNotification } from '../services/notification-sms.js';

export const attendanceRoutes = new Hono();

// Mark attendance for a class & section
// STRICT RULE: Only the designated Class Teacher (or Principal/SuperAdmin) is authorized!
attendanceRoutes.post('/mark', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { classId, sectionId, date, records } = body;
  // records: Array<{ studentId: string, status: 'present' | 'absent' | 'late' | 'half_day', remarks?: string }>

  if (!classId || !sectionId || !date || !Array.isArray(records)) {
    return c.json({ error: 'classId, sectionId, date, and records array are required' }, 400);
  }

  // Permission check
  if (user.role === 'teacher') {
    const isAllowed = await isDesignatedClassTeacher(user.schoolId, user.userId, classId, sectionId);
    if (!isAllowed) {
      return c.json({
        error: 'Permission Denied: You are not the assigned Class Teacher for this Class & Section!',
      }, 403);
    }
  } else if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Insufficient role' }, 403);
  }

  const results: any[] = [];
  const alertDispatches: any[] = [];
  const now = new Date().toISOString();

  for (const item of records) {
    // Check if record exists for student on this date
    const existing = db
      .select()
      .from(schema.attendance)
      .where(
        and(
          eq(schema.attendance.schoolId, user.schoolId),
          eq(schema.attendance.studentId, item.studentId),
          eq(schema.attendance.date, date)
        )
      )
      .get();

    if (existing) {
      db.update(schema.attendance)
        .set({
          status: item.status,
          markedByTeacherId: user.userId,
          remarks: item.remarks || null,
        })
        .where(eq(schema.attendance.id, existing.id))
        .run();
    } else {
      const attendanceId = crypto.randomUUID();
      db.insert(schema.attendance).values({
        id: attendanceId,
        schoolId: user.schoolId,
        studentId: item.studentId,
        classId,
        sectionId,
        date,
        status: item.status,
        markedByTeacherId: user.userId,
        remarks: item.remarks || null,
        createdAt: now,
      }).run();
    }

    results.push({ studentId: item.studentId, status: item.status });

    // Trigger automated in-app attendance notification to parent app (Present, Absent, Late)
    const student = db.select().from(schema.students).where(eq(schema.students.id, item.studentId)).get();
    const studentName = student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Your ward';
    const statusText = item.status.toUpperCase();

    let notifTitle = `Attendance Alert: ${statusText}`;
    let notifMessage = `${studentName} has been marked ${statusText} on ${date}.`;
    if (item.status === 'present') {
      notifTitle = `Attendance Update: PRESENT`;
      notifMessage = `${studentName} is PRESENT in school today (${date}).`;
    } else if (item.status === 'absent') {
      notifTitle = `Attendance Alert: ABSENT`;
      notifMessage = `${studentName} has been marked ABSENT on ${date}. Please contact school administration if unplanned.`;
    }

    const dispatchResult = await dispatchStudentNotification({
      schoolId: user.schoolId,
      studentId: item.studentId,
      title: notifTitle,
      message: notifMessage,
      type: 'attendance',
    });

    alertDispatches.push({
      studentId: item.studentId,
      studentName,
      status: item.status,
      dispatchResult,
    });
  }

  return c.json({
    success: true,
    message: `Attendance marked successfully for ${records.length} students`,
    alertDispatches,
  });
});

// Get attendance for a class on a specific date
attendanceRoutes.get('/class', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const classId = c.req.query('classId');
  const sectionId = c.req.query('sectionId');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  if (!classId || !sectionId) {
    return c.json({ error: 'classId and sectionId query params required' }, 400);
  }

  // Fetch all students in this class strictly
  const classStudents = db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.schoolId, user.schoolId),
        eq(schema.students.classId, classId)
      )
    )
    .all();

  const studentList = classStudents.filter((s: any) => {
    if (!sectionId) return true;
    if (s.sectionId === sectionId) return true;
    // Resilient fallback for legacy records where sectionId might be sec-default or orphaned
    if (sectionId.endsWith('-a') && (!s.sectionId || s.sectionId === 'sec-default' || !s.sectionId.includes(classId.replace('cls-', '')))) {
      return true;
    }
    return false;
  });

  // Fetch attendance records for this date
  const records = db
    .select()
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.schoolId, user.schoolId),
        eq(schema.attendance.classId, classId),
        eq(schema.attendance.sectionId, sectionId),
        eq(schema.attendance.date, date)
      )
    )
    .all();

  const attendanceMap = new Map(records.map((r) => [r.studentId, r]));

  const merged = studentList.map((s) => ({
    studentId: s.id,
    admissionNo: s.admissionNo,
    rollNo: s.rollNo,
    name: `${s.firstName} ${s.lastName || ''}`.trim(),
    firstName: s.firstName,
    lastName: s.lastName || '',
    classId: s.classId,
    sectionId: s.sectionId,
    photoUrl: s.photoUrl || null,
    status: attendanceMap.get(s.id)?.status || 'unmarked',
    remarks: attendanceMap.get(s.id)?.remarks || '',
  }));

  return c.json({
    date,
    students: merged,
    summary: {
      total: merged.length,
      present: merged.filter((s) => s.status === 'present').length,
      absent: merged.filter((s) => s.status === 'absent').length,
      late: merged.filter((s) => s.status === 'late').length,
      unmarked: merged.filter((s) => s.status === 'unmarked').length,
    },
  });
});

// Get attendance history for a single student (Parent & Student portal)
attendanceRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');
  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student attendance record' }, 403);
  }

  const history = db
    .select()
    .from(schema.attendance)
    .where(and(eq(schema.attendance.schoolId, user.schoolId), eq(schema.attendance.studentId, studentId)))
    .all();

  const total = history.length;
  const present = history.filter((h) => h.status === 'present').length;
  const absent = history.filter((h) => h.status === 'absent').length;
  const late = history.filter((h) => h.status === 'late').length;
  const halfDay = history.filter((h) => h.status === 'half_day').length;
  const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

  return c.json({
    studentId,
    percentage: pct,
    stats: { total, present, absent, late, halfDay },
    history: history.sort((a, b) => b.date.localeCompare(a.date)),
  });
});

// Institutional Attendance Register for Principal & Management
attendanceRoutes.get('/register', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const classId = c.req.query('classId');

  // Query students
  const studentQuery = classId && classId !== 'ALL'
    ? and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.classId, classId))
    : eq(schema.students.schoolId, user.schoolId);

  const studentList = db.select().from(schema.students).where(studentQuery).all();

  // Query attendance records for date
  const attendanceQuery = classId && classId !== 'ALL'
    ? and(
        eq(schema.attendance.schoolId, user.schoolId),
        eq(schema.attendance.date, date),
        eq(schema.attendance.classId, classId)
      )
    : and(
        eq(schema.attendance.schoolId, user.schoolId),
        eq(schema.attendance.date, date)
      );

  const records = db.select().from(schema.attendance).where(attendanceQuery).all();
  const attendanceMap = new Map(records.map((r) => [r.studentId, r]));

  // Class names mapping
  const classesList = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const classMap = new Map(classesList.map((cl) => [cl.id, cl.name]));

  // Combine
  const allRows = studentList.map((s) => {
    const rec = attendanceMap.get(s.id);
    return {
      studentId: s.id,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      className: classMap.get(s.classId) || s.classId,
      classId: s.classId,
      primaryPhone: s.emergencyPhone || '',
      isTaken: !!rec,
      status: rec?.status || 'not_marked',
      remarks: rec?.remarks || '',
      recordedAt: rec?.createdAt || null,
    };
  });

  const takenCount = records.length;
  const isAttendanceTaken = takenCount > 0;
  const onlyTaken = allRows.filter((r) => r.isTaken);

  return c.json({
    date,
    isAttendanceTaken,
    totalStudents: allRows.length,
    recordedCount: takenCount,
    unrecordedCount: Math.max(0, allRows.length - takenCount),
    records: onlyTaken, // Only students whose attendance was actually taken
    allRecords: allRows,
    summary: {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      half_day: records.filter((r) => r.status === 'half_day').length,
    },
  });
});

