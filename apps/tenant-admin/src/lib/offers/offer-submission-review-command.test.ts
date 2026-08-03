import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionReviewError,
  parseOfferSubmissionDecision,
  reviewNextOfferSubmission,
} from './offer-submission-review-command.ts'

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

test('parses strict bounded decisions and requires a rejection reason', () => {
  assert.deepEqual(parseOfferSubmissionDecision({ status: 'approved', note: '  Ready to join  ' }), {
    status: 'approved',
    note: 'Ready to join',
  })
  assert.deepEqual(parseOfferSubmissionDecision({ status: 'archived' }), {
    status: 'archived',
    note: null,
  })
  for (const input of [
    { status: 'rejected' },
    { status: 'deleted', note: 'x' },
    { status: 'approved', note: 'x'.repeat(501) },
    { status: 'approved', note: 'line\u0000break' },
    { status: 'approved', tenantId: 999 },
  ]) {
    assert.throws(
      () => parseOfferSubmissionDecision(input),
      (error: unknown) => error instanceof NextOfferSubmissionReviewError
        && error.code === 'submission_decision_invalid',
    )
  }
})

test('executes one tenant-bound database command and maps the audited result', async () => {
  const { calls, client } = fakeClient(() => [{
    submission_id: 91,
    previous_status: 'pending_review',
    submission_status: 'approved',
    changed: true,
    decided_at: '2026-08-03T14:00:00.000Z',
  }])
  const result = await reviewNextOfferSubmission({
    tx: client,
    principal,
    submissionId: '91',
    decision: { status: 'approved', note: 'Ready' },
  })
  assert.deepEqual(calls[0]?.params, [91, 'approved', 'Ready'])
  assert.match(calls[0]?.query ?? '', /akademate_next_review_offer_submission\(\$1, \$2, \$3\)/)
  assert.deepEqual(result, {
    submissionId: 91,
    previousStatus: 'pending_review',
    status: 'approved',
    changed: true,
    decidedAt: '2026-08-03T14:00:00.000Z',
  })
})

test('rejects unauthorized roles and malformed identifiers before SQL', async () => {
  for (const input of [
    { principal: { ...principal, platformRole: 'marketing' }, submissionId: '91' },
    { principal, submissionId: '0' },
    { principal, submissionId: '1e2' },
  ]) {
    const { calls, client } = fakeClient(() => { throw new Error('must not execute') })
    await assert.rejects(
      reviewNextOfferSubmission({
        tx: client,
        principal: input.principal,
        submissionId: input.submissionId,
        decision: { status: 'approved', note: null },
      }),
      (error: unknown) => error instanceof NextOfferSubmissionReviewError,
    )
    assert.equal(calls.length, 0)
  }
})

test('fails closed for missing or malformed database results', async () => {
  for (const rows of [[], [{ submission_id: 91, submission_status: 'approved' }]]) {
    const { client } = fakeClient(() => rows)
    await assert.rejects(
      reviewNextOfferSubmission({
        tx: client,
        principal,
        submissionId: '91',
        decision: { status: 'approved', note: null },
      }),
      (error: unknown) => error instanceof NextOfferSubmissionReviewError
        && error.code === 'submission_decision_persistence_invalid',
    )
  }
})
