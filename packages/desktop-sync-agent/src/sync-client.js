const axios = require('axios');
const { getLocalDb } = require('./local-db');

class SyncClient {
  constructor(config = {}) {
    this.erpUrl = config.erpUrl || 'http://localhost:4000';
    this.schoolCode = config.schoolCode || 'DPS01';
    this.apiSyncKey = config.apiSyncKey || 'ANVI_SYNC_DPS01_SECRET_KEY_9988';
    this.lastSyncTime = null;
    this.isSyncing = false;
  }

  updateConfig(config) {
    if (config.erpUrl) this.erpUrl = config.erpUrl;
    if (config.schoolCode) this.schoolCode = config.schoolCode;
    if (config.apiSyncKey) this.apiSyncKey = config.apiSyncKey;
  }

  async testConnection() {
    try {
      const resp = await axios.post(`${this.erpUrl}/api/sync/auth`, {
        schoolCode: this.schoolCode,
        apiSyncKey: this.apiSyncKey,
        deviceIdentifier: 'DESKTOP-AGENT-WIN',
      });
      return { success: true, data: resp.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Connection failed',
      };
    }
  }

  async performPullSync() {
    if (this.isSyncing) {
      throw new Error('Sync is already in progress');
    }

    this.isSyncing = true;
    try {
      const resp = await axios.post(`${this.erpUrl}/api/sync/pull`, {
        schoolCode: this.schoolCode,
        apiSyncKey: this.apiSyncKey,
        lastSyncTimestamp: this.lastSyncTime,
        deviceIdentifier: 'DESKTOP-AGENT-WIN',
      });

      const { school, dataset, syncTimestamp, totalRecords } = resp.data;
      const db = getLocalDb();

      // Wrap local transactions with SQLite BEGIN / COMMIT
      db.exec('BEGIN TRANSACTION;');
      try {
        // 1. Update School Info
        if (school) {
          db.prepare(`
            INSERT OR REPLACE INTO local_school (id, name, code, logo_url, address, phone)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(school.id, school.name, school.code, school.logoUrl, school.address, school.phone);
        }

        // 2. Update Students
        if (dataset?.students) {
          const insertStudent = db.prepare(`
            INSERT OR REPLACE INTO local_students (id, admission_no, roll_no, first_name, last_name, class_id, section_id, gender, photo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const s of dataset.students) {
            insertStudent.run(s.id, s.admissionNo, s.rollNo, s.firstName, s.lastName, s.classId, s.sectionId, s.gender, s.photoUrl);
          }
        }

        // 3. Update Attendance
        if (dataset?.attendance) {
          const insertAtt = db.prepare(`
            INSERT OR REPLACE INTO local_attendance (id, student_id, class_id, section_id, date, status, remarks, is_synced_to_cloud)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          `);
          for (const a of dataset.attendance) {
            insertAtt.run(a.id, a.studentId, a.classId, a.sectionId, a.date, a.status, a.remarks);
          }
        }

        // 4. Update Marks
        if (dataset?.marks) {
          const insertMark = db.prepare(`
            INSERT OR REPLACE INTO local_marks (id, exam_id, student_id, subject_id, marks_obtained, max_marks, grade, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const m of dataset.marks) {
            insertMark.run(m.id, m.examId, m.studentId, m.subjectId, m.marksObtained, m.maxMarks, m.grade, m.remarks);
          }
        }

        // 5. Update Fees
        if (dataset?.feePayments) {
          const insertFee = db.prepare(`
            INSERT OR REPLACE INTO local_fees (id, student_id, amount_paid, payment_date, payment_mode, receipt_no, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const f of dataset.feePayments) {
            insertFee.run(f.id, f.studentId, f.amountPaid, f.paymentDate, f.paymentMode, f.receiptNo, f.status);
          }
        }

        // 6. Update Timetable Periods
        if (dataset?.timetable) {
          const insertTt = db.prepare(`
            INSERT OR REPLACE INTO local_timetable (id, class_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, teacher_id, room_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const t of dataset.timetable) {
            insertTt.run(t.id, t.classId, t.sectionId, t.dayOfWeek, t.periodNumber, t.startTime, t.endTime, t.subjectId, t.teacherId, t.roomNumber);
          }
        }

        // 7. Update Student Behavioral / Conduct Logs
        if (dataset?.studentLogs) {
          const insertLog = db.prepare(`
            INSERT OR REPLACE INTO local_student_logs (id, student_id, log_type, title, description, action_taken, reported_by_user_id, date, notify_parent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const l of dataset.studentLogs) {
            insertLog.run(l.id, l.studentId, l.logType, l.title, l.description, l.actionTaken, l.reportedByUserId, l.date, l.notifyParent);
          }
        }

        // Save last sync time
        db.prepare(`
          INSERT OR REPLACE INTO sync_meta (key, value)
          VALUES ('last_sync_timestamp', ?)
        `).run(syncTimestamp);

        db.exec('COMMIT;');
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }

      this.lastSyncTime = syncTimestamp;
      return {
        success: true,
        syncTimestamp,
        totalRecords,
        schoolName: school?.name,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  getLocalStats() {
    const db = getLocalDb();
    const studentsCount = db.prepare('SELECT COUNT(*) as count FROM local_students').get().count;
    const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM local_attendance').get().count;
    const marksCount = db.prepare('SELECT COUNT(*) as count FROM local_marks').get().count;
    const feesCount = db.prepare('SELECT COUNT(*) as count FROM local_fees').get().count;
    const timetableCount = db.prepare('SELECT COUNT(*) as count FROM local_timetable').get().count;
    const studentLogsCount = db.prepare('SELECT COUNT(*) as count FROM local_student_logs').get().count;
    const meta = db.prepare("SELECT value FROM sync_meta WHERE key = 'last_sync_timestamp'").get();
    const school = db.prepare('SELECT * FROM local_school LIMIT 1').get();

    return {
      studentsCount,
      attendanceCount,
      marksCount,
      feesCount,
      timetableCount,
      studentLogsCount,
      lastSyncTimestamp: meta?.value || this.lastSyncTime || 'Never',
      school,
    };
  }
}

module.exports = SyncClient;
