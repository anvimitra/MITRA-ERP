import { Hono } from 'hono';
import { db, schema, eq } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const schoolRoutes = new Hono();

// Public: Get school branding info by School Code or Domain (used by mobile app & branded portal)
schoolRoutes.get('/branding/:codeOrDomain', async (c) => {
  const query = c.req.param('codeOrDomain').toUpperCase();

  const school = db
    .select({
      id: schema.schools.id,
      name: schema.schools.name,
      code: schema.schools.code,
      domain: schema.schools.domain,
      logoUrl: schema.schools.logoUrl,
      primaryColor: schema.schools.primaryColor,
      secondaryColor: schema.schools.secondaryColor,
      phone: schema.schools.phone,
      email: schema.schools.email,
      address: schema.schools.address,
    })
    .from(schema.schools)
    .where(eq(schema.schools.code, query))
    .get();

  if (!school) {
    return c.json({ error: 'School not found with given code' }, 404);
  }

  return c.json({ school });
});

// Super Admin: List all schools
schoolRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Super Admin only' }, 403);
  }

  const allSchools = db.select().from(schema.schools).all();

  // Attach student counts and staff counts
  const enriched = allSchools.map((s) => {
    const studentCount = db
      .select()
      .from(schema.students)
      .where(eq(schema.students.schoolId, s.id))
      .all().length;

    const teacherCount = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.schoolId, s.id))
      .all()
      .filter((u) => u.role === 'teacher').length;

    return {
      ...s,
      studentCount,
      teacherCount,
    };
  });

  return c.json({ schools: enriched });
});

// Super Admin: Create new school tenant
schoolRoutes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Super Admin only' }, 403);
  }

  const body = await c.req.json();
  const { name, code, domain, logoUrl, primaryColor, secondaryColor, phone, email, address } = body;

  if (!name || !code) {
    return c.json({ error: 'School name and unique code are required' }, 400);
  }

  const existing = db.select().from(schema.schools).where(eq(schema.schools.code, code.toUpperCase())).get();
  if (existing) {
    return c.json({ error: 'School code already exists' }, 400);
  }

  const schoolId = crypto.randomUUID();
  const apiSyncKey = `ANVI_SYNC_${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date().toISOString();

  db.insert(schema.schools).values({
    id: schoolId,
    name,
    code: code.toUpperCase(),
    domain,
    logoUrl: logoUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150',
    primaryColor: primaryColor || '#2563eb',
    secondaryColor: secondaryColor || '#1e40af',
    phone,
    email,
    address,
    apiSyncKey,
    isActive: 1,
    createdAt: now,
  }).run();

  return c.json({
    message: 'School created successfully',
    schoolId,
    apiSyncKey,
  }, 201);
});
