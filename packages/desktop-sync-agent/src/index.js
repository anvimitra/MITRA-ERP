const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const {
  initLocalDatabase,
  getLocalDb,
  getStoragePath,
  getBackupFilePath,
  saveMasterDataset,
  getMasterDataset,
  getMultiSchoolStats,
} = require('./local-db');
const SyncClient = require('./sync-client');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize local Master Multi-School SQLite
initLocalDatabase();

// Initialize Sync Client with Cloud ERP
const syncClient = new SyncClient({
  erpUrl: process.env.ERP_URL || 'https://mitra-erp.onrender.com',
  masterKey: process.env.MASTER_SYNC_KEY || 'ANVI_MASTER_PC_CONNECTOR_SYNC_KEY_2026',
});

// Start continuous background auto-sync loop (Runs every 30 seconds)
syncClient.startAutoSyncLoop(30000);

// 1. Get Master PC Storage & Sync Stats
app.get('/api/stats', (req, res) => {
  const stats = syncClient.getLocalStats();
  res.json({
    ...stats,
    storagePath: getStoragePath(),
    backupPath: getBackupFilePath(),
    erpUrl: syncClient.erpUrl,
  });
});

// 2. Test ERP connection
app.post('/api/test-connection', async (req, res) => {
  const result = await syncClient.testConnection();
  res.json(result);
});

// 3. Update agent config (e.g. change Cloud ERP URL or master key)
app.post('/api/config', (req, res) => {
  syncClient.updateConfig(req.body);
  res.json({ success: true, message: 'Config updated', erpUrl: syncClient.erpUrl });
});

// 4. Trigger Master Pull (Read ALL schools from Cloud ERP)
app.post('/api/sync/pull-all', async (req, res) => {
  try {
    const result = await syncClient.performMasterPull();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Trigger Master Push (Push/Restore ALL schools from PC to Cloud ERP)
app.post('/api/sync/push-all', async (req, res) => {
  try {
    const result = await syncClient.performMasterPush();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Export Master JSON backup file
app.get('/api/export/backup.json', (req, res) => {
  const backupFile = getBackupFilePath();
  if (fs.existsSync(backupFile)) {
    res.download(backupFile, 'all_schools_backup.json');
  } else {
    const dataset = getMasterDataset();
    const backupData = {
      exportDate: new Date().toISOString(),
      source: 'ANVIMITRA-ERP Master PC Storage Connector',
      computerName: process.env.COMPUTERNAME || 'LocalPC',
      totalSchools: dataset.schools?.length || 0,
      dataset,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="all_schools_backup.json"');
    res.send(JSON.stringify(backupData, null, 2));
  }
});

// 7. Export Master SQLite database file
app.get('/api/export/backup.sqlite', (req, res) => {
  const dbPath = getStoragePath();
  if (fs.existsSync(dbPath)) {
    res.download(dbPath, 'anvimitra_master_local.db');
  } else {
    res.status(404).send('Master database file not found yet.');
  }
});

// 8. Import JSON backup file to PC Storage & optionally push to Cloud
app.post('/api/import/backup.json', async (req, res) => {
  try {
    const { dataset } = req.body;
    if (!dataset) {
      return res.status(400).json({ success: false, error: 'dataset object required' });
    }
    saveMasterDataset(dataset, true);
    // Push immediately to cloud as well
    const pushResult = await syncClient.performMasterPush();
    res.json({ success: true, message: 'Backup imported and synchronized to Cloud ERP', pushResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.AGENT_PORT || 5432;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🖥️  ANVIMITRA-ERP Master PC Storage Connector`);
  console.log(`📂 PC Storage Engine: ${getStoragePath()}`);
  console.log(`🌐 Local Connector Dashboard: http://localhost:${PORT}`);
  console.log(`☁️  Direct Cloud ERP: ${syncClient.erpUrl}`);
  console.log(`=========================================`);
});

