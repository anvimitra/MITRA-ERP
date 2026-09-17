import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken, hashPassword } from '../services/auth.js';
import { isStudentAccessibleByUser, resolveLinkedStudentsForParent } from '../services/rbac.js';

export const transportRoutes = new Hono();

// Helper: Ensure driver has a login user account in the ERP
export function ensureDriverUserAccount(schoolId: string, driverName: string, driverPhone: string, vehicleId?: string): string | null {
  const cleanPhone = (driverPhone || '').trim();
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  if (!digitsOnly || digitsOnly.length < 10) return null;

  // Search existing user by phone in this school
  const allUsers = db.select().from(schema.users).where(eq(schema.users.schoolId, schoolId)).all();
  const existingUser = allUsers.find((u: any) => {
    const uPhone = (u.phone || '').replace(/\D/g, '');
    return uPhone === digitsOnly || (uPhone.length >= 10 && uPhone.endsWith(digitsOnly.slice(-10)));
  });

  const defaultPassHash = hashPassword('Driver@123');
  const now = new Date().toISOString();

  if (existingUser) {
    db.update(schema.users)
      .set({
        role: 'driver',
        name: driverName || existingUser.name,
        vehicleId: vehicleId || existingUser.vehicleId,
        isActive: 1,
      })
      .where(eq(schema.users.id, existingUser.id))
      .run();
    return existingUser.id;
  } else {
    const driverUserId = crypto.randomUUID();
    const driverEmail = `driver.${digitsOnly.slice(-10)}@transport.school`;
    db.insert(schema.users).values({
      id: driverUserId,
      schoolId: schoolId,
      role: 'driver',
      name: driverName || 'School Bus Driver',
      email: driverEmail,
      phone: cleanPhone,
      passwordHash: defaultPassHash,
      appInstalled: 0,
      isActive: 1,
      createdAt: now,
      vehicleId: vehicleId || null,
    }).run();
    return driverUserId;
  }
}

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
  const driverUserId = ensureDriverUserAccount(user.schoolId, driverName, driverPhone, vehicleId);

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
    driverUserId: driverUserId || null,
  }).run();

  return c.json({ success: true, message: 'Vehicle added successfully', vehicleId, driverUserId }, 201);
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

  let driverUserId = existing.driverUserId;
  if (driverPhone || driverName) {
    driverUserId = ensureDriverUserAccount(
      user.schoolId,
      driverName ?? existing.driverName,
      driverPhone ?? existing.driverPhone,
      id
    );
  }

  db.update(schema.transportVehicles)
    .set({
      vehicleNo: vehicleNo ?? existing.vehicleNo,
      vehicleModel: vehicleModel ?? existing.vehicleModel,
      seatingCapacity: seatingCapacity !== undefined ? Number(seatingCapacity) : existing.seatingCapacity,
      driverName: driverName ?? existing.driverName,
      driverPhone: driverPhone ?? existing.driverPhone,
      driverLicense: driverLicense ?? existing.driverLicense,
      status: status ?? existing.status,
      driverUserId: driverUserId ?? existing.driverUserId,
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
      currentLat: vehicle?.currentLat || null,
      currentLng: vehicle?.currentLng || null,
      currentSpeed: vehicle?.currentSpeed || 0,
      currentHeading: vehicle?.currentHeading || 0,
      lastLocationUpdate: vehicle?.lastLocationUpdate || null,
      isTripActive: vehicle?.isTripActive === 1,
    },
  });
});

// ==================== DRIVER & LIVE GPS TELEMETRY ====================

