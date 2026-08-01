import postgres from 'postgres'

export type LearningSqlClient = {
  unsafe<T extends Record<string, unknown>>(
    query: string,
    params?: unknown[],
  ): Promise<T[]>
}

export type LearningSqlPool = LearningSqlClient & {
  begin<T>(callback: (client: LearningSqlClient) => Promise<T>): Promise<T>
}

export type NextLearningIdentity = {
  userId: string | number
  tenantId: string | number
}

export type NextLearningPrincipal = {
  userId: number
  tenantId: number
  active: true
  platformRole: string
}

export class NextLearningInfrastructureError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextLearningInfrastructureError'
    this.code = code
  }
}

type NextLearningDatabaseEnvironment = {
  AKADEMATE_RUNTIME?: string
  AKADEMATE_NEXT_DB_APP_USER?: string
  DATABASE_URL?: string
}

type TransactionOptions = {
  pool?: LearningSqlPool
  expectedRole?: string
  runtime?: string
}

type RoleRow = {
  current_user: string
  rolsuper: boolean
  rolbypassrls: boolean
}

type UserRow = {
  id: number
  tenant_id: number
  role: string
  is_active: boolean
}

let defaultPool: LearningSqlPool | null = null
let defaultPoolUrl: string | null = null

function fail(code: string): never {
  throw new NextLearningInfrastructureError(code)
}

function positiveInteger(value: string | number, code: string): number {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) fail(code)
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) fail(code)
  return parsed
}

function safeRoleIdentifier(value: string | undefined): string {
  if (!value || !/^[a-z_][a-z0-9_]{0,62}$/.test(value)) fail('database_role_invalid')
  return value
}

export function resolveNextLearningDatabaseConfig(
  environment: NextLearningDatabaseEnvironment,
): { databaseUrl: string; expectedRole: string } {
  if (environment.AKADEMATE_RUNTIME !== 'next') fail('next_runtime_required')

  const expectedRole = safeRoleIdentifier(environment.AKADEMATE_NEXT_DB_APP_USER)
  if (!environment.DATABASE_URL) fail('database_url_required')

  let databaseUrl: URL
  try {
    databaseUrl = new URL(environment.DATABASE_URL)
  } catch {
    fail('database_url_invalid')
  }
  if (databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:') {
    fail('database_url_invalid')
  }

  let databaseUser: string
  try {
    databaseUser = decodeURIComponent(databaseUrl.username)
  } catch {
    fail('database_url_invalid')
  }
  if (databaseUser !== expectedRole) fail('database_role_mismatch')

  return { databaseUrl: environment.DATABASE_URL, expectedRole }
}

function getDefaultPool(): { pool: LearningSqlPool; expectedRole: string } {
  const config = resolveNextLearningDatabaseConfig({
    AKADEMATE_RUNTIME: process.env.AKADEMATE_RUNTIME,
    AKADEMATE_NEXT_DB_APP_USER: process.env.AKADEMATE_NEXT_DB_APP_USER,
    DATABASE_URL: process.env.DATABASE_URL,
  })
  if (!defaultPool || defaultPoolUrl !== config.databaseUrl) {
    defaultPool = postgres(config.databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    }) as unknown as LearningSqlPool
    defaultPoolUrl = config.databaseUrl
  }
  return { pool: defaultPool, expectedRole: config.expectedRole }
}

export async function withNextLearningTransaction<T>(
  identity: NextLearningIdentity,
  callback: (tx: LearningSqlClient, principal: NextLearningPrincipal) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const runtime = options.runtime ?? process.env.AKADEMATE_RUNTIME
  if (runtime !== 'next') fail('next_runtime_required')

  const userId = positiveInteger(identity.userId, 'principal_user_invalid')
  const tenantId = positiveInteger(identity.tenantId, 'principal_tenant_invalid')
  const defaults = options.pool && options.expectedRole
    ? { pool: options.pool, expectedRole: safeRoleIdentifier(options.expectedRole) }
    : getDefaultPool()

  return defaults.pool.begin(async (tx) => {
    await tx.unsafe('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')
    const roles = await tx.unsafe<RoleRow>(`
      SELECT current_user, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
      LIMIT 1
    `)
    const connectedRole = roles[0]
    if (
      !connectedRole
      || connectedRole.current_user !== defaults.expectedRole
      || connectedRole.rolsuper
      || connectedRole.rolbypassrls
    ) {
      fail('database_role_unsafe')
    }

    const users = await tx.unsafe<UserRow>(`
      SELECT id, tenant_id, role::text, is_active
      FROM users
      WHERE id = $1
        AND tenant_id = $2
        AND is_active = true
      LIMIT 1
    `, [userId, tenantId])
    const user = users[0]
    if (!user || user.id !== userId || user.tenant_id !== tenantId || !user.is_active) {
      fail('principal_inactive_or_mismatched')
    }

    const platformRole = typeof user.role === 'string' ? user.role : ''
    await tx.unsafe(`
      SELECT
        set_config('app.tenant_id', $1, true),
        set_config('app.user_id', $2, true),
        set_config('app.role', $3, true)
    `, [String(tenantId), String(userId), platformRole])

    return callback(tx, {
      userId,
      tenantId,
      active: true,
      platformRole,
    })
  })
}
