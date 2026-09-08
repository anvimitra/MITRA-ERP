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
