import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAssignment,
  gradeSubmission,
  LearningAssessmentError,
  publishAssignment,
  publishGrade,
  submitAssignment,
} from './assessment.ts'

const context = { tenantId: 'tenant-1', courseRunId: 'run-1', now: '2026-07-30T10:00:00.000Z' } as const
const instructor = { userId: 'teacher-user', tenantId: 'tenant-1', active: true } as const
const instructorMembership = {
  userId: 'teacher-user', tenantId: 'tenant-1', courseRunId: 'run-1', role: 'instructor', status: 'active', staffProfileId: 'staff-1',
} as const
const student = { userId: 'student-user', tenantId: 'tenant-1', active: true } as const
const studentMembership = {
  userId: 'student-user', tenantId: 'tenant-1', courseRunId: 'run-1', role: 'student', status: 'active', studentProfileId: 'student-1',
} as const

test('creates and explicitly publishes an assignment from instructor scope', () => {
  const draft = createAssignment({
    principal: instructor,
    membership: instructorMembership,
    context,
    assignmentId: 'assignment-1',
    now: '2026-07-30T10:05:00.000Z',
    input: {
      title: 'Caso práctico 1',
      instructions: 'Resuelve el caso y adjunta el documento.',
      dueAt: '2026-08-10T22:00:00.000Z',
      maxScore: 100,
      allowLate: false,
    },
  })
  assert.equal(draft.tenantId, 'tenant-1')
  assert.equal(draft.courseRunId, 'run-1')
  assert.equal(draft.createdByUserId, 'teacher-user')
  assert.equal(draft.status, 'draft')

  const published = publishAssignment({
    principal: instructor,
    membership: instructorMembership,
    context,
    assignment: draft,
    now: '2026-07-30T10:10:00.000Z',
  })
  assert.equal(published.status, 'published')
  assert.equal(published.publishedAt, '2026-07-30T10:10:00.000Z')
})

test('denies students and unscoped administrators from assignment management', () => {
  const input = { title: 'No permitido', instructions: 'x', dueAt: null, maxScore: 10, allowLate: false }
  assert.throws(
    () => createAssignment({ principal: student, membership: studentMembership, context, assignmentId: 'a-2', now: context.now, input }),
    (error) => error instanceof LearningAssessmentError && error.code === 'assignment_manage_denied',
  )
  assert.throws(
    () => createAssignment({ principal: { ...instructor, platformRole: 'admin' }, membership: null, context, assignmentId: 'a-3', now: context.now, input }),
    (error) => error instanceof LearningAssessmentError && error.code === 'membership_required',
  )
})

test('creates a student submission with derived identity and ignores spoofed fields', () => {
  const assignment = publishAssignmentFixture()
  const submission = submitAssignment({
    principal: student,
    membership: studentMembership,
    context,
    assignment,
    submissionId: 'submission-1',
    now: '2026-08-01T12:00:00.000Z',
    input: {
      clientSubmissionId: 'submission-client-0001',
      body: 'Mi respuesta',
      attachmentIds: ['media-1'],
      tenantId: 'tenant-evil',
      studentUserId: 'other-user',
    } as never,
  })
  assert.equal(submission.tenantId, 'tenant-1')
  assert.equal(submission.studentUserId, 'student-user')
  assert.equal(submission.assignmentId, assignment.id)
  assert.equal(submission.status, 'submitted')
  assert.equal(submission.attemptNumber, 1)
})

test('rejects draft, cross-scope and late assignments fail-closed', () => {
  const published = publishAssignmentFixture()
  const input = { clientSubmissionId: 'submission-client-0002', body: 'Respuesta' }
  const cases = [
    { assignment: { ...published, status: 'draft' as const }, code: 'assignment_not_open' },
    { assignment: { ...published, tenantId: 'tenant-2' }, code: 'assignment_tenant_mismatch' },
    { assignment: { ...published, courseRunId: 'run-2' }, code: 'assignment_course_run_mismatch' },
    { assignment: { ...published, dueAt: '2026-07-31T00:00:00.000Z', allowLate: false }, code: 'assignment_due' },
  ]
  for (const item of cases) {
    assert.throws(
      () => submitAssignment({ principal: student, membership: studentMembership, context, assignment: item.assignment, submissionId: 's-x', now: '2026-08-01T12:00:00.000Z', input }),
      (error) => error instanceof LearningAssessmentError && error.code === item.code,
    )
  }
})

test('grades a submission as draft and publishes it explicitly', () => {
  const assignment = publishAssignmentFixture()
  const submission = submitAssignment({
    principal: student,
    membership: studentMembership,
    context,
    assignment,
    submissionId: 'submission-2',
    now: '2026-08-01T12:00:00.000Z',
    input: { clientSubmissionId: 'submission-client-0003', body: 'Respuesta final' },
  })
  const grade = gradeSubmission({
    principal: instructor,
    membership: instructorMembership,
    context,
    assignment,
    submission,
    gradeId: 'grade-1',
    now: '2026-08-02T09:00:00.000Z',
    input: { score: 82.5, feedback: 'Buen trabajo; revisa la conclusión.' },
  })
  assert.equal(grade.status, 'draft')
  assert.equal(grade.graderUserId, 'teacher-user')
  assert.equal(grade.studentUserId, 'student-user')

  const published = publishGrade({
    principal: instructor,
    membership: instructorMembership,
    context,
    grade,
    now: '2026-08-02T10:00:00.000Z',
  })
  assert.equal(published.status, 'published')
  assert.equal(published.publishedAt, '2026-08-02T10:00:00.000Z')
})

test('rejects out-of-range grades, student grading and cross-scope submissions', () => {
  const assignment = publishAssignmentFixture()
  const submission = submitAssignment({
    principal: student,
    membership: studentMembership,
    context,
    assignment,
    submissionId: 'submission-3',
    now: '2026-08-01T12:00:00.000Z',
    input: { clientSubmissionId: 'submission-client-0004', body: 'Respuesta' },
  })
  const base = { assignment, submission, gradeId: 'grade-x', now: '2026-08-02T09:00:00.000Z', input: { score: 101, feedback: '' } }
  assert.throws(
    () => gradeSubmission({ principal: instructor, membership: instructorMembership, context, ...base }),
    (error) => error instanceof LearningAssessmentError && error.code === 'grade_score_invalid',
  )
  assert.throws(
    () => gradeSubmission({ principal: student, membership: studentMembership, context, ...base, input: { score: 80, feedback: '' } }),
    (error) => error instanceof LearningAssessmentError && error.code === 'submission_review_denied',
  )
  assert.throws(
    () => gradeSubmission({ principal: instructor, membership: instructorMembership, context, ...base, submission: { ...submission, tenantId: 'tenant-2' }, input: { score: 80, feedback: '' } }),
    (error) => error instanceof LearningAssessmentError && error.code === 'submission_tenant_mismatch',
  )
})

function publishAssignmentFixture() {
  const draft = createAssignment({
    principal: instructor,
    membership: instructorMembership,
    context,
    assignmentId: 'assignment-fixture',
    now: '2026-07-30T10:00:00.000Z',
    input: { title: 'Tarea', instructions: 'Instrucciones', dueAt: '2026-08-10T22:00:00.000Z', maxScore: 100, allowLate: false },
  })
  return publishAssignment({ principal: instructor, membership: instructorMembership, context, assignment: draft, now: '2026-07-30T10:01:00.000Z' })
}