// Driver: Get assigned bus, route, and stop information
transportRoutes.get('/driver/my-bus', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const schoolVehicles = db
    .select()
    .from(schema.transportVehicles)
    .where(eq(schema.transportVehicles.schoolId, user.schoolId))
    .all();

  const userPhoneDigits = (user.phone || '').replace(/\D/g, '');

  // Match vehicle by driverUserId, vehicleId, or driver phone number
  let vehicle = schoolVehicles.find((v: any) => v.driverUserId === user.userId || (v.id && (user as any).vehicleId === v.id));

  if (!vehicle && userPhoneDigits.length >= 10) {
    const last10 = userPhoneDigits.slice(-10);
    vehicle = schoolVehicles.find((v: any) => {
      const vPhoneDigits = (v.driverPhone || '').replace(/\D/g, '');
      return vPhoneDigits.endsWith(last10);
    });
  }

  // Fallback: if driver role and only one vehicle exists in the school
  if (!vehicle && user.role === 'driver' && schoolVehicles.length === 1) {
    vehicle = schoolVehicles[0];
  }

  if (!vehicle) {
    return c.json({
      assigned: false,
      message: 'No school vehicle assigned to this driver account yet. Please contact the Principal.',
    });
  }

  // Find assigned route
  const route = db
    .select()
    .from(schema.transportRoutes)
    .where(and(eq(schema.transportRoutes.schoolId, user.schoolId), eq(schema.transportRoutes.vehicleId, vehicle.id)))
    .get();

  let stops: any[] = [];
  if (route) {
    stops = db
      .select()
      .from(schema.transportStops)
      .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.routeId, route.id)))
      .all()
      .sort((a: any, b: any) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1));
  }

  return c.json({
    assigned: true,
    vehicle: {
      id: vehicle.id,
      vehicleNo: vehicle.vehicleNo,
      vehicleModel: vehicle.vehicleModel,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      driverLicense: vehicle.driverLicense,
      status: vehicle.status,
      currentLat: vehicle.currentLat || null,
      currentLng: vehicle.currentLng || null,
      currentSpeed: vehicle.currentSpeed || 0,
      currentHeading: vehicle.currentHeading || 0,
      lastLocationUpdate: vehicle.lastLocationUpdate || null,
      isTripActive: vehicle.isTripActive === 1,
    },
    route: route
      ? {
          id: route.id,
          routeName: route.routeName,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          monthlyFare: route.monthlyFare,
        }
      : null,
    stops,
  });
});

// Driver: Push live GPS telemetry updates from mobile phone (watchPosition)
transportRoutes.post('/driver/live-location', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { vehicleId, lat, lng, speed, heading, isTripActive } = body;

  let targetVehicleId = vehicleId;

  // If vehicleId not provided, look up by driver user
  if (!targetVehicleId) {
    const schoolVehicles = db
      .select()
      .from(schema.transportVehicles)
      .where(eq(schema.transportVehicles.schoolId, user.schoolId))
      .all();
    const userPhoneDigits = (user.phone || '').replace(/\D/g, '');
    const found = schoolVehicles.find((v: any) => {
      if (v.driverUserId === user.userId || (v.id && (user as any).vehicleId === v.id)) return true;
      if (userPhoneDigits.length >= 10) {
        return (v.driverPhone || '').replace(/\D/g, '').endsWith(userPhoneDigits.slice(-10));
      }
      return false;
    }) || (user.role === 'driver' && schoolVehicles.length === 1 ? schoolVehicles[0] : null);

    if (found) targetVehicleId = found.id;
  }

  if (!targetVehicleId) {
    return c.json({ error: 'Vehicle ID could not be identified for this driver' }, 400);
  }

  const existing = db
    .select()
    .from(schema.transportVehicles)
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, targetVehicleId)))
    .get();

  if (!existing) {
    return c.json({ error: 'Vehicle not found' }, 404);
  }

  const now = new Date().toISOString();
  const updateData: any = {
    lastLocationUpdate: now,
  };

  if (lat !== undefined && lng !== undefined) {
    updateData.currentLat = Number(lat);
    updateData.currentLng = Number(lng);
  }
  if (speed !== undefined) updateData.currentSpeed = Number(speed);
  if (heading !== undefined) updateData.currentHeading = Number(heading);
  if (isTripActive !== undefined) updateData.isTripActive = isTripActive ? 1 : 0;

  db.update(schema.transportVehicles)
    .set(updateData)
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, targetVehicleId)))
    .run();

  return c.json({
    success: true,
    timestamp: now,
    vehicleId: targetVehicleId,
    isTripActive: updateData.isTripActive !== undefined ? updateData.isTripActive === 1 : existing.isTripActive === 1,
  });
});

// Driver: Toggle trip state (Start / End Trip)
transportRoutes.post('/driver/toggle-trip', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { vehicleId, isTripActive } = body;

  let targetVehicleId = vehicleId;
  if (!targetVehicleId) {
    const schoolVehicles = db
      .select()
      .from(schema.transportVehicles)
      .where(eq(schema.transportVehicles.schoolId, user.schoolId))
      .all();
    const userPhoneDigits = (user.phone || '').replace(/\D/g, '');
    const found = schoolVehicles.find((v: any) => {
      if (v.driverUserId === user.userId) return true;
      if (userPhoneDigits.length >= 10) {
        return (v.driverPhone || '').replace(/\D/g, '').endsWith(userPhoneDigits.slice(-10));
      }
      return false;
    }) || (user.role === 'driver' && schoolVehicles.length === 1 ? schoolVehicles[0] : null);

    if (found) targetVehicleId = found.id;
  }

  if (!targetVehicleId) {
    return c.json({ error: 'Vehicle ID not found' }, 400);
  }

  const now = new Date().toISOString();
  db.update(schema.transportVehicles)
    .set({
      isTripActive: isTripActive ? 1 : 0,
      lastLocationUpdate: now,
    })
    .where(and(eq(schema.transportVehicles.schoolId, user.schoolId), eq(schema.transportVehicles.id, targetVehicleId)))
    .run();

  return c.json({
    success: true,
    vehicleId: targetVehicleId,
    isTripActive: Boolean(isTripActive),
    timestamp: now,
  });
});

