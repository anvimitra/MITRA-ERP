import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const frontDeskRoutes = new Hono();

// ==================== VISITORS ====================

// List visitors
frontDeskRoutes.get('/visitors', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const visitors = db
    .select()
    .from(schema.frontDeskVisitors)
    .where(eq(schema.frontDeskVisitors.schoolId, user.schoolId))
    .all();

  return c.json({ visitors });
});

// Register new visitor
frontDeskRoutes.post('/visitors', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const {
    visitorName,
    phone,
    purpose,
    whomToMeet,
    idCardType,
    idCardNo,
    badgeNumber,
  } = body;

  if (!visitorName || !phone || !purpose) {
    return c.json({ error: 'visitorName, phone, and purpose are required' }, 400);
  }

  const visitorId = crypto.randomUUID();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().split('T')[0];

  db.insert(schema.frontDeskVisitors).values({
    id: visitorId,
    schoolId: user.schoolId,
    visitorName,
    phone,
    purpose,
    whomToMeet: whomToMeet || 'Principal Desk',
    idCardType: idCardType || 'Aadhaar Card',
    idCardNo: idCardNo || '',
    checkIn: timeStr,
    checkOut: '',
    badgeNumber: badgeNumber || `PASS-${Math.floor(100 + Math.random() * 900)}`,
    status: 'IN',
    date: dateStr,
    createdAt: now.toISOString(),
  }).run();

  return c.json({ success: true, message: 'Visitor registered', visitorId }, 201);
});

// Checkout visitor
frontDeskRoutes.put('/visitors/:id/checkout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const visitorId = c.req.param('id');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  db.update(schema.frontDeskVisitors)
    .set({
      checkOut: timeStr,
      status: 'OUT',
    })
    .where(
      and(
        eq(schema.frontDeskVisitors.schoolId, user.schoolId),
        eq(schema.frontDeskVisitors.id, visitorId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Visitor checked out successfully' });
});

// ==================== ADMISSION INQUIRIES ====================

// List admission inquiries
frontDeskRoutes.get('/inquiries', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const inquiries = db
    .select()
    .from(schema.frontDeskInquiries)
    .where(eq(schema.frontDeskInquiries.schoolId, user.schoolId))
    .all();

  return c.json({ inquiries });
});

// Add new inquiry
frontDeskRoutes.post('/inquiries', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const {
    studentName,
    parentName,
    phone,
    email,
    classSeeking,
    source,
    followUpDate,
    notes,
  } = body;

  if (!studentName || !parentName || !phone || !classSeeking) {
    return c.json({ error: 'studentName, parentName, phone, and classSeeking are required' }, 400);
  }

  const inquiryId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.insert(schema.frontDeskInquiries).values({
    id: inquiryId,
    schoolId: user.schoolId,
    studentName,
    parentName,
    phone,
    email: email || '',
    classSeeking,
    source: source || 'Walk-in',
    status: 'NEW',
    followUpDate: followUpDate || '',
    notes: notes || '',
    createdAt: now,
  }).run();

  return c.json({ success: true, message: 'Inquiry saved', inquiryId }, 201);
});

// Update inquiry status or notes
frontDeskRoutes.put('/inquiries/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const inquiryId = c.req.param('id');
  const body = await c.req.json();
  const { status, followUpDate, notes } = body;

  const updateFields: any = {};
  if (status !== undefined) updateFields.status = status;
  if (followUpDate !== undefined) updateFields.followUpDate = followUpDate;
  if (notes !== undefined) updateFields.notes = notes;

  db.update(schema.frontDeskInquiries)
    .set(updateFields)
    .where(
      and(
        eq(schema.frontDeskInquiries.schoolId, user.schoolId),
        eq(schema.frontDeskInquiries.id, inquiryId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Inquiry updated' });
});

// ==================== POSTAL & COMPLAINTS ====================

// List postal & complaints
frontDeskRoutes.get('/postal-complaints', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const items = db
    .select()
    .from(schema.frontDeskPostalComplaints)
    .where(eq(schema.frontDeskPostalComplaints.schoolId, user.schoolId))
    .all();

  return c.json({ items });
});

// Add postal dispatch or complaint
frontDeskRoutes.post('/postal-complaints', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const {
    type,
    title,
    referenceNo,
    fromName,
    toName,
    contactPhone,
    description,
    actionTaken,
    status,
    date,
  } = body;

  if (!type || !title) {
    return c.json({ error: 'type and title are required' }, 400);
  }

  const itemId = crypto.randomUUID();
  const now = new Date().toISOString();
  const dateStr = date || now.split('T')[0];

  db.insert(schema.frontDeskPostalComplaints).values({
    id: itemId,
    schoolId: user.schoolId,
    type,
    title,
    referenceNo: referenceNo || '',
    fromName: fromName || '',
    toName: toName || '',
    contactPhone: contactPhone || '',
    description: description || '',
    actionTaken: actionTaken || '',
    status: status || 'PENDING',
    date: dateStr,
    createdAt: now,
  }).run();

  return c.json({ success: true, message: 'Record created', itemId }, 201);
});

// Update postal/complaint
frontDeskRoutes.put('/postal-complaints/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const itemId = c.req.param('id');
  const body = await c.req.json();
  const { actionTaken, status } = body;

  const updateFields: any = {};
  if (actionTaken !== undefined) updateFields.actionTaken = actionTaken;
  if (status !== undefined) updateFields.status = status;

  db.update(schema.frontDeskPostalComplaints)
    .set(updateFields)
    .where(
      and(
        eq(schema.frontDeskPostalComplaints.schoolId, user.schoolId),
        eq(schema.frontDeskPostalComplaints.id, itemId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Record updated' });
});
