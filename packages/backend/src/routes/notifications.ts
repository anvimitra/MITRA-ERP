import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import { verifyToken } from '../services/auth.js';

export const notificationRoutes = new Hono();

// Get user notifications (Parent, Teacher, Principal)
notificationRoutes.get('/my-alerts', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const notifs = db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.userId))
    .orderBy(desc(schema.notifications.createdAt))
    .all();

  return c.json({ notifications: notifs });
});

// Mark notification as read
notificationRoutes.post('/:id/read', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  db.update(schema.notifications)
    .set({ isRead: 1 })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, user.userId)))
    .run();

  return c.json({ success: true });
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
