import assert from 'node:assert/strict'
import test from 'node:test'

import { hasConversationCapability, resolveConversationAccess } from './conversation-access.ts'

const principal = { userId: 'student-user', tenantId: 'tenant-1', active: true } as const
const learningContext = { tenantId: 'tenant-1', courseRunId: 'run-1', now: '2026-07-30T10:00:00.000Z' } as const
const learningMembership = {
  userId: 'student-user',
  tenantId: 'tenant-1',
  courseRunId: 'run-1',
  role: 'student',
  status: 'active',
  studentProfileId: 'student-1',
} as const
const conversation = {
  id: 'conversation-1',
  tenantId: 'tenant-1',
  courseRunId: 'run-1',
  status: 'active',
  mode: 'discussion',
} as const
const participant = {
  conversationId: 'conversation-1',
  tenantId: 'tenant-1',
  userId: 'student-user',
  status: 'active',
  role: 'member',
} as const

test('allows an explicit active course participant to read and send', () => {
  const access = resolveConversationAccess({ principal, learningContext, learningMembership, conversation, participant })
  assert.equal(hasConversationCapability(access, 'conversation.read'), true)
  assert.equal(hasConversationCapability(access, 'message.send'), true)
  assert.equal(hasConversationCapability(access, 'conversation.moderate'), false)
})

test('denies same-tenant users without an explicit participant record', () => {
  assert.deepEqual(
    resolveConversationAccess({ principal, learningContext, learningMembership, conversation, participant: null }),
    { allowed: false, reason: 'participant_required', capabilities: [] },
  )
})

test('denies cross-tenant, cross-course and cross-user records fail-closed', () => {
  const cases = [
    { conversation: { ...conversation, tenantId: 'tenant-2' }, participant, reason: 'conversation_tenant_mismatch' },
    { conversation: { ...conversation, courseRunId: 'run-2' }, participant, reason: 'conversation_course_run_mismatch' },
    { conversation, participant: { ...participant, userId: 'other-user' }, reason: 'participant_user_mismatch' },
    { conversation, participant: { ...participant, tenantId: 'tenant-2' }, reason: 'participant_tenant_mismatch' },
  ]

  for (const item of cases) {
    assert.equal(
      resolveConversationAccess({
        principal,
        learningContext,
        learningMembership,
        conversation: item.conversation,
        participant: item.participant,
      }).reason,
      item.reason,
    )
  }
})

test('makes muted and announcement members read-only', () => {
  const muted = resolveConversationAccess({
    principal,
    learningContext,
    learningMembership,
    conversation,
    participant: { ...participant, status: 'muted' },
  })
  assert.equal(hasConversationCapability(muted, 'conversation.read'), true)
  assert.equal(hasConversationCapability(muted, 'message.send'), false)

  const announcement = resolveConversationAccess({
    principal,
    learningContext,
    learningMembership,
    conversation: { ...conversation, mode: 'announcement' },
    participant,
  })
  assert.equal(hasConversationCapability(announcement, 'conversation.read'), true)
  assert.equal(hasConversationCapability(announcement, 'message.send'), false)
})

test('allows explicit moderators to send announcements and moderate', () => {
  const access = resolveConversationAccess({
    principal,
    learningContext,
    learningMembership,
    conversation: { ...conversation, mode: 'announcement' },
    participant: { ...participant, role: 'moderator' },
  })
  assert.equal(hasConversationCapability(access, 'message.send'), true)
  assert.equal(hasConversationCapability(access, 'conversation.moderate'), true)
})

test('keeps archived conversations readable but immutable and rejects removed participants', () => {
  const archived = resolveConversationAccess({
    principal,
    learningContext,
    learningMembership,
    conversation: { ...conversation, status: 'archived' },
    participant,
  })
  assert.equal(hasConversationCapability(archived, 'conversation.read'), true)
  assert.equal(hasConversationCapability(archived, 'message.send'), false)

  assert.equal(resolveConversationAccess({
    principal,
    learningContext,
    learningMembership,
    conversation,
    participant: { ...participant, status: 'removed' },
  }).reason, 'participant_removed')
})

test('does not allow a platform administrator to bypass academic membership', () => {
  assert.equal(resolveConversationAccess({
    principal: { ...principal, platformRole: 'admin' },
    learningContext,
    learningMembership: null,
    conversation,
    participant,
  }).reason, 'learning_membership_required')
})

test('rejects unknown runtime conversation and participant states', () => {
  const cases = [
    { conversation: { ...conversation, status: 'deleted' as never }, participant, reason: 'conversation_invalid_status' },
    { conversation: { ...conversation, mode: 'global' as never }, participant, reason: 'conversation_invalid_mode' },
    { conversation, participant: { ...participant, status: 'unknown' as never }, reason: 'participant_invalid_status' },
    { conversation, participant: { ...participant, role: 'owner' as never }, reason: 'participant_invalid_role' },
  ]

  for (const item of cases) {
    assert.equal(resolveConversationAccess({
      principal,
      learningContext,
      learningMembership,
      conversation: item.conversation,
      participant: item.participant,
    }).reason, item.reason)
  }
})
