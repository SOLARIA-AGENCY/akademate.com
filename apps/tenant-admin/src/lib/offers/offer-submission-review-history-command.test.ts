import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionHistoryError,
  getNextOfferSubmissionHistory,
} from './offer-submission-review-history-command.ts'

type Row = Record<string, unknown>

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'gestor',
}

function fakeClient(respond: (query: string, params: unknown[]) => Row[]) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const client: LearningSqlClient = {
    async unsafe<T extends Row>(query: string, params: unknown[] = []) {
      const normalized = query.replace(/\s+/g, ' ').trim()
      calls.push({ query: normalized, params })
      return respond(normalized, params) as T[]
    },
  }
  return { calls, client }
}

const submission = {
  id: 91,
  status: 'rejected',
  created_at: '2026-08-03T10:00:00.000Z',
}
const event = {
  id: 501,
  actor_user_id: 41,
  actor_name: 'QA Manager',
  from_status: 'pending_review',
  to_status: 'rejected',
  note: 'Missing prerequisite',
  created_at: '2026-08-03T14:00:00.000Z',
}

test('reads the exact tenant submission and a bounded newest-first ledger', async () => {
  const { calls, client } = fakeClient((query) => {
    if (query.includes('FROM offer_submissions')) return [submission]
    if (query.includes('FROM offer_submission_review_events')) return [event]
    throw new Error(`unexpected query: ${query}`)
  })
  const result = await getNextOfferSubmissionHistory({ tx: client, principal, submissionId: '91' })
  assert.equal(result.submissionId, 91)
  assert.equal(result.status, 'rejected')
  assert.equal(result.truncated, false)
  assert.deepEqual(result.events[0], {
    id: 501,
    actorUserId: 41,
    actorName: 'QA Manager',
    fromStatus: 'pending_review',
    toStatus: 'rejected',
    note: 'Missing prerequisite',
    createdAt: '2026-08-03T14:00:00.000Z',
  })
  assert.deepEqual(calls[0]?.params, [7, 91])
  assert.deepEqual(calls[1]?.params, [7, 91, 101])
  assert.match(calls[1]?.query ?? '', /ORDER BY e\.created_at DESC, e\.id DESC LIMIT \$3/)
})

test('allows an empty ledger while preserving the original received state', async () => {
  const { client } = fakeClient((query) => query.includes('FROM offer_submissions') ? [submission] : [])
  const result = await getNextOfferSubmissionHistory({ tx: client, principal, submissionId: 91 })
  assert.deepEqual(result.events, [])
  assert.equal(result.receivedAt, '2026-08-03T10:00:00.000Z')
})

test('rejects read-only roles and malformed identifiers before SQL', async () => {
  for (const input of [
    { principal: { ...principal, platformRole: 'marketing' }, id: '91' },
    { principal, id: '0' },
    { principal, id: '1e2' },
  ]) {
    const { calls, client } = fakeClient(() => { throw new Error('must not run') })
    await assert.rejects(
      getNextOfferSubmissionHistory({ tx: client, principal: input.principal, submissionId: input.id }),
      (error: unknown) => error instanceof NextOfferSubmissionHistoryError,
    )
    assert.equal(calls.length, 0)
  }
})

test('returns not found for an absent tenant-scoped submission', async () => {
  const { calls, client } = fakeClient(() => [])
  await assert.rejects(
    getNextOfferSubmissionHistory({ tx: client, principal, submissionId: '91' }),
    (error: unknown) => error instanceof NextOfferSubmissionHistoryError
      && error.code === 'submission_history_not_found',
  )
  assert.equal(calls.length, 1)
})

test('fails closed on malformed actor or event data and flags bounded truncation', async () => {
  const malformed = fakeClient((query) => (
    query.includes('FROM offer_submissions') ? [submission] : [{ ...event, actor_user_id: 0 }]
  ))
  await assert.rejects(
    getNextOfferSubmissionHistory({ tx: malformed.client, principal, submissionId: '91' }),
    (error: unknown) => error instanceof NextOfferSubmissionHistoryError
      && error.code === 'submission_history_persistence_invalid',
  )

  const many = fakeClient((query) => (
    query.includes('FROM offer_submissions')
      ? [submission]
      : Array.from({ length: 101 }, (_, index) => ({ ...event, id: index + 1 }))
  ))
  const bounded = await getNextOfferSubmissionHistory({ tx: many.client, principal, submissionId: '91' })
  assert.equal(bounded.events.length, 100)
  assert.equal(bounded.truncated, true)
})
