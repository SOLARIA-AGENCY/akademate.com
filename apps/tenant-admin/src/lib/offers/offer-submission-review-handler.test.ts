import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  createOfferSubmissionReviewHandlers,
  type OfferSubmissionReviewHandlerDependencies,
} from './offer-submission-review-handler.ts'
import { NextOfferSubmissionReviewError } from './offer-submission-review-command.ts'

const identity = { userId: 41, tenantId: 7 }
const decisionResult = {
  submissionId: 91,
  previousStatus: 'pending_review' as const,
  status: 'approved' as const,
  changed: true,
  decidedAt: '2026-08-03T14:00:00.000Z',
}

function setup(overrides: Partial<OfferSubmissionReviewHandlerDependencies> = {}) {
  const calls = { authenticated: 0, review: 0 }
  const dependencies: OfferSubmissionReviewHandlerDependencies = {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => { calls.authenticated += 1; return identity },
    review: async () => { calls.review += 1; return decisionResult },
    ...overrides,
  }
  return { calls, handlers: createOfferSubmissionReviewHandlers(dependencies) }
}

const context = { params: Promise.resolve({ id: '91' }) }

test('is invisible outside enabled Next runtime and requires server auth', async () => {
  for (const overrides of [{ runtime: () => 'cep' }, { enabled: () => false }]) {
    const current = setup(overrides)
    const response = await current.handlers.PATCH(new Request('http://localhost', { method: 'PATCH' }), context)
    assert.equal(response.status, 404)
    assert.equal(current.calls.authenticated, 0)
  }
  const unauthenticated = setup({ authenticate: async () => null })
  const response = await unauthenticated.handlers.PATCH(new Request('http://localhost', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' }),
  }), context)
  assert.equal(response.status, 401)
  assert.equal(unauthenticated.calls.review, 0)
})

test('rejects invalid JSON, extra identity and missing rejection reason before review', async () => {
  for (const body of ['{', JSON.stringify({ status: 'approved', tenantId: 999 }), JSON.stringify({ status: 'rejected' })]) {
    const current = setup()
    const response = await current.handlers.PATCH(new Request('http://localhost', { method: 'PATCH', body }), context)
    assert.equal(response.status, 400)
    assert.equal(current.calls.review, 0)
  }
})

test('passes only authenticated identity, route id and normalized decision', async () => {
  const captured: unknown[] = []
  const current = setup({ review: async (input) => { captured.push(input); return decisionResult } })
  const response = await current.handlers.PATCH(new Request('http://localhost', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved', note: '  Ready  ' }),
  }), context)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(captured[0], {
    identity,
    submissionId: '91',
    decision: { status: 'approved', note: 'Ready' },
  })
})

test('maps authorization, transitions, conflicts and infrastructure without leakage', async () => {
  const cases = [
    { error: new NextOfferSubmissionReviewError('submission_decision_forbidden'), status: 403 },
    { error: new NextOfferSubmissionReviewError('submission_not_found'), status: 404 },
    { error: new NextOfferSubmissionReviewError('submission_transition_invalid'), status: 409 },
    { error: new NextLearningInfrastructureError('principal_inactive_or_mismatched'), status: 401 },
    { error: Object.assign(new Error('deadlock'), { code: '40P01' }), status: 409 },
    { error: Object.assign(new Error('missing table'), { code: '42P01' }), status: 503 },
  ]
  for (const item of cases) {
    const current = setup({ review: async () => { throw item.error } })
    const response = await current.handlers.PATCH(new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    }), context)
    assert.equal(response.status, item.status)
  }
})
