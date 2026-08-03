import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  createOfferSubmissionHistoryHandlers,
  type OfferSubmissionHistoryHandlerDependencies,
} from './offer-submission-review-history-handler.ts'
import { NextOfferSubmissionHistoryError } from './offer-submission-review-history-command.ts'

const identity = { userId: 41, tenantId: 7 }
const history = {
  submissionId: 91,
  status: 'approved' as const,
  receivedAt: '2026-08-03T10:00:00.000Z',
  events: [],
  truncated: false,
}

function setup(overrides: Partial<OfferSubmissionHistoryHandlerDependencies> = {}) {
  const calls = { authenticated: 0, history: 0 }
  const dependencies: OfferSubmissionHistoryHandlerDependencies = {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => { calls.authenticated += 1; return identity },
    history: async () => { calls.history += 1; return history },
    ...overrides,
  }
  return { calls, handlers: createOfferSubmissionHistoryHandlers(dependencies) }
}

const context = { params: Promise.resolve({ id: '91' }) }

test('is invisible outside enabled Next runtime and requires verified auth', async () => {
  for (const overrides of [{ runtime: () => 'cep' }, { enabled: () => false }]) {
    const current = setup(overrides)
    const response = await current.handlers.GET(new Request('http://localhost'), context)
    assert.equal(response.status, 404)
    assert.equal(current.calls.authenticated, 0)
  }
  const current = setup({ authenticate: async () => null })
  assert.equal((await current.handlers.GET(new Request('http://localhost'), context)).status, 401)
  assert.equal(current.calls.history, 0)
})

test('rejects query injection before auth and passes only route id plus server identity', async () => {
  const invalid = setup()
  const invalidResponse = await invalid.handlers.GET(new Request('http://localhost?tenantId=999'), context)
  assert.equal(invalidResponse.status, 400)
  assert.equal(invalid.calls.authenticated, 0)

  const captured: unknown[] = []
  const current = setup({ history: async (input) => { captured.push(input); return history } })
  const response = await current.handlers.GET(new Request('http://localhost'), context)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(captured[0], { identity, submissionId: '91' })
})

test('maps authorization, absence and infrastructure without leaking internals', async () => {
  const cases = [
    { error: new NextOfferSubmissionHistoryError('submission_history_forbidden'), status: 403 },
    { error: new NextOfferSubmissionHistoryError('submission_history_not_found'), status: 404 },
    { error: new NextLearningInfrastructureError('principal_inactive_or_mismatched'), status: 401 },
    { error: Object.assign(new Error('missing table'), { code: '42P01' }), status: 503 },
  ]
  for (const item of cases) {
    const current = setup({ history: async () => { throw item.error } })
    assert.equal((await current.handlers.GET(new Request('http://localhost'), context)).status, item.status)
  }
})
