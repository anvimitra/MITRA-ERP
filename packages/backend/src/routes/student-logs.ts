import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { dispatchStudentNotification } from '../services/notification-sms.js';

export const studentLogRoutes = new Hono();

// Get all logs for the current school (Principal / Admin view)
studentLogRoutes.get('/school', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const logs = db
    .select()
    .from(schema.studentLogs)
    .where(eq(schema.studentLogs.schoolId, user.schoolId))
    .all();

  const students = db
    .select({
      id: schema.students.id,
      firstName: schema.students.firstName,
      lastName: schema.students.lastName,
      admissionNo: schema.students.admissionNo,
      rollNo: schema.students.rollNo,
      classId: schema.students.classId,
      sectionId: schema.students.sectionId,
    })
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  const reporters = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = logs.map((l: any) => {
    const student = students.find((s: any) => s.id === l.studentId);
    const reporter = reporters.find((r: any) => r.id === l.reportedByUserId);
    return {
      ...l,
      studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown Student',
      admissionNo: student?.admissionNo || '',
      rollNo: student?.rollNo,
      reporterName: reporter?.name || 'Staff Member',
      reporterRole: reporter?.role || 'Staff',
    };
  });

  return c.json({ logs: enriched });
});

// Get behavioral / discipline logs for a student
studentLogRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');

  const logs = db
    .select()
    .from(schema.studentLogs)
    .where(
      and(
        eq(schema.studentLogs.schoolId, user.schoolId),
        eq(schema.studentLogs.studentId, studentId)
      )
    )
    .all();

  const reporters = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = logs.map((l: any) => {
    const reporter = reporters.find((r: any) => r.id === l.reportedByUserId);
    return {
      ...l,
      reporterName: reporter?.name || 'Staff Member',
      reporterRole: reporter?.role || 'Staff',
    };
  });

  return c.json({ logs: enriched });
});

// Create a new behavioral / discipline incident or award
studentLogRoutes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'teacher' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only Faculty and Principal can log observations' }, 403);
  }

  const body = await c.req.json();
  const { studentId, logType, title, description, actionTaken, date, notifyParent } = body;

  if (!studentId || !title || !description) {
    return c.json({ error: 'studentId, title, and description are required' }, 400);
  }

  const logId = crypto.randomUUID();
  const logDate = date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  db.insert(schema.studentLogs).values({
    id: logId,
    schoolId: user.schoolId,
    studentId,
    logType: logType || 'general',
    title,
    description,
    actionTaken: actionTaken || '',
    reportedByUserId: user.userId,
    date: logDate,
    notifyParent: notifyParent !== undefined ? (notifyParent ? 1 : 0) : 1,
    createdAt: now,
  }).run();

  // If notifyParent is requested, trigger in-app notification to the parent
  if (notifyParent) {
    dispatchStudentNotification({
      schoolId: user.schoolId,
      studentId,
      title: `[Student Log] ${title}`,
      message: `${description} ${actionTaken ? 'Action: ' + actionTaken : ''}`,
      type: 'general',
    }).catch((err) => console.warn('Discipline notification alert error:', err));
  }

  return c.json({ success: true, message: 'Student observation record saved', logId }, 201);
});

// Delete a log record
studentLogRoutes.delete('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only Principal can delete student log records' }, 403);
  }

  const logId = c.req.param('id');
  db.delete(schema.studentLogs).where(eq(schema.studentLogs.id, logId)).run();

  return c.json({ success: true, message: 'Student log record deleted' });
});
