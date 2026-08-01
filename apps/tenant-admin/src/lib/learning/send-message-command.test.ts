import assert from 'node:assert/strict'
import test from 'node:test'

import { LearningDomainError } from '@akademate/learning'

import type { LearningSqlClient, NextLearningPrincipal } from './next-learning-transaction.ts'
import { NextLearningCommandError, sendNextLearningMessage } from './send-message-command.ts'

type Row = Record<string, unknown>

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'lectura',
}

const membership = {
  user_id: 41,
  tenant_id: 7,
  course_run_id: 12,
  role: 'student',
  status: 'active',
  staff_profile_id: null,
  student_profile_id: 91,
  valid_from: null,
  valid_until: null,
}

const conversation = {
  id: 33,
  tenant_id: 7,
  course_run_id: 12,
  status: 'active',
  mode: 'discussion',
}

const participant = {
  conversation_id: 33,
  tenant_id: 7,
  user_id: 41,
  status: 'active',
  role: 'member',
}

function fakeClient(respond: (query: string, params: unknown[]) => Row[]): {
  client: LearningSqlClient
  calls: Array<{ query: string; params: unknown[] }>
} {
  const calls: Array<{ query: string; params: unknown[] }> = []
  return {
    calls,
    client: {
      async unsafe<T extends Row>(query: string, params: unknown[] = []) {
        const normalized = query.replace(/\s+/g, ' ').trim()
        calls.push({ query: normalized, params })
        return respond(normalized, params) as T[]
      },
    },
  }
}

function baseResponder(query: string): Row[] {
  if (query.includes('akademate_next_lock_learning_')) return [{}]
  if (query.includes('FROM learning_memberships')) return [membership]
  if (query.includes('FROM learning_conversations')) return [conversation]
  if (query.includes('FROM learning_conversation_participants')) return [participant]
  if (query.includes('FROM learning_messages')) return []
  if (query.includes("nextval('learning_messages_id_seq')")) return [{ id: 501 }]
  if (query.startsWith('INSERT INTO learning_messages')) {
    return [{
      id: 501,
      tenant_id: 7,
      course_run_id: 12,
      conversation_id: 33,
      sender_user_id: 41,
      client_message_id: 'clientmsg_0001',
      body: 'Hello class',
      attachment_ids: [],
      status: 'sent',
      created_at: '2026-07-30T12:00:00.000Z',
      edited_at: null,
      deleted_at: null,
    }]
  }
  throw new Error(`unexpected query: ${query}`)
}

test('inserts a message using only the server-derived principal scope', async () => {
  const { client, calls } = fakeClient(baseResponder)
  const result = await sendNextLearningMessage({
    tx: client,
    principal,
    conversationId: 33,
    now: '2026-07-30T12:00:00.000Z',
    input: {
      clientMessageId: 'clientmsg_0001',
      body: '  Hello class  ',
      attachmentIds: [],
      tenantId: 999,
      senderUserId: 999,
    } as never,
  })

  assert.equal(result.inserted, true)
  assert.equal(result.record.tenantId, 7)
  assert.equal(result.record.senderUserId, 41)
  const insert = calls.find(({ query }) => query.startsWith('INSERT INTO learning_messages'))
  assert.deepEqual(insert?.params.slice(0, 5), [501, 7, 12, 33, 41])
})

test('returns the durable record for an identical idempotent retry without inserting', async () => {
  const existing = {
    id: 77,
    tenant_id: 7,
    course_run_id: 12,
    conversation_id: 33,
    sender_user_id: 41,
    client_message_id: 'clientmsg_0001',
    body: 'Hello class',
    attachment_ids: [5],
    status: 'sent',
    created_at: '2026-07-30T11:59:00.000Z',
    edited_at: null,
    deleted_at: null,
  }
  const { client, calls } = fakeClient((query) => {
    if (query.includes('akademate_next_lock_learning_')) return [{}]
    if (query.includes('FROM learning_memberships')) return [membership]
    if (query.includes('FROM learning_conversations')) return [conversation]
    if (query.includes('FROM learning_conversation_participants')) return [participant]
    if (query.includes('FROM learning_messages')) return [existing]
    throw new Error(`unexpected query: ${query}`)
  })

  const result = await sendNextLearningMessage({
    tx: client,
    principal,
    conversationId: 33,
    now: '2026-07-30T12:00:00.000Z',
    input: { clientMessageId: 'clientmsg_0001', body: ' Hello class ', attachmentIds: [5] },
  })

  assert.equal(result.inserted, false)
  assert.equal(result.record.id, 77)
  assert.equal(calls.some(({ query }) => query.startsWith('INSERT INTO')), false)
})

test('rejects reuse of an idempotency key with different content', async () => {
  const { client } = fakeClient((query) => {
    if (query.includes('akademate_next_lock_learning_')) return [{}]
    if (query.includes('FROM learning_memberships')) return [membership]
    if (query.includes('FROM learning_conversations')) return [conversation]
    if (query.includes('FROM learning_conversation_participants')) return [participant]
    if (query.includes('FROM learning_messages')) {
      return [{
        id: 77,
        tenant_id: 7,
        course_run_id: 12,
        conversation_id: 33,
        sender_user_id: 41,
        client_message_id: 'clientmsg_0001',
        body: 'Original',
        attachment_ids: [],
        status: 'sent',
        created_at: '2026-07-30T11:59:00.000Z',
        edited_at: null,
        deleted_at: null,
      }]
    }
    throw new Error(`unexpected query: ${query}`)
  })

  await assert.rejects(
    sendNextLearningMessage({
      tx: client,
      principal,
      conversationId: 33,
      now: '2026-07-30T12:00:00.000Z',
      input: { clientMessageId: 'clientmsg_0001', body: 'Changed' },
    }),
    (error: unknown) => error instanceof NextLearningCommandError
      && error.code === 'message_idempotency_conflict',
  )
})

test('fails closed when RLS does not reveal the conversation', async () => {
  const { client } = fakeClient((query) => {
    if (query.includes('FROM learning_memberships')) return [membership]
    if (query.includes('FROM learning_conversations')) return []
    throw new Error(`unexpected query: ${query}`)
  })

  await assert.rejects(
    sendNextLearningMessage({
      tx: client,
      principal,
      conversationId: 33,
      now: '2026-07-30T12:00:00.000Z',
      input: { clientMessageId: 'clientmsg_0001', body: 'Hello' },
    }),
    (error: unknown) => error instanceof LearningDomainError
      && error.code === 'conversation_not_found',
  )
})

test('rejects non-canonical conversation identifiers instead of coercing them', async () => {
  const { client } = fakeClient(() => {
    throw new Error('query must not run')
  })
  for (const conversationId of ['1e3', '0x10', '+1', ' 1', '0']) {
    await assert.rejects(
      sendNextLearningMessage({
        tx: client,
        principal,
        conversationId,
        now: '2026-07-30T12:00:00.000Z',
        input: { clientMessageId: 'clientmsg_0001', body: 'Hello' },
      }),
      (error: unknown) => error instanceof NextLearningCommandError
        && error.code === 'conversation_id_invalid',
    )
  }
})
