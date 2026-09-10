import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const classRoutes = new Hono();

// Get all classes, sections, and subjects for the current school
classRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized or no school associated' }, 401);

  const schoolClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const schoolSections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const schoolSubjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();
  const schoolTeachers = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(and(eq(schema.users.schoolId, user.schoolId), eq(schema.users.role, 'teacher')))
    .all();

  const classTeacherAssignments = db
    .select()
    .from(schema.classTeachers)
    .where(eq(schema.classTeachers.schoolId, user.schoolId))
    .all();

  const subjectAllocations = db
    .select()
    .from(schema.subjectAllocations)
    .where(eq(schema.subjectAllocations.schoolId, user.schoolId))
    .all();

  return c.json({
    classes: schoolClasses,
    sections: schoolSections,
    subjects: schoolSubjects,
    teachers: schoolTeachers,
    classTeacherAssignments,
    subjectAllocations,
  });
});

// Teacher specific: Get only the classes/sections and subjects assigned to ME
classRoutes.get('/my-allocations', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  // If teacher, find class teacher assignments
  const classTeacherOf = db
    .select()
    .from(schema.classTeachers)
    .where(and(eq(schema.classTeachers.schoolId, user.schoolId), eq(schema.classTeachers.teacherId, user.userId)))
    .all();

  // Find subject assignments
  const subjectsAssigned = db
    .select()
    .from(schema.subjectAllocations)
    .where(and(eq(schema.subjectAllocations.schoolId, user.schoolId), eq(schema.subjectAllocations.teacherId, user.userId)))
    .all();

  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const subjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();

  return c.json({
    isClassTeacher: classTeacherOf.length > 0,
    classTeacherOf,
    subjectsAssigned,
    allClasses: classes,
    allSections: sections,
    allSubjects: subjects,
  });
});

// Assign Class Teacher (Principal only)
classRoutes.post('/class-teacher', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can assign class teachers' }, 403);
  }

  const body = await c.req.json();
  const { classId, sectionId, teacherId, academicYear } = body;

  if (!classId || !sectionId || !teacherId) {
    return c.json({ error: 'Class, Section and Teacher are required' }, 400);
  }

  // Remove existing assignment for this class & section if any
  db.delete(schema.classTeachers)
    .where(
      and(
        eq(schema.classTeachers.schoolId, user.schoolId),
        eq(schema.classTeachers.classId, classId),
        eq(schema.classTeachers.sectionId, sectionId)
      )
    )
    .run();

  const id = crypto.randomUUID();
  db.insert(schema.classTeachers).values({
    id,
    schoolId: user.schoolId,
    classId,
    sectionId,
    teacherId,
    academicYear: academicYear || '2026-2027',
  }).run();

  return c.json({ success: true, message: 'Class Teacher assigned successfully' });
});

// Assign Subject Teacher (Principal only)
classRoutes.post('/subject-allocation', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can allocate subject teachers' }, 403);
  }

  const body = await c.req.json();
  const { teacherId, classId, sectionId, subjectId, academicYear } = body;

  if (!teacherId || !classId || !sectionId || !subjectId) {
    return c.json({ error: 'Teacher, Class, Section, and Subject are required' }, 400);
  }

  // Delete existing mapping for this combo
  db.delete(schema.subjectAllocations)
    .where(
      and(
        eq(schema.subjectAllocations.schoolId, user.schoolId),
        eq(schema.subjectAllocations.classId, classId),
        eq(schema.subjectAllocations.sectionId, sectionId),
        eq(schema.subjectAllocations.subjectId, subjectId)
      )
    )
    .run();

  const id = crypto.randomUUID();
  db.insert(schema.subjectAllocations).values({
    id,
    schoolId: user.schoolId,
    teacherId,
    classId,
    sectionId,
    subjectId,
    academicYear: academicYear || '2026-2027',
  }).run();

  return c.json({ success: true, message: 'Subject allocated successfully' });
});

// Create a new Class (Principal or SuperAdmin)
classRoutes.post('/class', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can create classes' }, 403);
  }

  const { name, gradeLevel } = await c.req.json();
  if (!name) return c.json({ error: 'Class name is required' }, 400);

  const id = `class-${Date.now().toString().slice(-4)}`;
  db.insert(schema.classes).values({
    id,
    schoolId: user.schoolId,
    name,
    gradeLevel: gradeLevel ? Number(gradeLevel) : null,
  }).run();

  // Create default Section A for this new class
  const secId = `sec-${id}-a`;
  db.insert(schema.sections).values({
    id: secId,
    schoolId: user.schoolId,
    classId: id,
    name: 'A',
  }).run();

  return c.json({ success: true, message: 'Class created successfully', id });
});

// Create a new Section (Principal or SuperAdmin)
classRoutes.post('/section', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can create sections' }, 403);
  }

  const { classId, name } = await c.req.json();
  if (!classId || !name) return c.json({ error: 'Class and Section name are required' }, 400);

  const id = `sec-${Date.now().toString().slice(-4)}`;
  db.insert(schema.sections).values({
    id,
    schoolId: user.schoolId,
    classId,
    name,
  }).run();

  return c.json({ success: true, message: 'Section created successfully', id });
});

// Create a new Subject (Principal or SuperAdmin)
classRoutes.post('/subject', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can create subjects' }, 403);
  }

  const { name, code } = await c.req.json();
  if (!name) return c.json({ error: 'Subject name is required' }, 400);

  const id = `sub-${Date.now().toString().slice(-4)}`;
  db.insert(schema.subjects).values({
    id,
    schoolId: user.schoolId,
    name,
    code: code || null,
  }).run();

  return c.json({ success: true, message: 'Subject created successfully', id });
});

