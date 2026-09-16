import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import { verifyToken, hashPassword } from '../services/auth.js';
import { resolveLinkedStudentsForParent } from '../services/rbac.js';
import { saveLocalBackup } from '../db/persistent-backup.js';
import { getDatabaseInstance } from '../db/init.js';
import crypto from 'crypto';

export const studentRoutes = new Hono();

// Helper to authenticate request
function getAuthUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  return verifyToken(authHeader.substring(7));
}

// GET /api/students - List students (Strict parent/student isolation)
studentRoutes.get('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Strict isolation: Parent can ONLY ever see their own linked children
  if (user.role === 'parent') {
    const linked = resolveLinkedStudentsForParent(user);
    return c.json({ students: linked });
  }

  // Strict isolation: Student can ONLY ever see their own student record
  if (user.role === 'student') {
    const currentStudent = db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.userId, user.userId || (user as any).id)))
      .get();
    if (!currentStudent) return c.json({ students: [] });

    const cls = db.select().from(schema.classes).where(eq(schema.classes.id, currentStudent.classId)).get();
    const sec = db.select().from(schema.sections).where(eq(schema.sections.id, currentStudent.sectionId)).get();
    const p = currentStudent.parentId
      ? db.select().from(schema.parents).where(eq(schema.parents.id, currentStudent.parentId)).get()
      : null;

    return c.json({
      students: [
        {
          ...currentStudent,
          className: cls?.name || currentStudent.classId,
          sectionName: sec?.name || currentStudent.sectionId,
          fatherName: p?.fatherName || '',
          motherName: p?.motherName || '',
          primaryPhone: p?.primaryPhone || '',
          email: p?.email || '',
        },
      ],
    });
  }

  const { classId, sectionId, search } = c.req.query();

  let allStudents = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  // Apply filters in memory for flexibility
  if (classId) {
    allStudents = allStudents.filter((s: any) => s.classId === classId);
  }
  if (sectionId) {
    allStudents = allStudents.filter((s: any) => s.sectionId === sectionId);
  }
  if (search) {
    const q = search.toLowerCase();
    allStudents = allStudents.filter(
      (s: any) =>
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q)
    );
  }

  // Enrich with class and section names and parent info
  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const parents = db.select().from(schema.parents).where(eq(schema.parents.schoolId, user.schoolId)).all();

  const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
  const sectionMap = new Map(sections.map((s: any) => [s.id, s.name]));
  const parentMap = new Map(parents.map((p: any) => [p.id, p]));

  const enriched = allStudents.map((s: any) => {
    const p: any = parentMap.get(s.parentId);
    return {
      ...s,
      className: classMap.get(s.classId) || s.classId,
      sectionName: sectionMap.get(s.sectionId) || s.sectionId,
      fatherName: p?.fatherName || '',
      motherName: p?.motherName || '',
      primaryPhone: p?.primaryPhone || '',
      email: p?.email || '',
      address: p?.address || '',
      emergencyPhone: s.emergencyPhone || '',
      medicalConditions: s.medicalConditions || '',
      allergies: s.allergies || '',
      category: s.category || 'General',
    };
  });

  return c.json({ students: enriched });
});

