import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Service Account path and Folder ID
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../../service-account.json');
const DEFAULT_FOLDER_ID = '1_227b7nzwSRmhIfWRQP_DhlGwGFFeNvJ';

export function getDriveFolderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
}

export function isGoogleDriveConfigured(): boolean {
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) return true;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) return true;
  return false;
}

export function getDriveClient() {
  const folderId = getDriveFolderId();

  let auth: any;
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const cleanKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: cleanKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  } else {
    throw new Error('Google Service Account credentials not found.');
  }

  const drive = google.drive({ version: 'v3', auth });
  return { drive, folderId };
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
