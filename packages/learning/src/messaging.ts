import {
  hasConversationCapability,
  resolveConversationAccess,
  type ConversationContext,
  type ConversationParticipant,
} from './conversation-access.ts'
import type { LearningContext, LearningMembership, LearningPrincipal } from './access.ts'

export type MessageInput = {
  clientMessageId: string
  body?: string
  attachmentIds?: Array<string | number>
}

export type MessageRecord = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  conversationId: string | number
  senderUserId: string | number
  clientMessageId: string
  body: string
  attachmentIds: Array<string | number>
  status: 'sent'
  createdAt: string
  editedAt: null
  deletedAt: null
}

export class LearningDomainError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'LearningDomainError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new LearningDomainError(code)
}

function validIdentifier(value: unknown) {
  return (typeof value === 'string' || typeof value === 'number') && String(value).trim().length > 0
}

export function createMessage({
  principal,
  learningMembership,
  learningContext,
  conversation,
  participant,
  messageId,
  now,
  input,
}: {
  principal: LearningPrincipal
  learningMembership: LearningMembership | null | undefined
  learningContext: LearningContext
  conversation: ConversationContext
  participant: ConversationParticipant | null | undefined
  messageId: string | number
  now: string
  input: MessageInput
}): MessageRecord {
  const access = resolveConversationAccess({
    principal,
    learningMembership,
    learningContext,
    conversation,
    participant,
  })
  if (access.allowed === false) fail(access.reason)
  if (!hasConversationCapability(access, 'message.send')) fail('message_send_denied')

  if (!validIdentifier(messageId)) fail('message_id_invalid')
  if (typeof input.clientMessageId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(input.clientMessageId)) {
    fail('client_message_id_invalid')
  }
  const createdAt = new Date(now)
  if (!Number.isFinite(createdAt.getTime())) fail('message_timestamp_invalid')

  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (body.length > 10_000) fail('message_body_too_long')
  const attachmentIds = input.attachmentIds ?? []
  if (!Array.isArray(attachmentIds) || attachmentIds.some((id) => !validIdentifier(id))) fail('message_attachment_invalid')
  if (attachmentIds.length > 10) fail('message_attachments_too_many')
  if (new Set(attachmentIds.map(String)).size !== attachmentIds.length) fail('message_attachments_duplicate')
  if (!body && attachmentIds.length === 0) fail('message_content_required')

  return {
    id: messageId,
    tenantId: principal.tenantId,
    courseRunId: learningContext.courseRunId,
    conversationId: conversation.id,
    senderUserId: principal.userId,
    clientMessageId: input.clientMessageId,
    body,
    attachmentIds: [...attachmentIds],
    status: 'sent',
    createdAt: createdAt.toISOString(),
    editedAt: null,
    deletedAt: null,
  }
}