// Parent: Strict Live Bus Tracking (ONLY for students with assigned transport)
transportRoutes.get('/parent/live-tracking/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');

  // Strict RBAC: Parent can ONLY access their own children
  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student transport tracking' }, 403);
  }

  // Check if student has transport allocated
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
    return c.json({
      hasTransport: false,
      message: 'No school bus is assigned to this student in the ERP.',
    });
  }

  const route = db.select().from(schema.transportRoutes).where(eq(schema.transportRoutes.id, allocation.routeId)).get();
  if (!route) {
    return c.json({
      hasTransport: false,
      message: 'Assigned transport route was not found in the ERP system.',
    });
  }

  const stop = db.select().from(schema.transportStops).where(eq(schema.transportStops.id, allocation.stopId)).get();
  const vehicle = route.vehicleId
    ? db.select().from(schema.transportVehicles).where(eq(schema.transportVehicles.id, route.vehicleId)).get()
    : null;

  const allStops = db
    .select()
    .from(schema.transportStops)
    .where(and(eq(schema.transportStops.schoolId, user.schoolId), eq(schema.transportStops.routeId, route.id)))
    .all()
    .sort((a: any, b: any) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1));

  return c.json({
    hasTransport: true,
    studentId,
    vehicle: vehicle
      ? {
          id: vehicle.id,
          vehicleNo: vehicle.vehicleNo,
          vehicleModel: vehicle.vehicleModel,
          driverName: vehicle.driverName,
          driverPhone: vehicle.driverPhone,
          driverLicense: vehicle.driverLicense,
          status: vehicle.status,
          currentLat: vehicle.currentLat || null,
          currentLng: vehicle.currentLng || null,
          currentSpeed: vehicle.currentSpeed || 0,
          currentHeading: vehicle.currentHeading || 0,
          lastLocationUpdate: vehicle.lastLocationUpdate || null,
          isTripActive: vehicle.isTripActive === 1,
        }
      : null,
    route: {
      id: route.id,
      routeName: route.routeName,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      monthlyFare: route.monthlyFare,
    },
    studentStop: stop
      ? {
          id: stop.id,
          stopName: stop.stopName,
          pickupTime: stop.pickupTime,
          dropTime: stop.dropTime,
          sequenceOrder: stop.sequenceOrder,
        }
      : null,
    allStops,
  });
});

// Fleet Live Tracking: For Principal, Teachers & SuperAdmin to view all active buses
transportRoutes.get('/fleet-live', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'teacher' && user.role !== 'super_admin' && user.role !== 'accountant') {
    return c.json({ error: 'Forbidden: School staff only' }, 403);
  }

  const vehicles = db
    .select()
    .from(schema.transportVehicles)
    .where(eq(schema.transportVehicles.schoolId, user.schoolId))
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

  const fleet = vehicles.map((v: any) => {
    const route = routes.find((r: any) => r.vehicleId === v.id);
    const routeStops = route
      ? stops.filter((s: any) => s.routeId === route.id).sort((a: any, b: any) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1))
      : [];

    return {
      id: v.id,
      vehicleNo: v.vehicleNo,
      vehicleModel: v.vehicleModel,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      driverLicense: v.driverLicense,
      status: v.status,
      currentLat: v.currentLat || null,
      currentLng: v.currentLng || null,
      currentSpeed: v.currentSpeed || 0,
      currentHeading: v.currentHeading || 0,
      lastLocationUpdate: v.lastLocationUpdate || null,
      isTripActive: v.isTripActive === 1,
      routeName: route?.routeName || 'Unassigned Route',
      routeId: route?.id || null,
      stopsCount: routeStops.length,
      stops: routeStops,
    };
  });

  return c.json({
    schoolId: user.schoolId,
    totalVehicles: vehicles.length,
    activeTrips: fleet.filter((f: any) => f.isTripActive).length,
    vehicles: fleet,
  });
});

