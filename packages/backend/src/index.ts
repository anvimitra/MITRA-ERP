import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initializeDatabase } from './db/init.js';
import { initializePostgresSync } from './db/postgres-sync.js';
import { startAutoBackupScheduler } from './services/backup-scheduler.js';

// Initialize SQLite schema & persistent backup restore
const sqlite = initializeDatabase();

// Start daily 10:00 PM auto-backup scheduler for Google Drive
startAutoBackupScheduler();

// Connect to persistent PostgreSQL if DATABASE_URL is configured
initializePostgresSync(sqlite).then((connected) => {
  if (connected) {
    console.log('🟢 Cloud PostgreSQL Active: Zero-Data-Loss Write-Through Synchronization Enabled!');
  } else {
    console.log('ℹ️ Local PC Master Storage Mode: PC Connector Sync Active');
  }
}).catch((err) => {
  console.warn('PostgreSQL sync initialization notice:', err);
});

const PORT = Number(process.env.PORT) || 4000;

console.log(`=========================================`);
console.log(`🚀 ANVIMITRA-ERP Backend Server`);
console.log(`🌐 Ready on http://localhost:${PORT}`);
console.log(`⚡ Cloudflare & PC Master Storage Multi-Tenant Architecture`);
console.log(`=========================================`);

serve({
  fetch: app.fetch,
  port: PORT,
});

