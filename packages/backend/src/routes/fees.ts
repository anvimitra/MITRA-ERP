import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { dispatchStudentNotification } from '../services/notification-sms.js';

export const feeRoutes = new Hono();

// Get fee structures
feeRoutes.get('/structures', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const structures = db
    .select()
    .from(schema.feeStructures)
    .where(eq(schema.feeStructures.schoolId, user.schoolId))
    .all();

  return c.json({ structures });
});

// Create fee structure (Accountant, Principal, SuperAdmin)
feeRoutes.post('/structures', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Accountant or Principal only' }, 403);
  }

  const body = await c.req.json();
  const { classId, title, amount, dueDate, academicYear, applyToAllClasses } = body;

  if (!classId || !title || !amount) {
    return c.json({ error: 'classId, title, and amount are required' }, 400);
  }

  const isAllClasses = classId === 'ALL' || classId === 'all' || !!applyToAllClasses;
  if (isAllClasses) {
    const classes = db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.schoolId, user.schoolId))
      .all();

    if (classes.length === 0) {
      return c.json({ error: 'No classes found for this school' }, 400);
    }

    const createdIds: string[] = [];
    for (const cls of classes) {
      const structId = crypto.randomUUID();
      db.insert(schema.feeStructures).values({
        id: structId,
        schoolId: user.schoolId,
        classId: cls.id,
        title,
        amount: Number(amount),
        dueDate: dueDate || '2026-10-15',
        academicYear: academicYear || '2026-2027',
      }).run();
      createdIds.push(structId);
    }

    return c.json({
      success: true,
      message: `Fee structure "${title}" created for all ${classes.length} classes (Nursery to 12).`,
      count: classes.length,
      ids: createdIds,
    });
  }

  const id = crypto.randomUUID();
  db.insert(schema.feeStructures).values({
    id,
    schoolId: user.schoolId,
    classId,
    title,
    amount: Number(amount),
    dueDate,
    academicYear: academicYear || '2026-2027',
  }).run();

  return c.json({ success: true, message: 'Fee structure created', id });
});

// Delete fee structure (Principal, SuperAdmin, Accountant)
feeRoutes.delete('/structures/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Accountant or Principal only' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.feeStructures)
    .where(and(eq(schema.feeStructures.schoolId, user.schoolId), eq(schema.feeStructures.id, id)))
    .run();

  return c.json({ success: true, message: 'Fee structure removed' });
});

// Broadcast Due Fee Reminders to All Parents with Balances (Principal or Accountant)
feeRoutes.post('/broadcast-due-reminders', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Accountant or Principal only' }, 403);
  }

  const students = db.select().from(schema.students).where(eq(schema.students.schoolId, user.schoolId)).all();
  const feeStructs = db.select().from(schema.feeStructures).where(eq(schema.feeStructures.schoolId, user.schoolId)).all();
  const payments = db.select().from(schema.feePayments).where(eq(schema.feePayments.schoolId, user.schoolId)).all();

  let sentCount = 0;
  for (const s of students) {
    const applicableFees = feeStructs.filter((f: any) => f.classId === s.classId);
    const totalExpected = applicableFees.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
    const totalPaid = payments
      .filter((p: any) => p.studentId === s.id)
      .reduce((sum: number, p: any) => sum + (Number(p.amountPaid) || 0), 0);

    const balance = totalExpected - totalPaid;
    if (balance > 0) {
      const studentName = `${s.firstName} ${s.lastName || ''}`.trim();
      const earliestDue = applicableFees.find((f: any) => f.dueDate)?.dueDate || 'Immediate';
      await dispatchStudentNotification({
        schoolId: user.schoolId,
        studentId: s.id,
        title: 'Pending Fee Alert: Immediate Action Required',
        message: `Dear Parent, outstanding fee balance of Rs. ${balance.toLocaleString('en-IN')} is due for ${studentName} (${earliestDue}). Please pay timely to avoid late fine.`,
        type: 'fee',
      });
      sentCount++;
    }
  }

  return c.json({
    success: true,
    message: `Fee due notices successfully broadcasted to ${sentCount} parents.`,
    count: sentCount,
  });
});

