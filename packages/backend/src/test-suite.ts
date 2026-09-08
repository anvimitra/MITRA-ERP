import { app } from './app.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 Running ANVIMITRA-ERP Automated Verification Suite...\n');

  // 1. Health Check
  const healthRes = await app.request('/health');
  assert(healthRes.status === 200, 'Cloudflare Health Check endpoint returns 200');

  // 2. Authentication Test
  const loginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@dps.edu', password: 'principal123' }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && !!loginData.token, 'Principal Login returns JWT token');
  const principalToken = loginData.token;

  // Login as Mrs. Sharma (Class Teacher of 10-A & Math)
  const ctLoginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sharma@dps.edu', password: 'teacher123' }),
  });
  const ctData = await ctLoginRes.json();
  const ctToken = ctData.token;

  // Login as Mr. Verma (Science Teacher - NOT Class Teacher of 10-A)
  const scLoginRes = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'verma@dps.edu', password: 'teacher123' }),
  });
  const scData = await scLoginRes.json();
  const scToken = scData.token;

  // 3. Strict RBAC Attendance Enforcement
  console.log('\n--- Testing Attendance RBAC & SMS Fallback ---');
  // Mr. Verma attempts to mark attendance for Class 10-A -> MUST BE FORBIDDEN (403)
  const unauthorizedAttRes = await app.request('/api/attendance/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scToken}`,
    },
    body: JSON.stringify({
      classId: 'class-10',
      sectionId: 'sec-10-a',
      date: '2026-09-06',
      records: [{ studentId: 'stu-rahul-01', status: 'present' }],
    }),
  });
  assert(
    unauthorizedAttRes.status === 403,
    'Non-Class Teacher is STRICTLY FORBIDDEN (403) from marking class attendance'
  );

  // Mrs. Sharma (designated Class Teacher) marks attendance -> MUST SUCCEED (200)
  // Priya Patel is marked ABSENT (Parent has NO app installed -> triggers SMS fallback!)
  // Rahul Sharma is marked PRESENT (Parent has app installed)
  const authorizedAttRes = await app.request('/api/attendance/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ctToken}`,
    },
    body: JSON.stringify({
      classId: 'class-10',
      sectionId: 'sec-10-a',
      date: '2026-09-06',
      records: [
        { studentId: 'stu-rahul-01', status: 'present' },
        { studentId: 'stu-priya-02', status: 'absent', remarks: 'Medical leave' },
      ],
    }),
  });
  const authorizedAttData = await authorizedAttRes.json();
  assert(authorizedAttRes.status === 200, 'Designated Class Teacher successfully marks attendance');

  // Verify Automated SMS Fallback was dispatched for Priya's parent
  const dispatches = authorizedAttData.alertDispatches || [];
  const priyaDispatch = dispatches.find((d: any) => d.studentId === 'stu-priya-02');
  assert(
    priyaDispatch?.dispatchResult?.channel === 'AUTOMATED_SMS_FALLBACK',
    'Automated Text SMS Fallback is triggered for parent without mobile app'
  );

  // 4. Strict RBAC Marks Entry Enforcement
  console.log('\n--- Testing Subject Marks RBAC ---');
  // Mrs. Sharma attempts to mark Science marks (assigned to Mr. Verma) -> MUST BE FORBIDDEN (403)
  const unauthorizedMarksRes = await app.request('/api/exams/marks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ctToken}`,
    },
    body: JSON.stringify({
      examId: 'exam-sa1-term1',
      classId: 'class-10',
      sectionId: 'sec-10-a',
      subjectId: 'sub-sci', // Science is assigned to Mr. Verma!
      marksList: [{ studentId: 'stu-rahul-01', marksObtained: 90, maxMarks: 100 }],
    }),
  });
  assert(
    unauthorizedMarksRes.status === 403,
    'Teacher is STRICTLY FORBIDDEN (403) from recording marks for non-assigned subject'
  );

  // Mr. Verma enters Science marks -> MUST SUCCEED (200)
  const authorizedMarksRes = await app.request('/api/exams/marks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scToken}`,
    },
    body: JSON.stringify({
      examId: 'exam-sa1-term1',
      classId: 'class-10',
      sectionId: 'sec-10-a',
      subjectId: 'sub-sci',
      marksList: [{ studentId: 'stu-rahul-01', marksObtained: 92, maxMarks: 100 }],
    }),
  });
  assert(authorizedMarksRes.status === 200, 'Allocated Subject Teacher records marks successfully');

  // 5. Report Card Engine
  console.log('\n--- Testing Report Card Generation ---');
  const reportCardRes = await app.request('/api/exams/report-card/stu-rahul-01/exam-sa1-term1', {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  const reportCardData = await reportCardRes.json();
  const rc = reportCardData.reportCard;
  assert(
    reportCardRes.status === 200 && rc?.summary?.overallPercentage > 0,
    `Report Card generated with ${rc?.summary?.overallPercentage}% (Grade: ${rc?.summary?.overallGrade})`
  );
  assert(rc?.subjects?.length >= 4, 'Report Card includes all evaluated subjects');

  // 6. Secondary PC Database Sync Endpoint
  console.log('\n--- Testing Secondary Desktop PC Sync Engine ---');
  const syncAuthRes = await app.request('/api/sync/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolCode: 'DPS01',
      apiSyncKey: 'ANVI_SYNC_DPS01_SECRET_KEY_9988',
      deviceIdentifier: 'LOCAL-PC-STORAGE-01',
    }),
  });
  assert(syncAuthRes.status === 200, 'Desktop Agent authenticated with School API Sync Key');

  const syncPullRes = await app.request('/api/sync/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolCode: 'DPS01',
      apiSyncKey: 'ANVI_SYNC_DPS01_SECRET_KEY_9988',
    }),
  });
  const syncPullData = await syncPullRes.json();
  assert(
    syncPullRes.status === 200 && syncPullData.totalRecords > 0,
    `Secondary PC Storage pulled ${syncPullData.totalRecords} records across all school tables`
  );

  console.log(`\n=========================================`);
  console.log(`🏁 Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
