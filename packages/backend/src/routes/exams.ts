import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isDesignatedSubjectTeacher } from '../services/rbac.js';
import { calculateGrade, generateStudentReportCard } from '../services/report-card.js';

export const examRoutes = new Hono();

// List all exams for the school
examRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const schoolExams = db
    .select()
    .from(schema.exams)
    .where(eq(schema.exams.schoolId, user.schoolId))
    .all();

  return c.json({ exams: schoolExams });
});

// Create an exam (Principal or Admin)
examRoutes.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can create exams' }, 403);
  }

  const body = await c.req.json();
  const { name, examType, academicYear, startDate, endDate } = body;

  if (!name || !examType) {
    return c.json({ error: 'Exam name and type are required' }, 400);
  }

  const id = crypto.randomUUID();
  db.insert(schema.exams).values({
    id,
    schoolId: user.schoolId,
    name,
    examType, // 'weekly' | 'unit' | 'sa1' | 'sa2' | 'sa3' | 'half_yearly' | 'yearly'
    academicYear: academicYear || '2026-2027',
    startDate,
    endDate,
    isPublished: 0,
  }).run();

  return c.json({ success: true, message: 'Exam created successfully', examId: id });
});

// Mark entry for a subject & class
// STRICT RULE: Only the designated Subject Teacher (or Principal/SuperAdmin) can record marks for that subject!
examRoutes.post('/marks', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { examId, classId, sectionId, subjectId, marksList } = body;
  // marksList: Array<{ studentId: string, marksObtained: number, maxMarks: number, remarks?: string }>

  if (!examId || !classId || !sectionId || !subjectId || !Array.isArray(marksList)) {
    return c.json({ error: 'examId, classId, sectionId, subjectId, and marksList are required' }, 400);
  }

  // Permission check
  if (user.role === 'teacher') {
    const isAllowed = await isDesignatedSubjectTeacher(user.schoolId, user.userId, classId, sectionId, subjectId);
    if (!isAllowed) {
      return c.json({
        error: 'Permission Denied: You are not the assigned Subject Teacher for this Subject in this Class & Section!',
      }, 403);
    }
  } else if (user.role !== 'principal' && user.role !== 'super_admin') {
    return c.json({ error: 'Forbidden: Insufficient role' }, 403);
  }

  const saved: any[] = [];
  for (const item of marksList) {
    const pct = item.maxMarks > 0 ? (item.marksObtained / item.maxMarks) * 100 : 0;
    const gradeInfo = calculateGrade(pct);

    // Check if mark already recorded
    const existing = db
      .select()
      .from(schema.marks)
      .where(
        and(
          eq(schema.marks.schoolId, user.schoolId),
          eq(schema.marks.examId, examId),
          eq(schema.marks.studentId, item.studentId),
          eq(schema.marks.subjectId, subjectId)
        )
      )
      .get();

    if (existing) {
      db.update(schema.marks)
        .set({
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks,
          grade: gradeInfo.grade,
          remarks: item.remarks || gradeInfo.remarks,
          markedByTeacherId: user.userId,
        })
        .where(eq(schema.marks.id, existing.id))
        .run();
    } else {
      const markId = crypto.randomUUID();
      db.insert(schema.marks).values({
        id: markId,
        schoolId: user.schoolId,
        examId,
        studentId: item.studentId,
        classId,
        sectionId,
        subjectId,
        marksObtained: item.marksObtained,
        maxMarks: item.maxMarks,
        grade: gradeInfo.grade,
        remarks: item.remarks || gradeInfo.remarks,
        markedByTeacherId: user.userId,
      }).run();
    }

    saved.push({
      studentId: item.studentId,
      marksObtained: item.marksObtained,
      grade: gradeInfo.grade,
    });
  }

  return c.json({
    success: true,
    message: `Marks recorded successfully for ${marksList.length} students`,
    saved,
  });
});

// Fetch marks for a class, section & subject
examRoutes.get('/marks-sheet', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const examId = c.req.query('examId');
  const classId = c.req.query('classId');
  const sectionId = c.req.query('sectionId');
  const subjectId = c.req.query('subjectId');

  if (!examId || !classId || !sectionId || !subjectId) {
    return c.json({ error: 'examId, classId, sectionId, subjectId required' }, 400);
  }

  // Fetch all students in this class
  const studentList = db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.schoolId, user.schoolId),
        eq(schema.students.classId, classId),
        eq(schema.students.sectionId, sectionId)
      )
    )
    .all();

  const marksList = db
    .select()
    .from(schema.marks)
    .where(
      and(
        eq(schema.marks.schoolId, user.schoolId),
        eq(schema.marks.examId, examId),
        eq(schema.marks.classId, classId),
        eq(schema.marks.sectionId, sectionId),
        eq(schema.marks.subjectId, subjectId)
      )
    )
    .all();

  const markMap = new Map(marksList.map((m) => [m.studentId, m]));

  const merged = studentList.map((s) => {
    const m = markMap.get(s.id);
    return {
      studentId: s.id,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      name: `${s.firstName} ${s.lastName || ''}`.trim(),
      marksObtained: m ? m.marksObtained : '',
      maxMarks: m ? m.maxMarks : 100,
      grade: m ? m.grade : '',
      remarks: m ? m.remarks : '',
    };
  });

  return c.json({ students: merged });
});

// Generate Full Report Card for student & exam
// Returns comprehensive data ready to be displayed in any of the 4 attractive report card templates!
examRoutes.get('/report-card/:studentId/:examId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');
  const examId = c.req.param('examId');

  const reportCard = await generateStudentReportCard(user.schoolId, studentId, examId);
  if (!reportCard) {
    return c.json({ error: 'Report card could not be generated. Missing exam, student, or school data.' }, 404);
  }

  return c.json({ reportCard });
});
