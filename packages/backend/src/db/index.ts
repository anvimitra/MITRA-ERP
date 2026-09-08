import { getDatabaseInstance } from './init.js';
import { SQLiteAdapter, eq, and, desc } from './sqlite-adapter.js';
import * as schema from './schema.js';

const sqlite = getDatabaseInstance();
export const db = new SQLiteAdapter(sqlite);
export { schema, eq, and, desc };
