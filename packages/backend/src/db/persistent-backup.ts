import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

function getPersistentSeedPath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, 'persistent_dataset.json');
}

function getRuntimeBackupPath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '..', '..', 'data', 'schools_backup.json');
}

const TABLE_MAP: { tableName: string; propName: string }[] = [
  { tableName: 'schools', propName: 'schools' },
  { tableName: 'users', propName: 'users' },
  { tableName: 'classes', propName: 'classes' },
  { tableName: 'sections', propName: 'sections' },
  { tableName: 'subjects', propName: 'subjects' },
  { tableName: 'subject_allocations', propName: 'subjectAllocations' },
  { tableName: 'class_teachers', propName: 'classTeachers' },
  { tableName: 'parents', propName: 'parents' },
  { tableName: 'students', propName: 'students' },
  { tableName: 'fee_structures', propName: 'feeStructures' },
  { tableName: 'fee_payments', propName: 'feePayments' },
  { tableName: 'admit_cards', propName: 'admitCards' },
  { tableName: 'certificates', propName: 'certificates' },
  { tableName: 'student_logs', propName: 'studentLogs' },
  { tableName: 'attendance', propName: 'attendance' },
  { tableName: 'exams', propName: 'exams' },
  { tableName: 'marks', propName: 'marks' },
  { tableName: 'timetable', propName: 'timetable' },
  { tableName: 'notices', propName: 'notices' },
];

export function saveLocalBackup(sqlite: DatabaseSync) {
  try {
    const data: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    for (const item of TABLE_MAP) {
      try {
        const rows = sqlite.prepare(`SELECT * FROM ${item.tableName}`).all();
        data[item.propName] = rows;
      } catch (err) {
        data[item.propName] = [];
      }
    }

    const payload = JSON.stringify(data, null, 2);

    // Save to runtime path in data/
    const runtimePath = getRuntimeBackupPath();
    const runDir = path.dirname(runtimePath);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
    fs.writeFileSync(runtimePath, payload, 'utf-8');

    // Also persist into persistent_dataset.json if writable
    const seedPath = getPersistentSeedPath();
    try {
      fs.writeFileSync(seedPath, payload, 'utf-8');
    } catch {
      // Read-only filesystem during some container runs
    }
  } catch (err) {
    console.warn('Backup save warning:', err);
  }
}

export function restoreLocalBackup(sqlite: DatabaseSync): boolean {
  try {
    let chosenPath = '';
    const seedPath = getPersistentSeedPath();
    const runtimePath = getRuntimeBackupPath();

    if (fs.existsSync(seedPath)) {
      chosenPath = seedPath;
    } else if (fs.existsSync(runtimePath)) {
      chosenPath = runtimePath;
    } else {
      return false;
    }

    const content = fs.readFileSync(chosenPath, 'utf-8');
    const data = JSON.parse(content);

    console.log(`📦 Restoring institutional snapshot from ${path.basename(chosenPath)}...`);

    for (const item of TABLE_MAP) {
      const rows = data[item.propName] || data[item.tableName];
      if (Array.isArray(rows) && rows.length > 0) {
        let validCols: Set<string> = new Set();
        try {
          const colInfo = sqlite.prepare(`PRAGMA table_info(${item.tableName})`).all() as any[];
          validCols = new Set(colInfo.map((c) => c.name));
        } catch {}

        for (const row of rows) {
          try {
            const keys = Object.keys(row).filter((k) => validCols.has(k));
            if (keys.length === 0) continue;
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map((k) => row[k]);
            sqlite.prepare(`INSERT OR REPLACE INTO ${item.tableName} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
          } catch (rowErr) {
            // Silently handle column mismatch in legacy backups
          }
        }
        console.log(`  - Restored ${rows.length} records into ${item.tableName}`);
      }
    }

    return true;
  } catch (err) {
    console.warn('Backup restore error:', err);
    return false;
  }
}
