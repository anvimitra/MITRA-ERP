import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isDesignatedClassTeacher } from '../services/rbac.js';
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

    // If student is marked ABSENT or LATE, trigger automated notification & SMS fallback
    if (item.status === 'absent' || item.status === 'late') {
      const student = db.select().from(schema.students).where(eq(schema.students.id, item.studentId)).get();
      const studentName = student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Your ward';
      const statusText = item.status === 'absent' ? 'ABSENT' : 'LATE';

      const dispatchResult = await dispatchStudentNotification({
        schoolId: user.schoolId,
        studentId: item.studentId,
        title: `Attendance Alert: ${statusText}`,
        message: `${studentName} has been marked ${statusText} on ${date}.`,
        type: 'attendance',
      });

      alertDispatches.push({
        studentId: item.studentId,
        studentName,
        status: item.status,
        dispatchResult,
      });
    }
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

  // Fetch all students in this class and section
  const studentList = db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.schoolId, user.schoolId),
        eq(schema.students.classId, classId),
        eq(schema.students.sectionId, sectionId)
      )
    )
    .all();

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
