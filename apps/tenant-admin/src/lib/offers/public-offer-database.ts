import postgres from 'postgres'

import type { LearningSqlClient, LearningSqlPool } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'

type PublicOfferDatabaseEnvironment = {
  AKADEMATE_RUNTIME?: string
  AKADEMATE_NEXT_DB_APP_USER?: string
  DATABASE_URL?: string
}
type RoleRow = {
  current_user: string
  rolsuper: boolean
  rolbypassrls: boolean
}

type TransactionOptions = {
  pool?: LearningSqlPool
  expectedRole?: string
  runtime?: string
}

let defaultPool: LearningSqlPool | null = null
let defaultPoolUrl: string | null = null

function fail(code: string): never {
  throw new NextLearningInfrastructureError(code)
}

function safeRoleIdentifier(value: string | undefined): string {
  if (!value || !/^[a-z_][a-z0-9_]{0,62}$/.test(value)) fail('database_role_invalid')
  return value
}

export function resolveNextPublicOfferDatabaseConfig(
  environment: PublicOfferDatabaseEnvironment,
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
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) fail('database_url_invalid')

  let user: string
  try {
    user = decodeURIComponent(databaseUrl.username)
  } catch {
    fail('database_url_invalid')
  }
  if (user !== expectedRole) fail('database_role_mismatch')
  return { databaseUrl: environment.DATABASE_URL, expectedRole }
}

function defaults() {
  const config = resolveNextPublicOfferDatabaseConfig({
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

export async function withNextPublicOfferTransaction<T>(
  callback: (tx: LearningSqlClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const runtime = options.runtime ?? process.env.AKADEMATE_RUNTIME
  if (runtime !== 'next') fail('next_runtime_required')
  const connection = options.pool && options.expectedRole
    ? { pool: options.pool, expectedRole: safeRoleIdentifier(options.expectedRole) }
    : defaults()

  return connection.pool.begin(async (tx) => {
    await tx.unsafe('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY')
    const roles = await tx.unsafe<RoleRow>(`
      SELECT current_user, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
      LIMIT 1
    `)
    const role = roles[0]
    if (
      !role
      || role.current_user !== connection.expectedRole
      || role.rolsuper
      || role.rolbypassrls
    ) fail('database_role_unsafe')

    return callback(tx)
  })
}

export async function withNextPublicOfferWriteTransaction<T>(
  callback: (tx: LearningSqlClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const runtime = options.runtime ?? process.env.AKADEMATE_RUNTIME
  if (runtime !== 'next') fail('next_runtime_required')
  const connection = options.pool && options.expectedRole
    ? { pool: options.pool, expectedRole: safeRoleIdentifier(options.expectedRole) }
    : defaults()

  return connection.pool.begin(async (tx) => {
    await tx.unsafe('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE, READ WRITE')
    const roles = await tx.unsafe<RoleRow>(`
      SELECT current_user, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
      LIMIT 1
    `)
    const role = roles[0]
    if (
      !role
      || role.current_user !== connection.expectedRole
      || role.rolsuper
      || role.rolbypassrls
    ) fail('database_role_unsafe')

    return callback(tx)
  })
}
