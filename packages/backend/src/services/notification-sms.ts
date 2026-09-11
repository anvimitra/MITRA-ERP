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
  // 1. Fetch student and parent details
  const student = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.id, studentId))
    .get();

  if (!student || !student.parentId) {
    return { success: false, reason: 'Student or Parent link not found' };
  }

  const parent = db
    .select()
    .from(schema.parents)
    .where(eq(schema.parents.id, student.parentId))
    .get();

  if (!parent) {
    return { success: false, reason: 'Parent record not found' };
  }

  // 2. Check if parent user account has app installed and active
  let parentUser = null;
  if (parent.userId) {
    parentUser = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, parent.userId))
      .get();
  }

  // In-App Notification Dispatch (SMS service deactivated per requirements)
  const notifId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (parent.userId) {
    db.insert(schema.notifications).values({
      id: notifId,
      schoolId,
      userId: parent.userId,
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
    recipientPhone: parent.primaryPhone,
    message,
    notificationId: notifId,
  };
}
