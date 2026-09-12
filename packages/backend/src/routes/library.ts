import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const libraryRoutes = new Hono();

// ==================== BOOKS CATALOG ====================

// List all books
libraryRoutes.get('/books', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const books = db
    .select()
    .from(schema.libraryBooks)
    .where(eq(schema.libraryBooks.schoolId, user.schoolId))
    .all();

  return c.json({ books });
});

// Add new book
libraryRoutes.post('/books', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'teacher' && user.role !== 'accountant') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const { isbn, title, author, publisher, subject, rackNumber, totalCopies, price } = body;

  if (!title || !author) {
    return c.json({ error: 'title and author are required' }, 400);
  }

  const bookId = crypto.randomUUID();
  const total = Number(totalCopies) || 1;
  const now = new Date().toISOString();

  db.insert(schema.libraryBooks).values({
    id: bookId,
    schoolId: user.schoolId,
    isbn: isbn || '',
    title,
    author,
    publisher: publisher || '',
    subject: subject || 'General',
    rackNumber: rackNumber || 'Rack A1',
    totalCopies: total,
    availableCopies: total,
    price: Number(price) || 0,
    createdAt: now,
  }).run();

  return c.json({ success: true, message: 'Book added to catalog', bookId }, 201);
});

// Update book
libraryRoutes.put('/books/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const bookId = c.req.param('id');
  const body = await c.req.json();
  const { title, author, publisher, subject, rackNumber, totalCopies, price } = body;

  const updateFields: any = {};
  if (title !== undefined) updateFields.title = title;
  if (author !== undefined) updateFields.author = author;
  if (publisher !== undefined) updateFields.publisher = publisher;
  if (subject !== undefined) updateFields.subject = subject;
  if (rackNumber !== undefined) updateFields.rackNumber = rackNumber;
  if (price !== undefined) updateFields.price = Number(price);
  if (totalCopies !== undefined) {
    updateFields.totalCopies = Number(totalCopies);
  }

  db.update(schema.libraryBooks)
    .set(updateFields)
    .where(
      and(
        eq(schema.libraryBooks.schoolId, user.schoolId),
        eq(schema.libraryBooks.id, bookId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Book details updated' });
});

// Delete book
libraryRoutes.delete('/books/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const bookId = c.req.param('id');
  db.delete(schema.libraryBooks).where(
    and(
      eq(schema.libraryBooks.schoolId, user.schoolId),
      eq(schema.libraryBooks.id, bookId)
    )
  ).run();

  return c.json({ success: true, message: 'Book deleted from catalog' });
});

// ==================== ISSUE & RETURN ====================

// List issues
libraryRoutes.get('/issues', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const issues = db
    .select()
    .from(schema.libraryIssues)
    .where(eq(schema.libraryIssues.schoolId, user.schoolId))
    .all();

  const books = db
    .select()
    .from(schema.libraryBooks)
    .where(eq(schema.libraryBooks.schoolId, user.schoolId))
    .all();

  const students = db
    .select({ id: schema.students.id, firstName: schema.students.firstName, lastName: schema.students.lastName, admissionNo: schema.students.admissionNo })
    .from(schema.students)
    .where(eq(schema.students.schoolId, user.schoolId))
    .all();

  const staff = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = issues.map((iss: any) => {
    const book = books.find((b: any) => b.id === iss.bookId);
    const student = iss.studentId ? students.find((s: any) => s.id === iss.studentId) : null;
    const staffUser = iss.staffUserId ? staff.find((u: any) => u.id === iss.staffUserId) : null;
    return {
      ...iss,
      bookTitle: book?.title || 'Unknown Book',
      bookAuthor: book?.author || '',
      isbn: book?.isbn || '',
      rackNumber: book?.rackNumber || '',
      borrowerName: student
        ? `${student.firstName} ${student.lastName || ''}`.trim()
        : (staffUser?.name || 'Staff Member'),
      borrowerType: student ? 'Student' : 'Staff',
      admissionNo: student?.admissionNo || '',
    };
  });

  return c.json({ issues: enriched });
});

