import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Built-in fallback credentials for mitra-erp-508814 Google Drive Sync
const FALLBACK_CREDENTIALS_B64 = 'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibWl0cmEtZXJwLTUwODgxNCIsCiAgInByaXZhdGVfa2V5X2lkIjogIjhhODJhMjE2ZTYzM2Y4MmQwMzQwZmMyOWI1MDQwMzYxYzJhOGVjYzIiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRREdSdGNKejNnZnpaTEVcblZEWmFqMk84QlBnZGJSZjVvdVp4SG95akk3YmtFbFpocVovbTZQWWNFZ3o3cHpZc0Z1VjY5ZU5CeEJYUEFlQU9cbiszYTRjRW1IeWhDTW5LbjhTelJsREd2cklpVVdJWTQ2RThPMm1wdG9IZUdQN3BRR3ZQZ0JZZkJTUmwvL2pKejNcbmNOZmZ2YUhZUUlKVHdMRXBYdnlsa1hUclJ6TWY4T0VpODJpQWdlTDFnbDlpbkZxZFVCU2owMk9wdUxDbVc5Q1VcbjNBOXJCUDFwR3RTblpZTFVrSFFuOFpzeHJTaFM4U090TDh5dnFXVTdYUTRqVFV2OVhnblRXa1R2MFhSVTI2SWdcbnBVNnZDSnJ4OW1GUGpHYTZKMFlFMTB1RjR3eEt0SHpneW1qQitrd084R0doQnVYaWt1ak5YMkV6ZWU5RFVKRmFcbkk2Vkd1Tk1qQWdNQkFBRUNnZ0VBWUhMaU5LLzZ6NEdZNUs3UU45SXJZakVLbm9uTVVVODRDSXVqUHRKbksxOXVcbkxKaXVJMDFzTm5CaloyREozYjJQaUhZbXczMkdYRW1kdTd2LzNxMGtYNHpmNnY1a1E4a3paZm9hWHVrZm9EblhcbmJSSGpNS2JaZE5hZ08vc0NmNXFaaTFhZ1orMDYwbDBNbCtNSTU1bmZxZ21MUEFGdVRHRWJ4ZEJSVHdlMTYxRk5cbmFxK3NmM1FoMFZQWFVoeS80aGdWZ0FqNFg5cWpEeDFZbWNmelJvWjhCaGlGZ1Z3RmhLL1JmYUgyNEIwQS9FSUJcbmNncUpBL0Q3ZFFTUGlQeXBZaUFZMDNjVk9FdjF0T0hBNU4zNW55bDRPUFVMVjVJNTg0SHkvTUEwUm5FN2wvdGNcblZrTUlpRzY2LzZGNE55WElDYWxQSE9vVnpnYTErM1piL29KdEdDSXRNUUtCZ1FENVRmK0RXVm5mUmpBWUZuUzNcbmRqNVN1cUhNL1lTNEZMbGh3OEtsSkg0S2xybnhLbm9jSWxjamlYOFgwaWJuTVo1d1ZtL1hGZDhLaGFOTDJ3SWZcbnVGM0ovVVN2bHdlSWFlTmVEek9teDNEN1hZbVhyZThDaS9aeFM3SUxRU2FkZG01bGowckdpM0JHUzdGNi8vSERcblREYUxRQjVhdHFFR1lFVVZqVW1MdGNzZ1VRS0JnUURMbWdTZjZVUW1jYTRWUU44dExuOWlzZ2ExTTNiWi9OcmlcblBBRmthTnU4UTRJVHFJY01XYTRGWGpLZTJoeHJTVzBYSFR6SDdNaHhwdnBhamkvd2ZYbEtIMXhvbW5KUjFMVE9cblAxeW5Jdnk1bVMwODZKSEhpRjM3STJac25Eek16aXZTVldiOWtMaDdaUTRtaW54Sk9yUnpjTDY4cWpDZXM4Q0Zcbmk4TjBLYTF6TXdLQmdIWlkzNDN6OGFUN1JjTjVqWWkyR2huZHZRZDU1ZklZN0hRTG9UQVNKYjlURkF2M05TWjdcbjZzL1U2cjlkSk5pbGhtZ2ZzRkh6Y1FFbXRZRkNBejBab1hSTXhibHhRY014T1IwaXJFdGs3QzUzbGVTcVRnYndcbmVGb0tMQWdKc3BJWGNZckd2aUdJZWhEMHg5ankvVXJQdUNqY2xFeE4zQjBSd0ZuZHkyY0dNdG94QW9HQkFLUTdcbkdIL2xLWlBaSHhNRndRQXhBWkFiQ2s0ZnRUOGhOMjVGK05tRnU3bWd1c3dncE03UmlBM01iZ2kwNXplamd0dWlcbk9lVUttcVVTaTk5LzBpdXJDcXMvb01xL3luYzNuS0RCZTN0V1BZVjRpWVVZRkg5ZkFIQVRuZ3I5L0EwNFFTRG9cbndxckdrZ2oyK3ZNYndpVlB0VDlwTW5IODFqc3R3NTMxbnpPVWF0VUJBb0dBR0hIOWVDSmh3MklPSjMzVCsrOHNcbnZFOHAwWXlVNytDeXNFNWdTTWRIckc4cU12eE9VdGFnZ2pNOUliZjFBUFl0RE44VloxOXBBcHVXNDJsNmEzL1FcbmZnRGxzNUVsbE1XM1lZMng4L05VVFlFYlhGUWpjTXgySTkvb1lqeVZ3eEtrKzhrNUNTRVVLYTB6ZkdpNTQ5OXpcbm9DcnZ3dDVyeWNCQnVHa21nNkdWdzNFPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImVycC1kcml2ZS1zeW5jQG1pdHJhLWVycC01MDg4MTQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTE0MDI5NzExNTU4OTEwNzE3ODEzIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9lcnAtZHJpdmUtc3luYyU0MG1pdHJhLWVycC01MDg4MTQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0=';

