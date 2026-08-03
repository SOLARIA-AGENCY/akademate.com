import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  createOfferSubmissionInboxHandlers,
  type OfferSubmissionInboxHandlerDependencies,
} from './offer-submission-inbox-handler.ts'
import { NextOfferSubmissionInboxError } from './offer-submission-inbox-command.ts'

const identity = { userId: 41, tenantId: 7 }
const result = { items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 }

function setup(overrides: Partial<OfferSubmissionInboxHandlerDependencies> = {}) {
  const calls = { authenticated: 0, list: 0 }
  const dependencies: OfferSubmissionInboxHandlerDependencies = {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => {
      calls.authenticated += 1
      return identity
    },
    list: async () => {
      calls.list += 1
      return result
    },
    ...overrides,
  }
  return { calls, handlers: createOfferSubmissionInboxHandlers(dependencies) }
}

test('is invisible outside Next or while offer management is disabled', async () => {
  for (const overrides of [{ runtime: () => 'cep' }, { enabled: () => false }]) {
    const current = setup(overrides)
    const response = await current.handlers.GET(new Request('http://localhost/api/next/offer-submissions'))
    assert.equal(response.status, 404)
    assert.equal(current.calls.authenticated, 0)
    assert.equal(current.calls.list, 0)
  }
})

test('requires the verified server session before listing PII', async () => {
  const current = setup({ authenticate: async () => null })
  const response = await current.handlers.GET(new Request('http://localhost/api/next/offer-submissions'))
  assert.equal(response.status, 401)
  assert.equal(current.calls.list, 0)
})

test('rejects client identity and malformed filters before authentication', async () => {
  for (const query of ['tenantId=999', 'status=approved', 'page=1e3', 'extra=value']) {
    const current = setup()
    const response = await current.handlers.GET(new Request(`http://localhost/api/next/offer-submissions?${query}`))
    assert.equal(response.status, 400)
    assert.equal(current.calls.authenticated, 0)
    assert.equal(current.calls.list, 0)
  }
})

test('passes only the server identity and normalized filters', async () => {
  const captured: unknown[] = []
  const current = setup({ list: async (input) => { captured.push(input); return result } })
  const response = await current.handlers.GET(new Request(
    'http://localhost/api/next/offer-submissions?status=pending_review&kind=application&page=2&pageSize=50&search=Ada',
  ))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(captured[0], {
    identity,
    query: {
      kind: 'application',
      page: 2,
      pageSize: 50,
      search: 'Ada',
      status: 'pending_review',
    },
  })
})

test('maps authorization and infrastructure failures without leaking internals', async () => {
  const cases = [
    { error: new NextOfferSubmissionInboxError('submission_inbox_forbidden'), status: 403 },
    { error: new NextLearningInfrastructureError('principal_inactive_or_mismatched'), status: 401 },
    { error: new NextLearningInfrastructureError('database_role_unsafe'), status: 503 },
    { error: Object.assign(new Error('missing table'), { code: '42P01' }), status: 503 },
  ]
  for (const item of cases) {
    const current = setup({ list: async () => { throw item.error } })
    const response = await current.handlers.GET(new Request('http://localhost/api/next/offer-submissions'))
    assert.equal(response.status, item.status)
  }
})
