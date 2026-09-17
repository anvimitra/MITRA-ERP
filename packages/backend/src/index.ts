import { serve } from '@hono/node-server';
import fs from 'fs';
import path from 'path';
import { app } from './app.js';
import { initializeDatabase } from './db/init.js';
import { initializePostgresSync } from './db/postgres-sync.js';
import { startAutoBackupScheduler } from './services/backup-scheduler.js';

import { flushPostgresWrites } from './db/postgres-sync.js';

// Auto-load .env file if available
for (const envFile of ['.env', 'packages/backend/.env', '../backend/.env']) {
  try {
    if (fs.existsSync(envFile)) {
      process.loadEnvFile(envFile);
      break;
    }
  } catch {}
}

async function startServer() {
  // 1. Initialize SQLite schema
  const sqlite = initializeDatabase();

  // 2. Connect to Cloud PostgreSQL BEFORE listening to requests (prevents race conditions)
  try {
    const connected = await initializePostgresSync(sqlite);
    if (connected) {
      console.log('🟢 Cloud PostgreSQL Active: Zero-Data-Loss Write-Through Synchronization Enabled!');
    } else {
      console.log('ℹ️ Local Master Storage Mode Active');
    }
  } catch (err) {
    console.warn('PostgreSQL sync initialization notice:', err);
  }

  // 3. Start daily auto-backup scheduler for Google Drive
  startAutoBackupScheduler();

  // 4. Graceful shutdown handler: flush all pending PostgreSQL writes
  const gracefulShutdown = async () => {
    console.log('⏳ Flushing pending PostgreSQL writes before shutdown...');
    await flushPostgresWrites();
    process.exit(0);
  };
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  const PORT = Number(process.env.PORT) || 4000;

  console.log(`=========================================`);
  console.log(`🚀 ANVIMITRA-ERP Backend Server`);
  console.log(`🌐 Ready on http://localhost:${PORT}`);
  console.log(`⚡ Zero-Data-Loss Cloud PostgreSQL Architecture`);
  console.log(`=========================================`);

  serve({
    fetch: app.fetch,
    port: PORT,
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});

