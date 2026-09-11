import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const timetableRoutes = new Hono();

// Get weekly timetable for a specific class and section
timetableRoutes.get('/class/:classId/:sectionId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized or no school associated' }, 401);

  const classId = c.req.param('classId');
  const sectionId = c.req.param('sectionId');

  const rawPeriods = db
    .select()
    .from(schema.timetablePeriods)
    .where(
      and(
        eq(schema.timetablePeriods.schoolId, user.schoolId),
        eq(schema.timetablePeriods.classId, classId),
        eq(schema.timetablePeriods.sectionId, sectionId)
      )
    )
    .all();

  const subjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();
  const teachers = db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = rawPeriods.map((p: any) => {
    const sub = subjects.find((s: any) => s.id === p.subjectId);
    const tch = teachers.find((t: any) => t.id === p.teacherId);
    return {
      ...p,
      subjectName: sub?.name || 'Subject',
      subjectCode: sub?.code || 'GEN',
      teacherName: tch?.name || 'Teacher',
    };
  });

  return c.json({ periods: enriched });
});

// Teacher specific: Get weekly teaching timetable for a faculty member
timetableRoutes.get('/teacher/:teacherId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const teacherId = c.req.param('teacherId');

  const rawPeriods = db
    .select()
    .from(schema.timetablePeriods)
    .where(
      and(
        eq(schema.timetablePeriods.schoolId, user.schoolId),
        eq(schema.timetablePeriods.teacherId, teacherId)
      )
    )
    .all();

  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const subjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();

  const enriched = rawPeriods.map((p: any) => {
    const cls = classes.find((c: any) => c.id === p.classId);
    const sec = sections.find((s: any) => s.id === p.sectionId);
    const sub = subjects.find((s: any) => s.id === p.subjectId);
    return {
      ...p,
      className: cls?.name || 'Class',
      sectionName: sec?.name || 'A',
      subjectName: sub?.name || 'Subject',
    };
  });

  return c.json({ periods: enriched });
});

// Principal / Admin: Create or update a scheduled period
timetableRoutes.post('/period', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only School Principal or Admin can configure timetables' }, 403);
  }

  const body = await c.req.json();
  const {
    id,
    classId,
    sectionId,
    dayOfWeek,
    periodNumber,
    startTime,
    endTime,
    subjectId,
    teacherId,
    roomNumber,
  } = body;

  if (!classId || !sectionId || !dayOfWeek || !periodNumber || !subjectId || !teacherId) {
    return c.json({ error: 'Missing required period details' }, 400);
  }

  const periodId = id || crypto.randomUUID();

  if (id) {
    db.delete(schema.timetablePeriods).where(eq(schema.timetablePeriods.id, id)).run();
  }

  db.insert(schema.timetablePeriods).values({
    id: periodId,
    schoolId: user.schoolId,
    classId,
    sectionId,
    dayOfWeek,
    periodNumber: Number(periodNumber),
    startTime: startTime || '09:00 AM',
    endTime: endTime || '09:45 AM',
    subjectId,
    teacherId,
    roomNumber: roomNumber || 'Room 101',
  }).run();

  return c.json({ success: true, message: 'Timetable period saved successfully', periodId }, 201);
});

// Principal / Admin: Delete a scheduled period
timetableRoutes.delete('/period/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only School Principal can modify timetables' }, 403);
  }

  const periodId = c.req.param('id');
  db.delete(schema.timetablePeriods).where(eq(schema.timetablePeriods.id, periodId)).run();

  return c.json({ success: true, message: 'Period removed from timetable' });
});
