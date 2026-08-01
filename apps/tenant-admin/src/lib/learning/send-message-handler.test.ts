import assert from 'node:assert/strict'
import test from 'node:test'

import { LearningDomainError } from '@akademate/learning'

import { NextLearningInfrastructureError } from './next-learning-transaction.ts'
import { createSendMessageHandler, type SendMessageHandlerDependencies } from './send-message-handler.ts'

const identity = { userId: 41, tenantId: 7 }

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request('http://localhost/api/learning/conversations/33/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function dependencies(overrides: Partial<SendMessageHandlerDependencies> = {}): {
  dependencies: SendMessageHandlerDependencies
  calls: { authenticated: number; executed: Array<Record<string, unknown>> }
} {
  const calls = { authenticated: 0, executed: [] as Array<Record<string, unknown>> }
  return {
    calls,
    dependencies: {
      runtime: () => 'next',
      enabled: () => true,
      now: () => '2026-07-30T12:00:00.000Z',
      authenticate: async () => {
        calls.authenticated += 1
        return identity
      },
      execute: async (input) => {
        calls.executed.push(input as unknown as Record<string, unknown>)
        return {
          inserted: true,
          record: {
            id: 501,
            tenantId: 7,
            courseRunId: 12,
            conversationId: 33,
            senderUserId: 41,
            clientMessageId: 'clientmsg_0001',
            body: 'Hello',
            attachmentIds: [],
            status: 'sent' as const,
            createdAt: '2026-07-30T12:00:00.000Z',
            editedAt: null,
            deletedAt: null,
          },
        }
      },
      ...overrides,
    },
  }
}

const routeContext = { params: Promise.resolve({ conversationId: '33' }) }

test('returns 404 outside exact next runtime without authenticating', async () => {
  const setup = dependencies({ runtime: () => 'cep' })
  const handler = createSendMessageHandler(setup.dependencies)
  const response = await handler(request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }), routeContext)

  assert.equal(response.status, 404)
  assert.equal(setup.calls.authenticated, 0)
  assert.equal(setup.calls.executed.length, 0)
})

test('remains default-off without authenticating or executing', async () => {
  const setup = dependencies({ enabled: () => false })
  const handler = createSendMessageHandler(setup.dependencies)
  const response = await handler(request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }), routeContext)

  assert.equal(response.status, 404)
  assert.equal(setup.calls.authenticated, 0)
  assert.equal(setup.calls.executed.length, 0)
})

test('rejects client-supplied tenant, user and role fields', async () => {
  const setup = dependencies()
  const handler = createSendMessageHandler(setup.dependencies)
  const response = await handler(request({
    clientMessageId: 'clientmsg_0001',
    body: 'Hello',
    tenantId: 999,
    userId: 999,
    senderUserId: 999,
    role: 'admin',
  }), routeContext)

  assert.equal(response.status, 400)
  assert.equal(setup.calls.authenticated, 0)
  assert.equal(setup.calls.executed.length, 0)
})

test('requires a verified server session', async () => {
  const setup = dependencies({ authenticate: async () => null })
  const handler = createSendMessageHandler(setup.dependencies)
  const response = await handler(request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }), routeContext)

  assert.equal(response.status, 401)
  assert.equal(setup.calls.executed.length, 0)
})

test('returns 201 for a new durable message and passes only server identity', async () => {
  const setup = dependencies()
  const handler = createSendMessageHandler(setup.dependencies)
  const response = await handler(request({ clientMessageId: 'clientmsg_0001', body: ' Hello ' }), routeContext)
  const json = await response.json()

  assert.equal(response.status, 201)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(json.inserted, true)
  assert.deepEqual(setup.calls.executed[0], {
    identity,
    conversationId: '33',
    now: '2026-07-30T12:00:00.000Z',
    input: {
      clientMessageId: 'clientmsg_0001',
      body: ' Hello ',
      attachmentIds: [],
    },
  })
})

test('returns 200 for an identical idempotent retry', async () => {
  const setup = dependencies({
    execute: async () => ({
      inserted: false,
      record: {
        id: 77,
        tenantId: 7,
        courseRunId: 12,
        conversationId: 33,
        senderUserId: 41,
        clientMessageId: 'clientmsg_0001',
        body: 'Hello',
        attachmentIds: [],
        status: 'sent',
        createdAt: '2026-07-30T11:59:00.000Z',
        editedAt: null,
        deletedAt: null,
      },
    }),
  })
  const response = await createSendMessageHandler(setup.dependencies)(
    request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }),
    routeContext,
  )
  assert.equal(response.status, 200)
  assert.equal((await response.json()).inserted, false)
})

test('maps authorization, inactive-principal and unsafe-database errors fail closed', async () => {
  const cases = [
    { error: new LearningDomainError('message_send_denied'), status: 403 },
    { error: new NextLearningInfrastructureError('principal_inactive_or_mismatched'), status: 401 },
    { error: new NextLearningInfrastructureError('database_role_unsafe'), status: 503 },
    { error: Object.assign(new Error('serialization failure'), { code: '40001' }), status: 409 },
    { error: Object.assign(new Error('missing table'), { code: '42P01' }), status: 503 },
    { error: Object.assign(new Error('json scalar'), { code: '22023' }), status: 503 },
  ]

  for (const item of cases) {
    const setup = dependencies({ execute: async () => { throw item.error } })
    const response = await createSendMessageHandler(setup.dependencies)(
      request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }),
      routeContext,
    )
    assert.equal(response.status, item.status)
  }
})

test('rejects oversized or malformed request bodies before authentication', async () => {
  const setup = dependencies()
  const handler = createSendMessageHandler(setup.dependencies)
  const oversized = await handler(request('x'.repeat(32_769)), routeContext)
  const malformed = await handler(request('{not-json'), routeContext)

  assert.equal(oversized.status, 413)
  assert.equal(malformed.status, 400)
  assert.equal(setup.calls.authenticated, 0)
})

test('rejects attachments until tenant and course asset authorization exists', async () => {
  const setup = dependencies()
  const response = await createSendMessageHandler(setup.dependencies)(request({
    clientMessageId: 'clientmsg_0001',
    body: 'Hello',
    attachmentIds: ['cross-tenant-asset'],
  }), routeContext)

  assert.equal(response.status, 400)
  assert.equal(setup.calls.authenticated, 0)
  assert.equal(setup.calls.executed.length, 0)
})

test('maps missing message content to validation instead of authorization', async () => {
  const setup = dependencies({
    execute: async () => { throw new LearningDomainError('message_content_required') },
  })
  const response = await createSendMessageHandler(setup.dependencies)(
    request({ clientMessageId: 'clientmsg_0001', body: 'Hello' }),
    routeContext,
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'message_content_required' })
})
