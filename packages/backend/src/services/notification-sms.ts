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

  const isAppActive = parentUser && parentUser.appInstalled === 1;
  const now = new Date().toISOString();
  const notifId = crypto.randomUUID();

  if (isAppActive && parent.userId) {
    // Parent is active on mobile app -> Dispatch in-app push notification
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

    return {
      success: true,
      channel: 'APP_PUSH_NOTIFICATION',
      recipientPhone: parent.primaryPhone,
      message,
      notificationId: notifId,
    };
  } else {
    // Parent is NOT active on app -> Automatic SMS Fallback triggered!
    const smsLogId = crypto.randomUUID();

    // Log notification in db (linked to parent userId if exists)
    if (parent.userId) {
      db.insert(schema.notifications).values({
        id: notifId,
        schoolId,
        userId: parent.userId,
        title,
        message,
        type,
        isRead: 0,
        sentViaApp: 0,
        sentViaSms: 1,
        createdAt: now,
      }).run();
    }

    // Record in sms_logs
    db.insert(schema.smsLogs).values({
      id: smsLogId,
      schoolId,
      studentId,
      phoneNumber: parent.primaryPhone,
      messageText: `[ANVIMITRA-ERP] ${title}: ${message}`,
      triggerReason: 'parent_inactive_on_app',
      status: 'delivered', // simulated carrier delivery
      sentAt: now,
    }).run();

    return {
      success: true,
      channel: 'AUTOMATED_SMS_FALLBACK',
      recipientPhone: parent.primaryPhone,
      smsLogId,
      message: `[ANVIMITRA-ERP] ${title}: ${message}`,
    };
  }
}
