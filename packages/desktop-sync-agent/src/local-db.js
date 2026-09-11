const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let localDb = null;
let currentDbPath = '';

function getStoragePath() {
  return currentDbPath || path.resolve(process.cwd(), 'local-storage', 'anvimitra_secondary.db');
}

function initLocalDatabase(customPath) {
  const targetPath = customPath || getStoragePath();
  currentDbPath = targetPath;
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  localDb = new DatabaseSync(targetPath);
  localDb.exec('PRAGMA journal_mode = WAL;');

  // Secondary local replica schema
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS local_school (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      logo_url TEXT,
      address TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS local_students (
      id TEXT PRIMARY KEY,
      admission_no TEXT,
      roll_no INTEGER,
      first_name TEXT,
      last_name TEXT,
      class_id TEXT,
      section_id TEXT,
      gender TEXT,
      photo_url TEXT
    );

    CREATE TABLE IF NOT EXISTS local_attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      class_id TEXT,
      section_id TEXT,
      date TEXT,
      status TEXT,
      remarks TEXT,
      is_synced_to_cloud INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS local_marks (
      id TEXT PRIMARY KEY,
      exam_id TEXT,
      student_id TEXT,
      subject_id TEXT,
      marks_obtained REAL,
      max_marks REAL,
      grade TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS local_fees (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      amount_paid REAL,
      payment_date TEXT,
      payment_mode TEXT,
      receipt_no TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS local_timetable (
      id TEXT PRIMARY KEY,
      class_id TEXT,
      section_id TEXT,
      day_of_week TEXT,
      period_number INTEGER,
      start_time TEXT,
      end_time TEXT,
      subject_id TEXT,
      teacher_id TEXT,
      room_number TEXT
    );

    CREATE TABLE IF NOT EXISTS local_student_logs (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      log_type TEXT,
      title TEXT,
      description TEXT,
      action_taken TEXT,
      reported_by_user_id TEXT,
      date TEXT,
      notify_parent INTEGER
    );
  `);

  console.log(`[Secondary PC Storage] Local SQLite initialized at: ${targetPath}`);
  return localDb;
}

function getLocalDb() {
  if (!localDb) {
    initLocalDatabase();
  }
  return localDb;
}

module.exports = {
  initLocalDatabase,
  getLocalDb,
  getStoragePath,
};
