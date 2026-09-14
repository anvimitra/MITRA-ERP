import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

function getBackupFilePath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '..', '..', 'data', 'schools_backup.json');
}

export function saveLocalBackup(sqlite: DatabaseSync) {
  try {
    const backupPath = getBackupFilePath();
    const dir = path.dirname(backupPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const schools = sqlite.prepare('SELECT * FROM schools').all();
    const users = sqlite.prepare("SELECT * FROM users WHERE role IN ('super_admin', 'principal', 'accountant', 'teacher')").all();
    const classes = sqlite.prepare('SELECT * FROM classes').all();
    const sections = sqlite.prepare('SELECT * FROM sections').all();

    const data = {
      timestamp: new Date().toISOString(),
      schools,
      users,
      classes,
      sections,
    };

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Backup save warning:', err);
  }
}

export function restoreLocalBackup(sqlite: DatabaseSync): boolean {
  try {
    const backupPath = getBackupFilePath();
    if (!fs.existsSync(backupPath)) return false;

    const content = fs.readFileSync(backupPath, 'utf-8');
    const data = JSON.parse(content);

    if (Array.isArray(data.schools) && data.schools.length > 0) {
      console.log(`📦 Restoring ${data.schools.length} schools from local JSON backup...`);
      for (const s of data.schools) {
        const keys = Object.keys(s);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => s[k]);
        sqlite.prepare(`INSERT OR REPLACE INTO schools (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      }
    }

    if (Array.isArray(data.users) && data.users.length > 0) {
      for (const u of data.users) {
        const keys = Object.keys(u);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => u[k]);
        sqlite.prepare(`INSERT OR REPLACE INTO users (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      }
    }

    if (Array.isArray(data.classes) && data.classes.length > 0) {
      for (const c of data.classes) {
        const keys = Object.keys(c);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => c[k]);
        sqlite.prepare(`INSERT OR REPLACE INTO classes (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      }
    }

    if (Array.isArray(data.sections) && data.sections.length > 0) {
      for (const sec of data.sections) {
        const keys = Object.keys(sec);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => sec[k]);
        sqlite.prepare(`INSERT OR REPLACE INTO sections (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
      }
    }

    return true;
  } catch (err) {
    console.warn('Backup restore error:', err);
    return false;
  }
}
