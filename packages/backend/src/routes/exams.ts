import { Hono } from 'hono';
import { db, schema, eq, and } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';
import { isDesignatedSubjectTeacher, isStudentAccessibleByUser } from '../services/rbac.js';
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

// Update an exam (Principal or Admin)
examRoutes.put('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can edit exams' }, 403);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, examType, academicYear, startDate, endDate } = body;

  const existing = db
    .select()
    .from(schema.exams)
    .where(and(eq(schema.exams.schoolId, user.schoolId), eq(schema.exams.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Exam not found' }, 404);

  db.update(schema.exams)
    .set({
      name: name !== undefined ? name : existing.name,
      examType: examType !== undefined ? examType : existing.examType,
      academicYear: academicYear !== undefined ? academicYear : existing.academicYear,
      startDate: startDate !== undefined ? startDate : existing.startDate,
      endDate: endDate !== undefined ? endDate : existing.endDate,
    })
    .where(and(eq(schema.exams.schoolId, user.schoolId), eq(schema.exams.id, id)))
    .run();

  return c.json({ success: true, message: 'Exam updated successfully' });
});

// Delete an exam (Principal or Admin)
examRoutes.delete('/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Only Principal or Admin can delete exams' }, 403);
  }

  const id = c.req.param('id');
  const existing = db
    .select()
    .from(schema.exams)
    .where(and(eq(schema.exams.schoolId, user.schoolId), eq(schema.exams.id, id)))
    .get();

  if (!existing) return c.json({ error: 'Exam not found' }, 404);

  // Delete associated marks
  db.delete(schema.marks)
    .where(and(eq(schema.marks.schoolId, user.schoolId), eq(schema.marks.examId, id)))
    .run();

  // Delete associated admit cards
  db.delete(schema.admitCards)
    .where(and(eq(schema.admitCards.schoolId, user.schoolId), eq(schema.admitCards.examId, id)))
    .run();

  // Delete the exam
  db.delete(schema.exams)
    .where(and(eq(schema.exams.schoolId, user.schoolId), eq(schema.exams.id, id)))
    .run();

  return c.json({ success: true, message: `Exam "${existing.name}" removed successfully` });
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

    const now = new Date().toISOString();
    if (existing) {
      db.update(schema.marks)
        .set({
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks,
          grade: gradeInfo.grade,
          remarks: item.remarks || gradeInfo.remarks,
          markedByTeacherId: user.userId,
          updatedAt: now,
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
        isPublished: 0,
        updatedAt: now,
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
      isPublished: m ? !!m.isPublished : false,
    };
  });

  const detectedMaxMarks = marksList.length > 0 && marksList[0].maxMarks ? marksList[0].maxMarks : 100;
  const isSheetPublished = marksList.length > 0 && marksList.every((m) => m.isPublished === 1);
  const gradedCount = marksList.filter((m) => m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '').length;

  return c.json({
    students: merged,
    maxMarks: detectedMaxMarks,
    isPublished: isSheetPublished,
    gradedCount,
    totalStudents: studentList.length,
  });
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

  if (!isStudentAccessibleByUser(user, studentId)) {
    return c.json({ error: 'Forbidden: Access denied to student academic report card' }, 403);
  }

  const reportCard = await generateStudentReportCard(user.schoolId, studentId, examId);
  if (!reportCard) {
    return c.json({ error: 'Report card could not be generated. Missing exam, student, or school data.' }, 404);
  }

  // If requested by parent or student, and result is NOT published:
  if ((user.role === 'parent' || user.role === 'student') && !reportCard.isPublished) {
    return c.json({
      error: 'Academic Evaluation in Progress: Examination results have not been released by the Principal yet.',
      published: false,
    }, 403);
  }

  return c.json({ reportCard });
});

