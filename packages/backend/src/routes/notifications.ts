import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import { verifyToken } from '../services/auth.js';
import { saveLocalBackup } from '../db/persistent-backup.js';
import { getDatabaseInstance } from '../db/init.js';
import { resolveLinkedStudentsForParent } from '../services/rbac.js';
import crypto from 'crypto';

export const notificationRoutes = new Hono();

// Helper: Get user notifications strictly filtered by user.schoolId
const getMyNotifications = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const currentUid = user.userId || (user as any).id;

  // STRICT MULTI-TENANT ISOLATION:
  // Query ONLY notifications belonging to user.schoolId
  const allSchoolNotifs = db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.schoolId, user.schoolId))
    .orderBy(desc(schema.notifications.createdAt))
    .all();

  // Filter to notifications addressed to this user OR broadcast to 'ALL' within THIS school
  let myNotifs = allSchoolNotifs.filter(
    (n: any) => n.userId === currentUid || n.userId === 'ALL'
  );

  // STRICT RULE: If current user is a parent, ensure fee reminder notifications
  // are ONLY visible if their linked student actually has pending fee balance (due > 0)!
  // Parents whose children have zero pending fees or fully paid will NEVER receive/see fee reminders.
  if (user.role === 'parent') {
    const linkedStudents = resolveLinkedStudentsForParent(user);
    if (linkedStudents.length > 0) {
      const feeStructs = db
        .select()
        .from(schema.feeStructures)
        .where(eq(schema.feeStructures.schoolId, user.schoolId))
        .all();
      const allPayments = db
        .select()
        .from(schema.feePayments)
        .where(eq(schema.feePayments.schoolId, user.schoolId))
        .all();

      const studentsWithDues = new Set<string>();
      let hasAnyDue = false;

      for (const s of linkedStudents) {
        const applicableFees = feeStructs.filter(
          (f: any) => f.classId === s.classId || f.classId === 'ALL' || f.classId === 'all' || !f.classId
        );
        const totalExpected = applicableFees.reduce((sum: number, f: any) => sum + (Number(f.amount) || 0), 0);
        const totalPaid = allPayments
          .filter((p: any) => p.studentId === s.id)
          .reduce((sum: number, p: any) => sum + (Number(p.amountPaid) || 0), 0);
        const balance = totalExpected - totalPaid;
        if (balance > 0) {
          hasAnyDue = true;
          studentsWithDues.add(s.id);
          const fullName = `${s.firstName} ${s.lastName || ''}`.trim().toLowerCase();
          studentsWithDues.add(fullName);
        }
      }

      myNotifs = myNotifs.filter((n: any) => {
        const isFeeReminder =
          n.type === 'fee' &&
          (n.title?.toLowerCase().includes('reminder') ||
            n.title?.toLowerCase().includes('pending') ||
            n.title?.toLowerCase().includes('alert') ||
            n.title?.toLowerCase().includes('due'));

        if (!isFeeReminder) return true;

        // If parent has no student with dues at all, do NOT show any fee reminder
        if (!hasAnyDue) return false;

        // If reminder specifically mentions a child's name, verify that child has dues
        const msg = (n.message || '').toLowerCase();
        for (const s of linkedStudents) {
          const fullName = `${s.firstName} ${s.lastName || ''}`.trim().toLowerCase();
          if (msg.includes(fullName) && !studentsWithDues.has(fullName)) {
            return false;
          }
        }

        return true;
      });
    } else {
      // Parent has no linked student, do not show fee reminders
      myNotifs = myNotifs.filter((n: any) => {
        const isFeeReminder =
          n.type === 'fee' &&
          (n.title?.toLowerCase().includes('reminder') ||
            n.title?.toLowerCase().includes('pending') ||
            n.title?.toLowerCase().includes('alert') ||
            n.title?.toLowerCase().includes('due'));
        return !isFeeReminder;
      });
    }
  }

  // Deduplicate by title + message + date timestamp (ignoring second fractions)
  const seen = new Set<string>();
  const deduplicated: any[] = [];
  for (const n of myNotifs) {
    const key = `${n.title}_${n.message}_${(n.createdAt || '').slice(0, 16)}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(n);
    }
  }

  return c.json({ notifications: deduplicated });
};

// GET /api/notifications & GET /api/notifications/my-alerts
notificationRoutes.get('/', getMyNotifications);
notificationRoutes.get('/my-alerts', getMyNotifications);

// Mark single notification as read
notificationRoutes.post('/:id/read', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const currentUid = user.userId || (user as any).id;

  db.update(schema.notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.schoolId, user.schoolId),
        eq(schema.notifications.userId, currentUid)
      )
    )
    .run();

  return c.json({ success: true });
});

// Mark all notifications as read for current user in their school
notificationRoutes.post('/read-all', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const currentUid = user.userId || (user as any).id;

  db.update(schema.notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(schema.notifications.schoolId, user.schoolId),
        eq(schema.notifications.userId, currentUid)
      )
    )
    .run();

  return c.json({ success: true, message: 'All notifications marked as read' });
});

// Admin / Principal: View Automated SMS Logs
notificationRoutes.get('/sms-logs', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const logs = db
    .select()
    .from(schema.smsLogs)
    .where(eq(schema.smsLogs.schoolId, user.schoolId))
    .orderBy(desc(schema.smsLogs.sentAt))
    .all();

  return c.json({ smsLogs: logs });
});

// GET /api/notifications/notices - Get all school circulars/notices (strictly for user's school)
notificationRoutes.get('/notices', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  // Return notifications of type 'announcement' strictly within user.schoolId
  const notices = db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.schoolId, user.schoolId),
        eq(schema.notifications.type, 'announcement')
      )
    )
    .orderBy(desc(schema.notifications.createdAt))
    .all();

  // Deduplicate by title + message for the institution notice board
  const seen = new Set<string>();
  const deduplicated: any[] = [];
  for (const n of notices) {
    const key = `${n.title}_${n.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(n);
    }
  }

  return c.json({ notices: deduplicated });
});