// POST /api/students - Add a new student
studentRoutes.post('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant')) {
    return c.json({ error: 'Only Principal, Staff or Admin can add students' }, 403);
  }

  const body = await c.req.json();
  const {
    admissionNo,
    rollNo,
    firstName,
    lastName,
    classId,
    sectionId,
    gender,
    dob,
    bloodGroup,
    emergencyPhone,
    medicalConditions,
    allergies,
    category,
    fatherName,
    motherName,
    primaryPhone,
    email,
    address,
  } = body;

  if (!admissionNo || !firstName || !classId || !sectionId) {
    return c.json({ error: 'Admission No, First Name, Class and Section are required' }, 400);
  }

  // Check unique admissionNo in this school
  const existing = db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.admissionNo, admissionNo)))
    .get();

  if (existing) {
    return c.json({ error: `Admission No '${admissionNo}' already exists in this school` }, 400);
  }

  const studentId = `stu-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  let parentId = null;
  let parentCredentials = null;

  // Auto-generate Parent Credentials & Account
  if (primaryPhone || fatherName || motherName) {
    const pName = (fatherName || motherName || 'PARENT').trim();
    // Clean name letters only
    const lettersOnly = pName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const namePrefix = (lettersOnly.length >= 4 ? lettersOnly.slice(0, 4) : lettersOnly.padEnd(4, 'P')).toUpperCase();

    // Clean phone: extract digits only
    const cleanPhone = (primaryPhone || '').replace(/\D/g, '');
    const phoneSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';

    // Auto password formula: First 4 uppercase letters of parent name + Last 4 digits of mobile
    const autoPassword = `${namePrefix}${phoneSuffix}`;

    let parentUserId: string | null = null;
    if (cleanPhone.length >= 10) {
      const allUsers = db.select().from(schema.users).all();
      const existingParentUser = allUsers.find((u: any) => {
        const uPhone = (u.phone || '').replace(/\D/g, '');
        return uPhone === cleanPhone || (uPhone.length >= 10 && uPhone.endsWith(cleanPhone.slice(-10)));
      });

      if (existingParentUser) {
        parentUserId = existingParentUser.id;
      } else {
        parentUserId = `user-parent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        db.insert(schema.users).values({
          id: parentUserId,
          schoolId: user.schoolId,
          role: 'parent',
          name: pName,
          email: `${cleanPhone}@parent.school`,
          phone: cleanPhone,
          passwordHash: hashPassword(autoPassword),
          appInstalled: 0,
          isActive: 1,
          createdAt: new Date().toISOString(),
        }).run();
      }

      parentCredentials = {
        loginId: cleanPhone,
        password: autoPassword,
        parentName: pName,
        studentName: `${firstName} ${lastName || ''}`.trim(),
      };
    }

    // Check existing parent record or create new
    let parentRecord: any = null;
    if (parentUserId) {
      parentRecord = db.select().from(schema.parents).where(eq(schema.parents.userId, parentUserId)).get();
    }
    if (!parentRecord && cleanPhone) {
      const allParents = db.select().from(schema.parents).all();
      parentRecord = allParents.find((p: any) => {
        const pPhone = (p.primaryPhone || '').replace(/\D/g, '');
        return pPhone === cleanPhone || (pPhone.length >= 10 && pPhone.endsWith(cleanPhone.slice(-10)));
      });
    }

    if (parentRecord) {
      parentId = parentRecord.id;
      if (parentUserId && !parentRecord.userId) {
        db.update(schema.parents).set({ userId: parentUserId }).where(eq(schema.parents.id, parentId)).run();
      }
    } else {
      parentId = `par-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.insert(schema.parents).values({
        id: parentId,
        schoolId: user.schoolId,
        userId: parentUserId,
        fatherName: fatherName || '',
        motherName: motherName || '',
        primaryPhone: primaryPhone || '',
        email: email || '',
        address: address || '',
      }).run();
    }
  }

  db.insert(schema.students).values({
    id: studentId,
    schoolId: user.schoolId,
    admissionNo,
    rollNo: rollNo ? Number(rollNo) : null,
    firstName,
    lastName: lastName || '',
    classId,
    sectionId,
    parentId,
    gender: gender || 'Male',
    dob: dob || null,
    bloodGroup: bloodGroup || null,
    emergencyPhone: emergencyPhone || null,
    medicalConditions: medicalConditions || null,
    allergies: allergies || null,
    category: category || 'General',
    photoUrl: (body.photoUrl && typeof body.photoUrl === 'string' && body.photoUrl.trim())
      ? body.photoUrl.trim()
      : (gender === 'Female' ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
    isActive: 1,
  }).run();

  try {
    saveLocalBackup(getDatabaseInstance());
  } catch {}

  return c.json({
    success: true,
    message: 'Student admitted successfully',
    studentId,
    parentCredentials,
  });
});

// PUT /api/students/:id - Edit existing student
studentRoutes.put('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant')) {
    return c.json({ error: 'Only Principal, Staff or Admin can edit students' }, 403);
  }

  const studentId = c.req.param('id');
  const existing = db
    .select()
    .from(schema.students)
    .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.id, studentId)))
    .get();

  if (!existing) {
    return c.json({ error: 'Student not found' }, 404);
  }

  const body = await c.req.json();
  const {
    admissionNo,
    rollNo,
    firstName,
    lastName,
    classId,
    sectionId,
    gender,
    dob,
    bloodGroup,
    emergencyPhone,
    medicalConditions,
    allergies,
    category,
    photoUrl,
    fatherName,
    motherName,
    primaryPhone,
    email,
    address,
    isActive,
  } = body;

  db.update(schema.students)
    .set({
      admissionNo: admissionNo !== undefined ? admissionNo : existing.admissionNo,
      rollNo: rollNo !== undefined ? (rollNo ? Number(rollNo) : null) : existing.rollNo,
      firstName: firstName !== undefined ? firstName : existing.firstName,
      lastName: lastName !== undefined ? lastName : existing.lastName,
      classId: classId !== undefined ? classId : existing.classId,
      sectionId: sectionId !== undefined ? sectionId : existing.sectionId,
      gender: gender !== undefined ? gender : existing.gender,
      dob: dob !== undefined ? dob : existing.dob,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : existing.bloodGroup,
      emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : existing.emergencyPhone,
      medicalConditions: medicalConditions !== undefined ? medicalConditions : existing.medicalConditions,
      allergies: allergies !== undefined ? allergies : existing.allergies,
      category: category !== undefined ? category : existing.category,
      photoUrl: (photoUrl !== undefined && typeof photoUrl === 'string' && photoUrl.trim()) ? photoUrl.trim() : existing.photoUrl,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    })
    .where(eq(schema.students.id, studentId))
    .run();

  // Update or create parent record
  if (existing.parentId) {
    db.update(schema.parents)
      .set({
        fatherName: fatherName !== undefined ? fatherName : '',
        motherName: motherName !== undefined ? motherName : '',
        primaryPhone: primaryPhone !== undefined ? primaryPhone : '',
        email: email !== undefined ? email : '',
        address: address !== undefined ? address : '',
      })
      .where(eq(schema.parents.id, existing.parentId))
      .run();
  } else if (primaryPhone || fatherName) {
    const parentId = `par-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    db.insert(schema.parents).values({
      id: parentId,
      schoolId: user.schoolId,
      fatherName: fatherName || '',
      motherName: motherName || '',
      primaryPhone: primaryPhone || '',
      email: email || '',
      address: address || '',
    }).run();
    db.update(schema.students)
      .set({ parentId })
      .where(eq(schema.students.id, studentId))
      .run();
  }

  try {
    saveLocalBackup(getDatabaseInstance());
  } catch {}

  return c.json({ success: true, message: 'Student details updated successfully' });
});

