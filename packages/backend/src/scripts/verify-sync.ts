import { initializeDatabase } from '../db/init.js';
import { initializePostgresSync, getPostgresPool } from '../db/postgres-sync.js';
import { db, schema } from '../db/index.js';

// Auto-load .env
import fs from 'fs';
for (const envFile of ['.env', 'packages/backend/.env', '../backend/.env']) {
  if (fs.existsSync(envFile)) {
    process.loadEnvFile(envFile);
    break;
  }
}

async function verify() {
  console.log('--- Initializing SQLite & PostgreSQL Sync ---');
  const sqlite = initializeDatabase();
  const ok = await initializePostgresSync(sqlite);
  console.log('PostgreSQL Connected & Active:', ok);

  const testCertNo = 'TEST-SYNC-' + Date.now();
  console.log('Inserting test certificate to SQLite:', testCertNo);
  
  db.insert(schema.certificates).values({
    id: 'cert-' + Date.now(),
    schoolId: 'cf73013d-e0dd-4c0d-ab34-0a7ba6a01c17',
    studentId: 'stu-1789378107402-8d42db',
    certificateType: 'BONAFIDE',
    certificateNo: testCertNo,
    issueDate: '2026-09-17',
    academicYear: '2026-2027',
    status: 'ISSUED',
    createdAt: new Date().toISOString()
  }).run();

  // Wait 1.5 seconds for async write-through to finish
  await new Promise((r) => setTimeout(r, 1500));

  const pool = getPostgresPool();
  if (!pool) {
    console.error('Pool not available');
    process.exit(1);
  }

  const res = await pool.query('SELECT certificate_no, student_id, certificate_type FROM certificates WHERE certificate_no = $1', [testCertNo]);
  console.log('Query Result from Cloud PostgreSQL:', res.rows);

  if (res.rows.length > 0 && res.rows[0].certificate_no === testCertNo) {
    console.log('✅ Real-time Write-Through Verified Successfully!');
    // Clean up test certificate from both DBs
    await pool.query('DELETE FROM certificates WHERE certificate_no = $1', [testCertNo]);
    sqlite.prepare('DELETE FROM certificates WHERE certificate_no = ?').run(testCertNo);
    console.log('🧹 Test certificate cleaned up from both databases.');
  } else {
    console.error('❌ Certificate not found in PostgreSQL!');
  }

  await pool.end();
  process.exit(0);
}

verify().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
