import {
  resolveLearningAccess,
  type LearningContext,
  type LearningMembership,
  type LearningPrincipal,
} from './access.ts'

export type ConversationCapability = 'conversation.moderate' | 'conversation.read' | 'message.send'
export type ConversationMode = 'announcement' | 'discussion' | 'support'
export type ConversationStatus = 'active' | 'archived'
export type ConversationParticipantStatus = 'active' | 'muted' | 'removed'
export type ConversationParticipantRole = 'member' | 'moderator'

export type ConversationContext = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  status: ConversationStatus
  mode: ConversationMode
}

export type ConversationParticipant = {
  conversationId: string | number
  tenantId: string | number
  userId: string | number
  status: ConversationParticipantStatus
  role: ConversationParticipantRole
}

export type ConversationAccess =
  | { allowed: true; capabilities: ConversationCapability[] }
  | { allowed: false; reason: string; capabilities: [] }

function sameId(left: string | number, right: string | number) {
  return String(left) === String(right)
}

function denied(reason: string): ConversationAccess {
  return { allowed: false, reason, capabilities: [] }
}

export function resolveConversationAccess({
  principal,
  learningMembership,
  learningContext,
  conversation,
  participant,
}: {
  principal: LearningPrincipal
  learningMembership: LearningMembership | null | undefined
  learningContext: LearningContext
  conversation: ConversationContext
  participant: ConversationParticipant | null | undefined
}): ConversationAccess {
  const learningAccess = resolveLearningAccess({
    principal,
    membership: learningMembership,
    context: learningContext,
  })
  if (!learningAccess.allowed) {
    return denied(learningAccess.reason === 'membership_required' ? 'learning_membership_required' : `learning_${learningAccess.reason}`)
  }

  if (!sameId(conversation.tenantId, learningContext.tenantId)) return denied('conversation_tenant_mismatch')
  if (!sameId(conversation.courseRunId, learningContext.courseRunId)) return denied('conversation_course_run_mismatch')
  if (conversation.status !== 'active' && conversation.status !== 'archived') return denied('conversation_invalid_status')
  if (conversation.mode !== 'announcement' && conversation.mode !== 'discussion' && conversation.mode !== 'support') {
    return denied('conversation_invalid_mode')
  }
  if (!participant) return denied('participant_required')
  if (!sameId(participant.conversationId, conversation.id)) return denied('participant_conversation_mismatch')
  if (!sameId(participant.tenantId, conversation.tenantId)) return denied('participant_tenant_mismatch')
  if (!sameId(participant.userId, principal.userId)) return denied('participant_user_mismatch')
  if (participant.status !== 'active' && participant.status !== 'muted' && participant.status !== 'removed') {
    return denied('participant_invalid_status')
  }
  if (participant.role !== 'member' && participant.role !== 'moderator') return denied('participant_invalid_role')
  if (participant.status === 'removed') return denied('participant_removed')

  const capabilities: ConversationCapability[] = ['conversation.read']
  const canSend = conversation.status === 'active'
    && participant.status === 'active'
    && (conversation.mode !== 'announcement' || participant.role === 'moderator')
  if (canSend) capabilities.push('message.send')
  if (participant.role === 'moderator') capabilities.push('conversation.moderate')

  return { allowed: true, capabilities }
}

export function hasConversationCapability(access: ConversationAccess, capability: ConversationCapability) {
  return access.allowed && access.capabilities.includes(capability)
}
