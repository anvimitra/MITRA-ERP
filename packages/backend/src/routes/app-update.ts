import { Hono } from 'hono';

export const appUpdateRoutes = new Hono();

// GET /api/app/version - Mobile app version and auto-update information
appUpdateRoutes.get('/version', (c) => {
  return c.json({
    appName: 'LSK Academy Smart ERP Mobile',
    version: '1.2.0',
    versionCode: 102,
    minSupportedVersion: '1.0.0',
    latestApkUrl: 'https://github.com/anvimitra/MITRA-ERP/releases/latest/download/LSK-Academy-Mobile.apk',
    releaseNotes: 'Enterprise Update: Real-time 9-module synchronization, digital barcode ID card, CBSE marksheet viewer, dual-copy fee receipts, and instant push circulars.',
    publishedAt: new Date().toISOString(),
    isMandatory: false,
    autoUpdateSupported: true,
  });
});
