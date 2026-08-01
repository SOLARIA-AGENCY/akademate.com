import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NextLearningInfrastructureError,
  resolveNextLearningDatabaseConfig,
  withNextLearningTransaction,
  type LearningSqlClient,
  type LearningSqlPool,
} from './next-learning-transaction.ts'

function normalized(query: string) {
  return query.replace(/\s+/g, ' ').trim()
}

test('fails closed before opening a pool outside the exact next runtime', () => {
  assert.throws(
    () => resolveNextLearningDatabaseConfig({
      AKADEMATE_RUNTIME: 'NEXT',
      AKADEMATE_NEXT_DB_APP_USER: 'akademate_next_app',
      DATABASE_URL: 'postgresql://akademate_next_app:secret@postgres/akademate_next',
    }),
    (error: unknown) => error instanceof NextLearningInfrastructureError
      && error.code === 'next_runtime_required',
  )
})

test('rejects a database URL whose login is not the declared application role', () => {
  assert.throws(
    () => resolveNextLearningDatabaseConfig({
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_DB_APP_USER: 'akademate_next_app',
      DATABASE_URL: 'postgresql://akademate_next_owner:secret@postgres/akademate_next',
    }),
    (error: unknown) => error instanceof NextLearningInfrastructureError
      && error.code === 'database_role_mismatch',
  )
})

test('derives the active principal from the database and sets transaction-local RLS context', async () => {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const tx: LearningSqlClient = {
    async unsafe<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
      calls.push({ query: normalized(query), params })
      if (query.includes('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')) return [{}] as T[]
      if (query.includes('FROM pg_roles')) {
        return [{ current_user: 'akademate_next_app', rolsuper: false, rolbypassrls: false }] as T[]
      }
      if (query.includes('FROM users')) {
        return [{ id: 41, tenant_id: 7, role: 'lectura', is_active: true }] as T[]
      }
      if (query.includes('set_config')) return [{}] as T[]
      throw new Error(`unexpected query: ${query}`)
    },
  }
  const pool: LearningSqlPool = {
    unsafe: tx.unsafe,
    async begin<T>(callback: (client: LearningSqlClient) => Promise<T>) {
      return callback(tx)
    },
  }

  const result = await withNextLearningTransaction(
    { userId: 41, tenantId: 7 },
    async (_client, principal) => principal,
    {
      pool,
      expectedRole: 'akademate_next_app',
      runtime: 'next',
    },
  )

  assert.deepEqual(result, {
    userId: 41,
    tenantId: 7,
    active: true,
    platformRole: 'lectura',
  })
  const userQuery = calls.find(({ query }) => query.includes('FROM users'))
  const contextQuery = calls.find(({ query }) => query.includes('set_config'))
  assert.deepEqual(userQuery?.params, [41, 7])
  assert.deepEqual(contextQuery?.params, ['7', '41', 'lectura'])
  assert.match(contextQuery?.query ?? '', /set_config\('app\.tenant_id', \$1, true\)/)
  assert.match(contextQuery?.query ?? '', /set_config\('app\.user_id', \$2, true\)/)
  assert.match(contextQuery?.query ?? '', /set_config\('app\.role', \$3, true\)/)
})

test('rejects inactive or tenant-mismatched users before setting any RLS context', async () => {
  const calls: string[] = []
  const tx: LearningSqlClient = {
    async unsafe<T extends Record<string, unknown>>(query: string) {
      calls.push(normalized(query))
      if (query.includes('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE')) return [{}] as T[]
      if (query.includes('FROM pg_roles')) {
        return [{ current_user: 'akademate_next_app', rolsuper: false, rolbypassrls: false }] as T[]
      }
      if (query.includes('FROM users')) return [] as T[]
      throw new Error(`unexpected query: ${query}`)
    },
  }
  const pool: LearningSqlPool = {
    unsafe: tx.unsafe,
    async begin<T>(callback: (client: LearningSqlClient) => Promise<T>) {
      return callback(tx)
    },
  }

  await assert.rejects(
    withNextLearningTransaction(
      { userId: 41, tenantId: 8 },
      async () => 'must-not-run',
      { pool, expectedRole: 'akademate_next_app', runtime: 'next' },
    ),
    (error: unknown) => error instanceof NextLearningInfrastructureError
      && error.code === 'principal_inactive_or_mismatched',
  )
  assert.equal(calls.some((query) => query.includes('set_config')), false)
})