// Publish Results (STRICT: Principal or SuperAdmin only)
examRoutes.post('/publish', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Only Principal or Admin can publish exam results' }, 403);
  }

  const body = await c.req.json();
  const { examId, classId, sectionId, studentId, isPublished } = body;

  if (!examId) {
    return c.json({ error: 'examId is required' }, 400);
  }

  const pubVal = isPublished ? 1 : 0;

  if (studentId) {
    // Student-wise publishing
    db.update(schema.marks)
      .set({ isPublished: pubVal })
      .where(
        and(
          eq(schema.marks.schoolId, user.schoolId),
          eq(schema.marks.examId, examId),
          eq(schema.marks.studentId, studentId)
        )
      )
      .run();
    return c.json({
      success: true,
      message: `Result for student ${isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished: !!isPublished,
    });
  }

  if (classId) {
    // Class-wise publishing
    if (sectionId) {
      db.update(schema.marks)
        .set({ isPublished: pubVal })
        .where(
          and(
            eq(schema.marks.schoolId, user.schoolId),
            eq(schema.marks.examId, examId),
            eq(schema.marks.classId, classId),
            eq(schema.marks.sectionId, sectionId)
          )
        )
        .run();
    } else {
      db.update(schema.marks)
        .set({ isPublished: pubVal })
        .where(
          and(
            eq(schema.marks.schoolId, user.schoolId),
            eq(schema.marks.examId, examId),
            eq(schema.marks.classId, classId)
          )
        )
        .run();
    }
    return c.json({
      success: true,
      message: `Results for class ${isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished: !!isPublished,
    });
  }

  // Whole exam publishing
  db.update(schema.exams)
    .set({ isPublished: pubVal })
    .where(
      and(
        eq(schema.exams.schoolId, user.schoolId),
        eq(schema.exams.id, examId)
      )
    )
    .run();

  db.update(schema.marks)
    .set({ isPublished: pubVal })
    .where(
      and(
        eq(schema.marks.schoolId, user.schoolId),
        eq(schema.marks.examId, examId)
      )
    )
    .run();

  // If published, notify parents in-app
  if (isPublished) {
    try {
      const ex = db.select().from(schema.exams).where(eq(schema.exams.id, examId)).get();
      const exName = ex?.name || 'Annual Examination';
      const notifId = `notif-pub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.insert(schema.notifications).values({
        id: notifId,
        schoolId: user.schoolId,
        userId: 'ALL',
        title: `📢 Official Results Published: ${exName}`,
        message: `Official results and student report cards for ${exName} have been verified and released by the Principal. Parents and students can now view the compiled marksheet in the MITRA-ERP app.`,
        type: 'announcement',
        isRead: 0,
        sentViaApp: 1,
        sentViaSms: 0,
        createdAt: new Date().toISOString(),
      }).run();
    } catch (notifErr) {
      console.warn('Failed to dispatch publish notification:', notifErr);
    }
  }

  return c.json({
    success: true,
    message: `Exam results ${isPublished ? 'published' : 'unpublished'} successfully`,
    isPublished: !!isPublished,
  });
});

// Fetch Exam Marks Submission Status Matrix (Principal & Teachers Audit)
examRoutes.get('/submission-status', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const examId = c.req.query('examId');
  if (!examId) return c.json({ error: 'examId is required' }, 400);

  const exam = db
    .select()
    .from(schema.exams)
    .where(and(eq(schema.exams.schoolId, user.schoolId), eq(schema.exams.id, examId)))
    .get();

  if (!exam) return c.json({ error: 'Exam not found' }, 404);

  // 1. Fetch school classes, sections, subjects, allocations, users, students, and marks for this exam
  const allClasses = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const allSections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const allSubjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();
  const allAllocations = db.select().from(schema.subjectAllocations).where(eq(schema.subjectAllocations.schoolId, user.schoolId)).all();
  const allUsers = db.select().from(schema.users).where(eq(schema.users.schoolId, user.schoolId)).all();
  const allStudents = db.select().from(schema.students).where(eq(schema.students.schoolId, user.schoolId)).all();
  const examMarks = db
    .select()
    .from(schema.marks)
    .where(and(eq(schema.marks.schoolId, user.schoolId), eq(schema.marks.examId, examId)))
    .all();

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

  let totalExpectedSheets = 0;
  let totalSubmittedSheets = 0;
  let totalPendingSheets = 0;
  let totalPartialSheets = 0;

  const classMatrices: any[] = [];

  for (const cls of allClasses) {
    const classSecs = allSections.filter((sec) => sec.classId === cls.id);
    const sectionsToProcess = classSecs.length > 0 ? classSecs : [{ id: 'sec-a', name: 'Section A', classId: cls.id }];

    for (const sec of sectionsToProcess) {
      const classStudents = allStudents.filter(
        (st) => st.classId === cls.id && (sec.id === 'sec-a' || st.sectionId === sec.id)
      );

      // Determine subjects for this class & section:
      const secAllocations = allAllocations.filter(
        (a) => a.classId === cls.id && (a.sectionId === sec.id || !a.sectionId)
      );

      const classSubjects = allSubjects.filter((s) => s.classId === cls.id || !s.classId);
      const effectiveSubjects = classSubjects.length > 0 ? classSubjects : allSubjects;

      // Deduplicate subjects
      const subjectEntries: any[] = [];
      const seenSubIds = new Set<string>();

      // Allocated subjects first
      for (const alloc of secAllocations) {
        if (!seenSubIds.has(alloc.subjectId)) {
          seenSubIds.add(alloc.subjectId);
          const subObj = subjectMap.get(alloc.subjectId);
          const teacher = userMap.get(alloc.teacherId);
          subjectEntries.push({
            subjectId: alloc.subjectId,
            subjectName: subObj ? subObj.name : 'Subject',
            subjectCode: subObj?.code || '',
            teacherId: alloc.teacherId,
            teacherName: teacher ? teacher.name : 'Assigned Teacher',
            teacherEmail: teacher?.email || '',
            teacherPhone: teacher?.phone || '',
          });
        }
      }

      // Remaining class subjects
      for (const sub of effectiveSubjects) {
        if (!seenSubIds.has(sub.id)) {
          seenSubIds.add(sub.id);
          subjectEntries.push({
            subjectId: sub.id,
            subjectName: sub.name,
            subjectCode: sub.code || '',
            teacherId: '',
            teacherName: 'Unassigned',
            teacherEmail: '',
            teacherPhone: '',
          });
        }
      }

      // Default core 5 subjects if no subject registered yet
      if (subjectEntries.length === 0) {
        const fallbacks = [
          { id: 'sub-hindi', name: 'Hindi' },
          { id: 'sub-english', name: 'English' },
          { id: 'sub-maths', name: 'Mathematics' },
          { id: 'sub-science', name: 'Science' },
          { id: 'sub-social', name: 'Social Studies' },
        ];
        for (const fb of fallbacks) {
          subjectEntries.push({
            subjectId: fb.id,
            subjectName: fb.name,
            subjectCode: fb.id.toUpperCase(),
            teacherId: '',
            teacherName: 'Faculty Teacher',
            teacherEmail: '',
            teacherPhone: '',
          });
        }
      }

      // Audit marks for each subject in this section
      const subjectStatuses: any[] = [];
      let classSubmittedCount = 0;
      let classPendingCount = 0;

      for (const sub of subjectEntries) {
        totalExpectedSheets++;
        const marksForSub = examMarks.filter(
          (m) =>
            m.classId === cls.id &&
            (sec.id === 'sec-a' || m.sectionId === sec.id) &&
            (m.subjectId === sub.subjectId || m.subjectId === sub.subjectName)
        );

        const gradedCount = marksForSub.length;
        const totalStu = classStudents.length || 0;
        const isSubmitted = totalStu > 0 ? gradedCount >= totalStu : gradedCount > 0;
        const isPartial = gradedCount > 0 && gradedCount < totalStu;
        const status = isSubmitted ? 'SUBMITTED' : isPartial ? 'PARTIAL' : 'PENDING';

        if (status === 'SUBMITTED') {
          totalSubmittedSheets++;
          classSubmittedCount++;
        } else if (status === 'PARTIAL') {
          totalPartialSheets++;
        } else {
          totalPendingSheets++;
          classPendingCount++;
        }

        let actualTeacherName = sub.teacherName;
        let actualTeacherId = sub.teacherId;
        if (marksForSub.length > 0 && marksForSub[0].markedByTeacherId) {
          const actualTeacher = userMap.get(marksForSub[0].markedByTeacherId);
          if (actualTeacher) {
            actualTeacherName = actualTeacher.name;
            actualTeacherId = actualTeacher.id;
          }
        }

        const avgScore =
          marksForSub.length > 0
            ? Math.round(
                marksForSub.reduce(
                  (sum, m) => sum + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0),
                  0
                ) / marksForSub.length
              )
            : 0;

        const isPublished = marksForSub.length > 0 && marksForSub.every((m) => m.isPublished === 1);
        const lastUpdated = marksForSub.length > 0 ? marksForSub[0].updatedAt || null : null;
        const detectedMaxMarks = marksForSub.length > 0 && marksForSub[0].maxMarks ? marksForSub[0].maxMarks : 100;

        subjectStatuses.push({
          subjectId: sub.subjectId,
          subjectName: sub.subjectName,
          subjectCode: sub.subjectCode,
          teacherId: actualTeacherId,
          teacherName: actualTeacherName,
          teacherEmail: sub.teacherEmail,
          teacherPhone: sub.teacherPhone,
          status,
          gradedCount,
          totalStudents: totalStu,
          maxMarks: detectedMaxMarks,
          averagePercentage: avgScore,
          isPublished,
          lastUpdated,
        });
      }

      const totalClassSubjects = subjectEntries.length;
      const isClassReady = classSubmittedCount >= totalClassSubjects && totalClassSubjects > 0;
      const classMarks = examMarks.filter(
        (m) => m.classId === cls.id && (sec.id === 'sec-a' || m.sectionId === sec.id)
      );
      const isClassPublished = classMarks.length > 0 && classMarks.every((m) => m.isPublished === 1);

      classMatrices.push({
        classId: cls.id,
        className: cls.name,
        sectionId: sec.id,
        sectionName: sec.name,
        classLabel: `${cls.name} - ${sec.name}`,
        totalStudents: classStudents.length,
        totalSubjects: totalClassSubjects,
        submittedSubjects: classSubmittedCount,
        pendingSubjects: classPendingCount,
        completionPercentage:
          totalClassSubjects > 0 ? Math.round((classSubmittedCount / totalClassSubjects) * 100) : 0,
        isClassReady,
        isClassPublished,
        subjects: subjectStatuses,
      });
    }
  }

  const overallCompletionPercentage =
    totalExpectedSheets > 0 ? Math.round((totalSubmittedSheets / totalExpectedSheets) * 100) : 0;

  return c.json({
    exam: {
      id: exam.id,
      name: exam.name,
      examType: exam.examType,
      academicYear: exam.academicYear,
      isPublished: exam.isPublished === 1,
    },
    summary: {
      totalClasses: classMatrices.length,
      totalExpectedSheets,
      totalSubmittedSheets,
      totalPartialSheets,
      totalPendingSheets,
      overallCompletionPercentage,
      readyToPublishClasses: classMatrices.filter((cm) => cm.isClassReady).length,
      publishedClasses: classMatrices.filter((cm) => cm.isClassPublished).length,
      isExamPublished: exam.isPublished === 1,
    },
    classes: classMatrices,
  });
});

// Fetch Teacher Marks Submissions History (Teacher / Principal)
examRoutes.get('/teacher-submissions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  let marksQuery;
  if (user.role === 'teacher') {
    marksQuery = db
      .select()
      .from(schema.marks)
      .where(and(eq(schema.marks.schoolId, user.schoolId), eq(schema.marks.markedByTeacherId, user.userId)))
      .all();
  } else {
    // Principal or Admin: see all
    marksQuery = db
      .select()
      .from(schema.marks)
      .where(eq(schema.marks.schoolId, user.schoolId))
      .all();
  }

  const exams = db.select().from(schema.exams).where(eq(schema.exams.schoolId, user.schoolId)).all();
  const classes = db.select().from(schema.classes).where(eq(schema.classes.schoolId, user.schoolId)).all();
  const sections = db.select().from(schema.sections).where(eq(schema.sections.schoolId, user.schoolId)).all();
  const subjects = db.select().from(schema.subjects).where(eq(schema.subjects.schoolId, user.schoolId)).all();
  const students = db.select().from(schema.students).where(eq(schema.students.schoolId, user.schoolId)).all();

  const examMap = new Map(exams.map((e) => [e.id, e]));
  const classMap = new Map(classes.map((cl) => [cl.id, cl]));
  const secMap = new Map(sections.map((s) => [s.id, s]));
  const subMap = new Map(subjects.map((su) => [su.id, su]));

  // Group marks by key: `${examId}_${classId}_${sectionId}_${subjectId}`
  const groups = new Map<string, any[]>();
  for (const m of marksQuery) {
    const key = `${m.examId}_${m.classId}_${m.sectionId}_${m.subjectId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const submissions: any[] = [];
  for (const [key, groupMarks] of groups.entries()) {
    const first = groupMarks[0];
    const exam = examMap.get(first.examId);
    const cls = classMap.get(first.classId);
    const sec = secMap.get(first.sectionId);
    const sub = subMap.get(first.subjectId);

    const classStudents = students.filter(
      (st) => st.classId === first.classId && (!first.sectionId || st.sectionId === first.sectionId)
    );

    const gradedCount = groupMarks.filter((m) => m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '').length;
    const avg =
      gradedCount > 0
        ? Math.round(
            groupMarks.reduce(
              (sum, m) => sum + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0),
              0
            ) / gradedCount
          )
        : 0;

    submissions.push({
      key,
      examId: first.examId,
      examName: exam ? exam.name : first.examId,
      examType: exam?.examType || 'exam',
      classId: first.classId,
      className: cls ? cls.name : `Class ${first.classId}`,
      sectionId: first.sectionId || 'sec-a',
      sectionName: sec ? sec.name : 'A',
      subjectId: first.subjectId,
      subjectName: sub ? sub.name : first.subjectId,
      maxMarks: first.maxMarks || 100,
      gradedCount,
      totalStudents: classStudents.length || gradedCount,
      averagePercentage: avg,
      isPublished: groupMarks.every((m) => m.isPublished === 1),
      updatedAt: first.updatedAt || new Date().toISOString(),
    });
  }

  // Sort latest updated first
  submissions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return c.json({ submissions });
});

// Send reminder to teacher for pending exam marks (Principal only)
examRoutes.post('/send-reminder', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId || (user.role !== 'principal' && user.role !== 'super_admin')) {
    return c.json({ error: 'Forbidden: Only Principal or Admin can send marks reminders' }, 403);
  }

  const body = await c.req.json();
  const { teacherId, subjectName, className, examName } = body;

  if (!teacherId || !subjectName) {
    return c.json({ error: 'teacherId and subjectName are required' }, 400);
  }

  const notifId = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  db.insert(schema.notifications).values({
    id: notifId,
    schoolId: user.schoolId,
    userId: teacherId,
    title: `⚠️ Action Required: Submit ${examName || 'Exam'} Marks`,
    message: `Respected Teacher, please record and submit the examination marks for ${subjectName} (${className || 'Assigned Class'}) promptly so results can be verified and published by the Principal.`,
    type: 'announcement',
    isRead: 0,
    sentViaApp: 1,
    sentViaSms: 0,
    createdAt: new Date().toISOString(),
  }).run();

  return c.json({
    success: true,
    message: `Reminder sent to teacher successfully!`,
  });
});
