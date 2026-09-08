const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { initLocalDatabase, getLocalDb, getStoragePath } = require('./local-db');
const SyncClient = require('./sync-client');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize local SQLite
initLocalDatabase();

// Initialize Sync Client with default config
const syncClient = new SyncClient({
  erpUrl: process.env.ERP_URL || 'http://localhost:4000',
  schoolCode: process.env.SCHOOL_CODE || 'DPS01',
  apiSyncKey: process.env.API_SYNC_KEY || 'ANVI_SYNC_DPS01_SECRET_KEY_9988',
});

// 1. Get Sync Agent Stats
app.get('/api/stats', (req, res) => {
  const stats = syncClient.getLocalStats();
  res.json({
    ...stats,
    storagePath: getStoragePath(),
    erpUrl: syncClient.erpUrl,
    schoolCode: syncClient.schoolCode,
  });
});

// 2. Test ERP connection
app.post('/api/test-connection', async (req, res) => {
  const result = await syncClient.testConnection();
  res.json(result);
});

// 3. Update agent config
app.post('/api/config', (req, res) => {
  syncClient.updateConfig(req.body);
  res.json({ success: true, message: 'Config updated' });
});

// 4. Trigger Sync Pull
app.post('/api/sync/pull', async (req, res) => {
  try {
    const result = await syncClient.performPullSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Browse offline local students
app.get('/api/students', (req, res) => {
  const db = getLocalDb();
  const students = db.prepare('SELECT * FROM local_students ORDER BY roll_no ASC').all();
  res.json({ students });
});

// 6. Export offline JSON backup
app.get('/api/export/backup.json', (req, res) => {
  const db = getLocalDb();
  const school = db.prepare('SELECT * FROM local_school LIMIT 1').get();
  const students = db.prepare('SELECT * FROM local_students').all();
  const attendance = db.prepare('SELECT * FROM local_attendance').all();
  const marks = db.prepare('SELECT * FROM local_marks').all();
  const fees = db.prepare('SELECT * FROM local_fees').all();

  const backupData = {
    exportDate: new Date().toISOString(),
    source: 'ANVIMITRA-ERP Secondary Desktop Database',
    school,
    students,
    attendance,
    marks,
    fees,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="anvimitra_backup.json"');
  res.send(JSON.stringify(backupData, null, 2));
});

// 7. Export offline SQLite file
app.get('/api/export/backup.sqlite', (req, res) => {
  const dbPath = getStoragePath();
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, 'anvimitra_secondary.db');
  } else {
    res.status(404).send('Database file not found yet. Run Sync first.');
  }
});

const PORT = process.env.AGENT_PORT || 5432;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🖥️  ANVIMITRA Secondary PC Sync Agent`);
  console.log(`📂 PC Storage Engine: ${getStoragePath()}`);
  console.log(`🌐 Local Agent Dashboard: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