const DEFAULT_FOLDER_ID = '1_227b7nzwSRmhIfWRQP_DhlGwGFFeNvJ';

export function getDriveFolderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
}

function findServiceAccountPath(): string | null {
  const candidatePaths = [
    path.resolve(__dirname, '../../service-account.json'),
    path.resolve(__dirname, '../../../service-account.json'),
    path.resolve(__dirname, '../service-account.json'),
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'packages/backend/service-account.json'),
    path.resolve(process.cwd(), 'backend/service-account.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function isGoogleDriveConfigured(): boolean {
  if (findServiceAccountPath()) return true;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return true;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) return true;
  if (FALLBACK_CREDENTIALS_B64) return true;
  return false;
}

export function getDriveClient() {
  const folderId = getDriveFolderId();
  let auth: any;

  // 1. Priority 1: GOOGLE_SERVICE_ACCOUNT_JSON environment variable (Raw JSON or Base64)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
      const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const creds = JSON.parse(jsonStr);
      auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      return { drive: google.drive({ version: 'v3', auth }), folderId };
    } catch (e: any) {
      console.warn('[Google Drive] Failed parsing GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  // 2. Priority 2: Discrete email & private key in environment
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const cleanKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: cleanKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return { drive: google.drive({ version: 'v3', auth }), folderId };
  }

  // 3. Priority 3: Local file on disk (service-account.json)
  const filePath = findServiceAccountPath();
  if (filePath) {
    auth = new google.auth.GoogleAuth({
      keyFile: filePath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return { drive: google.drive({ version: 'v3', auth }), folderId };
  }

  // 4. Priority 4: Built-in production fallback (Guarantees zero-downtime cloud backups on Render)
  if (FALLBACK_CREDENTIALS_B64) {
    try {
      const creds = JSON.parse(Buffer.from(FALLBACK_CREDENTIALS_B64, 'base64').toString('utf8'));
      auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      return { drive: google.drive({ version: 'v3', auth }), folderId };
    } catch (err: any) {
      console.warn('[Google Drive] Fallback credentials parsing failed:', err.message);
    }
  }

  throw new Error('Google Service Account credentials not found.');
}

/**
 * Uploads a database snapshot or SQLite file to Google Drive.
 * If creating directly fails due to personal Gmail quota rules,
 * it automatically searches for an existing file in the folder and updates it.
 */
export async function uploadBackupToGoogleDrive(backupData: any, customFileName?: string) {
  const { drive, folderId } = getDriveClient();
  const fileName = customFileName || `anvimitra_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const fileContent = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

  // 1. First check if a file with this name (or an existing backup file) already exists in the folder
  const existingFilesRes = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, createdTime, modifiedTime)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = existingFilesRes.data.files || [];
  const exactMatch = files.find((f: any) => f.name === fileName);
  const targetFile = exactMatch || files.find((f: any) => f.name.includes('anvimitra') || f.name.endsWith('.json'));

  // If a file exists in the folder, update it (uses owner's quota)
  if (targetFile) {
    console.log(`Updating existing Drive file: ${targetFile.name} (${targetFile.id})`);
    const updateRes = await drive.files.update({
      fileId: targetFile.id,
      supportsAllDrives: true,
      requestBody: {
        name: fileName,
      },
      media: {
        mimeType: 'application/json',
        body: fileContent,
      },
      fields: 'id, name, webViewLink, modifiedTime',
    });

    return {
      success: true,
      mode: 'updated_existing',
      fileId: updateRes.data.id,
      fileName: updateRes.data.name,
      viewLink: updateRes.data.webViewLink,
      modifiedTime: updateRes.data.modifiedTime,
    };
  }

  // Otherwise, attempt to create a new file
  try {
    const createRes = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'application/json',
        body: fileContent,
      },
      fields: 'id, name, webViewLink, createdTime',
    });

    return {
      success: true,
      mode: 'created_new',
      fileId: createRes.data.id,
      fileName: createRes.data.name,
      viewLink: createRes.data.webViewLink,
      createdTime: createRes.data.createdTime,
    };
  } catch (err: any) {
    // If personal drive quota blocks creating new files
    if (err.message && (err.message.includes('storage quota') || err.message.includes('quota'))) {
      throw new Error(
        'Google Drive Service Account Quota Notice: Please create a blank file named "anvimitra_backup.json" inside your Google Drive folder. Once created, the system will automatically update it with all ERP database records.'
      );
    }
    throw err;
  }
}

/**
 * List all backup files available in the Google Drive folder
 */
export async function listGoogleDriveBackups() {
  const { drive, folderId } = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, createdTime, modifiedTime, size, webViewLink)',
    orderBy: 'modifiedTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 20,
  });

  return res.data.files || [];
}

/**
 * Download a backup file from Google Drive and return parsed JSON
 */
export async function downloadGoogleDriveBackup(fileId: string): Promise<any> {
  const { drive } = getDriveClient();
  const res = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    { responseType: 'text' }
  );

  const rawData = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  return JSON.parse(rawData);
}
