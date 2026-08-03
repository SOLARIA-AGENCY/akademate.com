import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from './next-learning-transaction.ts'
import { createNextSessionHandlers, type NextSessionHandlerDependencies } from './next-session-handler.ts'

const profile = {
  authenticated: true as const,
  user: { id: 41, email: 'manager@example.test', name: 'QA Manager', role: 'admin' },
}

function setup(overrides: Partial<NextSessionHandlerDependencies> = {}) {
  const calls = { authenticate: 0, read: 0 }
  const dependencies: NextSessionHandlerDependencies = {
    runtime: () => 'next',
    authenticate: async () => { calls.authenticate += 1; return { userId: 41, tenantId: 7 } },
    read: async () => { calls.read += 1; return profile },
    ...overrides,
  }
  return { calls, handlers: createNextSessionHandlers(dependencies) }
}

test('is not exposed in the CEP runtime', async () => {
  const current = setup({ runtime: () => 'cep' })
  const response = await current.handlers.GET(new Request('http://localhost/api/next/session'))
  assert.equal(response.status, 404)
  assert.equal(current.calls.authenticate, 0)
  assert.equal(current.calls.read, 0)
})

test('requires the dedicated verified Next credential', async () => {
  const current = setup({ authenticate: async () => null })
  const response = await current.handlers.GET(new Request('http://localhost/api/next/session'))
  assert.equal(response.status, 401)
  assert.equal(current.calls.read, 0)
})

test('returns a no-store profile derived from the server identity', async () => {
  const captured: unknown[] = []
  const current = setup({ read: async (input) => { captured.push(input); return profile } })
  const response = await current.handlers.GET(new Request('http://localhost/api/next/session'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(captured, [{ identity: { userId: 41, tenantId: 7 } }])
})

test('maps inactive users and unsafe database roles without leaking internals', async () => {
  for (const error of [
    new NextLearningInfrastructureError('principal_inactive_or_mismatched'),
    new NextLearningInfrastructureError('database_role_unsafe'),
  ]) {
    const current = setup({ read: async () => { throw error } })
    const response = await current.handlers.GET(new Request('http://localhost/api/next/session'))
    assert.equal(response.status, error.code === 'principal_inactive_or_mismatched' ? 401 : 503)
  }
})
