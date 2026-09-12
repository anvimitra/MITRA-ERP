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
      affiliationNo: schema.schools.affiliationNo,
      principalName: schema.schools.principalName,
      city: schema.schools.city,
      state: schema.schools.state,
      pincode: schema.schools.pincode,
      website: schema.schools.website,
      establishedYear: schema.schools.establishedYear,
      tagline: schema.schools.tagline,
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
  const {
    name,
    code,
    domain,
    logoUrl,
    primaryColor,
    secondaryColor,
    phone,
    email,
    address,
    affiliationNo,
    principalName,
    city,
    state,
    pincode,
    website,
    establishedYear,
    tagline,
  } = body;

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
    affiliationNo: affiliationNo || '',
    principalName: principalName || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    website: website || '',
    establishedYear: establishedYear || '',
    tagline: tagline || '',
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

// Update School Details (Super Admin has full access, Principal can only update operational fields)
schoolRoutes.put('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const schoolId = c.req.param('id');
  const existing = db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).get();
  if (!existing) {
    return c.json({ error: 'School not found' }, 404);
  }

  const body = await c.req.json();

  // If user is principal or accountant, restrict changing core details (Super Admin can change everything)
  if (user.role === 'principal' || user.role === 'accountant') {
    if (user.schoolId !== schoolId) {
      return c.json({ error: 'Forbidden: Access to another school is restricted' }, 403);
    }
    if (
      (body.code && body.code.toUpperCase() !== existing.code) ||
      (body.name && body.name !== existing.name) ||
      (body.domain && body.domain !== existing.domain) ||
      (body.affiliationNo && body.affiliationNo !== existing.affiliationNo)
    ) {
      return c.json({
        error: 'Security Policy: Core institutional details (School Name, Code, Domain, Affiliation) can only be changed by Super Admin.',
      }, 403);
    }

    // Principal can only update phone, address, and theme
    db.update(schema.schools)
      .set({
        phone: body.phone !== undefined ? body.phone : existing.phone,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        pincode: body.pincode !== undefined ? body.pincode : existing.pincode,
        website: body.website !== undefined ? body.website : existing.website,
        tagline: body.tagline !== undefined ? body.tagline : existing.tagline,
        primaryColor: body.primaryColor || existing.primaryColor,
        secondaryColor: body.secondaryColor || existing.secondaryColor,
        logoUrl: body.logoUrl || existing.logoUrl,
      })
      .where(eq(schema.schools.id, schoolId))
      .run();

    return c.json({ success: true, message: 'School preferences updated successfully' });
  }

  // Super Admin has full power to edit all fields
  if (user.role === 'super_admin') {
    db.update(schema.schools)
      .set({
        name: body.name || existing.name,
        code: body.code ? body.code.toUpperCase() : existing.code,
        domain: body.domain !== undefined ? body.domain : existing.domain,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        address: body.address !== undefined ? body.address : existing.address,
        affiliationNo: body.affiliationNo !== undefined ? body.affiliationNo : existing.affiliationNo,
        principalName: body.principalName !== undefined ? body.principalName : existing.principalName,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        pincode: body.pincode !== undefined ? body.pincode : existing.pincode,
        website: body.website !== undefined ? body.website : existing.website,
        establishedYear: body.establishedYear !== undefined ? body.establishedYear : existing.establishedYear,
        tagline: body.tagline !== undefined ? body.tagline : existing.tagline,
        primaryColor: body.primaryColor || existing.primaryColor,
        secondaryColor: body.secondaryColor || existing.secondaryColor,
        logoUrl: body.logoUrl || existing.logoUrl,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      })
      .where(eq(schema.schools.id, schoolId))
      .run();

    return c.json({ success: true, message: 'School profile and details updated successfully by Super Admin' });
  }

  return c.json({ error: 'Forbidden' }, 403);
});

// Super Admin: Delete / Remove a school
schoolRoutes.delete('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Super Admin permission required to delete schools' }, 403);
  }

  const schoolId = c.req.param('id');
  const existing = db.select().from(schema.schools).where(eq(schema.schools.id, schoolId)).get();
  if (!existing) {
    return c.json({ error: 'School not found' }, 404);
  }

  // Delete school record
  db.delete(schema.schools).where(eq(schema.schools.id, schoolId)).run();

  return c.json({ success: true, message: `School '${existing.name}' (${existing.code}) has been removed.` });
});
