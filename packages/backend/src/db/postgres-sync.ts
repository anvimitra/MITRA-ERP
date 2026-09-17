import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isConnected = false;

// Auto-load environment variables (.env) if present
function tryLoadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'packages/backend/.env'),
    path.resolve(process.cwd(), '../backend/.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        process.loadEnvFile(p);
        break;
      } catch {}
    }
  }
}

const DEFAULT_NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_Vel1NQjCX6Wy@ep-dry-thunder-a7kbb3o6-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require';

export function isPostgresConnected(): boolean {
  return isConnected && pool !== null;
}

export function getPostgresPool(): pg.Pool | null {
  if (pool) return pool;

  tryLoadEnv();
  const dbUrl = process.env.DATABASE_URL || DEFAULT_NEON_DATABASE_URL;
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
    board TEXT DEFAULT 'CBSE',
    services_enabled INTEGER DEFAULT 1,
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
    created_at TEXT NOT NULL,
    vehicle_id TEXT
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
    class_id TEXT,
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
    nic_no TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    admission_date TEXT,
    father_occupation TEXT,
    mother_occupation TEXT,
    previous_school TEXT,
    religion TEXT,
    mother_tongue TEXT,
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
    marked_by_teacher_id TEXT NOT NULL,
    is_published INTEGER DEFAULT 0
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

  CREATE TABLE IF NOT EXISTS admit_cards (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    exam_id TEXT,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    roll_no INTEGER,
    roll_code TEXT,
    exam_title TEXT,
    center_number TEXT,
    center_name TEXT,
    schedule_json TEXT,
    is_published INTEGER DEFAULT 1,
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
    status TEXT DEFAULT 'ACTIVE',
    current_lat REAL,
    current_lng REAL,
    current_speed REAL DEFAULT 0,
    current_heading REAL DEFAULT 0,
    last_location_update TEXT,
    is_trip_active INTEGER DEFAULT 0,
    driver_user_id TEXT
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

  -- Safe column upgrades for existing PostgreSQL databases
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS board TEXT DEFAULT 'CBSE';
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS services_enabled INTEGER DEFAULT 1;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS affiliation_no TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_name TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS pincode TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS established_year TEXT;
  ALTER TABLE schools ADD COLUMN IF NOT EXISTS tagline TEXT;

  ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_id TEXT;

  ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS allergies TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS nic_no TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS pincode TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_date TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS father_occupation TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_occupation TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS religion TEXT;
  ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_tongue TEXT;

  ALTER TABLE subjects ADD COLUMN IF NOT EXISTS class_id TEXT;

  ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_published INTEGER DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS is_published INTEGER DEFAULT 0;

  ALTER TABLE admit_cards ADD COLUMN IF NOT EXISTS schedule_json TEXT;

  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS current_lat REAL;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS current_lng REAL;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS current_speed REAL DEFAULT 0;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS current_heading REAL DEFAULT 0;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS last_location_update TEXT;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS is_trip_active INTEGER DEFAULT 0;
  ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS driver_user_id TEXT;
`;

export const ALL_SYNC_TABLES = [
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
  'sync_logs',
  'timetable_periods',
  'student_logs',
  'certificates',
  'admit_cards',
  'front_desk_visitors',
  'front_desk_inquiries',
  'front_desk_postal_complaints',
  'staff_leaves',
  'staff_payroll',
  'library_books',
  'library_issues',
  'transport_vehicles',
  'transport_routes',
  'transport_stops',
  'student_transport',
  'inventory_items',
  'inventory_transactions',
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

      // 2. Determine initial sync direction (Postgres -> SQLite or SQLite -> Postgres)
      const pgUserCheck = await client.query('SELECT count(*) as count FROM users');
      const pgUserCount = parseInt(pgUserCheck.rows[0]?.count || '0', 10);

      let localUserCount = 0;
      try {
        const localUserRow = sqlite.prepare('SELECT count(*) as count FROM users').get() as { count: number } | undefined;
        localUserCount = localUserRow?.count || 0;
      } catch {}

      if (pgUserCount > 0) {
        // Postgres has existing data: pull from PostgreSQL into SQLite
        console.log(`📥 Found ${pgUserCount} existing users in Cloud PostgreSQL. Syncing down to SQLite cache...`);
        for (const table of ALL_SYNC_TABLES) {
          try {
            const res = await client.query(`SELECT * FROM ${table}`);
            if (res.rows && res.rows.length > 0) {
              console.log(`  ⬇️ Restoring ${res.rows.length} records from PostgreSQL table '${table}' into SQLite...`);
              for (const row of res.rows) {
                const keys = Object.keys(row);
                const placeholders = keys.map(() => '?').join(', ');
                const values = keys.map((k) => row[k]);
                try {
                  sqlite
                    .prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`)
                    .run(...values);
                } catch {
                  // Skip individual record mismatch
                }
              }
            }
          } catch {
            // Skip table if error
          }
        }
        console.log('🌟 Cloud PostgreSQL Synchronization Complete: All tables synchronized to local SQLite cache.');
      } else if (localUserCount > 0) {
        // Postgres is fresh/empty, but local SQLite has existing data: seed PostgreSQL from SQLite!
        console.log(`📤 Fresh PostgreSQL detected. Pushing ${localUserCount} local users & school data to Cloud PostgreSQL...`);
        for (const table of ALL_SYNC_TABLES) {
          try {
            const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
            if (rows && rows.length > 0) {
              console.log(`  ➡️ Uploading ${rows.length} records to PostgreSQL table '${table}'...`);
              for (const row of rows) {
                const keys = Object.keys(row as object);
                if (keys.length === 0) continue;
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const values = keys.map((k) => (row as any)[k]);
                
                let conflictClause = 'ON CONFLICT DO NOTHING';
                if (keys.includes('id')) {
                  conflictClause = 'ON CONFLICT (id) DO NOTHING';
                }

                try {
                  await client.query(
                    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ${conflictClause}`,
                    values
                  );
                } catch (insertErr) {
                  // Skip individual row if issue
                }
              }
            }
          } catch {
            // Table read issue
          }
        }
        console.log('🚀 Initial Push Complete: All existing SQLite school data is now live in PostgreSQL!');
      }

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

const pendingWrites = new Set<Promise<any>>();

export async function flushPostgresWrites(): Promise<void> {
  if (pendingWrites.size === 0) return;
  await Promise.allSettled(Array.from(pendingWrites));
}

// Write-through hook: Async sync to PostgreSQL when an insert/update/delete occurs
export function queuePostgresWrite(
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: any,
  condition?: any
) {
  if (!isConnected || !pool) return;

  // Run in background without blocking synchronous SQLite operations, tracking execution promise
  const writePromise = (async () => {
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
      console.warn(`⚠️ PostgreSQL write-through warning on ${table} [${action}]:`, err.message);
    }
  })();

  pendingWrites.add(writePromise);
  writePromise.finally(() => pendingWrites.delete(writePromise));
}
