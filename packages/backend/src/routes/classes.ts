import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const classRoutes = new Hono();

function ensurePrePrimaryClasses(schoolId: string) {
  const preClasses = [
    { name: 'NURSERY', gradeLevel: -3, codeSuffix: 'nursery' },
    { name: 'LKG', gradeLevel: -2, codeSuffix: 'lkg' },
    { name: 'UKG', gradeLevel: -1, codeSuffix: 'ukg' },
  ];

  try {
    const existingClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, schoolId)).all();
    const existingNames = new Set(existingClasses.map((c: any) => (c.name || '').toUpperCase().trim()));

    for (const pre of preClasses) {
      if (!existingNames.has(pre.name)) {
        const classId = `cls-${schoolId.slice(0, 6)}-${pre.codeSuffix}`;
        db.insert(schema.classes).values({
          id: classId,
          schoolId,
          name: pre.name,
          gradeLevel: pre.gradeLevel,
        }).run();

        db.insert(schema.sections).values({
          id: `sec-${schoolId.slice(0, 6)}-${pre.codeSuffix}-a`,
          schoolId,
          classId,
          name: 'A',
        }).run();

        db.insert(schema.sections).values({
          id: `sec-${schoolId.slice(0, 6)}-${pre.codeSuffix}-b`,
          schoolId,
          classId,
          name: 'B',
        }).run();
      }
    }
  } catch (err) {
    console.warn('ensurePrePrimaryClasses warning:', err);
  }
}

// Get all classes, sections, and subjects for the current school
classRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized or no school associated' }, 401);

  ensurePrePrimaryClasses(user.schoolId);

  const schoolClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  schoolClasses.sort((a: any, b: any) => (Number(a.gradeLevel) || 0) - (Number(b.gradeLevel) || 0));
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

  ensurePrePrimaryClasses(user.schoolId);

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
  classes.sort((a: any, b: any) => (Number(a.gradeLevel) || 0) - (Number(b.gradeLevel) || 0));
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

// Update Class (Principal or SuperAdmin)
classRoutes.put('/class/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can edit classes' }, 403);
  }

  const id = c.req.param('id');
  const { name, gradeLevel } = await c.req.json();

  const existing = db
    .select()
    .from(schema.classes)
    .where(and(eq(schema.classes.schoolId, user.schoolId), eq(schema.classes.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Class not found' }, 404);

  db.update(schema.classes)
    .set({
      name: name ?? existing.name,
      gradeLevel: gradeLevel !== undefined ? Number(gradeLevel) : existing.gradeLevel,
    })
    .where(and(eq(schema.classes.schoolId, user.schoolId), eq(schema.classes.id, id)))
    .run();

  return c.json({ success: true, message: 'Class updated successfully' });
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

// Create a new Subject (Principal or SuperAdmin) - strictly per class
classRoutes.post('/subject', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can create subjects' }, 403);
  }

  const { name, code, classId } = await c.req.json();
  if (!name) return c.json({ error: 'Subject name is required' }, 400);

  const id = `sub-${Date.now().toString().slice(-4)}`;
  db.insert(schema.subjects).values({
    id,
    schoolId: user.schoolId,
    classId: classId || null,
    name,
    code: code || null,
  }).run();

  return c.json({ success: true, message: 'Subject created successfully', id });
});

// Update Subject (Principal or SuperAdmin)
classRoutes.put('/subject/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can edit subjects' }, 403);
  }

  const id = c.req.param('id');
  const { name, code, classId } = await c.req.json();

  const existing = db
    .select()
    .from(schema.subjects)
    .where(and(eq(schema.subjects.schoolId, user.schoolId), eq(schema.subjects.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Subject not found' }, 404);

  db.update(schema.subjects)
    .set({
      name: name ?? existing.name,
      code: code !== undefined ? code : existing.code,
      classId: classId !== undefined ? classId : existing.classId,
    })
    .where(and(eq(schema.subjects.schoolId, user.schoolId), eq(schema.subjects.id, id)))
    .run();

  return c.json({ success: true, message: 'Subject updated successfully' });
});


// Delete a Subject (Principal or SuperAdmin)
classRoutes.delete('/subject/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can delete subjects' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.subjects).where(
    and(
      eq(schema.subjects.schoolId, user.schoolId),
      eq(schema.subjects.id, id)
    )
  ).run();

  // Also clean up allocations for this subject
  db.delete(schema.subjectAllocations).where(
    and(
      eq(schema.subjectAllocations.schoolId, user.schoolId),
      eq(schema.subjectAllocations.subjectId, id)
    )
  ).run();

  return c.json({ success: true, message: 'Subject removed successfully' });
});

// Get subjects specific to a class
classRoutes.get('/:classId/subjects', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const classId = c.req.param('classId');
  const allSubs = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();
  // Filter for subjects designated for this class, or common (no classId set)
  const classSubs = allSubs.filter((s: any) => !s.classId || s.classId === classId);

  return c.json({ subjects: classSubs });
});

