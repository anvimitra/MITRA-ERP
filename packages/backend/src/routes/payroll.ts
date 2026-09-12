import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const payrollRoutes = new Hono();

// ==================== STAFF LEAVES ====================

// List staff leaves
payrollRoutes.get('/leaves', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  let leaves: any[] = [];
  if (user.role === 'principal' || user.role === 'super_admin' || user.role === 'accountant') {
    leaves = db
      .select()
      .from(schema.staffLeaves)
      .where(eq(schema.staffLeaves.schoolId, user.schoolId))
      .all();
  } else {
    // Regular teacher / staff only sees their own leaves
    leaves = db
      .select()
      .from(schema.staffLeaves)
      .where(
        and(
          eq(schema.staffLeaves.schoolId, user.schoolId),
          eq(schema.staffLeaves.staffUserId, user.userId)
        )
      )
      .all();
  }

  const staffMembers = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = leaves.map((l: any) => {
    const staff = staffMembers.find((s: any) => s.id === l.staffUserId);
    const reviewer = staffMembers.find((s: any) => s.id === l.reviewedByUserId);
    return {
      ...l,
      staffName: staff?.name || 'Staff Member',
      staffRole: staff?.role || 'Teacher',
      staffEmail: staff?.email || '',
      reviewerName: reviewer?.name || '',
    };
  });

  return c.json({ leaves: enriched });
});

// Staff apply for leave
payrollRoutes.post('/leaves', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { leaveType, startDate, endDate, totalDays, reason } = body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return c.json({ error: 'leaveType, startDate, endDate, and reason are required' }, 400);
  }

  const leaveId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.insert(schema.staffLeaves).values({
    id: leaveId,
    schoolId: user.schoolId,
    staffUserId: user.userId,
    leaveType,
    startDate,
    endDate,
    totalDays: Number(totalDays) || 1,
    reason,
    status: 'PENDING',
    reviewedByUserId: null,
    reviewRemarks: null,
    appliedAt: now,
  }).run();

  return c.json({ success: true, message: 'Leave application submitted successfully', leaveId }, 201);
});

// Principal approve or reject leave
payrollRoutes.put('/leaves/:id/review', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Only Principal can review leave requests' }, 403);
  }

  const leaveId = c.req.param('id');
  const body = await c.req.json();
  const { status, reviewRemarks } = body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return c.json({ error: 'status must be APPROVED or REJECTED' }, 400);
  }

  db.update(schema.staffLeaves)
    .set({
      status,
      reviewRemarks: reviewRemarks || '',
      reviewedByUserId: user.userId,
    })
    .where(
      and(
        eq(schema.staffLeaves.schoolId, user.schoolId),
        eq(schema.staffLeaves.id, leaveId)
      )
    )
    .run();

  return c.json({ success: true, message: `Leave request ${status.toLowerCase()}` });
});

// ==================== STAFF PAYROLL & SALARY SLIPS ====================

// List all salary slips
payrollRoutes.get('/slips', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  let slips: any[] = [];
  if (user.role === 'principal' || user.role === 'super_admin' || user.role === 'accountant') {
    slips = db
      .select()
      .from(schema.staffPayroll)
      .where(eq(schema.staffPayroll.schoolId, user.schoolId))
      .all();
  } else {
    // Individual staff view
    slips = db
      .select()
      .from(schema.staffPayroll)
      .where(
        and(
          eq(schema.staffPayroll.schoolId, user.schoolId),
          eq(schema.staffPayroll.staffUserId, user.userId)
        )
      )
      .all();
  }

  const staffMembers = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role, email: schema.users.email, phone: schema.users.phone })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = slips.map((slip: any) => {
    const staff = staffMembers.find((s: any) => s.id === slip.staffUserId);
    return {
      ...slip,
      staffName: staff?.name || 'Staff Member',
      staffRole: staff?.role || 'Staff',
      staffEmail: staff?.email || '',
      staffPhone: staff?.phone || '',
    };
  });

  return c.json({ slips: enriched });
});

// Get single slip with school & staff details for printing
payrollRoutes.get('/slips/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const slipId = c.req.param('id');
  const slip = db
    .select()
    .from(schema.staffPayroll)
    .where(
      and(
        eq(schema.staffPayroll.schoolId, user.schoolId),
        eq(schema.staffPayroll.id, slipId)
      )
    )
    .get();

  if (!slip) return c.json({ error: 'Salary slip not found' }, 404);

  const school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
  const staff = db.select().from(schema.users).where(eq(schema.users.id, slip.staffUserId)).get();

  return c.json({
    slip: {
      ...slip,
      staff: {
        id: staff?.id,
        name: staff?.name || '',
        role: staff?.role || '',
        email: staff?.email || '',
        phone: staff?.phone || '',
      },
      school: {
        name: school?.name || '',
        address: school?.address || '',
        city: school?.city || '',
        affiliationNo: school?.affiliationNo || '',
        principalName: school?.principalName || '',
        phone: school?.phone || '',
        logoUrl: school?.logoUrl || '',
      },
    },
  });
});

// Generate salary slip
payrollRoutes.post('/generate-slip', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const {
    staffUserId,
    monthYear,
    basicSalary,
    hra,
    da,
    specialAllowance,
    deductionPf,
    deductionTax,
    deductionLeave,
    paymentMode,
    paymentStatus,
  } = body;

  if (!staffUserId || !monthYear || basicSalary === undefined) {
    return c.json({ error: 'staffUserId, monthYear, and basicSalary are required' }, 400);
  }

  const basic = Number(basicSalary) || 0;
  const h = Number(hra) || 0;
  const d = Number(da) || 0;
  const allowance = Number(specialAllowance) || 0;
  const pf = Number(deductionPf) || 0;
  const tax = Number(deductionTax) || 0;
  const leaveDeduction = Number(deductionLeave) || 0;

  const grossSalary = basic + h + d + allowance;
  const totalDeductions = pf + tax + leaveDeduction;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const slipId = crypto.randomUUID();
  const now = new Date().toISOString();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const slipNo = `PAY-${monthYear.replace('-', '')}-${randomSuffix}`;

  db.insert(schema.staffPayroll).values({
    id: slipId,
    schoolId: user.schoolId,
    staffUserId,
    monthYear,
    basicSalary: basic,
    hra: h,
    da: d,
    specialAllowance: allowance,
    deductionPf: pf,
    deductionTax: tax,
    deductionLeave: leaveDeduction,
    netSalary,
    paymentStatus: paymentStatus || 'PAID',
    paymentDate: now.split('T')[0],
    paymentMode: paymentMode || 'BANK_TRANSFER',
    slipNo,
    createdAt: now,
  }).run();

  return c.json({
    success: true,
    message: 'Salary slip generated successfully',
    slipId,
    slipNo,
    netSalary,
  }, 201);
});
