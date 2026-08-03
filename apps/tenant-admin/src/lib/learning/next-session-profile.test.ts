import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from './next-learning-transaction.ts'
import { NextSessionProfileError, getNextSessionProfile } from './next-session-profile.ts'

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'admin',
}

test('loads only the already verified user and tenant pair', async () => {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const tx: LearningSqlClient = {
    async unsafe<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
      calls.push({ query: query.replace(/\s+/g, ' ').trim(), params })
      return [{ id: 41, email: 'manager@example.test', name: 'QA Manager', role: 'admin' }] as T[]
    },
  }
  assert.deepEqual(await getNextSessionProfile({ tx, principal }), {
    authenticated: true,
    user: { id: 41, email: 'manager@example.test', name: 'QA Manager', role: 'admin' },
  })
  assert.deepEqual(calls[0]?.params, [41, 7])
  assert.match(calls[0]?.query ?? '', /id = \$1 AND tenant_id = \$2 AND is_active = true/)
})

test('fails closed when the verified principal disappears or persistence is malformed', async () => {
  for (const rows of [[], [{ id: 41, email: 'invalid', name: 'QA', role: 'admin' }]]) {
    const tx: LearningSqlClient = { async unsafe<T extends Record<string, unknown>>() { return rows as T[] } }
    await assert.rejects(
      getNextSessionProfile({ tx, principal }),
      (error: unknown) => error instanceof NextSessionProfileError
        && error.code === 'next_session_profile_invalid',
    )
  }
})
