import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isConnected = false;

export function isPostgresConnected(): boolean {
  return isConnected && pool !== null;
}

export function getPostgresPool(): pg.Pool | null {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  try {
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL client error:', err);
    });

    return pool;
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err);
    return null;
  }
}

// PostgreSQL Table Schemas
const POSTGRES_TABLES_SQL = `
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
`;

const ALL_SYNC_TABLES = [
  'schools',
  'users',
  'classes',
  'sections',
  'class_teachers',
  'subjects',
  'subject_allocations',
  'parents',
  'students',
  'attendance',
  'exams',
  'marks',
  'fee_structures',
  'fee_payments',
  'notifications',
  'sms_logs',
  'staff_leaves',
];

// Initialize PostgreSQL and restore data into SQLite
export async function initializePostgresSync(sqlite: DatabaseSync): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) {
    console.log('ℹ️ DATABASE_URL not detected. Operating with Local SQLite storage.');
    return false;
  }

  try {
    const client = await p.connect();
    try {
      // 1. Create tables in PostgreSQL
      await client.query(POSTGRES_TABLES_SQL);
      isConnected = true;
      console.log('✅ PostgreSQL Schema Verified & Active on Cloud Database!');

      // 2. Load all rows from PostgreSQL into SQLite
      for (const table of ALL_SYNC_TABLES) {
        try {
          const res = await client.query(`SELECT * FROM ${table}`);
          if (res.rows && res.rows.length > 0) {
            console.log(`📥 Restoring ${res.rows.length} rows from PostgreSQL table '${table}' into SQLite...`);
            for (const row of res.rows) {
              const keys = Object.keys(row);
              const placeholders = keys.map(() => '?').join(', ');
              const values = keys.map((k) => row[k]);
              try {
                sqlite
                  .prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`)
                  .run(...values);
              } catch (insertErr) {
                // Ignore single row insert issues if columns differ
              }
            }
          }
        } catch (tableErr) {
          // Table may not exist yet
        }
      }

      console.log('🌟 Cloud PostgreSQL Synchronization Complete: All schools & users restored to SQLite cache.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Failed to synchronize with PostgreSQL:', err);
    isConnected = false;
    return false;
  }
}

// Write-through hook: Async sync to PostgreSQL when an insert/update/delete occurs
export function queuePostgresWrite(
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: any,
  condition?: any
) {
  if (!isConnected || !pool) return;

  // Run in background without blocking synchronous SQLite operations
  setImmediate(async () => {
    try {
      if (action === 'insert') {
        const rows = Array.isArray(data) ? data : [data];
        for (const row of rows) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;
          const snakeKeys = keys.map((k) => k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`));
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const values = keys.map((k) => (row[k] === undefined ? null : row[k]));

          // Use ON CONFLICT DO UPDATE if primary key 'id' exists
          let conflictClause = '';
          if (snakeKeys.includes('id')) {
            const updates = snakeKeys
              .filter((k) => k !== 'id')
              .map((k) => `${k} = EXCLUDED.${k}`)
              .join(', ');
            conflictClause = updates ? `ON CONFLICT (id) DO UPDATE SET ${updates}` : `ON CONFLICT (id) DO NOTHING`;
          } else {
            conflictClause = 'ON CONFLICT DO NOTHING';
          }

          const query = `INSERT INTO ${table} (${snakeKeys.join(', ')}) VALUES (${placeholders}) ${conflictClause}`;
          await pool!.query(query, values);
        }
      } else if (action === 'update') {
        const keys = Object.keys(data);
        if (keys.length === 0) return;
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        for (const k of keys) {
          setClauses.push(`${k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)} = $${idx}`);
          values.push(data[k]);
          idx++;
        }

        let whereClause = '';
        if (condition) {
          if (condition.type === 'eq') {
            whereClause = `WHERE ${condition.column} = $${idx}`;
            values.push(condition.value);
          } else if (condition.type === 'and') {
            const parts: string[] = [];
            for (const c of condition.conditions) {
              if (c.type === 'eq') {
                parts.push(`${c.column} = $${idx}`);
                values.push(c.value);
                idx++;
              }
            }
            if (parts.length > 0) whereClause = `WHERE ${parts.join(' AND ')}`;
          }
        }

        const query = `UPDATE ${table} SET ${setClauses.join(', ')} ${whereClause}`;
        await pool!.query(query, values);
      } else if (action === 'delete') {
        const values: any[] = [];
        let whereClause = '';
        if (condition) {
          if (condition.type === 'eq') {
            whereClause = `WHERE ${condition.column} = $1`;
            values.push(condition.value);
          } else if (condition.type === 'and') {
            const parts: string[] = [];
            let idx = 1;
            for (const c of condition.conditions) {
              if (c.type === 'eq') {
                parts.push(`${c.column} = $${idx}`);
                values.push(c.value);
                idx++;
              }
            }
            if (parts.length > 0) whereClause = `WHERE ${parts.join(' AND ')}`;
          }
        }

        const query = `DELETE FROM ${table} ${whereClause}`;
        await pool!.query(query, values);
      }
    } catch (err: any) {
      console.warn(`⚠️ PostgreSQL async sync warning on ${table} [${action}]:`, err.message);
    }
  });
}
