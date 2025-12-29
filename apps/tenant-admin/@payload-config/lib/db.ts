/**
 * @fileoverview Database Client Configuration
 * Provides Drizzle ORM instance for database operations
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, invoices, paymentMethods, paymentTransactions } from '../../../../packages/db/src/schema'

/**
 * Gets the database URL from environment variables
 * @returns {string} Database connection URL
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure database connection.'
    )
  }

  return url
}

/**
 * Creates a PostgreSQL client instance
 * Connection pooling is handled automatically by postgres-js
 */
const queryClient = postgres(getDatabaseUrl(), {
  max: 10, // Maximum pool size
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
})

/**
 * Drizzle ORM instance with full schema
 * Use this for all database operations
 */
export const db = drizzle(queryClient, { schema })

/**
 * Export table references for convenience
 */
export { subscriptions, invoices, paymentMethods, paymentTransactions }

/**
 * Graceful shutdown helper
 * Call this when shutting down the application
 */
export async function closeDatabaseConnection(): Promise<void> {
  await queryClient.end()
  console.log('[Database] Connection pool closed')
}
