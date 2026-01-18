import { cookies } from 'next/headers';
import { query, queryOne, execute, generateId, ORG_COOKIE_NAME, SESSION_COOKIE_NAME } from './db';

// ============================================
// SUPABASE-COMPATIBLE QUERY BUILDER
// ============================================

interface QueryError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
  count?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any;

type OrderOptions = { ascending?: boolean; nullsFirst?: boolean };
type SelectOptions = { count?: 'exact' | 'planned' | 'estimated'; head?: boolean };

class QueryBuilder<T = AnyRecord> {
  private tableName: string;
  private selectColumns: string = '*';
  private countMode: 'exact' | null = null;
  private whereClauses: string[] = [];
  private whereValues: unknown[] = [];
  private paramIndex: number = 1;
  private orderByClause: string = '';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private isSingle: boolean = false;
  private insertData: Record<string, unknown> | null = null;
  private updateData: Record<string, unknown> | null = null;
  private deleteMode: boolean = false;
  private upsertData: Record<string, unknown> | null = null;
  private upsertConflict: string = 'id';
  private returnData: boolean = false;
  private headOnly: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*', options?: SelectOptions): QueryBuilder<T> {
    this.selectColumns = columns;
    if (options?.count === 'exact') {
      this.countMode = 'exact';
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): QueryBuilder<T> {
    this.insertData = Array.isArray(data) ? data[0] : data;
    return this;
  }

  update(data: Record<string, unknown>): QueryBuilder<T> {
    this.updateData = data;
    return this;
  }

  upsert(data: Record<string, unknown>, options?: { onConflict: string }): QueryBuilder<T> {
    this.upsertData = data;
    if (options?.onConflict) {
      this.upsertConflict = options.onConflict;
    }
    return this;
  }

