import { initializeDatabase } from '../db/init.js';
import { initializePostgresSync, getPostgresPool, ALL_SYNC_TABLES } from '../db/postgres-sync.js';
import fs from 'fs';
import path from 'path';

// Load .env if present
for (const envFile of ['.env', 'packages/backend/.env', '../backend/.env']) {
  try {
    if (fs.existsSync(envFile)) {
      process.loadEnvFile(envFile);
      break;
    }
  } catch {}
}

async function runTest() {
  console.log('====================================================');
  console.log('🐘 ANVIMITRA ERP - Cloud PostgreSQL Verification');
  console.log('====================================================');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ DATABASE_URL environment variable is NOT set!');
    console.log('');
    console.log('💡 How to connect PostgreSQL:');
    console.log('   1. Create a free PostgreSQL database:');
    console.log('      • Neon (https://neon.tech) - Free Serverless PostgreSQL in 30 sec');
    console.log('      • Supabase (https://supabase.com) - Free Hosted PostgreSQL');
    console.log('      • Render (https://render.com) or Aiven (https://aiven.io)');
    console.log('      • Local PostgreSQL: postgresql://postgres:password@localhost:5432/anvimitra_erp');
    console.log('');
    console.log('   2. Set DATABASE_URL in packages/backend/.env:');
    console.log('      DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"');
    console.log('');
    console.log('   3. Run this check again:');
    console.log('      npm --prefix packages/backend run db:test-pg');
    console.log('====================================================');
    process.exit(1);
  }

  // Obfuscate password in URL for secure console display
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔗 Target URL: ${maskedUrl}`);
  console.log('⏳ Connecting to PostgreSQL pool...');

  const pool = getPostgresPool();
  if (!pool) {
    console.error('❌ Could not create PostgreSQL pool. Check URL syntax.');
    process.exit(1);
  }

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully to PostgreSQL server!');
    
    // Check DB version
    const versionRes = await client.query('SELECT version();');
    console.log(`📦 Server: ${versionRes.rows[0].version.split('\n')[0]}`);
    client.release();

    // Initialize local SQLite
    console.log('📂 Checking local SQLite database...');
    const sqlite = initializeDatabase();

    // Trigger sync
    console.log('🔄 Executing PostgreSQL synchronization & schema creation...');
    const success = await initializePostgresSync(sqlite);

    if (success) {
      console.log('====================================================');
      console.log('🎉 SUCCESS! PostgreSQL is 100% active and synchronized!');
      console.log(`📊 All ${ALL_SYNC_TABLES.length} tables verified & live.`);
      console.log('⚡ All future create/update/delete operations will write-through in real time.');
      console.log('====================================================');
    } else {
      console.error('❌ Sync failed during execution.');
    }
  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runTest();
