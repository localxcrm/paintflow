import { Pool, PoolClient } from 'pg';

// ============================================
// POSTGRESQL CONNECTION POOL
// ============================================

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });
  }

  return pool;
}

// ============================================
// QUERY HELPERS
// ============================================

export interface QueryOptions {
  values?: unknown[];
}

export async function query<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, values);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] || null;
}

export async function execute(
  text: string,
  values?: unknown[]
): Promise<{ rowCount: number }> {
  const pool = getPool();
  const result = await pool.query(text, values);
  return { rowCount: result.rowCount || 0 };
}

// ============================================
// TRANSACTION SUPPORT
// ============================================

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// ORGANIZATION-SCOPED QUERIES
// ============================================

export async function queryByOrg<T = Record<string, unknown>>(
  table: string,
  organizationId: string,
  options: {
    select?: string;
    where?: string;
    whereValues?: unknown[];
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<T[]> {
  const {
    select = '*',
    where,
    whereValues = [],
    orderBy,
    limit,
    offset,
  } = options;

  let sql = `SELECT ${select} FROM "${table}" WHERE "organizationId" = $1`;
  const values: unknown[] = [organizationId];
  let paramIndex = 2;

  if (where) {
    // Replace $1, $2, etc. in where clause with correct param numbers
    const adjustedWhere = where.replace(/\$(\d+)/g, () => {
      return `$${paramIndex++}`;
    });
    sql += ` AND ${adjustedWhere}`;
    values.push(...whereValues);
  }

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  if (limit !== undefined) {
    sql += ` LIMIT $${paramIndex++}`;
    values.push(limit);
  }

  if (offset !== undefined) {
    sql += ` OFFSET $${paramIndex++}`;
    values.push(offset);
  }

  return query<T>(sql, values);
}

export async function queryOneByOrg<T = Record<string, unknown>>(
  table: string,
  organizationId: string,
  id: string
): Promise<T | null> {
  const sql = `SELECT * FROM "${table}" WHERE "organizationId" = $1 AND "id" = $2`;
  return queryOne<T>(sql, [organizationId, id]);
}

export async function insertByOrg<T = Record<string, unknown>>(
  table: string,
  organizationId: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const dataWithOrg = { ...data, organizationId };
  const keys = Object.keys(dataWithOrg);
  const values = Object.values(dataWithOrg);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.map(k => `"${k}"`).join(', ');

  const sql = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  return queryOne<T>(sql, values);
}

export async function updateByOrg<T = Record<string, unknown>>(
  table: string,
  organizationId: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');

  const sql = `UPDATE "${table}" SET ${setClause} WHERE "organizationId" = $${keys.length + 1} AND "id" = $${keys.length + 2} RETURNING *`;
  return queryOne<T>(sql, [...values, organizationId, id]);
}

export async function deleteByOrg(
  table: string,
  organizationId: string,
  id: string
): Promise<boolean> {
  const sql = `DELETE FROM "${table}" WHERE "organizationId" = $1 AND "id" = $2`;
  const result = await execute(sql, [organizationId, id]);
  return result.rowCount > 0;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateId(): string {
  return crypto.randomUUID();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================
// COOKIE HELPERS (moved from supabase.ts)
// ============================================

export const ORG_COOKIE_NAME = 'paintpro_org_id';
export const SESSION_COOKIE_NAME = 'paintpro_session';

// ============================================
// PLAN LIMITS (moved from supabase.ts)
// ============================================

export const PLAN_LIMITS = {
  free: {
    users: 1,
    jobsPerMonth: 10,
    storage: '100MB',
    features: ['jobs', 'estimates', 'leads'],
  },
  starter: {
    users: 3,
    jobsPerMonth: 50,
    storage: '1GB',
    features: ['jobs', 'estimates', 'leads', 'calendar', 'map', 'reports'],
  },
  pro: {
    users: 10,
    jobsPerMonth: -1, // unlimited
    storage: '10GB',
    features: ['all'],
  },
  enterprise: {
    users: -1, // unlimited
    jobsPerMonth: -1,
    storage: 'unlimited',
    features: ['all', 'api', 'whitelabel', 'dedicated-support'],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
