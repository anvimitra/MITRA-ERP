import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isStudentAccessibleByUser, resolveLinkedStudentsForParent } from '../services/rbac.js';

export const transportRoutes = new Hono();

// ==================== VEHICLES ====================

// List vehicles
transportRoutes.get('/vehicles', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const vehicles = db
    .select()
    .from(schema.transportVehicles)
    .where(eq(schema.transportVehicles.schoolId, user.schoolId))
    .all();

  return c.json({ vehicles });
});

// Add vehicle
transportRoutes.post('/vehicles', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const { vehicleNo, vehicleModel, seatingCapacity, driverName, driverPhone, driverLicense } = body;

  if (!vehicleNo || !driverName || !driverPhone) {
    return c.json({ error: 'vehicleNo, driverName, and driverPhone are required' }, 400);
  }

  const vehicleId = crypto.randomUUID();

  db.insert(schema.transportVehicles).values({
    id: vehicleId,
    schoolId: user.schoolId,
    vehicleNo,
    vehicleModel: vehicleModel || 'Tata Starbus 40-Seater',
    seatingCapacity: Number(seatingCapacity) || 40,
    driverName,
    driverPhone,
    driverLicense: driverLicense || '',
    status: 'ACTIVE',
  }).run();

  return c.json({ success: true, message: 'Vehicle added successfully', vehicleId }, 201);
});

// Update vehicle (Principal or SuperAdmin only)
transportRoutes.put('/vehicles/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const { vehicleNo, vehicleModel, seatingCapacity, driverName, driverPhone, driverLicense, status } = body;

  const existing = db
    .select()
    .from(schema.transportVehicles)
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Vehicle not found' }, 404);

  db.update(schema.transportVehicles)
    .set({
      vehicleNo: vehicleNo ?? existing.vehicleNo,
      vehicleModel: vehicleModel ?? existing.vehicleModel,
      seatingCapacity: seatingCapacity !== undefined ? Number(seatingCapacity) : existing.seatingCapacity,
      driverName: driverName ?? existing.driverName,
      driverPhone: driverPhone ?? existing.driverPhone,
      driverLicense: driverLicense ?? existing.driverLicense,
      status: status ?? existing.status,
    })
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, id)))
    .run();

  return c.json({ success: true, message: 'Vehicle updated successfully' });
});

// Delete vehicle (Principal or SuperAdmin only)
transportRoutes.delete('/vehicles/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.transportVehicles)
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, id)))
    .run();

  return c.json({ success: true, message: 'Vehicle removed from fleet' });
});


// ==================== ROUTES & STOPS ====================

// List routes with embedded stops and vehicle info
transportRoutes.get('/routes', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const routes = db
    .select()
    .from(schema.transportRoutes)
    .where(eq(schema.transportRoutes.schoolId, user.schoolId))
    .all();

  const vehicles = db
    .select()
    .from(schema.transportVehicles)
    .where(eq(schema.transportVehicles.schoolId, user.schoolId))
    .all();

  const stops = db
    .select()
    .from(schema.transportStops)
    .where(eq(schema.transportStops.schoolId, user.schoolId))
    .all();

  const enriched = routes.map((r: any) => {
    const vehicle = vehicles.find((v: any) => v.id === r.vehicleId);
    const routeStops = stops
      .filter((s: any) => s.routeId === r.id)
      .sort((a: any, b: any) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1));

    return {
      ...r,
      vehicleNo: vehicle?.vehicleNo || 'Unassigned',
      vehicleModel: vehicle?.vehicleModel || '',
      driverName: vehicle?.driverName || '',
      driverPhone: vehicle?.driverPhone || '',
      stops: routeStops,
    };
  });

  return c.json({ routes: enriched });
});

// Create route
transportRoutes.post('/routes', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { routeName, startLocation, endLocation, vehicleId, monthlyFare } = body;

  if (!routeName || !startLocation || !endLocation) {
    return c.json({ error: 'routeName, startLocation, and endLocation are required' }, 400);
  }

  const routeId = crypto.randomUUID();

  db.insert(schema.transportRoutes).values({
    id: routeId,
    schoolId: user.schoolId,
    routeName,
    startLocation,
    endLocation,
    vehicleId: vehicleId || null,
    monthlyFare: Number(monthlyFare) || 0,
  }).run();

  return c.json({ success: true, message: 'Route created successfully', routeId }, 201);
});