  delete(): QueryBuilder<T> {
    this.deleteMode = true;
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`"${column}" IS NULL`);
    } else {
      this.whereClauses.push(`"${column}" = $${this.paramIndex++}`);
      this.whereValues.push(value);
    }
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`"${column}" IS NOT NULL`);
    } else {
      this.whereClauses.push(`"${column}" != $${this.paramIndex++}`);
      this.whereValues.push(value);
    }
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" > $${this.paramIndex++}`);
    this.whereValues.push(value);
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" >= $${this.paramIndex++}`);
    this.whereValues.push(value);
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" < $${this.paramIndex++}`);
    this.whereValues.push(value);
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" <= $${this.paramIndex++}`);
    this.whereValues.push(value);
    return this;
  }

  like(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" LIKE $${this.paramIndex++}`);
    this.whereValues.push(pattern);
    return this;
  }

  ilike(column: string, pattern: string): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" ILIKE $${this.paramIndex++}`);
    this.whereValues.push(pattern);
    return this;
  }

  is(column: string, value: null | boolean): QueryBuilder<T> {
    if (value === null) {
      this.whereClauses.push(`"${column}" IS NULL`);
    } else {
      this.whereClauses.push(`"${column}" IS ${value}`);
    }
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    if (values.length === 0) {
      this.whereClauses.push('FALSE');
    } else {
      const placeholders = values.map(() => `$${this.paramIndex++}`).join(', ');
      this.whereClauses.push(`"${column}" IN (${placeholders})`);
      this.whereValues.push(...values);
    }
    return this;
  }

  contains(column: string, value: unknown[]): QueryBuilder<T> {
    this.whereClauses.push(`"${column}" @> $${this.paramIndex++}`);
    this.whereValues.push(value);
    return this;
  }

  or(filters: string): QueryBuilder<T> {
    // Parse Supabase OR filter syntax: "field.op.value,field.op.value"
    const conditions = filters.split(',').map(filter => {
      const match = filter.match(/^(\w+)\.(\w+)\.(.+)$/);
      if (!match) return null;
      const [, field, op, value] = match;

      switch (op) {
        case 'eq':
          this.whereValues.push(value);
          return `"${field}" = $${this.paramIndex++}`;
        case 'neq':
          this.whereValues.push(value);
          return `"${field}" != $${this.paramIndex++}`;
        case 'ilike':
          this.whereValues.push(value);
          return `"${field}" ILIKE $${this.paramIndex++}`;
        case 'like':
          this.whereValues.push(value);
          return `"${field}" LIKE $${this.paramIndex++}`;
        case 'gt':
          this.whereValues.push(value);
          return `"${field}" > $${this.paramIndex++}`;
        case 'gte':
          this.whereValues.push(value);
          return `"${field}" >= $${this.paramIndex++}`;
        case 'lt':
          this.whereValues.push(value);
          return `"${field}" < $${this.paramIndex++}`;
        case 'lte':
          this.whereValues.push(value);
          return `"${field}" <= $${this.paramIndex++}`;
        case 'is':
          if (value === 'null') return `"${field}" IS NULL`;
          return `"${field}" IS ${value}`;
        default:
          return null;
      }
    }).filter(Boolean);

    if (conditions.length > 0) {
      this.whereClauses.push(`(${conditions.join(' OR ')})`);
    }
    return this;
  }

  order(column: string, options?: OrderOptions): QueryBuilder<T> {
    const direction = options?.ascending === false ? 'DESC' : 'ASC';
    const nulls = options?.nullsFirst ? 'NULLS FIRST' : 'NULLS LAST';
    this.orderByClause = `ORDER BY "${column}" ${direction} ${nulls}`;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): QueryBuilder<T> {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): QueryBuilder<T> {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  maybeSingle(): QueryBuilder<T> {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  private buildWhereClause(): string {
    return this.whereClauses.length > 0 ? `WHERE ${this.whereClauses.join(' AND ')}` : '';
  }

  async then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      if (onfulfilled) {
        return onfulfilled(result);
      }
      return result as unknown as TResult1;
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      // DELETE operation
      if (this.deleteMode) {
        const sql = `DELETE FROM "${this.tableName}" ${this.buildWhereClause()}`;
        await execute(sql, this.whereValues);
        return { data: null, error: null };
      }

      // INSERT operation
      if (this.insertData) {
        const data = { ...this.insertData, id: this.insertData.id || generateId() };
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map(k => `"${k}"`).join(', ');

        const sql = `INSERT INTO "${this.tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const rows = await query<T>(sql, values);
        return { data: this.isSingle ? rows[0] || null : rows as unknown as T, error: null };
      }

      // UPDATE operation
      if (this.updateData) {
        const keys = Object.keys(this.updateData);
        const values = Object.values(this.updateData);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');

        // Adjust where clause param indices
        const adjustedWhere = this.whereClauses.map(clause => {
          return clause.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + keys.length}`);
        }).join(' AND ');

        const whereClause = adjustedWhere ? `WHERE ${adjustedWhere}` : '';
        const sql = `UPDATE "${this.tableName}" SET ${setClause} ${whereClause} RETURNING *`;
        const rows = await query<T>(sql, [...values, ...this.whereValues]);
        return { data: this.isSingle ? rows[0] || null : rows as unknown as T, error: null };
      }

      // UPSERT operation
      if (this.upsertData) {
        const data = { ...this.upsertData, id: this.upsertData.id || generateId() };
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map(k => `"${k}"`).join(', ');
        const updateSet = keys.filter((k: any) => k !== this.upsertConflict).map((k, i) => `"${k}" = EXCLUDED."${k}"`).join(', ');

        const sql = `INSERT INTO "${this.tableName}" (${columns}) VALUES (${placeholders})
                     ON CONFLICT ("${this.upsertConflict}") DO UPDATE SET ${updateSet} RETURNING *`;
        const rows = await query<T>(sql, values);
        return { data: this.isSingle ? rows[0] || null : rows as unknown as T, error: null };
      }

      // SELECT operation (simplified - relations would need more work)
      let sql = `SELECT * FROM "${this.tableName}" ${this.buildWhereClause()}`;

      if (this.orderByClause) {
        sql += ` ${this.orderByClause}`;
      }

      if (this.limitValue !== null) {
        sql += ` LIMIT ${this.limitValue}`;
      }

      if (this.offsetValue !== null) {
        sql += ` OFFSET ${this.offsetValue}`;
      }

      const rows = await query<T>(sql, this.whereValues);

      let count: number | undefined;
      if (this.countMode === 'exact') {
        const countSql = `SELECT COUNT(*) as count FROM "${this.tableName}" ${this.buildWhereClause()}`;
        const countResult = await query<{ count: string }>(countSql, this.whereValues);
        count = parseInt(countResult[0]?.count || '0');
      }

      if (this.headOnly) {
        return { data: null, error: null, count };
      }

      if (this.isSingle) {
        return { data: rows[0] || null, error: null, count };
      }

      return { data: rows as unknown as T, error: null, count };
    } catch (error) {
      console.error('[QueryBuilder] Error:', error);
      return { data: null, error: error as Error };
    }
  }
}

