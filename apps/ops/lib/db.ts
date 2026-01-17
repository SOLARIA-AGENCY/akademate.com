import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../../../packages/db/src/schema'

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const client = postgres(getDatabaseUrl(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema: { users } })

export { users }

export const closeDatabaseConnection = async () => {
  await client.end()
}
