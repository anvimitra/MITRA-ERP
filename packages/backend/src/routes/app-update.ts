import { Hono } from 'hono';

export const appUpdateRoutes = new Hono();

interface GitHubReleaseCache {
  appName: string;
  version: string;
  versionCode: number;
  releaseId: string;
  assetId: string | null;
  assetUpdatedAt: string;
  publishedAt: string;
  latestApkUrl: string;
  latestIpaUrl: string;
  releaseNotes: string;
  sizeBytes: number;
  isMandatory: boolean;
  autoUpdateSupported: boolean;
}

let cachedRelease: GitHubReleaseCache | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

async function fetchLatestGitHubRelease(): Promise<GitHubReleaseCache> {
  const now = Date.now();
  if (cachedRelease && now - lastCacheFetchTime < CACHE_TTL_MS) {
    return cachedRelease;
  }

  const fallback: GitHubReleaseCache = {
    appName: 'MITRA-ERP Mobile',
    version: '1.2.1',
    versionCode: 103,
    releaseId: 'latest',
    assetId: 'latest-apk',
    assetUpdatedAt: '2026-09-25T15:07:56Z',
    publishedAt: '2026-09-25T15:07:56Z',
    latestApkUrl: 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk',
    latestIpaUrl: 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP-iOS.ipa',
    releaseNotes: 'Official MITRA-ERP release with latest features, real-time push synchronization and speed improvements.',
    sizeBytes: 4420834,
    isMandatory: false,
    autoUpdateSupported: true,
  };

  // 1. Try GitHub REST API (with optional token if configured)
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'MITRA-ERP-Backend',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch('https://api.github.com/repos/anvimitra/MITRA-ERP/releases/latest', { headers });

    if (res.ok) {
      const data: any = await res.json();
      const apkAsset = Array.isArray(data.assets)
        ? data.assets.find((a: any) => a.name && a.name.endsWith('.apk')) || data.assets[0]
        : null;
      const ipaAsset = Array.isArray(data.assets)
        ? data.assets.find((a: any) => a.name && (a.name.endsWith('.ipa') || a.name.includes('iOS')))
        : null;

      const rawTag = String(data.tag_name || 'latest').replace(/^v/, '');
      const assetUpdate = apkAsset?.updated_at || ipaAsset?.updated_at || data.updated_at || data.published_at || new Date().toISOString();

      cachedRelease = {
        appName: 'MITRA-ERP Mobile',
        version: rawTag !== 'latest' ? rawTag : '1.2.1',
        versionCode: 103,
        releaseId: String(data.id || 'latest'),
        assetId: apkAsset ? String(apkAsset.id) : (ipaAsset ? String(ipaAsset.id) : 'latest-apk'),
        assetUpdatedAt: assetUpdate,
        publishedAt: data.published_at || assetUpdate,
        latestApkUrl: apkAsset?.browser_download_url || 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk',
        latestIpaUrl: ipaAsset?.browser_download_url || 'https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP-iOS.ipa',
        releaseNotes: data.body || 'New features, real-time push synchronization and speed improvements.',
        sizeBytes: apkAsset?.size || ipaAsset?.size || 4420834,
        isMandatory: false,
        autoUpdateSupported: true,
      };
      lastCacheFetchTime = now;
      return cachedRelease;
    }
  } catch (err) {
    console.warn('GitHub Releases API check error, falling back to direct asset HEAD check:', err);
  }

  // 2. Direct HEAD check on latest APK asset (bypasses GitHub API rate limits on cloud IPs like Render)
  try {
    const headRes = await fetch('https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk', {
      method: 'HEAD',
      redirect: 'follow',
    });
    if (headRes.ok) {
      const lastMod = headRes.headers.get('last-modified');
      const length = headRes.headers.get('content-length');
      const etag = headRes.headers.get('etag');
      const remoteTime = lastMod ? new Date(lastMod).toISOString() : fallback.assetUpdatedAt;

      cachedRelease = {
        ...fallback,
        releaseId: etag || 'latest',
        assetUpdatedAt: remoteTime,
        publishedAt: remoteTime,
        sizeBytes: length ? parseInt(length, 10) : fallback.sizeBytes,
      };
      lastCacheFetchTime = now;
      return cachedRelease;
    }
  } catch (headErr) {
    console.warn('Direct APK HEAD check error:', headErr);
  }

  return cachedRelease || fallback;
}

// GET /api/app/version - Mobile app version and auto-update information from GitHub Releases
appUpdateRoutes.get('/version', async (c) => {
  const releaseInfo = await fetchLatestGitHubRelease();
  return c.json(releaseInfo);
});

// GET /api/app/download - Direct APK download redirect (Android)
appUpdateRoutes.get('/download', (c) => {
  return c.redirect('https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk', 302);
});

// GET /api/app/download/android - Direct APK download redirect
appUpdateRoutes.get('/download/android', (c) => {
  return c.redirect('https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP.apk', 302);
});

// GET /api/app/download/ios - Direct iOS IPA package redirect (Apple)
appUpdateRoutes.get('/download/ios', (c) => {
  return c.redirect('https://github.com/anvimitra/MITRA-ERP/releases/download/latest/MITRA-ERP-iOS.ipa', 302);
});