// Update route (Principal or SuperAdmin only)
transportRoutes.put('/routes/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const { routeName, startLocation, endLocation, vehicleId, monthlyFare } = body;

  const existing = db
    .select()
    .from(schema.transportRoutes)
    .where(and(eq(schema.transportRoutes.schoolId, user.schoolId), eq(schema.transportRoutes.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Route not found' }, 404);

  db.update(schema.transportRoutes)
    .set({
      routeName: routeName ?? existing.routeName,
      startLocation: startLocation ?? existing.startLocation,
      endLocation: endLocation ?? existing.endLocation,
      vehicleId: vehicleId !== undefined ? vehicleId : existing.vehicleId,
      monthlyFare: monthlyFare !== undefined ? Number(monthlyFare) : existing.monthlyFare,
    })
    .where(and(eq(schema.transportRoutes.schoolId, user.schoolId), eq(schema.transportRoutes.id, id)))
    .run();

  return c.json({ success: true, message: 'Route updated successfully' });
});

// Delete route (Principal or SuperAdmin only)
transportRoutes.delete('/routes/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.transportStops)
    .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.routeId, id)))
    .run();

  db.delete(schema.transportRoutes)
    .where(and(eq(schema.transportRoutes.schoolId, user.schoolId), eq(schema.transportRoutes.id, id)))
    .run();

  return c.json({ success: true, message: 'Route and its stops deleted' });
});


// Add stop to route
transportRoutes.post('/stops', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { routeId, stopName, pickupTime, dropTime, sequenceOrder } = body;

  if (!routeId || !stopName || !pickupTime) {
    return c.json({ error: 'routeId, stopName, and pickupTime are required' }, 400);
  }

  const stopId = crypto.randomUUID();

  db.insert(schema.transportStops).values({
    id: stopId,
    schoolId: user.schoolId,
    routeId,
    stopName,
    pickupTime,
    dropTime: dropTime || pickupTime,
    sequenceOrder: Number(sequenceOrder) || 1,
  }).run();

  return c.json({ success: true, message: 'Stop added', stopId }, 201);
});

// Update stop (Principal or SuperAdmin only)
transportRoutes.put('/stops/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const { stopName, pickupTime, dropTime, sequenceOrder } = body;

  const existing = db
    .select()
    .from(schema.transportStops)
    .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Stop not found' }, 404);

  db.update(schema.transportStops)
    .set({
      stopName: stopName ?? existing.stopName,
      pickupTime: pickupTime ?? existing.pickupTime,
      dropTime: dropTime ?? existing.dropTime,
      sequenceOrder: sequenceOrder !== undefined ? Number(sequenceOrder) : existing.sequenceOrder,
    })
    .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.id, id)))
    .run();

  return c.json({ success: true, message: 'Stop updated successfully' });
});

// Delete stop (Principal or SuperAdmin only)
transportRoutes.delete('/stops/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.transportStops)
    .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.id, id)))
    .run();

  return c.json({ success: true, message: 'Stop deleted' });
});


// ==================== STUDENT ALLOCATIONS ====================

