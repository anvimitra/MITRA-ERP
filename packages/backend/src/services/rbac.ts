import { db, schema, eq, and } from '../db/index.js';
import { TokenPayload } from './auth.js';

export async function isDesignatedClassTeacher(
  schoolId: string,
  teacherId: string,
  classId: string,
  sectionId: string
): Promise<boolean> {
  // STRICT RULE: Only the designated Class Teacher for this class & section can mark attendance
  const match = db
    .select()
    .from(schema.classTeachers)
    .where(
      and(
        eq(schema.classTeachers.schoolId, schoolId),
        eq(schema.classTeachers.teacherId, teacherId),
        eq(schema.classTeachers.classId, classId),
        eq(schema.classTeachers.sectionId, sectionId)
      )
    )
    .get();

  return !!match;
}

export async function isDesignatedSubjectTeacher(
  schoolId: string,
  teacherId: string,
  classId: string,
  sectionId: string,
  subjectId: string
): Promise<boolean> {
  const match = db
    .select()
    .from(schema.subjectAllocations)
    .where(
      and(
        eq(schema.subjectAllocations.schoolId, schoolId),
        eq(schema.subjectAllocations.teacherId, teacherId),
        eq(schema.subjectAllocations.classId, classId),
        eq(schema.subjectAllocations.sectionId, sectionId),
        eq(schema.subjectAllocations.subjectId, subjectId)
      )
    )
    .get();

  return !!match;
}

export function hasRole(user: TokenPayload, allowedRoles: string[]): boolean {
  if (user.role === 'super_admin') return true;
  return allowedRoles.includes(user.role);
}

// Strict Parent-Child Multi-Student Resolution
// ONLY returns students that belong to this specific authenticated parent account
export function resolveLinkedStudentsForParent(user: any): any[] {
  if (!user || user.role !== 'parent') return [];

  const uid = user.userId || user.id;
  let dbUser = user;

  // If phone or schoolId not in token payload, fetch from users table
  if ((!user.phone || !user.schoolId) && uid) {
    const fetched = db.select().from(schema.users).where(eq(schema.users.id, uid)).get();
    if (fetched) {
      dbUser = { ...fetched, ...user };
    }
  }

  const schoolId = dbUser.schoolId || user.schoolId;
  if (!schoolId) return [];

  const schoolStudents = db
    .select()
    .from(schema.students)
    .where(eq(schema.students.schoolId, schoolId))
    .all();

  const allParents = db
    .select()
    .from(schema.parents)
    .where(eq(schema.parents.schoolId, schoolId))
    .all();

  const parentMap = new Map(allParents.map((p: any) => [p.id, p]));

  const rawPhone = (dbUser.phone || '').replace(/\D/g, '');
  const uPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '';
  const isUserPhoneValid = uPhone.length === 10 && !/^(\d)\1{9}$/.test(uPhone) && uPhone !== '1234567890';

  const uEmail = (dbUser.email || '').toLowerCase().trim();
  const isUserEmailValid = uEmail && uEmail.length > 5 && !uEmail.endsWith('@parent.school');

  // Match parent records linked to this authenticated parent
  const matchingParentIds = new Set<string>();
  for (const p of allParents) {
    const pUid = p.userId || p.user_id;
    const isUserMatch = !!(pUid && pUid === uid);

    const pPhoneRaw = (p.primaryPhone || p.primary_phone || '').replace(/\D/g, '');
    const pPhone = pPhoneRaw.length >= 10 ? pPhoneRaw.slice(-10) : '';
    const pAltRaw = (p.altPhone || p.alt_phone || '').replace(/\D/g, '');
    const pAlt = pAltRaw.length >= 10 ? pAltRaw.slice(-10) : '';
    const isPhoneMatch = isUserPhoneValid && (pPhone === uPhone || pAlt === uPhone);

    const pEmail = (p.email || '').toLowerCase().trim();
    const isEmailMatch = isUserEmailValid && pEmail === uEmail;

    if (isUserMatch || isPhoneMatch || isEmailMatch) {
      matchingParentIds.add(p.id);
    }
  }

  // Filter students strictly belonging to this parent within this school
  const matched = schoolStudents.filter((s: any) => {
    // 1. Direct parentId match
    if (s.parentId && matchingParentIds.has(s.parentId)) return true;

    // 2. Parent primary phone match via student parent record
    if (s.parentId && isUserPhoneValid) {
      const p: any = parentMap.get(s.parentId);
      if (p) {
        const pPhone = (p.primaryPhone || p.primary_phone || '').replace(/\D/g, '').slice(-10);
        const pAlt = (p.altPhone || p.alt_phone || '').replace(/\D/g, '').slice(-10);
        if (pPhone === uPhone || pAlt === uPhone) return true;
      }
    }

    // 3. Emergency phone or student phone match
    if (isUserPhoneValid) {
      const sEmerg = (s.emergencyPhone || s.emergency_phone || '').replace(/\D/g, '').slice(-10);
      const sPrimary = (s.primaryPhone || s.primary_phone || '').replace(/\D/g, '').slice(-10);
      if (sEmerg === uPhone || sPrimary === uPhone) return true;
    }

    return false;
  });

  const seenIds = new Set<string>();
  const rawStudents: any[] = [];
  for (const s of matched) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      rawStudents.push(s);
    }
  }

  const allClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, schoolId)).all();
  const allSections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, schoolId)).all();
  const classMap = new Map(allClasses.map((c: any) => [c.id, c.name]));
  const sectionMap = new Map(allSections.map((sc: any) => [sc.id, sc.name]));

  return rawStudents.map((s: any) => {
    const p: any = parentMap.get(s.parentId);
    return {
      ...s,
      className: classMap.get(s.classId) || s.classId || 'Class',
      sectionName: sectionMap.get(s.sectionId) || s.sectionId || 'A',
      fatherName: p?.fatherName || '',
      motherName: p?.motherName || '',
      primaryPhone: p?.primaryPhone || '',
    };
  });
}

// Strict Authorization check: checks if a given student record can be accessed by the user
export function isStudentAccessibleByUser(user: any, studentId: string): boolean {
  if (!user || !studentId) return false;

  // Staff and Admin roles have full institutional access
  if (user.role === 'super_admin' || user.role === 'principal' || user.role === 'accountant' || user.role === 'teacher') {
    return true;
  }

  // Student role: can only access their own record
  if (user.role === 'student') {
    const student = db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.schoolId, user.schoolId), eq(schema.students.id, studentId)))
      .get();
    return student?.userId === (user.userId || user.id);
  }

  // Parent role: strictly allowed ONLY for their own children
  if (user.role === 'parent') {
    const linked = resolveLinkedStudentsForParent(user);
    return linked.some((s: any) => s.id === studentId);
  }

  return false;
}

