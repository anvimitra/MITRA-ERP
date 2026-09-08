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
  const { classId, title, amount, dueDate, academicYear } = body;

  if (!classId || !title || !amount) {
    return c.json({ error: 'classId, title, and amount are required' }, 400);
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

  if (!studentId || !feeStructureId || !amountPaid || !paymentMode) {
    return c.json({ error: 'studentId, feeStructureId, amountPaid, and paymentMode are required' }, 400);
  }

  const feeStruct = db.select().from(schema.feeStructures).where(eq(schema.feeStructures.id, feeStructureId)).get();
  if (!feeStruct) {
    return c.json({ error: 'Fee structure not found' }, 404);
  }

  const paymentId = crypto.randomUUID();
  const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString().split('T')[0];

  const status = Number(amountPaid) >= feeStruct.amount ? 'paid' : 'partial';

  db.insert(schema.feePayments).values({
    id: paymentId,
    schoolId: user.schoolId,
    studentId,
    feeStructureId,
    amountPaid: Number(amountPaid),
    paymentDate: now,
    paymentMode,
    receiptNo,
    status,
    remarks,
  }).run();

  // Send Fee Receipt Notification / SMS to parent
  const student = db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
  const studentName = student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'student';

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

  // Applicable fee structures for student's class
  const classFees = db
    .select()
    .from(schema.feeStructures)
    .where(
      and(
        eq(schema.feeStructures.schoolId, user.schoolId),
        eq(schema.feeStructures.classId, student.classId)
      )
    )
    .all();

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

  const totalFeeAmount = classFees.reduce((acc, f) => acc + f.amount, 0);
  const totalPaidAmount = payments.reduce((acc, p) => acc + p.amountPaid, 0);
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
