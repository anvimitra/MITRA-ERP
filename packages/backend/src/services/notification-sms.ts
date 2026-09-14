import { db, schema, eq } from '../db/index.js';
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

  let targetUserId: string | null = null;
  let targetPhone = student.primaryPhone || student.emergencyPhone || '';

  if (student.parentId) {
    const parent = db
      .select()
      .from(schema.parents)
      .where(eq(schema.parents.id, student.parentId))
      .get();
    if (parent?.userId) targetUserId = parent.userId;
    if (parent?.primaryPhone) targetPhone = parent.primaryPhone;
  }

  // Fallback: search users table by parent phone if targetUserId is null
  if (!targetUserId && targetPhone) {
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const allUsers = db.select().from(schema.users).all();
      const matchedUser = allUsers.find((u: any) => {
        const uPhone = (u.phone || '').replace(/\D/g, '');
        return u.role === 'parent' && (uPhone === cleanPhone || (uPhone.length >= 10 && uPhone.endsWith(cleanPhone.slice(-10))));
      });
      if (matchedUser) {
        targetUserId = matchedUser.id;
      }
    }
  }

  // In-App Notification Dispatch
  const notifId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (targetUserId) {
    db.insert(schema.notifications).values({
      id: notifId,
      schoolId,
      userId: targetUserId,
      title,
      message,
      type,
      isRead: 0,
      sentViaApp: 1,
      sentViaSms: 0,
      createdAt: now,
    }).run();
  }

  return {
    success: true,
    channel: 'APP_PUSH_NOTIFICATION',
    recipientPhone: targetPhone,
    message,
    notificationId: notifId,
  };
}