// List all student transport allocations
transportRoutes.get('/student-allocations', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  let allocations = db
    .select()
    .from(schema.studentTransport)
    .where(eq(schema.studentTransport.schoolId, user.schoolId))
    .all();

  // Strict parent/student isolation
  if (user.role === 'parent') {
    const linked = resolveLinkedStudentsForParent(user);
    const allowedIds = new Set(linked.map((s: any) => s.id));
    allocations = allocations.filter((a: any) => allowedIds.has(a.studentId));
  } else if (user.role === 'student') {
    const student = db.select().from(schema.students).where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.userId, user.userId || (user as any).id))).get();
    allocations = allocations.filter((a: any) => student && a.studentId === student.id);
  }

  const students = db
    .select({
      id: schema.students.id,
      firstName: schema.students.firstName,
      lastName: schema.students.lastName,
      admissionNo: schema.students.admissionNo,
      rollNo: schema.students.rollNo,
      classId: schema.students.classId,
      sectionId: schema.students.sectionId,
    })
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  const routes = db
    .select()
    .from(schema.transportRoutes)
    .where(eq(schema.transportRoutes.schoolId, user.schoolId))
    .all();

  const stops = db
    .select()
    .from(schema.transportStops)
    .where(eq(schema.transportStops.schoolId, user.schoolId))
    .all();

  const vehicles = db
    .select()
    .from(schema.transportVehicles)
    .where(eq(schema.transportVehicles.schoolId, user.schoolId))
    .all();

  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();

  const enriched = allocations.map((a: any) => {
    const student = students.find((s: any) => s.id === a.studentId);
    const cls = student ? classes.find((c: any) => c.id === student.classId) : null;
    const sec = student ? sections.find((c: any) => c.id === student.sectionId) : null;
    const route = routes.find((r: any) => r.id === a.routeId);
    const stop = stops.find((s: any) => s.id === a.stopId);
    const vehicle = route ? vehicles.find((v: any) => v.id === route.vehicleId) : null;

    return {
      ...a,
      studentName: student ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Unknown',
      admissionNo: student?.admissionNo || '',
      className: cls?.name || '',
      sectionName: sec?.name || '',
      routeName: route?.routeName || '',
      stopName: stop?.stopName || '',
      pickupTime: stop?.pickupTime || '',
      dropTime: stop?.dropTime || '',
      vehicleNo: vehicle?.vehicleNo || 'Unassigned',
      driverName: vehicle?.driverName || '',
      driverPhone: vehicle?.driverPhone || '',
      monthlyFare: route?.monthlyFare || 0,
    };
  });

  return c.json({ allocations: enriched });
});

// Allocate transport to student
transportRoutes.post('/student-allocations', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { studentId, routeId, stopId, academicYear } = body;

  if (!studentId || !routeId || !stopId) {
    return c.json({ error: 'studentId, routeId, and stopId are required' }, 400);
  }

  // Remove previous allocation if exists
  db.delete(schema.studentTransport)
    .where(
      and(
        eq(schema.studentTransport.schoolId, user.schoolId),
        eq(schema.studentTransport.studentId, studentId)
      )
    )
    .run();

  const allocId = crypto.randomUUID();

  db.insert(schema.studentTransport).values({
    id: allocId,
    schoolId: user.schoolId,
    studentId,
    routeId,
    stopId,
    academicYear: academicYear || '2026-2027',
  }).run();

  return c.json({ success: true, message: 'Student bus allocation saved', allocId }, 201);
});

// Delete student bus allocation (Principal or SuperAdmin only)
transportRoutes.delete('/student-allocations/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Principal or SuperAdmin only' }, 403);
  }

  const id = c.req.param('id');
  db.delete(schema.studentTransport)
    .where(and(eq(schema.studentTransport.schoolId, user.schoolId), eq(schema.studentTransport.id, id)))
    .run();

  return c.json({ success: true, message: 'Student bus allocation removed' });
});


// Student / Parent lookup: personal transport information
transportRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');
  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student transport details' }, 403);
  }

  const allocation = db
    .select()
    .from(schema.studentTransport)
    .where(
      and(
        eq(schema.studentTransport.schoolId, user.schoolId),
        eq(schema.studentTransport.studentId, studentId)
      )
    )
    .get();

  if (!allocation) {
    return c.json({ transport: null });
  }

  const route = db.select().from(schema.transportRoutes).where(eq(schema.transportRoutes.id, allocation.routeId)).get();
  const stop = db.select().from(schema.transportStops).where(eq(schema.transportStops.id, allocation.stopId)).get();
  const vehicle = route?.vehicleId
    ? db.select().from(schema.transportVehicles).where(eq(schema.transportVehicles.id, route.vehicleId)).get()
    : null;

  return c.json({
    transport: {
      allocationId: allocation.id,
      routeName: route?.routeName || '',
      startLocation: route?.startLocation || '',
      endLocation: route?.endLocation || '',
      monthlyFare: route?.monthlyFare || 0,
      stopName: stop?.stopName || '',
      pickupTime: stop?.pickupTime || '',
      dropTime: stop?.dropTime || '',
      vehicleNo: vehicle?.vehicleNo || 'Not Assigned',
      vehicleModel: vehicle?.vehicleModel || '',
      driverName: vehicle?.driverName || '',
      driverPhone: vehicle?.driverPhone || '',
    },
  });
});
