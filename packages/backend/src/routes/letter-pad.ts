import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const letterPadRoutes = new Hono();

// Helper to get authenticated user
function getAuthUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// GET /api/letter-pad - List all letter pad documents for school
letterPadRoutes.get('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const letters = db
      .select()
      .from(schema.letterPadDocuments)
      .where(eq(schema.letterPadDocuments.schoolId, user.schoolId))
      .orderBy(desc(schema.letterPadDocuments.createdAt))
      .all();

    return c.json({ letters: letters || [] });
  } catch (err: any) {
    console.error('Error fetching letter pad documents:', err);
    return c.json({ error: 'Failed to fetch letter pad documents', details: err?.message }, 500);
  }
});

// GET /api/letter-pad/:id - Get single document
letterPadRoutes.get('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const letter = db
      .select()
      .from(schema.letterPadDocuments)
      .where(
        and(
          eq(schema.letterPadDocuments.id, id),
          eq(schema.letterPadDocuments.schoolId, user.schoolId)
        )
      )
      .get();

    if (!letter) {
      return c.json({ error: 'Letter pad document not found' }, 404);
    }

    return c.json({ letter });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch document', details: err?.message }, 500);
  }
});

// POST /api/letter-pad - Create & Save official letter
letterPadRoutes.post('/', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      refNo,
      docDate,
      recipient,
      subject,
      salutation,
      bodyContent,
      tableData,
      templateId,
      headerMode,
      signatoryName,
      signatoryTitle,
      watermarkEnabled,
      status,
    } = body;

    if (!subject) {
      return c.json({ error: 'Subject is required' }, 400);
    }

    const docId = body.id || `LP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();
    const formattedDate = docDate || nowIso.split('T')[0];

    const newRecord = {
      id: docId,
      schoolId: user.schoolId,
      refNo: refNo || `AMIS/OFFICE/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      docDate: formattedDate,
      recipient: recipient || 'To Whom It May Concern',
      subject,
      salutation: salutation || 'Respected Sir / Madam,',
      bodyContent: bodyContent || '',
      tableData: typeof tableData === 'object' ? JSON.stringify(tableData) : (tableData || ''),
      templateId: templateId || 'classic',
      headerMode: headerMode || 'with_header',
      signatoryName: signatoryName || 'Principal',
      signatoryTitle: signatoryTitle || 'Head of Institution',
      watermarkEnabled: watermarkEnabled !== false ? 1 : 0,
      status: status || 'ISSUED',
      createdBy: user.userId || user.role,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.insert(schema.letterPadDocuments).values(newRecord).run();

    return c.json({ success: true, letter: newRecord }, 201);
  } catch (err: any) {
    console.error('Error creating letter pad document:', err);
    return c.json({ error: 'Failed to save letter document', details: err?.message }, 500);
  }
});

// PUT /api/letter-pad/:id - Update existing letter
letterPadRoutes.put('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const nowIso = new Date().toISOString();

    const existing = db
      .select()
      .from(schema.letterPadDocuments)
      .where(
        and(
          eq(schema.letterPadDocuments.id, id),
          eq(schema.letterPadDocuments.schoolId, user.schoolId)
        )
      )
      .get();

    if (!existing) {
      return c.json({ error: 'Document not found' }, 404);
    }

    const updatedData = {
      refNo: body.refNo !== undefined ? body.refNo : existing.refNo,
      docDate: body.docDate !== undefined ? body.docDate : existing.docDate,
      recipient: body.recipient !== undefined ? body.recipient : existing.recipient,
      subject: body.subject !== undefined ? body.subject : existing.subject,
      salutation: body.salutation !== undefined ? body.salutation : existing.salutation,
      bodyContent: body.bodyContent !== undefined ? body.bodyContent : existing.bodyContent,
      tableData: body.tableData !== undefined ? (typeof body.tableData === 'object' ? JSON.stringify(body.tableData) : body.tableData) : existing.tableData,
      templateId: body.templateId !== undefined ? body.templateId : existing.templateId,
      headerMode: body.headerMode !== undefined ? body.headerMode : existing.headerMode,
      signatoryName: body.signatoryName !== undefined ? body.signatoryName : existing.signatoryName,
      signatoryTitle: body.signatoryTitle !== undefined ? body.signatoryTitle : existing.signatoryTitle,
      watermarkEnabled: body.watermarkEnabled !== undefined ? (body.watermarkEnabled ? 1 : 0) : existing.watermarkEnabled,
      status: body.status !== undefined ? body.status : existing.status,
      updatedAt: nowIso,
    };

    db.update(schema.letterPadDocuments)
      .set(updatedData)
      .where(
        and(
          eq(schema.letterPadDocuments.id, id),
          eq(schema.letterPadDocuments.schoolId, user.schoolId)
        )
      )
      .run();

    return c.json({ success: true, letter: { ...existing, ...updatedData } });
  } catch (err: any) {
    return c.json({ error: 'Failed to update letter document', details: err?.message }, 500);
  }
});

// DELETE /api/letter-pad/:id - Delete letter
letterPadRoutes.delete('/:id', async (c) => {
  const user = getAuthUser(c);
  if (!user || !user.schoolId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  try {
    db.delete(schema.letterPadDocuments)
      .where(
        and(
          eq(schema.letterPadDocuments.id, id),
          eq(schema.letterPadDocuments.schoolId, user.schoolId)
        )
      )
      .run();

    return c.json({ success: true, message: 'Document deleted successfully' });
  } catch (err: any) {
    return c.json({ error: 'Failed to delete letter document', details: err?.message }, 500);
  }
});
