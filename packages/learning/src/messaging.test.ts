import assert from 'node:assert/strict'
import test from 'node:test'

import { createMessage, LearningDomainError } from './messaging.ts'

const authorization = {
  principal: { userId: 'user-1', tenantId: 'tenant-1', active: true },
  learningContext: { tenantId: 'tenant-1', courseRunId: 'run-1', now: '2026-07-30T10:00:00.000Z' },
  learningMembership: {
    userId: 'user-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    role: 'student',
    status: 'active',
    studentProfileId: 'student-1',
  },
  conversation: {
    id: 'conversation-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    status: 'active',
    mode: 'discussion',
  },
  participant: {
    conversationId: 'conversation-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    status: 'active',
    role: 'member',
  },
} as const

test('creates a durable message with identity and scope derived from authorization', () => {
  assert.deepEqual(createMessage({
    ...authorization,
    messageId: 'message-1',
    now: '2026-07-30T10:01:00.000Z',
    input: {
      clientMessageId: 'client-msg-0001',
      body: '  Hola, profesora.  ',
      attachmentIds: ['media-1', 'media-2'],
    },
  }), {
    id: 'message-1',
    tenantId: 'tenant-1',
    courseRunId: 'run-1',
    conversationId: 'conversation-1',
    senderUserId: 'user-1',
    clientMessageId: 'client-msg-0001',
    body: 'Hola, profesora.',
    attachmentIds: ['media-1', 'media-2'],
    status: 'sent',
    createdAt: '2026-07-30T10:01:00.000Z',
    editedAt: null,
    deletedAt: null,
  })
})

test('ignores spoofed scope fields and derives them from the verified context', () => {
  const record = createMessage({
    ...authorization,
    messageId: 'message-2',
    now: '2026-07-30T10:01:00.000Z',
    input: {
      clientMessageId: 'client-msg-0002',
      body: 'Scope seguro',
      tenantId: 'tenant-evil',
      senderUserId: 'other-user',
      conversationId: 'other-conversation',
    } as never,
  })

  assert.equal(record.tenantId, 'tenant-1')
  assert.equal(record.senderUserId, 'user-1')
  assert.equal(record.conversationId, 'conversation-1')
})

test('denies muted participants and cross-tenant conversations', () => {
  const input = { clientMessageId: 'client-msg-0003', body: 'No debe enviarse' }
  assert.throws(
    () => createMessage({ ...authorization, participant: { ...authorization.participant, status: 'muted' }, messageId: 'm-3', now: '2026-07-30T10:01:00.000Z', input }),
    (error) => error instanceof LearningDomainError && error.code === 'message_send_denied',
  )
  assert.throws(
    () => createMessage({ ...authorization, conversation: { ...authorization.conversation, tenantId: 'tenant-2' }, messageId: 'm-4', now: '2026-07-30T10:01:00.000Z', input }),
    (error) => error instanceof LearningDomainError && error.code === 'conversation_tenant_mismatch',
  )
})

test('requires content, a valid idempotency key and bounded body length', () => {
  const base = { ...authorization, messageId: 'message-5', now: '2026-07-30T10:01:00.000Z' }
  const cases = [
    { input: { clientMessageId: 'client-msg-0005', body: '   ' }, code: 'message_content_required' },
    { input: { clientMessageId: 'short', body: 'Hola' }, code: 'client_message_id_invalid' },
    { input: { clientMessageId: 'client-msg-0006', body: 'x'.repeat(10_001) }, code: 'message_body_too_long' },
  ]
  for (const item of cases) {
    assert.throws(
      () => createMessage({ ...base, input: item.input }),
      (error) => error instanceof LearningDomainError && error.code === item.code,
    )
  }
})

test('allows attachment-only messages but rejects duplicate or excessive attachments', () => {
  const base = { ...authorization, messageId: 'message-6', now: '2026-07-30T10:01:00.000Z' }
  const attachmentOnly = createMessage({
    ...base,
    input: { clientMessageId: 'client-msg-0007', body: '', attachmentIds: ['media-1'] },
  })
  assert.equal(attachmentOnly.body, '')
  assert.deepEqual(attachmentOnly.attachmentIds, ['media-1'])

  assert.throws(
    () => createMessage({ ...base, input: { clientMessageId: 'client-msg-0008', body: 'Adjuntos', attachmentIds: ['media-1', 'media-1'] } }),
    (error) => error instanceof LearningDomainError && error.code === 'message_attachments_duplicate',
  )
  assert.throws(
    () => createMessage({ ...base, input: { clientMessageId: 'client-msg-0009', body: 'Adjuntos', attachmentIds: Array.from({ length: 11 }, (_, index) => `media-${index}`) } }),
    (error) => error instanceof LearningDomainError && error.code === 'message_attachments_too_many',
  )
})
