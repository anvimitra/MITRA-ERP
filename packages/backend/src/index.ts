import { serve } from '@hono/node-server';
import { app } from './app.js';
import { initializeDatabase } from './db/init.js';

// Initialize SQLite schema
initializeDatabase();

const PORT = Number(process.env.PORT) || 4000;

console.log(`=========================================`);
console.log(`🚀 ANVIMITRA-ERP Backend Server`);
console.log(`🌐 Ready on http://localhost:${PORT}`);
console.log(`⚡ Cloudflare-Ready Multi-Tenant Architecture`);
console.log(`=========================================`);

serve({
  fetch: app.fetch,
  port: PORT,
});
