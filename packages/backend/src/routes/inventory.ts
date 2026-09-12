import { Hono } from 'hono';
import { db, schema, eq, and, desc } from '../db/index.js';
import crypto from 'crypto';
import { verifyToken } from '../services/auth.js';

export const inventoryRoutes = new Hono();

// ==================== ITEMS CATALOG ====================

// List inventory items
inventoryRoutes.get('/items', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const items = db
    .select()
    .from(schema.inventoryItems)
    .where(eq(schema.inventoryItems.schoolId, user.schoolId))
    .all();

  const enriched = items.map((item: any) => ({
    ...item,
    isLowStock: item.currentQuantity <= item.minimumAlertQuantity,
  }));

  return c.json({ items: enriched });
});

// Create inventory item
inventoryRoutes.post('/items', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const { name, category, unit, currentQuantity, minimumAlertQuantity } = body;

  if (!name || !category) {
    return c.json({ error: 'name and category are required' }, 400);
  }

  const itemId = crypto.randomUUID();
  const qty = Number(currentQuantity) || 0;
  const alertQty = Number(minimumAlertQuantity) || 5;

  db.insert(schema.inventoryItems).values({
    id: itemId,
    schoolId: user.schoolId,
    name,
    category,
    unit: unit || 'PCS',
    currentQuantity: qty,
    minimumAlertQuantity: alertQty,
  }).run();

  return c.json({ success: true, message: 'Item added to inventory', itemId }, 201);
});

// Update inventory item
inventoryRoutes.put('/items/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const itemId = c.req.param('id');
  const body = await c.req.json();
  const { name, category, unit, minimumAlertQuantity } = body;

  const updateFields: any = {};
  if (name !== undefined) updateFields.name = name;
  if (category !== undefined) updateFields.category = category;
  if (unit !== undefined) updateFields.unit = unit;
  if (minimumAlertQuantity !== undefined) updateFields.minimumAlertQuantity = Number(minimumAlertQuantity);

  db.update(schema.inventoryItems)
    .set(updateFields)
    .where(
      and(
        eq(schema.inventoryItems.schoolId, user.schoolId),
        eq(schema.inventoryItems.id, itemId)
      )
    )
    .run();

  return c.json({ success: true, message: 'Item details updated' });
});

// ==================== TRANSACTIONS (INWARD & OUTWARD) ====================

// List transactions
inventoryRoutes.get('/transactions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  const transactions = db
    .select()
    .from(schema.inventoryTransactions)
    .where(eq(schema.inventoryTransactions.schoolId, user.schoolId))
    .all();

  const items = db
    .select()
    .from(schema.inventoryItems)
    .where(eq(schema.inventoryItems.schoolId, user.schoolId))
    .all();

  const users = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.schoolId, user.schoolId))
    .all();

  const enriched = transactions.map((t: any) => {
    const item = items.find((i: any) => i.id === t.itemId);
    const u = users.find((usr: any) => usr.id === t.createdByUserId);

    return {
      ...t,
      itemName: item?.name || 'Unknown Item',
      category: item?.category || '',
      unit: item?.unit || 'PCS',
      creatorName: u?.name || 'Staff Member',
    };
  });

  return c.json({ transactions: enriched });
});

// Record Stock Movement (Inward Purchase / Outward Issue)
inventoryRoutes.post('/transactions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);
  const user = verifyToken(authHeader.substring(7));
  if (!user || !user.schoolId) return c.json({ error: 'Unauthorized' }, 401);

  if (user.role !== 'principal' && user.role !== 'super_admin' && user.role !== 'accountant') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = await c.req.json();
  const {
    itemId,
    transactionType,
    quantity,
    unitPrice,
    supplierOrRecipient,
    invoiceOrSlipNo,
    date,
    notes,
  } = body;

  if (!itemId || !transactionType || !quantity || !supplierOrRecipient) {
    return c.json({ error: 'itemId, transactionType, quantity, and supplierOrRecipient are required' }, 400);
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return c.json({ error: 'quantity must be a positive number' }, 400);
  }

  const item = db
    .select()
    .from(schema.inventoryItems)
    .where(
      and(
        eq(schema.inventoryItems.schoolId, user.schoolId),
        eq(schema.inventoryItems.id, itemId)
      )
    )
    .get();

  if (!item) return c.json({ error: 'Inventory item not found' }, 404);

  // If Outward, verify sufficient stock
  if (transactionType === 'OUTWARD' && item.currentQuantity < qty) {
    return c.json({
      error: `Insufficient stock. Current available: ${item.currentQuantity} ${item.unit}`,
    }, 400);
  }

  const txId = crypto.randomUUID();
  const now = new Date().toISOString();
  const dateStr = date || now.split('T')[0];

  // Insert transaction
  db.insert(schema.inventoryTransactions).values({
    id: txId,
    schoolId: user.schoolId,
    itemId,
    transactionType,
    quantity: qty,
    unitPrice: Number(unitPrice) || 0,
    supplierOrRecipient,
    invoiceOrSlipNo: invoiceOrSlipNo || '',
    date: dateStr,
    notes: notes || '',
    createdByUserId: user.userId,
  }).run();

  // Adjust current item stock
  const updatedQty = transactionType === 'INWARD'
    ? item.currentQuantity + qty
    : item.currentQuantity - qty;

  db.update(schema.inventoryItems)
    .set({ currentQuantity: Math.max(0, updatedQty) })
    .where(
      and(
        eq(schema.inventoryItems.schoolId, user.schoolId),
        eq(schema.inventoryItems.id, itemId)
      )
    )
    .run();

  return c.json({
    success: true,
    message: `Stock ${transactionType.toLowerCase()} recorded. New stock level: ${updatedQty} ${item.unit}`,
    transactionId: txId,
    newQuantity: updatedQty,
  }, 201);
});
