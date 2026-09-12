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

        // 8. Update Certificates
        if (dataset?.certificates) {
          const insertCert = db.prepare(`
            INSERT OR REPLACE INTO local_certificates (id, student_id, certificate_type, certificate_no, issue_date, academic_year, reason, conduct, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const c of dataset.certificates) {
            insertCert.run(c.id, c.studentId, c.certificateType, c.certificateNo, c.issueDate, c.academicYear, c.reason, c.conduct, c.status);
          }
        }

        // 9. Update Front Desk Visitors
        if (dataset?.visitors) {
          const insertVis = db.prepare(`
            INSERT OR REPLACE INTO local_visitors (id, visitor_name, phone, purpose, whom_to_meet, check_in, check_out, badge_number, status, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const v of dataset.visitors) {
            insertVis.run(v.id, v.visitorName, v.phone, v.purpose, v.whomToMeet, v.checkIn, v.checkOut, v.badgeNumber, v.status, v.date);
          }
        }

        // 10. Update Admission Inquiries
        if (dataset?.inquiries) {
          const insertInq = db.prepare(`
            INSERT OR REPLACE INTO local_inquiries (id, student_name, parent_name, phone, class_seeking, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const i of dataset.inquiries) {
            insertInq.run(i.id, i.studentName, i.parentName, i.phone, i.classSeeking, i.status, i.notes);
          }
        }

        // 11. Update Staff Leaves
        if (dataset?.leaves) {
          const insertLeave = db.prepare(`
            INSERT OR REPLACE INTO local_leaves (id, staff_user_id, leave_type, start_date, end_date, total_days, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const lv of dataset.leaves) {
            insertLeave.run(lv.id, lv.staffUserId, lv.leaveType, lv.startDate, lv.endDate, lv.totalDays, lv.reason, lv.status);
          }
        }

        // 12. Update Staff Payroll
        if (dataset?.payroll) {
          const insertPay = db.prepare(`
            INSERT OR REPLACE INTO local_payroll (id, staff_user_id, month_year, basic_salary, net_salary, payment_status, slip_no)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const p of dataset.payroll) {
            insertPay.run(p.id, p.staffUserId, p.monthYear, p.basicSalary, p.netSalary, p.paymentStatus, p.slipNo);
          }
        }

        // 13. Update Library Books
        if (dataset?.books) {
          const insertBook = db.prepare(`
            INSERT OR REPLACE INTO local_books (id, isbn, title, author, subject, rack_number, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const b of dataset.books) {
            insertBook.run(b.id, b.isbn, b.title, b.author, b.subject, b.rackNumber, b.totalCopies, b.availableCopies);
          }
        }

        // 14. Update Transport Vehicles
        if (dataset?.vehicles) {
          const insertVeh = db.prepare(`
            INSERT OR REPLACE INTO local_vehicles (id, vehicle_no, driver_name, driver_phone, status)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const v of dataset.vehicles) {
            insertVeh.run(v.id, v.vehicleNo, v.driverName, v.driverPhone, v.status);
          }
        }

        // 15. Update Inventory Items
        if (dataset?.inventoryItems) {
          const insertItem = db.prepare(`
            INSERT OR REPLACE INTO local_inventory_items (id, name, category, unit, current_quantity, minimum_alert_quantity)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          for (const itm of dataset.inventoryItems) {
            insertItem.run(itm.id, itm.name, itm.category, itm.unit, itm.currentQuantity, itm.minimumAlertQuantity);
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
    const certificatesCount = db.prepare('SELECT COUNT(*) as count FROM local_certificates').get().count;
    const visitorsCount = db.prepare('SELECT COUNT(*) as count FROM local_visitors').get().count;
    const booksCount = db.prepare('SELECT COUNT(*) as count FROM local_books').get().count;
    const itemsCount = db.prepare('SELECT COUNT(*) as count FROM local_inventory_items').get().count;

    const lastSyncMeta = db.prepare("SELECT value FROM sync_meta WHERE key = 'last_sync_timestamp'").get();

    return {
      studentsCount,
      attendanceCount,
      marksCount,
      feesCount,
      timetableCount,
      studentLogsCount,
      certificatesCount,
      visitorsCount,
      booksCount,
      itemsCount,
      lastSyncTimestamp: lastSyncMeta ? lastSyncMeta.value : 'Never',
    };
  }
}

module.exports = SyncClient;
module.exports.SyncClient = SyncClient;
