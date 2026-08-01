import {
  createMessage,
  LearningDomainError,
  type ConversationContext,
  type ConversationParticipant,
  type LearningMembership,
  type MessageInput,
  type MessageRecord,
} from '@akademate/learning'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from './next-learning-transaction.ts'

type MembershipRow = {
  user_id: number
  tenant_id: number
  course_run_id: number
  role: LearningMembership['role']
  status: LearningMembership['status']
  staff_profile_id: number | null
  student_profile_id: number | null
  valid_from: string | Date | null
  valid_until: string | Date | null
}

type ConversationRow = {
  id: number
  tenant_id: number
  course_run_id: number
  status: ConversationContext['status']
  mode: ConversationContext['mode']
}

type ParticipantRow = {
  conversation_id: number
  tenant_id: number
  user_id: number
  status: ConversationParticipant['status']
  role: ConversationParticipant['role']
}

type MessageRow = {
  id: number
  tenant_id: number
  course_run_id: number
  conversation_id: number
  sender_user_id: number
  client_message_id: string
  body: string
  attachment_ids: unknown
  status: 'sent'
  created_at: string | Date
  edited_at: string | Date | null
  deleted_at: string | Date | null
}

export class NextLearningCommandError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextLearningCommandError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextLearningCommandError(code)
}

function positiveInteger(value: string | number, code: string): number {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) fail(code)
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) fail(code)
  return parsed
}

function iso(value: string | Date | null): string | null {
  if (value === null) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(parsed.getTime())) fail('message_persistence_invalid')
  return parsed.toISOString()
}

function attachmentIds(value: unknown): Array<string | number> {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      fail('message_persistence_invalid')
    }
  }
  if (!Array.isArray(parsed)) fail('message_persistence_invalid')
  if (parsed.some((id) => typeof id !== 'string' && typeof id !== 'number')) {
    fail('message_persistence_invalid')
  }
  return [...parsed] as Array<string | number>
}

function mapMessage(row: MessageRow): MessageRecord {
  if (row.edited_at !== null || row.deleted_at !== null) fail('message_idempotency_conflict')
  return {
    id: row.id,
    tenantId: row.tenant_id,
    courseRunId: row.course_run_id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    clientMessageId: row.client_message_id,
    body: row.body,
    attachmentIds: attachmentIds(row.attachment_ids),
    status: row.status,
    createdAt: iso(row.created_at) ?? fail('message_persistence_invalid'),
    editedAt: null,
    deletedAt: null,
  }
}

function sameIds(left: Array<string | number>, right: Array<string | number>) {
  return left.length === right.length && left.every((value, index) => String(value) === String(right[index]))
}

function sameMessageCommand(existing: MessageRecord, candidate: MessageRecord) {
  return String(existing.tenantId) === String(candidate.tenantId)
    && String(existing.courseRunId) === String(candidate.courseRunId)
    && String(existing.conversationId) === String(candidate.conversationId)
    && String(existing.senderUserId) === String(candidate.senderUserId)
    && existing.clientMessageId === candidate.clientMessageId
    && existing.body === candidate.body
    && sameIds(existing.attachmentIds, candidate.attachmentIds)
}

function membershipFrom(row: MembershipRow | undefined): LearningMembership | null {
  if (!row) return null
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    courseRunId: row.course_run_id,
    role: row.role,
    status: row.status,
    staffProfileId: row.staff_profile_id,
    studentProfileId: row.student_profile_id,
    validFrom: iso(row.valid_from),
    validUntil: iso(row.valid_until),
  }
}

function conversationFrom(row: ConversationRow): ConversationContext {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    courseRunId: row.course_run_id,
    status: row.status,
    mode: row.mode,
  }
}

function participantFrom(row: ParticipantRow | undefined): ConversationParticipant | null {
  if (!row) return null
  return {
    conversationId: row.conversation_id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    status: row.status,
    role: row.role,
  }
}

async function loadExistingMessage(
  tx: LearningSqlClient,
  principal: NextLearningPrincipal,
  conversationId: number,
  clientMessageId: string,
) {
  const rows = await tx.unsafe<MessageRow>(`
    SELECT
      id, tenant_id, course_run_id, conversation_id, sender_user_id,
      client_message_id, body, attachment_ids, status,
      created_at, edited_at, deleted_at
    FROM learning_messages
    WHERE tenant_id = $1
      AND conversation_id = $2
      AND sender_user_id = $3
      AND client_message_id = $4
    LIMIT 1
  `, [principal.tenantId, conversationId, principal.userId, clientMessageId])
  return rows[0] ? mapMessage(rows[0]) : null
}

