import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, tenants, users } from '../../../packages/db/src/schema'

type OpsSchema = {
  users: typeof users
  tenants: typeof tenants
  subscriptions: typeof subscriptions
}

let client: postgres.Sql | null = null
let dbInstance: PostgresJsDatabase<OpsSchema> | null = null

export const getDb = () => {
  if (dbInstance) {
    return dbInstance
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  dbInstance = drizzle(client, { schema: { users, tenants, subscriptions } })
  return dbInstance
}

export { subscriptions, tenants, users }

export const closeDatabaseConnection = async () => {
  if (client) {
    await client.end()
  }
  client = null
  dbInstance = null
}
