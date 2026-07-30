import assert from 'node:assert/strict'
import test from 'node:test'

import { InMemoryLearningRepository, LearningRepositoryError } from './repository.ts'
import type { AssignmentRecord, GradeRecord, SubmissionRecord } from './assessment.ts'
import type { MessageRecord } from './messaging.ts'

const conversation = {
  id: 'conversation-1', tenantId: 'tenant-1', courseRunId: 'run-1', status: 'active', mode: 'discussion',
  title: 'Curso 1', createdByUserId: 'teacher-1', createdAt: '2026-07-30T10:00:00.000Z',
} as const
const participant = {
  id: 'participant-1', conversationId: 'conversation-1', tenantId: 'tenant-1', userId: 'student-1',
  status: 'active', role: 'member', createdAt: '2026-07-30T10:00:00.000Z',
} as const
const message: MessageRecord = {
  id: 'message-1', tenantId: 'tenant-1', courseRunId: 'run-1', conversationId: 'conversation-1',
  senderUserId: 'student-1', clientMessageId: 'client-msg-0001', body: 'Hola', attachmentIds: [],
  status: 'sent', createdAt: '2026-07-30T10:01:00.000Z', editedAt: null, deletedAt: null,
}

test('persists a conversation participant and message with scoped references', () => {
  const repository = new InMemoryLearningRepository()
  repository.insertConversation(conversation)
  repository.insertConversationParticipant(participant)
  assert.deepEqual(repository.insertMessage(message), { record: message, inserted: true })
  assert.deepEqual(repository.getMessage('tenant-1', 'message-1'), message)
})

test('makes message client ids idempotent and rejects conflicting reuse', () => {
  const repository = messagingRepository()
  assert.deepEqual(repository.insertMessage(message), { record: message, inserted: true })
  assert.deepEqual(repository.insertMessage({ ...message }), { record: message, inserted: false })
  assert.throws(
    () => repository.insertMessage({ ...message, id: 'message-2', body: 'Contenido distinto' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'message_idempotency_conflict',
  )
})

test('rejects orphaned and cross-course messages', () => {
  const repository = new InMemoryLearningRepository()
  assert.throws(
    () => repository.insertMessage(message),
    (error) => error instanceof LearningRepositoryError && error.code === 'conversation_not_found',
  )
  repository.insertConversation(conversation)
  repository.insertConversationParticipant(participant)
  assert.throws(
    () => repository.insertMessage({ ...message, courseRunId: 'run-2' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'message_course_run_mismatch',
  )
  assert.throws(
    () => repository.insertMessage({ ...message, senderUserId: 'not-a-participant' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'message_participant_not_found',
  )
})

test('persists assignment submission and one canonical grade with idempotent submission clients', () => {
  const repository = new InMemoryLearningRepository()
  const assignment = assignmentFixture()
  const submission = submissionFixture()
  const grade = gradeFixture()

  repository.insertAssignment(assignment)
  assert.deepEqual(repository.insertSubmission(submission), { record: submission, inserted: true })
  assert.deepEqual(repository.insertSubmission({ ...submission }), { record: submission, inserted: false })
  repository.insertGrade(grade)

  assert.deepEqual(repository.getAssignment('tenant-1', 'assignment-1'), assignment)
  assert.deepEqual(repository.getSubmission('tenant-1', 'submission-1'), submission)
  assert.deepEqual(repository.getGradeForSubmission('tenant-1', 'submission-1'), grade)
  assert.throws(
    () => repository.insertGrade({ ...grade, id: 'grade-2' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'submission_grade_conflict',
  )
})

test('rejects cross-scope submissions and conflicting idempotency reuse', () => {
  const repository = new InMemoryLearningRepository()
  repository.insertAssignment(assignmentFixture())
  const submission = submissionFixture()
  assert.throws(
    () => repository.insertSubmission({ ...submission, courseRunId: 'run-2' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'submission_course_run_mismatch',
  )
  repository.insertSubmission(submission)
  assert.throws(
    () => repository.insertSubmission({ ...submission, id: 'submission-2', body: 'Distinto' }),
    (error) => error instanceof LearningRepositoryError && error.code === 'submission_idempotency_conflict',
  )
})

function messagingRepository() {
  const repository = new InMemoryLearningRepository()
  repository.insertConversation(conversation)
  repository.insertConversationParticipant(participant)
  return repository
}

function assignmentFixture(): AssignmentRecord {
  return {
    id: 'assignment-1', tenantId: 'tenant-1', courseRunId: 'run-1', createdByUserId: 'teacher-1',
    title: 'Tarea', instructions: 'Instrucciones', dueAt: null, maxScore: 100, allowLate: false,
    status: 'published', createdAt: '2026-07-30T10:00:00.000Z', publishedAt: '2026-07-30T10:01:00.000Z',
  }
}

function submissionFixture(): SubmissionRecord {
  return {
    id: 'submission-1', tenantId: 'tenant-1', courseRunId: 'run-1', assignmentId: 'assignment-1',
    studentUserId: 'student-1', clientSubmissionId: 'submission-client-0001', body: 'Respuesta',
    attachmentIds: [], status: 'submitted', submittedAt: '2026-07-31T10:00:00.000Z', attemptNumber: 1,
  }
}

function gradeFixture(): GradeRecord {
  return {
    id: 'grade-1', tenantId: 'tenant-1', courseRunId: 'run-1', assignmentId: 'assignment-1',
    submissionId: 'submission-1', studentUserId: 'student-1', graderUserId: 'teacher-1',
    score: 85, maxScore: 100, feedback: 'Bien', status: 'draft', gradedAt: '2026-08-01T10:00:00.000Z', publishedAt: null,
  }
}
