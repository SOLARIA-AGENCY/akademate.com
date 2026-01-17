/**
 * @fileoverview Database Client Configuration
 * Provides Drizzle ORM instance for database operations
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema, subscriptions, invoices, paymentMethods, paymentTransactions, tenants, featureFlags } from '../../../../packages/db/src/schema'

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

/**
 * Export table references for convenience
 */
export { subscriptions, invoices, paymentMethods, paymentTransactions, tenants, featureFlags }

/**
 * Graceful shutdown helper
 * Call this when shutting down the application
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (!queryClient) return
  await queryClient.end()
  console.log('[Database] Connection pool closed')
}
