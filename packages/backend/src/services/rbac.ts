import { db, schema, eq, and } from '../db/index.js';
import { TokenPayload } from './auth.js';

export async function isDesignatedClassTeacher(
  schoolId: string,
  teacherId: string,
  classId: string,
  sectionId: string
): Promise<boolean> {
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
