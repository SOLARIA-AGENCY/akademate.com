import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Client } = pg

const SMOKE_ROLE = 'lectura'
const DEFAULT_SMOKE_NAME = 'Cuenta técnica de despliegue'

function requireValue(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`)
  }

  return value.trim()
}

function parseTenantId(value) {
  const tenantId = Number.parseInt(requireValue(value, 'SMOKE_AUTH_TENANT_ID'), 10)
  if (!Number.isSafeInteger(tenantId) || tenantId < 1) {
    throw new Error('SMOKE_AUTH_TENANT_ID must be a positive integer')
  }

  return tenantId
}

export function getSmokeUserConfig(env = process.env) {
  const password = requireValue(env.SMOKE_AUTH_PASSWORD, 'SMOKE_AUTH_PASSWORD')
  if (password.length < 24) {
    throw new Error('SMOKE_AUTH_PASSWORD must be at least 24 characters')
  }

  return {
    connectionString: requireValue(env.DATABASE_URL, 'DATABASE_URL'),
    email: requireValue(env.SMOKE_AUTH_EMAIL, 'SMOKE_AUTH_EMAIL').toLowerCase(),
    name: (env.SMOKE_AUTH_NAME || DEFAULT_SMOKE_NAME).trim() || DEFAULT_SMOKE_NAME,
    password,
    tenantId: parseTenantId(env.SMOKE_AUTH_TENANT_ID || '1'),
  }
}

export function generatePayloadPasswordHash(password, randomBytes = crypto.randomBytes) {
  const salt = randomBytes(32).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex')
  return { hash, salt }
}

export function validateExistingSmokeUser(user, expected) {
  if (Number(user.tenant_id) !== expected.tenantId) {
    throw new Error('Existing smoke user belongs to a different tenant')
  }
  if (user.role !== SMOKE_ROLE) {
    throw new Error('Existing smoke user does not have the lectura role')
  }
  if (user.is_active !== true) {
    throw new Error('Existing smoke user is inactive')
  }
}

export async function ensureProductionSmokeUser(options = {}) {
  const config = options.config || getSmokeUserConfig(options.env)
  const client = options.client || new Client({ connectionString: config.connectionString })
  const ownsClient = !options.client

  if (ownsClient) await client.connect()

  try {
    await client.query('BEGIN')

    const tenant = await client.query(
      'SELECT id FROM tenants WHERE id = $1 FOR KEY SHARE',
      [config.tenantId],
    )
    if (tenant.rowCount !== 1) {
      throw new Error('Smoke tenant does not exist')
    }

    const existing = await client.query(
      'SELECT id, tenant_id, role, is_active FROM users WHERE email = $1 FOR UPDATE',
      [config.email],
    )

    if (existing.rowCount === 1) {
      validateExistingSmokeUser(existing.rows[0], config)
      await client.query('COMMIT')
      return { created: false, id: existing.rows[0].id }
    }

    const { hash, salt } = generatePayloadPasswordHash(config.password)
    const created = await client.query(
      `INSERT INTO users (
        email, name, role, tenant_id, is_active, login_count, login_attempts,
        enable_a_p_i_key, hash, salt, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, true, 0, 0, false, $5, $6, NOW(), NOW())
      RETURNING id`,
      [config.email, config.name, SMOKE_ROLE, config.tenantId, hash, salt],
    )

    await client.query('COMMIT')
    return { created: true, id: created.rows[0].id }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // A failed rollback cannot make provisioning safe to continue.
    }
    throw error
  } finally {
    if (ownsClient) await client.end()
  }
}

async function main() {
  const result = await ensureProductionSmokeUser()
  console.log(`Smoke user ${result.created ? 'created' : 'verified'} (id=${result.id})`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Smoke user provisioning failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    process.exitCode = 1
  })
}
