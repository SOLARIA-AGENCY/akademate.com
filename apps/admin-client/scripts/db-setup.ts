/**
 * Better Auth — Database setup & superadmin seed
 *
 * Creates Better Auth tables and seeds the superadmin user.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." npx tsx scripts/db-setup.ts
 *   ADMIN_EMAIL="ops@akademate.com" ADMIN_PASSWORD="..." DATABASE_URL="..." npx tsx scripts/db-setup.ts
 */
import { Pool } from 'pg'
import crypto from 'crypto'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL env var required')
  process.exit(1)
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ops@akademate.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AkademateOps2026!'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Ops Superadmin'

const pool = new Pool({ connectionString: DATABASE_URL })

async function setupSchema(client: Awaited<ReturnType<typeof pool.connect>>) {
  console.log('🔧 Creating Better Auth tables...')

  await client.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      "expiresAt" TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP,
      "refreshTokenExpiresAt" TIMESTAMP,
      scope TEXT,
      password TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
    CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
  `)

  console.log('✅ Tables created')
}

async function seedSuperadmin(client: Awaited<ReturnType<typeof pool.connect>>) {
  console.log(`\n👤 Seeding superadmin: ${ADMIN_EMAIL}`)

  // Check if user already exists
  const existing = await client.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [ADMIN_EMAIL]
  )

  if (existing.rows.length > 0) {
    console.log('⚠️  User already exists — updating password...')

    // Hash password using Better Auth's format (bcrypt via scrypt)
    const hashedPassword = await hashPassword(ADMIN_PASSWORD)

    await client.query(
      `UPDATE "account" SET password = $1, "updatedAt" = NOW()
       WHERE "userId" = $2 AND "providerId" = 'credential'`,
      [hashedPassword, existing.rows[0].id]
    )
    console.log('✅ Password updated')
    return existing.rows[0].id
  }

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const hashedPassword = await hashPassword(ADMIN_PASSWORD)

  await client.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, TRUE, NOW(), NOW())`,
    [userId, ADMIN_NAME, ADMIN_EMAIL]
  )

  await client.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
    [accountId, ADMIN_EMAIL, userId, hashedPassword]
  )

  console.log(`✅ Superadmin created with id: ${userId}`)
  return userId
}

/**
 * Better Auth uses scrypt for password hashing.
 * Parameters must match better-auth exactly: N=16384, r=16, p=1, dkLen=64
 */
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex')
    crypto.scrypt(password, salt, 64, { N: 16384, r: 16, p: 1 }, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await setupSchema(client)
    const userId = await seedSuperadmin(client)
    await client.query('COMMIT')

    console.log('\n🎉 Database setup complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Email:    ${ADMIN_EMAIL}`)
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
    console.log(`🆔 User ID:  ${userId}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('URL: https://admin.akademate.com/login')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Setup failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
