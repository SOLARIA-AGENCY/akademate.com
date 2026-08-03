import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, LearningSqlPool } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  resolveNextPublicOfferDatabaseConfig,
  withNextPublicOfferTransaction,
  withNextPublicOfferWriteTransaction,
} from './public-offer-database.ts'

type Row = Record<string, unknown>

function fakePool(role: { current_user: string; rolsuper: boolean; rolbypassrls: boolean }) {
  const calls: string[] = []
  const tx: LearningSqlClient = {
    async unsafe<T extends Row>(query: string) {
      const normalized = query.replace(/\s+/g, ' ').trim()
      calls.push(normalized)
      if (normalized.includes('FROM pg_roles')) return [role] as unknown as T[]
      return [] as T[]
    },
  }
  const pool: LearningSqlPool = {
    ...tx,
    async begin<T>(callback: (client: LearningSqlClient) => Promise<T>) {
      return callback(tx)
    },
  }
  return { calls, pool }
}

test('requires the exact Next runtime, app role and PostgreSQL URL user', () => {
  const valid = {
    AKADEMATE_RUNTIME: 'next',
    AKADEMATE_NEXT_DB_APP_USER: 'akademate_next_app',
    DATABASE_URL: 'postgresql://akademate_next_app:secret@localhost/akademate_next',
  }
  assert.equal(resolveNextPublicOfferDatabaseConfig(valid).expectedRole, 'akademate_next_app')

  for (const environment of [
    { ...valid, AKADEMATE_RUNTIME: 'cep' },
    { ...valid, AKADEMATE_NEXT_DB_APP_USER: 'bad-role' },
    { ...valid, DATABASE_URL: 'postgresql://owner:secret@localhost/akademate_next' },
    { ...valid, DATABASE_URL: 'https://akademate_next_app@example.com/db' },
  ]) assert.throws(() => resolveNextPublicOfferDatabaseConfig(environment))
})

test('uses a read-only transaction under a non-owner non-bypass role', async () => {
  const { calls, pool } = fakePool({
    current_user: 'akademate_next_app',
    rolsuper: false,
    rolbypassrls: false,
  })
  const result = await withNextPublicOfferTransaction(async () => 'public-offer', {
    pool,
    expectedRole: 'akademate_next_app',
    runtime: 'next',
  })
  assert.equal(result, 'public-offer')
  assert.match(calls[0] ?? '', /SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY/)
})

test('uses a serializable write transaction for the bounded submission command only', async () => {
  const { calls, pool } = fakePool({
    current_user: 'akademate_next_app',
    rolsuper: false,
    rolbypassrls: false,
  })
  const result = await withNextPublicOfferWriteTransaction(async () => 'submission', {
    pool,
    expectedRole: 'akademate_next_app',
    runtime: 'next',
  })
  assert.equal(result, 'submission')
  assert.match(calls[0] ?? '', /SET TRANSACTION ISOLATION LEVEL SERIALIZABLE, READ WRITE/)
})

test('rejects superuser, bypass-RLS and mismatched connections before the projection', async () => {
  for (const role of [
    { current_user: 'akademate_next_app', rolsuper: true, rolbypassrls: false },
    { current_user: 'akademate_next_app', rolsuper: false, rolbypassrls: true },
    { current_user: 'postgres', rolsuper: false, rolbypassrls: false },
  ]) {
    const { pool } = fakePool(role)
    let projected = false
    await assert.rejects(
      withNextPublicOfferTransaction(async () => {
        projected = true
      }, { pool, expectedRole: 'akademate_next_app', runtime: 'next' }),
      (error: unknown) => error instanceof NextLearningInfrastructureError
        && error.code === 'database_role_unsafe',
    )
    assert.equal(projected, false)
  }
})
