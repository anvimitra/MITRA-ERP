import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import { verifyToken, hashPassword } from '../services/auth.js';
import crypto from 'crypto';

export const teacherRoutes = new Hono();

function getAuthUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  return verifyToken(authHeader.substring(7));
}

// GET /api/teachers - List all staff/faculty for the school
teacherRoutes.get('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const staff = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      appInstalled: schema.users.appInstalled,
      lastActiveAt: schema.users.lastActiveAt,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  return c.json({ staff });
});

// POST /api/teachers - Add new teacher or staff member
teacherRoutes.post('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant')) {
    return c.json({ error: 'Only Principal, Accountant or Super Admin can recruit staff' }, 403);
  }

  const body = await c.req.json();
  const { name, email, phone, role = 'teacher', password } = body;

  if (!name || !email || !password) {
    return c.json({ error: 'Name, Email and Password are required' }, 400);
  }

  // Check existing email
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) {
    return c.json({ error: `User with email '${email}' already exists` }, 400);
  }

  const staffId = `user-staff-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const passwordHash = hashPassword(password);

  db.insert(schema.users).values({
    id: staffId,
    schoolId: user.schoolId,
    role: role || 'teacher',
    name,
    email,
    phone: phone || '',
    passwordHash,
    appInstalled: 0,
    isActive: 1,
    createdAt: new Date().toISOString(),
  }).run();

  return c.json({
    success: true,
    message: `${role === 'teacher' ? 'Teacher' : 'Staff'} registered successfully`,
    staffId,
  });
});

// PUT /api/teachers/:id - Edit faculty details
teacherRoutes.put('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant')) {
    return c.json({ error: 'Only Principal, Accountant or Super Admin can edit staff' }, 403);
  }

  const staffId = c.req.param('id');
  const existing = db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.schoolId, user.schoolId), eq(schema.users.id, staffId)))
    .get();

  if (!existing) {
    return c.json({ error: 'Staff member not found' }, 404);
  }

  const body = await c.req.json();
  const { name, email, phone, role, isActive, password } = body;

  const updates: any = {
    name: name !== undefined ? name : existing.name,
    phone: phone !== undefined ? phone : existing.phone,
    role: role !== undefined ? role : existing.role,
    isActive: isActive !== undefined ? isActive : existing.isActive,
  };

  if (email && email !== existing.email) {
    const conflict = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (conflict) {
      return c.json({ error: `User with email '${email}' already exists` }, 400);
    }
    updates.email = email;
  }

  if (password) {
    updates.passwordHash = hashPassword(password);
  }

  db.update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, staffId))
    .run();

  return c.json({ success: true, message: 'Faculty details updated successfully' });
});

// DELETE /api/teachers/:id - Remove or deactivate staff
teacherRoutes.delete('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant')) {
    return c.json({ error: 'Only Principal, Accountant or Super Admin can remove staff' }, 403);
  }

  const staffId = c.req.param('id');
  db.update(schema.users)
    .set({ isActive: 0 })
    .where(and(eq(schema.users.schoolId, user.schoolId), eq(schema.users.id, staffId)))
    .run();

  return c.json({ success: true, message: 'Staff deactivated from institution records' });
});
