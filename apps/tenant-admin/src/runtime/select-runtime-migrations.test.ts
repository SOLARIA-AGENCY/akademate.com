import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
  selectRuntimeMigrations,
} from './select-runtime-migrations.ts'

type TestMigration = { name: string }

const legacyMigrations: TestMigration[] = [{ name: 'legacy-base' }, { name: 'cep-planning' }]
const nextMigrations: TestMigration[] = [{ name: 'next-base' }, { name: 'next-learning' }]

test('registers Next migrations only for the exact next runtime', () => {
  assert.deepEqual(
    selectRuntimeMigrations('next', legacyMigrations, nextMigrations),
    nextMigrations,
  )

  for (const runtime of [undefined, '', 'cep', 'NEXT', ' next ', 'production']) {
    assert.deepEqual(
      selectRuntimeMigrations(runtime, legacyMigrations, nextMigrations),
      legacyMigrations,
      `runtime ${JSON.stringify(runtime)} must not register Next migrations`,
    )
  }
})

test('accepts only safe PostgreSQL application role identifiers', () => {
  assert.equal(resolveNextDatabaseAppRole('akademate_next_app'), 'akademate_next_app')
  for (const role of [
    undefined,
    '',
    'AkademateNext',
    '1akademate',
    'akademate-next',
    'akademate_next_app; DROP TABLE users',
    'a'.repeat(64),
  ]) {
    assert.throws(
      () => resolveNextDatabaseAppRole(role),
      /invalid application database role/,
    )
  }
})

test('does not mutate either migration source', () => {
  const selected = selectRuntimeMigrations('next', legacyMigrations, nextMigrations)
  assert.notEqual(selected, legacyMigrations)
  assert.notEqual(selected, nextMigrations)
  assert.deepEqual(legacyMigrations, [{ name: 'legacy-base' }, { name: 'cep-planning' }])
  assert.deepEqual(nextMigrations, [{ name: 'next-base' }, { name: 'next-learning' }])
})

test('aborts migration execution outside the exact next runtime', () => {
  assert.doesNotThrow(() => assertAkademateNextRuntime('next'))
  for (const runtime of [undefined, '', 'cep', 'NEXT', ' next ', 'production']) {
    assert.throws(
      () => assertAkademateNextRuntime(runtime),
      /Akademate Next migration refused: AKADEMATE_RUNTIME must equal next/,
    )
  }
})
