import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import { comparePassword, generateToken, verifyToken } from '../services/auth.js';

export const authRoutes = new Hono();

// Universal login for all roles: Super Admin, Principal, Teacher, Staff/Accountant, Parent
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, password, schoolCode } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  // Find user by email
  const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  if (user.isActive === 0) {
    return c.json({ error: 'Account is deactivated. Contact administration.' }, 403);
  }

  // Validate password
  const isValid = comparePassword(password, user.passwordHash);
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // If schoolCode provided, verify school match (except for super_admin)
  let school = null;
  if (user.schoolId) {
    school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
    if (schoolCode && school && school.code.toUpperCase() !== schoolCode.toUpperCase()) {
      return c.json({ error: 'User does not belong to this school' }, 403);
    }
  }

  // Update last active time & set appInstalled if request indicates mobile client
  const now = new Date().toISOString();
  db.update(schema.users)
    .set({
      lastActiveAt: now,
      appInstalled: body.isMobileApp ? 1 : user.appInstalled,
    })
    .where(eq(schema.users.id, user.id))
    .run();

  // If role is parent, find linked students
  let linkedStudents: any[] = [];
  if (user.role === 'parent') {
    const parentRecord = db.select().from(schema.parents).where(eq(schema.parents.userId, user.id)).get();
    if (parentRecord) {
      linkedStudents = db
        .select()
        .from(schema.students)
        .where(eq(schema.students.parentId, parentRecord.id))
        .all();
    }
  }

  const token = generateToken({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      phone: user.phone,
      appInstalled: user.appInstalled,
    },
    school: school
      ? {
          id: school.id,
          name: school.name,
          code: school.code,
          logoUrl: school.logoUrl,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
        }
      : null,
    linkedStudents,
  });
});

// Current user profile
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  const user = db.select().from(schema.users).where(eq(schema.users.id, decoded.userId)).get();
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  let school = null;
  if (user.schoolId) {
    school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
  }

  let linkedStudents: any[] = [];
  if (user.role === 'parent') {
    const parentRecord = db.select().from(schema.parents).where(eq(schema.parents.userId, user.id)).get();
    if (parentRecord) {
      linkedStudents = db
        .select()
        .from(schema.students)
        .where(eq(schema.students.parentId, parentRecord.id))
        .all();
    }
  }

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      phone: user.phone,
      appInstalled: user.appInstalled,
    },
    school,
    linkedStudents,
  });
});