class SupabaseClient {
  from<T = AnyRecord>(tableName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(tableName);
  }

  rpc(functionName: string, params?: Record<string, unknown>): Promise<QueryResult<unknown>> {
    // RPC calls need to be implemented based on actual functions
    console.warn(`[SupabaseClient] RPC ${functionName} not implemented, params:`, params);
    return Promise.resolve({ data: null, error: null });
  }
}

// Create Supabase-compatible client (backwards compatible)
export function createServerSupabaseClient(): SupabaseClient {
  return new SupabaseClient();
}

// ============================================
// MULTI-TENANCY HELPERS
// ============================================

// Get organization ID from cookies (server-side)
export async function getOrganizationId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        return cookieStore.get(ORG_COOKIE_NAME)?.value || null;
    } catch {
        return null;
    }
}

// Get organization ID from request headers (for API routes)
export function getOrganizationIdFromRequest(request: Request): string | null {
    // Try from cookie header
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`${ORG_COOKIE_NAME}=([^;]+)`));
        if (match) {
            return match[1];
        }
    }

    // Try from custom header (for API clients)
    const orgHeader = request.headers.get('x-organization-id');
    if (orgHeader) {
        return orgHeader;
    }

    return null;
}

// ============================================
// SESSION HELPERS
// ============================================

// Get session token from cookies
export async function getSessionToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
    } catch {
        return null;
    }
}

// Get session token from request
export function getSessionTokenFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
        if (match) {
            return match[1];
        }
    }
    return null;
}

// Validate session and get user/org info
export async function validateSession(token: string): Promise<{
    userId: string;
    organizationId: string | null;
    user: { id: string; email: string; name: string };
    organization: { id: string; name: string; slug: string; plan: string } | null;
} | null> {
    const session = await queryOne<{
        id: string;
        userId: string;
        organizationId: string | null;
        expiresAt: Date;
    }>(
        'SELECT id, "userId", "organizationId", "expiresAt" FROM "Session" WHERE token = $1',
        [token]
    );

    if (!session) {
        return null;
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
        // Delete expired session
        await query('DELETE FROM "Session" WHERE id = $1', [session.id]);
        return null;
    }

    // Get user info
    const user = await queryOne<{ id: string; email: string; name: string }>(
        'SELECT id, email, name FROM "User" WHERE id = $1',
        [session.userId]
    );

    if (!user) {
        return null;
    }

    // Get organization info if set
    let organization = null;
    if (session.organizationId) {
        organization = await queryOne<{ id: string; name: string; slug: string; plan: string }>(
            'SELECT id, name, slug, plan FROM "Organization" WHERE id = $1',
            [session.organizationId]
        );
    }

    return {
        userId: session.userId,
        organizationId: session.organizationId,
        user,
        organization,
    };
}

// ============================================
// ORGANIZATION HELPERS
// ============================================

// Get all organizations for a user
export async function getUserOrganizations(userId: string): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    role: string;
    isDefault: boolean;
}>> {
    const data = await query<{
        role: string;
        isDefault: boolean;
        orgId: string;
        orgName: string;
        orgSlug: string;
        orgPlan: string;
    }>(
        `SELECT uo.role, uo."isDefault", o.id as "orgId", o.name as "orgName", o.slug as "orgSlug", o.plan as "orgPlan"
         FROM "UserOrganization" uo
         JOIN "Organization" o ON uo."organizationId" = o.id
         WHERE uo."userId" = $1`,
        [userId]
    );

    return data.map((item) => ({
        id: item.orgId,
        name: item.orgName,
        slug: item.orgSlug,
        plan: item.orgPlan,
        role: item.role,
        isDefault: item.isDefault,
    }));
}

// Get default organization for a user
export async function getDefaultOrganization(userId: string): Promise<string | null> {
    const data = await queryOne<{ organizationId: string }>(
        'SELECT "organizationId" FROM "UserOrganization" WHERE "userId" = $1 AND "isDefault" = true',
        [userId]
    );

    if (data) {
        return data.organizationId;
    }

    // Fallback to first organization
    const first = await queryOne<{ organizationId: string }>(
        'SELECT "organizationId" FROM "UserOrganization" WHERE "userId" = $1 LIMIT 1',
        [userId]
    );

    return first?.organizationId || null;
}

// ============================================
// RE-EXPORT FOR BACKWARDS COMPATIBILITY
// ============================================

export { query, queryOne, generateId } from './db';
