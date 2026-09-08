import { DatabaseSync } from 'node:sqlite';

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapRowToCamel(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const newObj: any = {};
  for (const key of Object.keys(row)) {
    newObj[toCamelCase(key)] = row[key];
  }
  return newObj;
}

export function eq(column: any, value: any) {
  const colName = typeof column === 'string' ? column : column.name || column._colName;
  return { type: 'eq', column: toSnakeCase(colName), value };
}

export function and(...conditions: any[]) {
  return { type: 'and', conditions: conditions.filter(Boolean) };
}

export function desc(column: any) {
  const colName = typeof column === 'string' ? column : column.name || column._colName;
  return { type: 'desc', column: toSnakeCase(colName) };
}

function buildWhereClause(condition: any): { sql: string; params: any[] } {
  if (!condition) return { sql: '', params: [] };

  if (condition.type === 'eq') {
    return { sql: `WHERE ${condition.column} = ?`, params: [condition.value] };
  }

  if (condition.type === 'and') {
    const parts: string[] = [];
    const params: any[] = [];
    for (const c of condition.conditions) {
      if (c.type === 'eq') {
        parts.push(`${c.column} = ?`);
        params.push(c.value);
      }
    }
    return {
      sql: parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '',
      params,
    };
  }

  return { sql: '', params: [] };
}

export class SQLiteAdapter {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  select(fields?: any) {
    return {
      from: (table: any) => {
        const tableName = typeof table === 'string' ? table : table._tableName;
        let whereCondition: any = null;
        let orderCondition: any = null;

        const chain = {
          where: (cond: any) => {
            whereCondition = cond;
            return chain;
          },
          orderBy: (order: any) => {
            orderCondition = order;
            return chain;
          },
          get: () => {
            const { sql: whereSql, params } = buildWhereClause(whereCondition);
            let orderSql = '';
            if (orderCondition && orderCondition.type === 'desc') {
              orderSql = `ORDER BY ${orderCondition.column} DESC`;
            }
            const query = `SELECT * FROM ${tableName} ${whereSql} ${orderSql} LIMIT 1`;
            const stmt = this.db.prepare(query);
            const row = stmt.get(...params);
            return row ? mapRowToCamel(row) : null;
          },
          all: () => {
            const { sql: whereSql, params } = buildWhereClause(whereCondition);
            let orderSql = '';
            if (orderCondition && orderCondition.type === 'desc') {
              orderSql = `ORDER BY ${orderCondition.column} DESC`;
            }
            const query = `SELECT * FROM ${tableName} ${whereSql} ${orderSql}`;
            const stmt = this.db.prepare(query);
            const rows = stmt.all(...params);
            return rows.map(mapRowToCamel);
          },
        };
        return chain;
      },
    };
  }

  insert(table: any) {
    const tableName = typeof table === 'string' ? table : table._tableName;
    return {
      values: (data: any | any[]) => {
        const rows = Array.isArray(data) ? data : [data];
        let ignoreConflict = false;

        const chain = {
          onConflictDoNothing: () => {
            ignoreConflict = true;
            return chain;
          },
          run: () => {
            for (const row of rows) {
              const keys = Object.keys(row);
              const snakeKeys = keys.map(toSnakeCase);
              const placeholders = keys.map(() => '?').join(', ');
              const values = keys.map((k) => (row[k] === undefined ? null : row[k]));

              const conflictClause = ignoreConflict ? 'OR IGNORE' : '';
              const query = `INSERT ${conflictClause} INTO ${tableName} (${snakeKeys.join(', ')}) VALUES (${placeholders})`;
              const stmt = this.db.prepare(query);
              stmt.run(...values);
            }
          },
        };
        return chain;
      },
    };
  }

  update(table: any) {
    const tableName = typeof table === 'string' ? table : table._tableName;
    return {
      set: (values: any) => {
        return {
          where: (condition: any) => {
            return {
              run: () => {
                const keys = Object.keys(values);
                const setClauses = keys.map((k) => `${toSnakeCase(k)} = ?`).join(', ');
                const setParams = keys.map((k) => values[k]);

                const { sql: whereSql, params: whereParams } = buildWhereClause(condition);
                const query = `UPDATE ${tableName} SET ${setClauses} ${whereSql}`;
                const stmt = this.db.prepare(query);
                stmt.run(...setParams, ...whereParams);
              },
            };
          },
        };
      },
    };
  }

  delete(table: any) {
    const tableName = typeof table === 'string' ? table : table._tableName;
    return {
      where: (condition: any) => {
        return {
          run: () => {
            const { sql: whereSql, params } = buildWhereClause(condition);
            const query = `DELETE FROM ${tableName} ${whereSql}`;
            const stmt = this.db.prepare(query);
            stmt.run(...params);
          },
        };
      },
    };
  }
}
