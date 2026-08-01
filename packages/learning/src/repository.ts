import type { AssignmentRecord, GradeRecord, SubmissionRecord } from './assessment.ts'
import type { ConversationMode, ConversationParticipantRole, ConversationParticipantStatus, ConversationStatus } from './conversation-access.ts'
import type { MessageRecord } from './messaging.ts'

export type ConversationRecord = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  status: ConversationStatus
  mode: ConversationMode
  title: string
  createdByUserId: string | number
  createdAt: string
}

export type ConversationParticipantRecord = {
  id: string | number
  conversationId: string | number
  tenantId: string | number
  userId: string | number
  status: ConversationParticipantStatus
  role: ConversationParticipantRole
  createdAt: string
}

export class LearningRepositoryError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'LearningRepositoryError'
    this.code = code
  }
}

export interface LearningRepository {
  insertConversation(record: ConversationRecord): void
  insertConversationParticipant(record: ConversationParticipantRecord): void
  insertMessage(record: MessageRecord): { record: MessageRecord; inserted: boolean }
  getMessage(tenantId: string | number, messageId: string | number): MessageRecord | null
  insertAssignment(record: AssignmentRecord): void
  getAssignment(tenantId: string | number, assignmentId: string | number): AssignmentRecord | null
  insertSubmission(record: SubmissionRecord): { record: SubmissionRecord; inserted: boolean }
  getSubmission(tenantId: string | number, submissionId: string | number): SubmissionRecord | null
  insertGrade(record: GradeRecord): void
  getGradeForSubmission(tenantId: string | number, submissionId: string | number): GradeRecord | null
}

function fail(code: string): never {
  throw new LearningRepositoryError(code)
}

function key(...values: Array<string | number>) {
  return values.map(String).join('\u001f')
}

function sameId(left: string | number, right: string | number) {
  return String(left) === String(right)
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function sameRecord(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class InMemoryLearningRepository implements LearningRepository {
  private readonly conversations = new Map<string, ConversationRecord>()
  private readonly participants = new Map<string, ConversationParticipantRecord>()
  private readonly participantByUser = new Map<string, ConversationParticipantRecord>()
  private readonly messages = new Map<string, MessageRecord>()
  private readonly messageIdempotency = new Map<string, MessageRecord>()
  private readonly assignments = new Map<string, AssignmentRecord>()
  private readonly submissions = new Map<string, SubmissionRecord>()
  private readonly submissionIdempotency = new Map<string, SubmissionRecord>()
  private readonly grades = new Map<string, GradeRecord>()
  private readonly gradeBySubmission = new Map<string, GradeRecord>()

  insertConversation(record: ConversationRecord) {
    const recordKey = key(record.tenantId, record.id)
    if (this.conversations.has(recordKey)) fail('conversation_id_conflict')
    this.conversations.set(recordKey, clone(record))
  }

  insertConversationParticipant(record: ConversationParticipantRecord) {
    const conversation = this.conversations.get(key(record.tenantId, record.conversationId))
    if (!conversation) fail('conversation_not_found')
    const recordKey = key(record.tenantId, record.id)
    const membershipKey = key(record.tenantId, record.conversationId, record.userId)
    if (this.participants.has(recordKey) || this.participantByUser.has(membershipKey)) fail('conversation_participant_conflict')
    const stored = clone(record)
    this.participants.set(recordKey, stored)
    this.participantByUser.set(membershipKey, stored)
  }

  insertMessage(record: MessageRecord) {
    const conversation = this.conversations.get(key(record.tenantId, record.conversationId))
    if (!conversation) fail('conversation_not_found')
    if (!sameId(conversation.courseRunId, record.courseRunId)) fail('message_course_run_mismatch')
    const participant = this.participantByUser.get(key(record.tenantId, record.conversationId, record.senderUserId))
    if (!participant) fail('message_participant_not_found')
    if (participant.status !== 'active') fail('message_participant_inactive')

    const idempotencyKey = key(record.tenantId, record.conversationId, record.senderUserId, record.clientMessageId)
    const existingByClient = this.messageIdempotency.get(idempotencyKey)
    if (existingByClient) {
      if (!sameRecord(existingByClient, record)) fail('message_idempotency_conflict')
      return { record: clone(existingByClient), inserted: false }
    }
    const recordKey = key(record.tenantId, record.id)
    if (this.messages.has(recordKey)) fail('message_id_conflict')
    const stored = clone(record)
    this.messages.set(recordKey, stored)
    this.messageIdempotency.set(idempotencyKey, stored)
    return { record: clone(stored), inserted: true }
  }

  getMessage(tenantId: string | number, messageId: string | number) {
    const record = this.messages.get(key(tenantId, messageId))
    return record ? clone(record) : null
  }

  insertAssignment(record: AssignmentRecord) {
    const recordKey = key(record.tenantId, record.id)
    if (this.assignments.has(recordKey)) fail('assignment_id_conflict')
    this.assignments.set(recordKey, clone(record))
  }

  getAssignment(tenantId: string | number, assignmentId: string | number) {
    const record = this.assignments.get(key(tenantId, assignmentId))
    return record ? clone(record) : null
  }

  insertSubmission(record: SubmissionRecord) {
    const assignment = this.assignments.get(key(record.tenantId, record.assignmentId))
    if (!assignment) fail('assignment_not_found')
    if (!sameId(assignment.courseRunId, record.courseRunId)) fail('submission_course_run_mismatch')
    const idempotencyKey = key(record.tenantId, record.assignmentId, record.studentUserId, record.clientSubmissionId)
    const existingByClient = this.submissionIdempotency.get(idempotencyKey)
    if (existingByClient) {
      if (!sameRecord(existingByClient, record)) fail('submission_idempotency_conflict')
      return { record: clone(existingByClient), inserted: false }
    }
    const recordKey = key(record.tenantId, record.id)
    if (this.submissions.has(recordKey)) fail('submission_id_conflict')
    const stored = clone(record)
    this.submissions.set(recordKey, stored)
    this.submissionIdempotency.set(idempotencyKey, stored)
    return { record: clone(stored), inserted: true }
  }

  getSubmission(tenantId: string | number, submissionId: string | number) {
    const record = this.submissions.get(key(tenantId, submissionId))
    return record ? clone(record) : null
  }

  insertGrade(record: GradeRecord) {
    const submission = this.submissions.get(key(record.tenantId, record.submissionId))
    if (!submission) fail('submission_not_found')
    if (!sameId(submission.courseRunId, record.courseRunId)) fail('grade_course_run_mismatch')
    if (!sameId(submission.assignmentId, record.assignmentId)) fail('grade_assignment_mismatch')
    if (!sameId(submission.studentUserId, record.studentUserId)) fail('grade_student_mismatch')
    const submissionKey = key(record.tenantId, record.submissionId)
    if (this.gradeBySubmission.has(submissionKey)) fail('submission_grade_conflict')
    const recordKey = key(record.tenantId, record.id)
    if (this.grades.has(recordKey)) fail('grade_id_conflict')
    const stored = clone(record)
    this.grades.set(recordKey, stored)
    this.gradeBySubmission.set(submissionKey, stored)
  }

  getGradeForSubmission(tenantId: string | number, submissionId: string | number) {
    const record = this.gradeBySubmission.get(key(tenantId, submissionId))
    return record ? clone(record) : null
  }
}
