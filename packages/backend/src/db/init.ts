import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

let globalDbInstance: DatabaseSync | null = null;

export function initializeDatabase(dbPath?: string): DatabaseSync {
  if (globalDbInstance) {
    return globalDbInstance;
  }

  const targetPath = dbPath || path.resolve(process.cwd(), 'data', 'anvimitra_dev.db');
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const sqlite = new DatabaseSync(targetPath);
  sqlite.exec('PRAGMA journal_mode = WAL;');

  // Create all Multi-Tenant ERP Tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      domain TEXT,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#2563eb',
      secondary_color TEXT DEFAULT '#1e40af',
      phone TEXT,
      email TEXT,
      address TEXT,
      api_sync_key TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      app_installed INTEGER DEFAULT 0,
      last_active_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_level INTEGER
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS class_teachers (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      academic_year TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT
    );

    CREATE TABLE IF NOT EXISTS subject_allocations (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      academic_year TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      user_id TEXT,
      father_name TEXT,
      mother_name TEXT,
      primary_phone TEXT NOT NULL,
      alt_phone TEXT,
      email TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      admission_no TEXT NOT NULL,
      roll_no INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      parent_id TEXT,
      gender TEXT,
      dob TEXT,
      blood_group TEXT,
      photo_url TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      marked_by_teacher_id TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_published INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL,
      grade TEXT,
      remarks TEXT,
      marked_by_teacher_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      academic_year TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      fee_structure_id TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_mode TEXT NOT NULL,
      receipt_no TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      sent_via_app INTEGER DEFAULT 1,
      sent_via_sms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT,
      phone_number TEXT NOT NULL,
      message_text TEXT NOT NULL,
      trigger_reason TEXT NOT NULL,
      status TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      device_identifier TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      records_count INTEGER DEFAULT 0,
      last_sync_timestamp TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  globalDbInstance = sqlite;
  return sqlite;
}

export function getDatabaseInstance(): DatabaseSync {
  if (!globalDbInstance) {
    return initializeDatabase();
  }
  return globalDbInstance;
}
