import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, schema } from '../db/index.js';
import { uploadBackupToGoogleDrive, isGoogleDriveConfigured } from './google-drive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '../../backup-scheduler-state.json');

export interface SchedulerState {
  enabled: boolean;
  targetHour: number; // 22 (10:00 PM)
  targetMinute: number; // 0
  lastRunDate: string | null; // e.g. '2026-09-16'
  lastRunAt: string | null; // ISO timestamp
  lastRunStatus: 'success' | 'failed' | 'idle';
  lastRunMessage: string | null;
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function loadSchedulerState(): SchedulerState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}
  return {
    enabled: true,
    targetHour: 22, // 10:00 PM (Night)
    targetMinute: 0,
    lastRunDate: null,
    lastRunAt: null,
    lastRunStatus: 'idle',
    lastRunMessage: 'Scheduled for 10:00 PM Nightly',
  };
}

export function saveSchedulerState(state: SchedulerState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save backup scheduler state:', err);
  }
}

/**
 * Extracts complete multi-tenant ERP database snapshot
 */
export function generateDatabaseSnapshot() {
  const schools = db.select().from(schema.schools).all();
  const users = db.select().from(schema.users).all();
  const classes = db.select().from(schema.classes).all();
  const sections = db.select().from(schema.sections).all();
  const students = db.select().from(schema.students).all();
  const parents = db.select().from(schema.parents).all();
  const subjects = db.select().from(schema.subjects).all();
  const marks = db.select().from(schema.marks).all();
  const attendance = db.select().from(schema.attendance).all();
  const feeStructures = db.select().from(schema.feeStructures).all();
  const feePayments = db.select().from(schema.feePayments).all();

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    source: 'ANVIMITRA-ERP Google Drive Auto-Backup Scheduler',
    totalSchools: schools.length,
    dataset: {
      schools,
      users,
      classes,
      sections,
      students,
      parents,
      subjects,
      marks,
      attendance,
      feeStructures,
      feePayments,
    },
  };
}

/**
 * Executes cloud backup to Google Drive
 */
export async function executeAutoBackup(reason = 'Nightly 10:00 PM Auto-Backup') {
  const state = loadSchedulerState();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  if (!isGoogleDriveConfigured()) {
    console.warn('[Auto-Backup ⏰] Skipped: Google Drive credentials not configured.');
    state.lastRunStatus = 'failed';
    state.lastRunMessage = 'Google Drive credentials not configured';
    saveSchedulerState(state);
    return { success: false, message: state.lastRunMessage };
  }

  console.log(`[Auto-Backup ⏰] Triggering ${reason} at ${now.toLocaleTimeString()}...`);

  try {
    const snapshot = generateDatabaseSnapshot();
    const fileName = `anvimitra_backup_${dateStr}.json`;
    const result = await uploadBackupToGoogleDrive(snapshot, fileName);

    state.lastRunDate = dateStr;
    state.lastRunAt = now.toISOString();
    state.lastRunStatus = 'success';
    state.lastRunMessage = `Auto-backup completed: ${snapshot.totalSchools} schools, ${snapshot.dataset.students.length} students synced.`;
    saveSchedulerState(state);

    console.log(`[Auto-Backup ⏰] ✅ SUCCESS: ${state.lastRunMessage}`);
    return { success: true, result, message: state.lastRunMessage };
  } catch (err: any) {
    state.lastRunStatus = 'failed';
    state.lastRunMessage = `Auto-backup failed: ${err.message}`;
    saveSchedulerState(state);
    console.error(`[Auto-Backup ⏰] ❌ ERROR:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Initializes the background scheduler to run every night at 10:00 PM (22:00)
 */
export function startAutoBackupScheduler() {
  const state = loadSchedulerState();
  console.log(`⏰ [Auto-Backup Scheduler] Active & Scheduled for 10:00 PM Nightly (22:00 IST).`);

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Periodic clock check every 30 seconds
  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dateStr = now.toISOString().slice(0, 10);

    const currentState = loadSchedulerState();
    if (!currentState.enabled) return;

    // Check if current hour and minute matches 22:00 and hasn't already run today
    if (currentHour === currentState.targetHour && currentMinute === currentState.targetMinute) {
      if (currentState.lastRunDate !== dateStr) {
        console.log(`⏰ [Auto-Backup Scheduler] 10:00 PM Night time reached! Running daily Google Drive backup...`);
        await executeAutoBackup('Nightly 10:00 PM Scheduled Backup');
      }
    }
  }, 30000);
}

export function getAutoBackupStatus() {
  const state = loadSchedulerState();
  const now = new Date();
  const next = new Date(now);
  next.setHours(state.targetHour, state.targetMinute, 0, 0);
  if (now.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return {
    enabled: state.enabled,
    scheduleDescription: 'Daily Night at 10:00 PM (22:00)',
    targetHour: state.targetHour,
    targetMinute: state.targetMinute,
    lastRunDate: state.lastRunDate,
    lastRunAt: state.lastRunAt,
    lastRunStatus: state.lastRunStatus,
    lastRunMessage: state.lastRunMessage,
    nextRunAt: next.toISOString(),
  };
}