// DELETE /api/students/:id - Delete or deactivate student
studentRoutes.delete('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Super Admin can delete students' }, 403);
  }

  const studentId = c.req.param('id');
  db.delete(schema.students)
    .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.id, studentId)))
    .run();

  try {
    saveLocalBackup(getDatabaseInstance());
  } catch {}

  return c.json({ success: true, message: 'Student removed from institution records' });
});

// GET /api/students/parents - Dedicated directory of all parents for current school
studentRoutes.get('/parents', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (user.role === 'parent' || user.role === 'student') {
    return c.json({ error: 'Forbidden: Access denied to parents directory' }, 403);
  }

  const rawParents = db
    .select()
    .from(schema.parents)
    .where(eq(schema.parents.schoolId, user.schoolId))
    .all();

  const students = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  const users = db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.schoolId, user.schoolId), eq(schema.users.role, 'parent')))
    .all();

  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const classMap = new Map(classes.map((cl: any) => [cl.id, cl.name]));
  const sectionMap = new Map(sections.map((sec: any) => [sec.id, sec.name]));
  const userMap = new Map(users.map((u: any) => [u.id, u]));

  // Index known parents by clean phone and ID
  const parentsByPhone = new Map<string, any>();
  const parentsById = new Map<string, any>();

  for (const p of rawParents) {
    const pPhone = (p.primaryPhone || '').replace(/\D/g, '');
    if (pPhone) parentsByPhone.set(pPhone.slice(-10), p);
    parentsById.set(p.id, p);
  }

  const allParentEntries: any[] = [...rawParents];

  // Also add registered parent users from users table if not in parents table
  for (const u of users) {
    const uPhone = (u.phone || '').replace(/\D/g, '');
    const hasById = parentsById.has(u.id);
    const hasByPhone = uPhone.length >= 10 && parentsByPhone.has(uPhone.slice(-10));
    if (!hasById && !hasByPhone) {
      const parentEntry = {
        id: `par-user-${u.id}`,
        schoolId: user.schoolId,
        userId: u.id,
        fatherName: u.name || 'Parent Guardian',
        motherName: '',
        primaryPhone: u.phone || '',
        email: u.email || '',
        address: '',
      };
      allParentEntries.push(parentEntry);
      if (uPhone.length >= 10) parentsByPhone.set(uPhone.slice(-10), parentEntry);
      parentsById.set(parentEntry.id, parentEntry);
    }
  }

  // Also collect parents directly from students if missing from parents table
  for (const s of students) {
    const sPhone = (s.emergencyPhone || '').replace(/\D/g, '');
    const hasParentById = s.parentId && parentsById.has(s.parentId);
    const hasParentByPhone = sPhone.length >= 10 && parentsByPhone.has(sPhone.slice(-10));

    if (!hasParentById && !hasParentByPhone) {
      const syntheticParent = {
        id: s.parentId || `par-auto-${s.id}`,
        schoolId: user.schoolId,
        userId: null,
        fatherName: `Guardian of ${s.firstName}`,
        motherName: '',
        primaryPhone: s.emergencyPhone || '',
        email: '',
        address: '',
      };
      allParentEntries.push(syntheticParent);
      if (sPhone.length >= 10) {
        parentsByPhone.set(sPhone.slice(-10), syntheticParent);
      }
      parentsById.set(syntheticParent.id, syntheticParent);
    }
  }

  const enrichedParents = allParentEntries.map((p: any) => {
    const cleanPhone = (p.primaryPhone || '').replace(/\D/g, '');
    const parentUser: any = p.userId
      ? userMap.get(p.userId)
      : users.find((u: any) => {
          const uPhone = (u.phone || '').replace(/\D/g, '');
          return cleanPhone && uPhone && cleanPhone.slice(-10) === uPhone.slice(-10);
        });

    const pName = (p.fatherName || p.motherName || parentUser?.name || 'Parent').trim();

    // Find all children linked by parentId OR phone matching
    const children = students
      .filter((s: any) => {
        if (s.parentId === p.id) return true;
        const sPhone = (s.primaryPhone || '').replace(/\D/g, '');
        const sEmerg = (s.emergencyPhone || '').replace(/\D/g, '');
        if (cleanPhone.length >= 10 && (sPhone.endsWith(cleanPhone.slice(-10)) || sEmerg.endsWith(cleanPhone.slice(-10)))) {
          return true;
        }
        return false;
      })
      .map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo,
        className: classMap.get(s.classId) || s.classId,
        sectionName: sectionMap.get(s.sectionId) || s.sectionId,
        gender: s.gender,
      }));

    // Calculate auto password hint: First 4 letters uppercase + Last 4 digits of phone
    const lettersOnly = pName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const namePrefix = (lettersOnly.length >= 4 ? lettersOnly.slice(0, 4) : lettersOnly.padEnd(4, 'P')).toUpperCase();
    const phoneSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';
    const autoPasswordPreview = `${namePrefix}${phoneSuffix}`;

    return {
      id: p.id,
      userId: parentUser?.id || p.userId || null,
      name: pName,
      fatherName: p.fatherName || '',
      motherName: p.motherName || '',
      phone: p.primaryPhone || parentUser?.phone || '',
      email: p.email || parentUser?.email || '',
      address: p.address || '',
      loginId: cleanPhone || p.primaryPhone,
      passwordFormula: `${namePrefix} + Last 4 digits (${autoPasswordPreview})`,
      autoPasswordPreview,
      appInstalled: parentUser ? parentUser.appInstalled : 0,
      lastActiveAt: parentUser ? parentUser.lastActiveAt : null,
      isActive: parentUser ? parentUser.isActive : 1,
      children,
      totalChildren: children.length,
    };
  });

  return c.json({ parents: enrichedParents });
});

