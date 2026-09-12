function createTable(tableName: string) {
  return new Proxy(
    { _tableName: tableName } as any,
    {
      get(target, prop: string) {
        if (prop in target) return (target as any)[prop];
        return { _colName: prop, _tableName: tableName };
      },
    }
  );
}

export const schools = createTable('schools');
export const users = createTable('users');
export const classes = createTable('classes');
export const sections = createTable('sections');
export const classTeachers = createTable('class_teachers');
export const subjects = createTable('subjects');
export const subjectAllocations = createTable('subject_allocations');
export const parents = createTable('parents');
export const students = createTable('students');
export const attendance = createTable('attendance');
export const exams = createTable('exams');
export const marks = createTable('marks');
export const feeStructures = createTable('fee_structures');
export const feePayments = createTable('fee_payments');
export const notifications = createTable('notifications');
export const smsLogs = createTable('sms_logs');
export const syncLogs = createTable('sync_logs');
export const timetablePeriods = createTable('timetable_periods');
export const studentLogs = createTable('student_logs');
export const certificates = createTable('certificates');
export const frontDeskVisitors = createTable('front_desk_visitors');
export const frontDeskInquiries = createTable('front_desk_inquiries');
export const frontDeskPostalComplaints = createTable('front_desk_postal_complaints');
export const staffLeaves = createTable('staff_leaves');
export const staffPayroll = createTable('staff_payroll');
export const libraryBooks = createTable('library_books');
export const libraryIssues = createTable('library_issues');
export const transportVehicles = createTable('transport_vehicles');
export const transportRoutes = createTable('transport_routes');
export const transportStops = createTable('transport_stops');
export const studentTransport = createTable('student_transport');
export const inventoryItems = createTable('inventory_items');
export const inventoryTransactions = createTable('inventory_transactions');
