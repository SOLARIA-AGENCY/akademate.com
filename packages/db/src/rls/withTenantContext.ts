/**
 * AKADEMATE.COM - Tenant Context Wrapper for RLS
 *
 * Blueprint Reference: Section 4.3 - Contexto por request en Postgres
 *
 * This module provides a transaction wrapper that establishes the tenant context
 * using PostgreSQL set_config() with LOCAL scope. This ensures RLS policies
 * can access the current tenant_id within the transaction.
 *
 * INVARIANT: All database operations on tenant-scoped tables MUST use this wrapper.
 * Accessing the database outside of this wrapper is a SECURITY BUG.
 *
 * NOTE: Schema uses INTEGER PKs (Payload pattern), not UUIDs.
 */

import { sql } from 'drizzle-orm'
import type { TablesRelationalConfig } from 'drizzle-orm/relations'
import type { PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

/**
 * Database schema type for transactions
 */
type DatabaseSchema = Record<string, unknown>

/**
 * Tables relational config type
 */
type DatabaseTablesConfig = TablesRelationalConfig

/**
 * Generic Postgres transaction type with proper schema typing
 */
type DatabaseTransaction = PgTransaction<
  PgQueryResultHKT,
  DatabaseSchema,
  DatabaseTablesConfig
>

/**
 * Result row from set_config query
 */
interface TenantIdRow {
  tenant_id: string | null
}

/**
 * Query result format - handles both postgres-js array format and standard rows format
 */
interface QueryResult {
  rows?: TenantIdRow[]
}

/**
 * Tenant context for RLS enforcement
 */
export interface TenantContext {
  /** ID of the current tenant (integer as string for set_config compatibility) */
  tenantId: string | number
  /** ID of the current user (optional, for audit) */
  userId?: string | number
  /** ID of the current site/sede (optional, for multi-sede) */
  siteId?: string | number
  /** Role key (optional, for permission checks) */
  role?: string
}

/**
 * Result of a tenant-scoped operation
 */
export type TenantScopedResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: Error
}

/**
 * Validate tenant ID format (accepts positive integers or integer strings)
 */
function isValidTenantId(value: string | number): boolean {
  const numValue = typeof value === 'number' ? value : parseInt(value, 10)
  return !isNaN(numValue) && numValue > 0 && Number.isInteger(numValue)
}

/**
 * Execute a database operation within a tenant context transaction.
 *
 * This function:
 * 1. Opens a transaction
 * 2. Sets app.tenant_id (and optionally app.user_id, app.site_id, app.role) using set_config LOCAL
 * 3. Executes the provided callback
 * 4. Commits or rolls back the transaction
 *
 * The LOCAL parameter to set_config ensures the setting is automatically reverted
 * at the end of the transaction, preventing context leakage in connection pooling.
 *
 * @example
 * ```typescript
 * const result = await withTenantContext(db, { tenantId: 1 }, async (tx) => {
 *   // All queries here are automatically filtered by tenant_id via RLS
 *   return await tx.select().from(courses)
 * })
 * ```
 *
 * @param db - Drizzle database instance
 * @param context - Tenant context (tenantId required, userId/siteId/role optional)
 * @param callback - Async function to execute within the tenant context
 * @returns The result of the callback wrapped in TenantScopedResult
 */
export async function withTenantContext<T>(
  db: PostgresJsDatabase,
  context: TenantContext,
  callback: (tx: DatabaseTransaction) => Promise<T>
): Promise<TenantScopedResult<T>> {
  const { tenantId, userId, siteId, role } = context

  // Validate tenant ID format (positive integer)
  if (!isValidTenantId(tenantId)) {
    return {
      success: false,
      error: new Error(`Invalid tenant_id format: ${tenantId}. Expected positive integer.`)
    }
  }

  // Convert to string for set_config
  const tenantIdStr = String(tenantId)

  try {
    const result = await db.transaction(async (tx) => {
      // Set app.tenant_id (required, LOCAL scope via true parameter)
      await tx.execute(
        sql`SELECT set_config('app.tenant_id', ${tenantIdStr}, true)`
      )

      // Set app.user_id (optional, for audit trails)
      if (userId !== undefined) {
        await tx.execute(
          sql`SELECT set_config('app.user_id', ${String(userId)}, true)`
        )
      }

      // Set app.site_id (optional, for multi-sede filtering)
      if (siteId !== undefined) {
        await tx.execute(
          sql`SELECT set_config('app.site_id', ${String(siteId)}, true)`
        )
      }

      // Set app.role (optional, for permission checks in policies)
      if (role) {
        await tx.execute(
          sql`SELECT set_config('app.role', ${role}, true)`
        )
      }

      // Execute the callback within the tenant context
      return await callback(tx)
    })

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Execute a read-only query within a tenant context.
 * This is a convenience wrapper for SELECT operations.
 *
 * @param db - Drizzle database instance
 * @param tenantId - ID of the tenant (integer)
 * @param callback - Async function to execute (should only perform reads)
 */
export async function withTenantRead<T>(
  db: PostgresJsDatabase,
  tenantId: string | number,
  callback: (tx: DatabaseTransaction) => Promise<T>
): Promise<TenantScopedResult<T>> {
  return withTenantContext(db, { tenantId }, callback)
}

/**
 * Get the current tenant_id from the database context.
 * Useful for debugging and audit purposes.
 *
 * @param tx - Drizzle transaction
 * @returns The current app.tenant_id or null if not set
 */
export async function getCurrentTenantId(
  tx: DatabaseTransaction
): Promise<string | null> {
  const result: unknown = await tx.execute(
    sql`SELECT current_setting('app.tenant_id', true) as tenant_id`
  )
  // Handle both postgres-js (array) and standard (rows) result formats
  const queryResult = result as TenantIdRow[] | QueryResult
  const row = Array.isArray(queryResult) ? queryResult[0] : queryResult.rows?.[0]
  return row?.tenant_id ?? null
}

/**
 * Assert that a tenant context is active.
 * Throws if no tenant_id is set in the current transaction.
 *
 * @param tx - Drizzle transaction
 * @throws Error if tenant context is not set
 */
export async function assertTenantContext(
  tx: DatabaseTransaction
): Promise<void> {
  const tenantId = await getCurrentTenantId(tx)
  if (!tenantId) {
    throw new Error('Tenant context not set. Use withTenantContext() for all database operations.')
  }
}
