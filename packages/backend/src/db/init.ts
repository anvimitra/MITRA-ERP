import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

let globalDbInstance: DatabaseSync | null = null;

export function getCanonicalDbPath(): string {
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);
  // Canonical location is inside packages/backend/data/anvimitra_dev.db
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '..', '..', 'data', 'anvimitra_dev.db');
}

export function checkpointDatabase(): void {
  if (globalDbInstance) {
    try {
      globalDbInstance.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (e) {
      console.error('Database checkpoint error:', e);
    }
  }
}

export function initializeDatabase(dbPath?: string): DatabaseSync {
  if (globalDbInstance) {
    return globalDbInstance;
  }

  const targetPath = dbPath || getCanonicalDbPath();
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const sqlite = new DatabaseSync(targetPath);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA synchronous = NORMAL;');
  sqlite.exec('PRAGMA busy_timeout = 5000;');

  // Automatic checkpoint on shutdown to ensure data is permanently flushed to disk
  const handleExit = () => {
    try {
      sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {}
  };
  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
  process.on('exit', handleExit);

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
      affiliation_no TEXT,
      principal_name TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      website TEXT,
      established_year TEXT,
      tagline TEXT,
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

    CREATE TABLE IF NOT EXISTS timetable_periods (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      room_number TEXT
    );

    CREATE TABLE IF NOT EXISTS student_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      log_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      action_taken TEXT,
      reported_by_user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      notify_parent INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      certificate_no TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      reason TEXT,
      conduct TEXT,
      extra_fields TEXT,
      status TEXT DEFAULT 'ISSUED',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS front_desk_visitors (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL,
      whom_to_meet TEXT NOT NULL,
      id_card_type TEXT,
      id_card_no TEXT,
      check_in TEXT NOT NULL,
      check_out TEXT,
      badge_number TEXT,
      status TEXT DEFAULT 'IN',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS front_desk_inquiries (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      class_seeking TEXT NOT NULL,
      source TEXT,
      status TEXT DEFAULT 'NEW',
      follow_up_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS front_desk_postal_complaints (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      reference_no TEXT,
      from_name TEXT,
      to_name TEXT,
      contact_phone TEXT,
      description TEXT,
      action_taken TEXT,
      status TEXT DEFAULT 'PENDING',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_leaves (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      staff_user_id TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      reviewed_by_user_id TEXT,
      review_remarks TEXT,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_payroll (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      staff_user_id TEXT NOT NULL,
      month_year TEXT NOT NULL,
      basic_salary REAL NOT NULL,
      hra REAL DEFAULT 0,
      da REAL DEFAULT 0,
      special_allowance REAL DEFAULT 0,
      deduction_pf REAL DEFAULT 0,
      deduction_tax REAL DEFAULT 0,
      deduction_leave REAL DEFAULT 0,
      net_salary REAL NOT NULL,
      payment_status TEXT DEFAULT 'PAID',
      payment_date TEXT,
      payment_mode TEXT DEFAULT 'BANK_TRANSFER',
      slip_no TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_books (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publisher TEXT,
      subject TEXT,
      rack_number TEXT,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      price REAL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_issues (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      student_id TEXT,
      staff_user_id TEXT,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      fine_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'ISSUED',
      issued_by_user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transport_vehicles (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      vehicle_no TEXT NOT NULL,
      vehicle_model TEXT,
      seating_capacity INTEGER NOT NULL DEFAULT 40,
      driver_name TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      driver_license TEXT,
      status TEXT DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS transport_routes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      route_name TEXT NOT NULL,
      start_location TEXT NOT NULL,
      end_location TEXT NOT NULL,
      vehicle_id TEXT,
      monthly_fare REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transport_stops (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      stop_name TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      drop_time TEXT NOT NULL,
      sequence_order INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS student_transport (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      stop_id TEXT NOT NULL,
      academic_year TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'PCS',
      current_quantity INTEGER NOT NULL DEFAULT 0,
      minimum_alert_quantity INTEGER DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL,
      supplier_or_recipient TEXT NOT NULL,
      invoice_or_slip_no TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      created_by_user_id TEXT NOT NULL
    );
  `);

  // Auto-migrate school profile columns if upgrading an existing SQLite DB
  const schoolProfileCols = [
    'affiliation_no',
    'principal_name',
    'city',
    'state',
    'pincode',
    'website',
    'established_year',
    'tagline',
  ];
  for (const col of schoolProfileCols) {
    try {
      sqlite.exec(`ALTER TABLE schools ADD COLUMN ${col} TEXT;`);
    } catch {
      // Column already exists
    }
  }

  // Auto-migrate student profile columns (medical, emergency, caste category, user_id)
  const studentProfileCols = [
    'emergency_phone',
    'medical_conditions',
    'allergies',
    'category',
    'user_id',
  ];
  for (const col of studentProfileCols) {
    try {
      sqlite.exec(`ALTER TABLE students ADD COLUMN ${col} TEXT;`);
    } catch {
      // Column already exists
    }
  }

  // Ensure default Super Admin root account exists
  try {
    const adminRow = sqlite.prepare("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1").get();
    if (!adminRow) {
      const now = new Date().toISOString();
      const adminPassHash = bcrypt.hashSync('Admin@123', 10);
      sqlite.prepare(`
        INSERT INTO users (id, school_id, role, name, email, phone, password_hash, app_installed, is_active, created_at)
        VALUES ('user-super-admin-01', NULL, 'super_admin', 'Super Administrator', 'admin@anvimitra.com', '+91 99999 88888', ?, 0, 1, ?)
      `).run(adminPassHash, now);
      console.log('✅ Default Super Admin root account verified: admin@anvimitra.com');
    }
  } catch (err) {
    console.warn('Super Admin initialization check:', err);
  }

  globalDbInstance = sqlite;
  return sqlite;
}

export function getDatabaseInstance(): DatabaseSync {
  if (!globalDbInstance) {
    return initializeDatabase();
  }
  return globalDbInstance;
}
