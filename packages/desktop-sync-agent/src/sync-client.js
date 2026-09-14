const axios = require('axios');
const {
  getLocalDb,
  saveMasterDataset,
  getMasterDataset,
  getMultiSchoolStats,
  getStoragePath,
  getBackupFilePath,
} = require('./local-db');

class SyncClient {
  constructor(config = {}) {
    this.erpUrl = config.erpUrl || process.env.ERP_URL || 'https://mitra-erp.onrender.com';
    this.masterKey = config.masterKey || process.env.MASTER_SYNC_KEY || 'ANVI_MASTER_PC_CONNECTOR_SYNC_KEY_2026';
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.lastSyncStatus = 'idle';
    this.autoSyncTimer = null;
    this.cloudSchoolsCount = null;
  }

  updateConfig(config) {
    if (config.erpUrl) this.erpUrl = config.erpUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    if (config.masterKey) this.masterKey = config.masterKey;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-master-key': this.masterKey,
    };
  }

  // 1. Check ERP Status & Connectivity
  async testConnection() {
    try {
      const resp = await axios.get(`${this.erpUrl}/api/sync/status`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      this.cloudSchoolsCount = resp.data.schoolsCount;
      return {
        success: true,
        data: resp.data,
        erpUrl: this.erpUrl,
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Connection failed',
        erpUrl: this.erpUrl,
      };
    }
  }

  // 2. Master Pull: Auto-Read ALL schools from Cloud ERP and save to this computer
  async performMasterPull() {
    if (this.isSyncing) return { success: false, error: 'Sync already in progress' };

    this.isSyncing = true;
    this.lastSyncStatus = 'pulling';

    try {
      console.log(`📡 [PC Master Connector] Pulling all schools from Cloud ERP (${this.erpUrl})...`);
      const resp = await axios.post(
        `${this.erpUrl}/api/sync/master-pull`,
        {},
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      const { dataset, schoolsCount, timestamp } = resp.data;
      if (dataset) {
        saveMasterDataset(dataset, true);
      }

      this.lastSyncTime = timestamp || new Date().toISOString();
      this.lastSyncStatus = 'synced';
      this.cloudSchoolsCount = schoolsCount;

      console.log(`✅ [PC Master Connector] Successfully synced ${schoolsCount} schools from Cloud ERP to this PC!`);
      return {
        success: true,
        schoolsCount,
        timestamp: this.lastSyncTime,
      };
    } catch (err) {
      this.lastSyncStatus = 'error';
      console.warn(`⚠️ [PC Master Connector] Master Pull warning:`, err.response?.data?.error || err.message);
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // 3. Master Push: Push ALL schools stored on this PC to Cloud ERP (Disaster Recovery)
  async performMasterPush() {
    if (this.isSyncing) return { success: false, error: 'Sync already in progress' };

    this.isSyncing = true;
    this.lastSyncStatus = 'pushing';

    try {
      const dataset = getMasterDataset();
      const localCount = dataset.schools?.length || 0;
      console.log(`🚀 [PC Master Connector] Pushing ${localCount} schools from this PC to Cloud ERP (${this.erpUrl})...`);

      const resp = await axios.post(
        `${this.erpUrl}/api/sync/master-push`,
        { dataset },
        {
          headers: this.getHeaders(),
          timeout: 60000,
        }
      );

      this.lastSyncTime = new Date().toISOString();
      this.lastSyncStatus = 'restored';
      this.cloudSchoolsCount = resp.data.restored?.schools || localCount;

      console.log(`🌟 [PC Master Connector] Disaster Recovery: Successfully restored ${localCount} schools to Cloud ERP!`);
      return {
        success: true,
        message: resp.data.message,
        restored: resp.data.restored,
      };
    } catch (err) {
      this.lastSyncStatus = 'error';
      console.error(`❌ [PC Master Connector] Push failed:`, err.response?.data?.error || err.message);
      return {
        success: false,
        error: err.response?.data?.error || err.message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // 4. Crash Recovery & Auto-Sync Engine
  async checkCrashAndAutoRecover() {
    try {
      const conn = await this.testConnection();
      if (!conn.success) {
        return;
      }

      const cloudCount = conn.data?.schoolsCount || 0;
      const localStats = getMultiSchoolStats();
      const localCount = localStats.totalSchools || 0;

      // DISASTER RECOVERY CONDITION: Cloud has 0 schools, but local PC has data saved!
      if (cloudCount === 0 && localCount > 0) {
        console.log(`🚨 [DISASTER RECOVERY TRIGGERED] Cloud ERP has 0 schools, but this PC has ${localCount} schools saved!`);
        console.log(`⚡ Auto-Restoring complete database to Cloud ERP now...`);
        await this.performMasterPush();
        return;
      }

      // NORMAL AUTO-READ: If cloud has equal or more schools, pull latest updates
      if (cloudCount > 0) {
        await this.performMasterPull();
      }
    } catch (err) {
      console.warn('[PC Connector Check]', err.message);
    }
  }

  // 5. Start Background Auto-Sync Loop (Default: Every 30 seconds)
  startAutoSyncLoop(intervalMs = 30000) {
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);

    // Run first sync after 3 seconds
    setTimeout(() => {
      this.checkCrashAndAutoRecover();
    }, 3000);

    // Continuous loop
    this.autoSyncTimer = setInterval(() => {
      this.checkCrashAndAutoRecover();
    }, intervalMs);

    console.log(`🔄 [PC Master Connector] Auto-Sync Loop Active (Interval: ${intervalMs / 1000}s) -> ${this.erpUrl}`);
  }

  // 6. Get stats for local dashboard
  getLocalStats() {
    const stats = getMultiSchoolStats();
    return {
      ...stats,
      erpUrl: this.erpUrl,
      lastSyncStatus: this.lastSyncStatus,
      isSyncing: this.isSyncing,
      cloudSchoolsCount: this.cloudSchoolsCount,
      masterKey: this.masterKey,
    };
  }
}

module.exports = SyncClient;