export async function sendNextLearningMessage({
  tx,
  principal,
  conversationId: rawConversationId,
  now,
  input,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  conversationId: string | number
  now: string
  input: MessageInput
}): Promise<{ record: MessageRecord; inserted: boolean }> {
  const conversationId = positiveInteger(rawConversationId, 'conversation_id_invalid')

  const initialConversations = await tx.unsafe<Pick<ConversationRow, 'course_run_id'>>(
    `SELECT course_run_id FROM learning_conversations WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
    [principal.tenantId, conversationId],
  )
  const initialConversation = initialConversations[0]
  if (!initialConversation) throw new LearningDomainError('conversation_not_found')

  await tx.unsafe(
    `SELECT akademate_next_lock_learning_membership($1)`,
    [initialConversation.course_run_id],
  )
  await tx.unsafe(
    `SELECT akademate_next_lock_learning_conversation($1)`,
    [conversationId],
  )
  await tx.unsafe(
    `SELECT akademate_next_lock_learning_participant($1)`,
    [conversationId],
  )

  const memberships = await tx.unsafe<MembershipRow>(`
    SELECT
      user_id, tenant_id, course_run_id, role, status,
      staff_profile_id, student_profile_id, valid_from, valid_until
    FROM learning_memberships
    WHERE tenant_id = $1
      AND user_id = $2
      AND course_run_id = $3
    LIMIT 1
  `, [principal.tenantId, principal.userId, initialConversation.course_run_id])

  const conversations = await tx.unsafe<ConversationRow>(`
    SELECT id, tenant_id, course_run_id, status, mode
    FROM learning_conversations
    WHERE tenant_id = $1 AND id = $2
    LIMIT 1
  `, [principal.tenantId, conversationId])
  const conversationRow = conversations[0]
  if (!conversationRow) throw new LearningDomainError('conversation_not_found')

  const participants = await tx.unsafe<ParticipantRow>(`
    SELECT conversation_id, tenant_id, user_id, status, role
    FROM learning_conversation_participants
    WHERE tenant_id = $1
      AND conversation_id = $2
      AND user_id = $3
    LIMIT 1
  `, [principal.tenantId, conversationId, principal.userId])

  const membership = membershipFrom(memberships[0])
  const conversation = conversationFrom(conversationRow)
  const participant = participantFrom(participants[0])
  const existing = await loadExistingMessage(
    tx,
    principal,
    conversationId,
    input.clientMessageId,
  )

  if (existing) {
    const candidate = createMessage({
      principal,
      learningMembership: membership,
      learningContext: {
        tenantId: principal.tenantId,
        courseRunId: conversation.courseRunId,
        now,
      },
      conversation,
      participant,
      messageId: existing.id,
      now: existing.createdAt,
      input,
    })
    if (!sameMessageCommand(existing, candidate)) fail('message_idempotency_conflict')
    return { record: existing, inserted: false }
  }

  const identifiers = await tx.unsafe<{ id: number }>(
    `SELECT nextval('learning_messages_id_seq')::integer AS id`,
  )
  const messageId = positiveInteger(identifiers[0]?.id ?? 0, 'message_id_unavailable')
  const candidate = createMessage({
    principal,
    learningMembership: membership,
    learningContext: {
      tenantId: principal.tenantId,
      courseRunId: conversation.courseRunId,
      now,
    },
    conversation,
    participant,
    messageId,
    now,
    input,
  })

  const inserted = await tx.unsafe<MessageRow>(`
    INSERT INTO learning_messages (
      id, tenant_id, course_run_id, conversation_id, sender_user_id,
      client_message_id, body, attachment_ids, status,
      created_at, updated_at, edited_at, deleted_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8::jsonb, 'sent',
      $9::timestamptz, $9::timestamptz, NULL, NULL
    )
    ON CONFLICT (tenant_id, conversation_id, sender_user_id, client_message_id) DO NOTHING
    RETURNING
      id, tenant_id, course_run_id, conversation_id, sender_user_id,
      client_message_id, body, attachment_ids, status,
      created_at, edited_at, deleted_at
  `, [
    candidate.id,
    candidate.tenantId,
    candidate.courseRunId,
    candidate.conversationId,
    candidate.senderUserId,
    candidate.clientMessageId,
    candidate.body,
    candidate.attachmentIds,
    candidate.createdAt,
  ])
  if (inserted[0]) return { record: mapMessage(inserted[0]), inserted: true }

  const concurrent = await loadExistingMessage(
    tx,
    principal,
    conversationId,
    candidate.clientMessageId,
  )
  if (!concurrent) fail('message_persistence_conflict')
  if (!sameMessageCommand(concurrent, candidate)) fail('message_idempotency_conflict')
  return { record: concurrent, inserted: false }
}
