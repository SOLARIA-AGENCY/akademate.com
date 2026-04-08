/**
 * @fileoverview Database Client Configuration
 * Provides Drizzle ORM instance for database operations
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import { schema, subscriptions, invoices, paymentMethods, paymentTransactions, tenants, users, memberships, featureFlags } from '../../../../packages/db/src/schema'

/**
 * Gets the database URL from environment variables.
 * Returns null in dev when no database is configured so we can skip eager failures.
 */
function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? null
}

/**
 * Creates a PostgreSQL client instance
 * Connection pooling is handled automatically by postgres-js
 */
const databaseUrl = getDatabaseUrl()
const queryClient = databaseUrl
  ? postgres(databaseUrl, {
      max: 10, // Maximum pool size
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
    })
  : null

export type RawDbClient = Sql<Record<string, unknown>>

/**
 * Drizzle ORM instance with full schema
 * Use this for all database operations
 */
const missingDbProxy = new Proxy(
  {},
  {
    get() {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure database connection.'
      )
    },
  }
) as unknown as ReturnType<typeof drizzle>

export const db = queryClient ? drizzle(queryClient, { schema }) : missingDbProxy
export const rawDb = (queryClient ?? missingDbProxy) as unknown as RawDbClient

/**
 * Export table references for convenience
 */
export { subscriptions, invoices, paymentMethods, paymentTransactions, tenants, users, memberships, featureFlags }

function ensureRawDb(): RawDbClient {
  if (!queryClient) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure database connection.'
    )
  }

  return queryClient as RawDbClient
}

export async function queryRows<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  return (await ensureRawDb().unsafe(query, params)) as unknown as T[]
}

export async function queryFirst<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await queryRows<T>(query, params)
  return rows[0]
}

export async function withTransaction<T>(
  callback: (tx: RawDbClient) => Promise<T>
): Promise<T> {
  return ensureRawDb().begin(async (tx) => callback(tx as unknown as RawDbClient)) as unknown as Promise<T>
}

/**
 * Graceful shutdown helper
 * Call this when shutting down the application
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (!queryClient) return
  await queryClient.end()
  console.log('[Database] Connection pool closed')
}
