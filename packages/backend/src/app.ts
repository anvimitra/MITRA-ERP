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
import { studentRoutes } from './routes/students.js';
import { teacherRoutes } from './routes/teachers.js';
import { appUpdateRoutes } from './routes/app-update.js';
import { timetableRoutes } from './routes/timetable.js';
import { studentLogRoutes } from './routes/student-logs.js';
import { certificateRoutes } from './routes/certificates.js';
import { frontDeskRoutes } from './routes/front-desk.js';
import { payrollRoutes } from './routes/payroll.js';
import { libraryRoutes } from './routes/library.js';
import { transportRoutes } from './routes/transport.js';
import { inventoryRoutes } from './routes/inventory.js';
import { homeworkRoutes } from './routes/homework.js';
import { isPostgresConnected } from './db/postgres-sync.js';
import { verifyToken } from './services/auth.js';
import { db, schema, eq } from './db/index.js';

export const app = new Hono();

// Enable CORS for web portals and mobile clients
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-school-code', 'x-master-key'],
  })
);

// School Services Status Guard Middleware
// If a school's services have been suspended by Super Admin:
// - Public routes, /health, /api/auth/*, and /api/schools/branding are allowed
// - Super Admin requests are always allowed
// - For any tenant user whose school has services_enabled === 0:
//   Write requests (POST, PUT, DELETE, PATCH) are blocked with 403 Forbidden
//   (Login is permitted, but no services can be used!)
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  // Always allow auth routes, public branding, health, and OPTIONS preflight
  if (
    c.req.method === 'OPTIONS' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/schools/branding') ||
    path.startsWith('/api/app') ||
    path === '/health'
  ) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const user = verifyToken(authHeader.substring(7));
    // Super Admin has full platform access
    if (user && user.role === 'super_admin') {
      return next();
    }

    if (user && user.schoolId) {
      const school = db.select().from(schema.schools).where(eq(schema.schools.id, user.schoolId)).get();
      if (school && (school as any).servicesEnabled === 0) {
        // Block state modifying actions
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
          return c.json({
            error: `ERP services for '${(school as any).name}' have been temporarily suspended by the Super Admin. Operations and data modifications are locked.`,
            servicesDisabled: true,
          }, 403);
        }
      }
    }
  }

  return next();
});

// Health check endpoint
app.get('/health', (c) => {
  const isPg = isPostgresConnected();
  return c.json({
    status: 'online',
    service: 'ANVIMITRA-ERP Cloud Control Plane',
    database: isPg ? 'postgresql' : 'sqlite',
    isPostgresConnected: isPg,
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
app.route('/api/students', studentRoutes);
app.route('/api/teachers', teacherRoutes);
app.route('/api/app', appUpdateRoutes);
app.route('/api/timetable', timetableRoutes);
app.route('/api/student-logs', studentLogRoutes);
app.route('/api/certificates', certificateRoutes);
app.route('/api/front-desk', frontDeskRoutes);
app.route('/api/payroll', payrollRoutes);
app.route('/api/library', libraryRoutes);
app.route('/api/transport', transportRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/homework', homeworkRoutes);