// Collect Fee Payment & Generate Receipt
feeRoutes.post('/collect', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Only Accountant or Principal can collect fees' }, 403);
  }

  const body = await c.req.json();
  const { studentId, feeStructureId, amountPaid, paymentMode, remarks } = body;

  if (!studentId || !amountPaid || !paymentMode) {
    return c.json({ error: 'studentId, amountPaid, and paymentMode are required' }, 400);
  }

  const student = db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
  if (!student) {
    return c.json({ error: 'Student record not found' }, 404);
  }

  let feeStruct = feeStructureId ? db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, feeStructureId)).get() : null;
  if (!feeStruct) {
    // If student has a fee structure for their class, use that, otherwise auto-create or use general
    const classStruct = db.select().from(schema.feeStructures).where(and(eq(schema.feeStructures.schoolId, user.schoolId), eq(schema.feeStructures.classId, student.classId))).get();
    if (classStruct) {
      feeStruct = classStruct;
    } else {
      const genId = `struct-gen-${Date.now()}`;
      db.insert(schema.feeStructures).values({
        id: genId,
        schoolId: user.schoolId,
        classId: student.classId || 'ALL',
        title: remarks && remarks.trim() ? remarks.slice(0, 50) : 'Tuition & Academic Fee',
        amount: Number(amountPaid),
        dueDate: new Date().toISOString().split('T')[0],
        academicYear: '2026-2027',
      }).run();
      feeStruct = { id: genId, title: remarks || 'Tuition & Academic Fee', amount: Number(amountPaid) };
    }
  }

  const paymentId = crypto.randomUUID();
  const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString().split('T')[0];

  const status = Number(amountPaid) >= feeStruct.amount ? 'paid' : 'partial';

  db.insert(schema.feePayments).values({
    id: paymentId,
    schoolId: user.schoolId,
    studentId,
    feeStructureId: feeStruct.id,
    amountPaid: Number(amountPaid),
    paymentDate: now,
    paymentMode,
    receiptNo,
    status,
    remarks: remarks || 'Fee payment recorded',
  }).run();

  // Send Fee Receipt Notification / SMS to parent
  const studentName = `${student.firstName} ${student.lastName || ''}`.trim();

  await dispatchStudentNotification({
    schoolId: user.schoolId,
    studentId,
    title: 'Fee Payment Received',
    message: `Payment of Rs. ${amountPaid} received for ${studentName} (${feeStruct.title}). Receipt: ${receiptNo}.`,
    type: 'fee',
  });

  return c.json({
    success: true,
    message: 'Fee collected successfully',
    payment: {
      id: paymentId,
      receiptNo,
      amountPaid,
      paymentDate: now,
      status,
      feeTitle: feeStruct.title,
    },
  });
});

// Student Fee Summary (Used by Parent portal and Accountant)
feeRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');
  const student = db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
  if (!student) return c.json({ error: 'Student not found' }, 404);

  // Applicable fee structures for student's class (including school-wide structures)
  const allSchoolFees = db
    .select()
    .from(schema.feeStructures)
    .where(eq(schema.feeStructures.schoolId, user.schoolId))
    .all();

  const classFees = allSchoolFees.filter(
    (f: any) => f.classId === student.classId || f.classId === 'ALL' || f.classId === 'all'
  );

  // Payments made by student
  const payments = db
    .select()
    .from(schema.feePayments)
    .where(
      and(
        eq(schema.feePayments.schoolId, user.schoolId),
        eq(schema.feePayments.studentId, studentId)
      )
    )
    .all();

  const totalFeeAmount = classFees.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
  const totalPaidAmount = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
  const balanceDue = Math.max(0, totalFeeAmount - totalPaidAmount);

  return c.json({
    studentId,
    studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
    totalFeeAmount,
    totalPaidAmount,
    balanceDue,
    classFees,
    payments,
  });
});

// Trigger Fee Reminder to Parent (App or automated SMS)
feeRoutes.post('/send-reminder', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'accountant' && user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Accountant or Principal only' }, 403);
  }

  const body = await c.req.json();
  const { studentId, dueAmount, dueDate } = body;

  const student = db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
  if (!student) return c.json({ error: 'Student not found' }, 404);

  const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
  const dispatchResult = await dispatchStudentNotification({
    schoolId: user.schoolId,
    studentId,
    title: 'Fee Reminder Notice',
    message: `Dear Parent, fee balance of Rs. ${dueAmount} is due for ${studentName} on/before ${dueDate}. Please pay timely.`,
    type: 'fee',
  });

  return c.json({
    success: true,
    message: 'Fee reminder sent successfully',
    dispatchResult,
  });
});

// GET /api/fees/payments - List all fee collection transactions
feeRoutes.get('/payments', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const payments = db
    .select()
    .from(schema.feePayments)
    .where(eq(schema.feePayments.schoolId, user.schoolId))
    .all();

  const students = db.select().from(schema.students).where(eq(schema.students.schoolId, user.schoolId)).all();
  const structures = db.select().from(schema.feeStructures).where(eq(schema.feeStructures.schoolId, user.schoolId)).all();
  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();

  const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
  const studentMap = new Map(students.map((s: any) => [s.id, s]));
  const structMap = new Map(structures.map((st: any) => [st.id, st.title]));

  const enriched = payments.map((p: any) => {
    const s: any = studentMap.get(p.studentId);
    return {
      ...p,
      studentName: s ? `${s.firstName} ${s.lastName || ''}`.trim() : 'Student',
      admissionNo: s?.admissionNo || 'N/A',
      className: s ? (classMap.get(s.classId) || s.classId) : 'Class',
      feeTitle: structMap.get(p.feeStructureId) || 'Tuition Fee',
    };
  });

  return c.json({ payments: enriched.reverse() });
});

