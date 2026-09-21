import { db, schema, eq, and } from '../db/index.js';
import { resolveLinkedStudentsForParent } from './rbac.js';
import { saveLocalBackup } from '../db/persistent-backup.js';
import { getDatabaseInstance } from '../db/init.js';
import crypto from 'crypto';

export interface DispatchNotificationParams {
  schoolId: string;
  studentId: string;
  title: string;
  message: string;
  type: 'attendance' | 'fee' | 'exam' | 'general';
}

export async function dispatchStudentNotification({
  schoolId,
  studentId,
  title,
  message,
  type,
}: DispatchNotificationParams) {
  const student = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.id, studentId))
    .get();

  if (!student) {
    return { success: false, reason: 'Student record not found' };
  }

  const targetUserIds = new Set<string>();
  let targetPhone = student.primaryPhone || student.emergencyPhone || '';

  // 1. Direct student user account
  if (student.userId) {
    targetUserIds.add(student.userId);
  }

  // 2. Direct parent record linked to student
  if (student.parentId) {
    const parent = db
      .select()
      .from(schema.parents)
      .where(eq(schema.parents.id, student.parentId))
      .get();
    if (parent?.userId) targetUserIds.add(parent.userId);
    if (parent?.primaryPhone) targetPhone = parent.primaryPhone;
  }

  // 3. Match any parent user in this school linked to this student via resolveLinkedStudentsForParent
  try {
    const schoolParentUsers = db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.schoolId, schoolId), eq(schema.users.role, 'parent')))
      .all();

    for (const pUser of schoolParentUsers) {
      const linked = resolveLinkedStudentsForParent(pUser);
      if (linked && linked.some((s: any) => s.id === studentId)) {
        targetUserIds.add(pUser.id);
      }
    }
  } catch (err) {
    console.warn('Error resolving parent users for notification:', err);
  }

  // 4. Fallback phone matching across all users in school
  if (targetPhone) {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const allUsers = db.select().from(schema.users).where(eq(schema.users.schoolId, schoolId)).all();
      for (const u of allUsers) {
        const uPhone = (u.phone || '').replace(/\D/g, '');
        if (uPhone === cleanPhone || (uPhone.length >= 10 && uPhone.endsWith(cleanPhone.slice(-10)))) {
          targetUserIds.add(u.id);
        }
      }
    }
  }

  // 5. In-App Notification Dispatch to all identified user accounts
  const now = new Date().toISOString();
  let firstNotifId = crypto.randomUUID();

  for (const uid of targetUserIds) {
    const notifId = crypto.randomUUID();
    db.insert(schema.notifications)
      .values({
        id: notifId,
        schoolId,
        userId: uid,
        title,
        message,
        type,
        isRead: 0,
        sentViaApp: 1,
        sentViaSms: 0,
        createdAt: now,
      })
      .run();
    firstNotifId = notifId;
  }

  // Save persistent backup
  try {
    saveLocalBackup(getDatabaseInstance());
  } catch {}

  return {
    success: true,
    channel: 'APP_PUSH_NOTIFICATION',
    recipientPhone: targetPhone,
    message,
    notificationId: firstNotifId,
    dispatchedCount: targetUserIds.size,
  };
}
