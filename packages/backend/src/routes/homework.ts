import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import { verifyToken } from '../services/auth.js';
import { dispatchStudentNotification } from '../services/notification-sms.js';
import { saveLocalBackup } from '../db/persistent-backup.js';
import { getDatabaseInstance } from '../db/init.js';
import crypto from 'crypto';

export const homeworkRoutes = new Hono();

function getAuthUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  return verifyToken(authHeader.substring(7));
}

// GET /api/homework - List homework assignments
homeworkRoutes.get('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { classId, sectionId } = c.req.query();

  let query = db
    .select()
    .from(schema.homework)
    .where(eq(schema.homework.schoolId, user.schoolId))
    .all();

  if (classId) {
    query = query.filter((h: any) => h.classId === classId);
  }
  if (sectionId) {
    query = query.filter((h: any) => !h.sectionId || h.sectionId === sectionId);
  }

  // Sort descending by createdAt
  query.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Enrich with class and subject names
  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const subjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();

  const classMap = new Map(classes.map((cl: any) => [cl.id, cl.name]));
  const sectionMap = new Map(sections.map((sc: any) => [sc.id, sc.name]));
  const subjectMap = new Map(subjects.map((sb: any) => [sb.id, sb.name]));

  const enriched = query.map((h: any) => ({
    ...h,
    className: classMap.get(h.classId) || `Class ${h.classId}`,
    sectionName: h.sectionId ? (sectionMap.get(h.sectionId) || h.sectionId) : 'All Sections',
    subjectName: h.subjectId ? (subjectMap.get(h.subjectId) || h.subjectId) : 'General / Daily Homework',
  }));

  return c.json({ homework: enriched });
});

// POST /api/homework - Create homework assignment
homeworkRoutes.post('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Teachers, Principals, Admins can assign homework
  if (!['teacher', 'principal', 'admin', 'superadmin'].includes(user.role)) {
    return c.json({ error: 'Only teachers and academic staff can assign homework' }, 403);
  }

  const body = await c.req.json();
  const { classId, sectionId, subjectId, subjectName, title, description, dueDate, attachmentUrl } = body;

  if (!classId || !title?.trim() || !description?.trim()) {
    return c.json({ error: 'Class, title, and description are required' }, 400);
  }

  const newId = `hw-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const homeworkItem = {
    id: newId,
    schoolId: user.schoolId,
    classId,
    sectionId: sectionId || null,
    subjectId: subjectId || null,
    teacherId: user.userId || (user as any).id,
    teacherName: user.name || 'Faculty',
    title: title.trim(),
    description: description.trim(),
    dueDate: dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    attachmentUrl: attachmentUrl || null,
    createdAt: now,
  };

  db.insert(schema.homework).values(homeworkItem).run();

  // Trigger instant in-app alerts to all parents/students in this class
  try {
    const classStudents = db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.classId, classId)))
      .all();

    const targetStudents = classStudents.filter((s: any) => {
      if (!sectionId) return true;
      if (s.sectionId === sectionId) return true;
      if (sectionId.endsWith('-a') && (!s.sectionId || s.sectionId === 'sec-default' || !s.sectionId.includes(classId.replace('cls-', '')))) {
        return true;
      }
      return false;
    });

    const displaySubject = subjectName || (subjectId ? (db.select().from(schema.subjects).where(eq(schema.subjects.id, subjectId)).get()?.name || 'Subject') : 'Homework');

    for (const stu of targetStudents) {
      dispatchStudentNotification({
        schoolId: user.schoolId,
        studentId: stu.id,
        title: `📚 Homework: ${displaySubject}`,
        message: `${title.trim()} (Due: ${dueDate || 'Tomorrow'}). ${description.trim()}`,
        type: 'general',
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Notification dispatch error for homework:', err);
  }

  // Backup state
  saveLocalBackup(getDatabaseInstance());

  return c.json({ success: true, homework: homeworkItem });
});

// DELETE /api/homework/:id - Remove homework assignment
homeworkRoutes.delete('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const existing = db
    .select()
    .from(schema.homework)
    .where(and(eq(schema.homework.schoolId, user.schoolId), eq(schema.homework.id, id)))
    .get();

  if (!existing) {
    return c.json({ error: 'Homework not found' }, 404);
  }

  // Permission check: Creator teacher, principal, or superadmin
  if (user.role === 'teacher' && existing.teacherId !== (user.userId || (user as any).id)) {
    return c.json({ error: 'You can only delete homework assigned by you' }, 403);
  }

  db.delete(schema.homework).where(eq(schema.homework.id, id)).run();

  // Backup state
  saveLocalBackup(getDatabaseInstance());

  return c.json({ success: true, message: 'Homework assignment deleted successfully' });
});
