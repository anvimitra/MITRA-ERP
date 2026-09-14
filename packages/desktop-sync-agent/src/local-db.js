const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let localDb = null;
let currentDbPath = '';

function getStorageDir() {
  if (process.env.LOCAL_STORAGE_DIR) return path.resolve(process.env.LOCAL_STORAGE_DIR);
  return path.resolve(__dirname, '..', 'local-storage');
}

function getStoragePath() {
  if (currentDbPath) return currentDbPath;
  if (process.env.LOCAL_DB_PATH) return path.resolve(process.env.LOCAL_DB_PATH);
  return path.resolve(getStorageDir(), 'anvimitra_master_local.db');
}

function getBackupFilePath() {
  return path.resolve(getStorageDir(), 'all_schools_backup.json');
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
  localDb.exec('PRAGMA synchronous = NORMAL;');
  localDb.exec('PRAGMA busy_timeout = 5000;');

  const handleExit = () => {
    try {
      localDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {}
  };
  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
  process.on('exit', handleExit);

  // Full Multi-School Master Replica Schema
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

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

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT
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
      emergency_phone TEXT,
      medical_conditions TEXT,
      allergies TEXT,
      category TEXT,
      user_id TEXT,
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
      applied_at TEXT NOT NULL
    );
  `);

  console.log(`[Master PC Storage] Local SQLite Master Database initialized at: ${targetPath}`);
  
  // Auto-load local JSON backup on startup if SQLite is fresh
  try {
    const backupFile = getBackupFilePath();
    if (fs.existsSync(backupFile)) {
      const schoolCount = localDb.prepare('SELECT count(*) as count FROM schools').get();
      if (!schoolCount || schoolCount.count === 0) {
        console.log(`📦 Found existing local backup '${backupFile}', restoring into SQLite...`);
        const content = fs.readFileSync(backupFile, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed.dataset) {
          saveMasterDataset(parsed.dataset, false);
        }
      }
    }
  } catch (err) {
    console.warn('Initial backup restore notice:', err.message);
  }

  return localDb;
}

function getLocalDb() {
  if (!localDb) {
    initLocalDatabase();
  }
  return localDb;
}

// Save complete dataset from Cloud ERP into local SQLite and JSON backup file
function saveMasterDataset(dataset, updateJson = true) {
  const db = getLocalDb();
  if (!dataset || typeof dataset !== 'object') return;

  const insertHelper = (tableName, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    for (const r of rows) {
      const keys = Object.keys(r);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => (r[k] === undefined ? null : r[k]));
      try {
        db.prepare(`INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      } catch (err) {
        // Continue with other records
      }
    }
  };

  if (Array.isArray(dataset.schools)) insertHelper('schools', dataset.schools);
  if (Array.isArray(dataset.users)) insertHelper('users', dataset.users);
  if (Array.isArray(dataset.classes)) insertHelper('classes', dataset.classes);
  if (Array.isArray(dataset.sections)) insertHelper('sections', dataset.sections);
  if (Array.isArray(dataset.subjects)) insertHelper('subjects', dataset.subjects);
  if (Array.isArray(dataset.parents)) insertHelper('parents', dataset.parents);
  if (Array.isArray(dataset.students)) insertHelper('students', dataset.students);
  if (Array.isArray(dataset.attendance)) insertHelper('attendance', dataset.attendance);
  if (Array.isArray(dataset.exams)) insertHelper('exams', dataset.exams);
  if (Array.isArray(dataset.marks)) insertHelper('marks', dataset.marks);
  if (Array.isArray(dataset.feeStructures)) insertHelper('fee_structures', dataset.feeStructures);
  if (Array.isArray(dataset.feePayments)) insertHelper('fee_payments', dataset.feePayments);
  if (Array.isArray(dataset.timetable)) insertHelper('timetable_periods', dataset.timetable);
  if (Array.isArray(dataset.staffLeaves)) insertHelper('staff_leaves', dataset.staffLeaves);

  // Update sync metadata
  const now = new Date().toISOString();
  try {
    db.prepare(`INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_master_sync', ?)`).run(now);
  } catch {}

  // Save to JSON backup file on PC
  if (updateJson) {
    try {
      const backupPath = getBackupFilePath();
      const currentFullDataset = getMasterDataset();
      const backupPayload = {
        exportDate: now,
        computerName: process.env.COMPUTERNAME || 'LocalMasterPC',
        totalSchools: currentFullDataset.schools?.length || 0,
        dataset: currentFullDataset,
      };
      fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf8');
      console.log(`💾 [Master PC Storage] Persistent JSON snapshot saved: ${backupPath}`);
    } catch (err) {
      console.warn('Backup write notice:', err.message);
    }
  }
}