// Student or Parent personal borrowed books
libraryRoutes.get('/student/:studentId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const studentId = c.req.param('studentId');

  const issues = db
    .select()
    .from(schema.libraryIssues)
    .where(
      and(
        eq(schema.libraryIssues.schoolId, user.schoolId),
        eq(schema.libraryIssues.studentId, studentId)
      )
    )
    .all();

  const books = db
    .select()
    .from(schema.libraryBooks)
    .where(eq(schema.libraryBooks.schoolId, user.schoolId))
    .all();

  const enriched = issues.map((iss: any) => {
    const book = books.find((b: any) => b.id === iss.bookId);
    return {
      ...iss,
      bookTitle: book?.title || 'Unknown Book',
      bookAuthor: book?.author || '',
      isbn: book?.isbn || '',
      rackNumber: book?.rackNumber || '',
    };
  });

  return c.json({ issues: enriched });
});

// Issue book
libraryRoutes.post('/issue-book', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { bookId, studentId, staffUserId, issueDate, dueDate } = body;

  if (!bookId || (!studentId && !staffUserId)) {
    return c.json({ error: 'bookId and either studentId or staffUserId are required' }, 400);
  }

  // Check book availability
  const book = db
    .select()
    .from(schema.libraryBooks)
    .where(
      and(
        eq(schema.libraryBooks.schoolId, user.schoolId),
        eq(schema.libraryBooks.id, bookId)
      )
    )
    .get();

  if (!book) return c.json({ error: 'Book not found' }, 404);
  if (book.availableCopies <= 0) {
    return c.json({ error: 'No copies available for issue at this moment' }, 400);
  }

  const issueId = crypto.randomUUID();
  const now = new Date();
  const issueDateStr = issueDate || now.toISOString().split('T')[0];

  // Default due date: 14 days later
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dueDateStr = dueDate || due.toISOString().split('T')[0];

  // Record issue
  db.insert(schema.libraryIssues).values({
    id: issueId,
    schoolId: user.schoolId,
    bookId,
    studentId: studentId || null,
    staffUserId: staffUserId || null,
    issueDate: issueDateStr,
    dueDate: dueDateStr,
    returnDate: null,
    fineAmount: 0,
    status: 'ISSUED',
    issuedByUserId: user.userId,
  }).run();

  // Deduct available copies
  db.update(schema.libraryBooks)
    .set({
      availableCopies: Math.max(0, book.availableCopies - 1),
    })
    .where(
      and(
        eq(schema.libraryBooks.schoolId, user.schoolId),
        eq(schema.libraryBooks.id, bookId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Book issued successfully', issueId }, 201);
});

// Return book
libraryRoutes.put('/return-book/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const issueId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const returnDateStr = body.returnDate || new Date().toISOString().split('T')[0];
  const fine = Number(body.fineAmount) || 0;

  const issue = db
    .select()
    .from(schema.libraryIssues)
    .where(
      and(
        eq(schema.libraryIssues.schoolId, user.schoolId),
        eq(schema.libraryIssues.id, issueId)
      )
    )
    .get();

  if (!issue) return c.json({ error: 'Issue record not found' }, 404);
  if (issue.status === 'RETURNED') return c.json({ error: 'Book already marked returned' }, 400);

  // Update issue record
  db.update(schema.libraryIssues)
    .set({
      status: 'RETURNED',
      returnDate: returnDateStr,
      fineAmount: fine,
    })
    .where(
      and(
        eq(schema.libraryIssues.schoolId, user.schoolId),
        eq(schema.libraryIssues.id, issueId)
      )
    )
    .run();

  // Increment available copies in libraryBooks
  const book = db
    .select()
    .from(schema.libraryBooks)
    .where(
      and(
        eq(schema.libraryBooks.schoolId, user.schoolId),
        eq(schema.libraryBooks.id, issue.bookId)
      )
    )
    .get();

  if (book) {
    db.update(schema.libraryBooks)
      .set({
        availableCopies: Math.min(book.totalCopies, book.availableCopies + 1),
      })
      .where(
        and(
          eq(schema.libraryBooks.schoolId, user.schoolId),
          eq(schema.libraryBooks.id, book.id)
        )
      )
      .run();
  }

  return c.json({ success: true, message: 'Book returned successfully' });
});