// POST /api/notifications/broadcast - Publish circular/announcement
// STRICT MULTI-TENANT ISOLATION:
// ONLY sends notifications to staff and parents of THIS specific school (user.schoolId)!
// Other schools' users are NEVER included or notified!
notificationRoutes.post('/broadcast', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can broadcast circulars' }, 403);
  }

  const body = await c.req.json();
  const { title, message } = body;
  if (!title || !message) {
    return c.json({ error: 'Title and message are required' }, 400);
  }

  const now = new Date().toISOString();

  // 1. Fetch ONLY active users belonging strictly to this school
  const schoolUsers = db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.schoolId, user.schoolId),
        eq(schema.users.isActive, 1)
      )
    )
    .all();

  // Filter to valid institutional recipients (Staff: teacher, accountant, principal; and Parents/Students)
  // Guarantee: Users from any other school are NEVER included!
  const targetRecipients = schoolUsers.filter((u: any) =>
    u.role === 'parent' || u.role === 'teacher' || u.role === 'accountant' || u.role === 'principal' || u.role === 'student'
  );

  // 2. Dispatch individual in-app notification to each staff & parent of THIS school
  for (const recipient of targetRecipients) {
    const notifId = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    db.insert(schema.notifications).values({
      id: notifId,
      schoolId: user.schoolId,
      userId: recipient.id,
      title: title.trim(),
      message: message.trim(),
      type: 'announcement',
      isRead: 0,
      sentViaApp: 1,
      sentViaSms: 0,
      createdAt: now,
    }).run();
  }

  // 3. Also insert a school-wide master record for the notice board
  const masterNotifId = `notif-all-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  db.insert(schema.notifications).values({
    id: masterNotifId,
    schoolId: user.schoolId,
    userId: 'ALL',
    title: title.trim(),
    message: message.trim(),
    type: 'announcement',
    isRead: 0,
    sentViaApp: 1,
    sentViaSms: 0,
    createdAt: now,
  }).run();

  try {
    saveLocalBackup(getDatabaseInstance());
  } catch {}

  const staffCount = targetRecipients.filter(
    (u: any) => u.role === 'teacher' || u.role === 'accountant' || u.role === 'principal'
  ).length;
  const parentCount = targetRecipients.filter((u: any) => u.role === 'parent').length;

  return c.json({
    success: true,
    message: `Circular announcement broadcasted successfully to ${staffCount} staff and ${parentCount} parents of your school.`,
    stats: {
      totalRecipients: targetRecipients.length,
      staffCount,
      parentCount,
      schoolId: user.schoolId,
    },
  });
});