// Retrieve complete dataset of ALL schools from local SQLite
function getMasterDataset() {
  const db = getLocalDb();
  return {
    schools: db.prepare('SELECT * FROM schools').all(),
    users: db.prepare('SELECT * FROM users').all(),
    classes: db.prepare('SELECT * FROM classes').all(),
    sections: db.prepare('SELECT * FROM sections').all(),
    subjects: db.prepare('SELECT * FROM subjects').all(),
    parents: db.prepare('SELECT * FROM parents').all(),
    students: db.prepare('SELECT * FROM students').all(),
    attendance: db.prepare('SELECT * FROM attendance').all(),
    exams: db.prepare('SELECT * FROM exams').all(),
    marks: db.prepare('SELECT * FROM marks').all(),
    feeStructures: db.prepare('SELECT * FROM fee_structures').all(),
    feePayments: db.prepare('SELECT * FROM fee_payments').all(),
    timetable: db.prepare('SELECT * FROM timetable_periods').all(),
    staffLeaves: db.prepare('SELECT * FROM staff_leaves').all(),
  };
}

// Multi-School Summary Stats for the Local PC Dashboard
function getMultiSchoolStats() {
  const db = getLocalDb();
  const schools = db.prepare('SELECT * FROM schools ORDER BY name ASC').all();
  
  const enrichedSchools = schools.map((s) => {
    const studentCount = db.prepare('SELECT count(*) as count FROM students WHERE school_id = ?').get(s.id)?.count || 0;
    const teacherCount = db.prepare("SELECT count(*) as count FROM users WHERE school_id = ? AND role = 'teacher'").get(s.id)?.count || 0;
    const attendanceCount = db.prepare('SELECT count(*) as count FROM attendance WHERE school_id = ?').get(s.id)?.count || 0;
    const feeCount = db.prepare('SELECT count(*) as count FROM fee_payments WHERE school_id = ?').get(s.id)?.count || 0;
    return {
      ...s,
      studentCount,
      teacherCount,
      attendanceCount,
      feeCount,
    };
  });

  const totalStudents = db.prepare('SELECT count(*) as count FROM students').get()?.count || 0;
  const totalUsers = db.prepare('SELECT count(*) as count FROM users').get()?.count || 0;
  const totalAttendance = db.prepare('SELECT count(*) as count FROM attendance').get()?.count || 0;
  const totalFees = db.prepare('SELECT count(*) as count FROM fee_payments').get()?.count || 0;

  const lastSyncMeta = db.prepare("SELECT value FROM sync_meta WHERE key = 'last_master_sync'").get();

  return {
    totalSchools: schools.length,
    totalStudents,
    totalUsers,
    totalAttendance,
    totalFees,
    lastSyncTimestamp: lastSyncMeta?.value || null,
    schools: enrichedSchools,
    storagePath: getStoragePath(),
    backupPath: getBackupFilePath(),
  };
}

module.exports = {
  initLocalDatabase,
  getLocalDb,
  getStoragePath,
  getStorageDir,
  getBackupFilePath,
  saveMasterDataset,
  getMasterDataset,
  getMultiSchoolStats,
};

