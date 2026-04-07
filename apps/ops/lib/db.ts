import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, tenants, users } from '../../../packages/db/src/schema'

const opsSchema = { users, tenants, subscriptions }

let client: postgres.Sql | null = null
let dbInstance: PostgresJsDatabase<typeof opsSchema> | null = null

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

  dbInstance = drizzle(client, { schema: opsSchema })
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
