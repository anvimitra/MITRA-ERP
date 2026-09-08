import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth.js';
import { schoolRoutes } from './routes/schools.js';
import { classRoutes } from './routes/classes.js';
import { attendanceRoutes } from './routes/attendance.js';
import { examRoutes } from './routes/exams.js';
import { feeRoutes } from './routes/fees.js';
import { syncRoutes } from './routes/sync.js';
import { notificationRoutes } from './routes/notifications.js';

export const app = new Hono();

// Enable CORS for web portals and mobile clients
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-school-code'],
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'online',
    service: 'ANVIMITRA-ERP Cloudflare Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routes
app.route('/api/auth', authRoutes);
app.route('/api/schools', schoolRoutes);
app.route('/api/classes', classRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/exams', examRoutes);
app.route('/api/fees', feeRoutes);
app.route('/api/sync', syncRoutes);
app.route('/api/notifications', notificationRoutes);
