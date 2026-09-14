import { Hono } from 'hono';
import { db, schema, eq } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken, hashPassword } from '../services/auth.js';
import { isPostgresConnected, getPostgresPool } from '../db/postgres-sync.js';
import { restoreLocalBackup, saveLocalBackup } from '../db/persistent-backup.js';
import { getDatabaseInstance } from '../db/init.js';

function normalizeLogoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150';
  }
  let clean = url.trim();
  // Handle Google Drive preview/sharing URL
  const gdriveMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`;
  }
  // Handle Imgur page link
  const imgurMatch = clean.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.png`;
  }
  // Ensure http/https/data prefix
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('data:')) {
    clean = 'https://' + clean;
  }
  return clean;
}

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
    principalEmail,
    principalPassword,
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

  // 1. Insert School
  db.insert(schema.schools).values({
    id: schoolId,
    name,
    code: code.toUpperCase(),
    domain,
    logoUrl: normalizeLogoUrl(logoUrl),
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

  // 2. Create Principal Account with Super Admin specified credentials
  const pEmail = principalEmail || email || `principal@${code.toLowerCase()}.edu`;
  const pPassword = principalPassword || 'School@123';
  const principalUserId = `user-principal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  db.insert(schema.users).values({
    id: principalUserId,
    schoolId,
    role: 'principal',
    name: principalName || `${name} Principal`,
    email: pEmail,
    phone: phone || '',
    passwordHash: hashPassword(pPassword),
    appInstalled: 0,
    isActive: 1,
    createdAt: now,
  }).run();

  // 3. Auto-initialize Pre-Primary (NURSERY, LKG, UKG) and Classes 1 to 12 with Sections A & B for this school
  try {
    const preClasses = [
      { name: 'NURSERY', gradeLevel: -3, codeSuffix: 'nursery' },
      { name: 'LKG', gradeLevel: -2, codeSuffix: 'lkg' },
      { name: 'UKG', gradeLevel: -1, codeSuffix: 'ukg' },
    ];
    for (const pre of preClasses) {
      const classId = `cls-${code.toLowerCase()}-${pre.codeSuffix}`;
      db.insert(schema.classes).values({
        id: classId,
        schoolId,
        name: pre.name,
        gradeLevel: pre.gradeLevel,
      }).onConflictDoNothing().run();

      db.insert(schema.sections).values([
        { id: `sec-${code.toLowerCase()}-${pre.codeSuffix}-a`, schoolId, classId, name: 'A' },
        { id: `sec-${code.toLowerCase()}-${pre.codeSuffix}-b`, schoolId, classId, name: 'B' },
      ]).onConflictDoNothing().run();
    }

    for (let grade = 1; grade <= 12; grade++) {
      const classId = `cls-${code.toLowerCase()}-${grade}`;
      db.insert(schema.classes).values({
        id: classId,
        schoolId,
        name: `Class ${grade}`,
        gradeLevel: grade,
      }).onConflictDoNothing().run();

      db.insert(schema.sections).values([
        { id: `sec-${code.toLowerCase()}-${grade}-a`, schoolId, classId, name: 'A' },
        { id: `sec-${code.toLowerCase()}-${grade}-b`, schoolId, classId, name: 'B' },
      ]).onConflictDoNothing().run();
    }
  } catch (err) {
    console.warn('Auto class initialization check:', err);
  }

  return c.json({
    message: 'School created successfully with Principal credentials & classes (NURSERY, LKG, UKG, 1 to 12)',
    schoolId,
    apiSyncKey,
    principalCredentials: {
      schoolCode: code.toUpperCase(),
      email: pEmail,
      password: pPassword,
      name: principalName || `${name} Principal`,
    },
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
        logoUrl: body.logoUrl !== undefined ? normalizeLogoUrl(body.logoUrl) : existing.logoUrl,
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
        logoUrl: body.logoUrl !== undefined ? normalizeLogoUrl(body.logoUrl) : existing.logoUrl,
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

// =========================================================================
// ZERO-DATA-LOSS DATABASE STATUS & BACKUP RECOVERY ENDPOINTS
// =========================================================================

// Database Status (Publicly queryable or by Super Admin)
schoolRoutes.get('/db-status', async (c) => {
  const isPg = isPostgresConnected();
  const allSchools = db.select().from(schema.schools).all();
  const allStudents = db.select().from(schema.students).all();
  const allUsers = db.select().from(schema.users).all();

  return c.json({
    database: isPg ? 'postgresql' : 'sqlite',
    isPostgresConnected: isPg,
    schoolCount: allSchools.length,
    studentCount: allStudents.length,
    userCount: allUsers.length,
    persistentStorage: isPg ? 'Cloud PostgreSQL (Zero Data Loss)' : 'Local PC / Ephemeral Disk',
    timestamp: new Date().toISOString(),
  });
});

// Download JSON Backup Snapshot (Super Admin only)
schoolRoutes.get('/backup-snapshot', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Super Admin only' }, 403);
  }

  const schools = db.select().from(schema.schools).all();
  const users = db.select().from(schema.users).all();
  const classes = db.select().from(schema.classes).all();
  const sections = db.select().from(schema.sections).all();
  const students = db.select().from(schema.students).all();
  const parents = db.select().from(schema.parents).all();
  const subjects = db.select().from(schema.subjects).all();
  const marks = db.select().from(schema.marks).all();
  const attendance = db.select().from(schema.attendance).all();
  const feeStructures = db.select().from(schema.feeStructures).all();
  const feePayments = db.select().from(schema.feePayments).all();

  return c.json({
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    source: 'ANVIMITRA-ERP Cloud Control Plane',
    totalSchools: schools.length,
    dataset: {
      schools,
      users,
      classes,
      sections,
      students,
      parents,
      subjects,
      marks,
      attendance,
      feeStructures,
      feePayments,
    },
  });
});

// Restore from JSON Backup Snapshot (Super Admin only)
schoolRoutes.post('/restore-snapshot', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Super Admin only' }, 403);
  }

  const body = await c.req.json();
  const dataset = body.dataset || body;
  if (!dataset || !Array.isArray(dataset.schools)) {
    return c.json({ error: 'Invalid backup format: schools array not found' }, 400);
  }

  let restoredCount = 0;
  for (const s of dataset.schools) {
    try {
      db.insert(schema.schools).values(s).run();
      restoredCount++;
    } catch {}
  }

  if (Array.isArray(dataset.users)) {
    for (const u of dataset.users) {
      try {
        db.insert(schema.users).values(u).run();
      } catch {}
    }
  }

  if (Array.isArray(dataset.classes)) {
    for (const cl of dataset.classes) {
      try {
        db.insert(schema.classes).values(cl).run();
      } catch {}
    }
  }

  if (Array.isArray(dataset.sections)) {
    for (const sec of dataset.sections) {
      try {
        db.insert(schema.sections).values(sec).run();
      } catch {}
    }
  }

  if (Array.isArray(dataset.students)) {
    for (const st of dataset.students) {
      try {
        db.insert(schema.students).values(st).run();
      } catch {}
    }
  }

  // Trigger local file backup save
  try {
    const sqlite = getDatabaseInstance();
    saveLocalBackup(sqlite);
  } catch {}

  return c.json({
    success: true,
    message: `Restored ${restoredCount} schools successfully from backup snapshot`,
    totalSchools: restoredCount,
  });
});

