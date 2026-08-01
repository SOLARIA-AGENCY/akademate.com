import { hasLearningCapability, resolveLearningAccess, type LearningContext, type LearningMembership, type LearningPrincipal } from './access.ts'

export class LearningAssessmentError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'LearningAssessmentError'
    this.code = code
  }
}

export type AssignmentRecord = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  createdByUserId: string | number
  title: string
  instructions: string
  dueAt: string | null
  maxScore: number
  allowLate: boolean
  status: 'draft' | 'published' | 'closed'
  createdAt: string
  publishedAt: string | null
}

export type SubmissionRecord = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  assignmentId: string | number
  studentUserId: string | number
  clientSubmissionId: string
  body: string
  attachmentIds: Array<string | number>
  status: 'submitted' | 'returned' | 'graded'
  submittedAt: string
  attemptNumber: number
}

export type GradeRecord = {
  id: string | number
  tenantId: string | number
  courseRunId: string | number
  assignmentId: string | number
  submissionId: string | number
  studentUserId: string | number
  graderUserId: string | number
  score: number
  maxScore: number
  feedback: string
  status: 'draft' | 'published'
  gradedAt: string
  publishedAt: string | null
}

function fail(code: string): never {
  throw new LearningAssessmentError(code)
}

function sameId(left: string | number, right: string | number) {
  return String(left) === String(right)
}

function requiredId(value: unknown, code: string): asserts value is string | number {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) fail(code)
}

function timestamp(value: string, code: string) {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) fail(code)
  return parsed.toISOString()
}

function accessFor(principal: LearningPrincipal, membership: LearningMembership | null | undefined, context: LearningContext) {
  const access = resolveLearningAccess({ principal, membership, context })
  if (access.allowed === false) fail(access.reason)
  return access
}

function assertAssignmentScope(assignment: AssignmentRecord, context: LearningContext) {
  if (!sameId(assignment.tenantId, context.tenantId)) fail('assignment_tenant_mismatch')
  if (!sameId(assignment.courseRunId, context.courseRunId)) fail('assignment_course_run_mismatch')
}

export function createAssignment({ principal, membership, context, assignmentId, now, input }: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
  assignmentId: string | number
  now: string
  input: { title: string; instructions: string; dueAt: string | null; maxScore: number; allowLate: boolean }
}): AssignmentRecord {
  const access = accessFor(principal, membership, context)
  if (!hasLearningCapability(access, 'assignment.manage')) fail('assignment_manage_denied')
  requiredId(assignmentId, 'assignment_id_invalid')
  const createdAt = timestamp(now, 'assignment_timestamp_invalid')
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const instructions = typeof input.instructions === 'string' ? input.instructions.trim() : ''
  if (!title || title.length > 200) fail('assignment_title_invalid')
  if (!instructions || instructions.length > 20_000) fail('assignment_instructions_invalid')
  if (!Number.isFinite(input.maxScore) || input.maxScore <= 0 || input.maxScore > 1_000) fail('assignment_max_score_invalid')
  const dueAt = input.dueAt === null ? null : timestamp(input.dueAt, 'assignment_due_at_invalid')
  if (typeof input.allowLate !== 'boolean') fail('assignment_late_policy_invalid')

  return {
    id: assignmentId,
    tenantId: principal.tenantId,
    courseRunId: context.courseRunId,
    createdByUserId: principal.userId,
    title,
    instructions,
    dueAt,
    maxScore: input.maxScore,
    allowLate: input.allowLate,
    status: 'draft',
    createdAt,
    publishedAt: null,
  }
}

export function publishAssignment({ principal, membership, context, assignment, now }: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
  assignment: AssignmentRecord
  now: string
}): AssignmentRecord {
  const access = accessFor(principal, membership, context)
  if (!hasLearningCapability(access, 'assignment.manage')) fail('assignment_manage_denied')
  assertAssignmentScope(assignment, context)
  if (assignment.status !== 'draft') fail('assignment_publish_invalid_state')
  return { ...assignment, status: 'published', publishedAt: timestamp(now, 'assignment_timestamp_invalid') }
}

export function submitAssignment({ principal, membership, context, assignment, submissionId, now, input }: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
  assignment: AssignmentRecord
  submissionId: string | number
  now: string
  input: { clientSubmissionId: string; body?: string; attachmentIds?: Array<string | number> }
}): SubmissionRecord {
  const access = accessFor(principal, membership, context)
  if (!hasLearningCapability(access, 'assignment.submit')) fail('assignment_submit_denied')
  assertAssignmentScope(assignment, context)
  if (assignment.status !== 'published') fail('assignment_not_open')
  requiredId(submissionId, 'submission_id_invalid')
  const submittedAt = timestamp(now, 'submission_timestamp_invalid')
  if (assignment.dueAt && Date.parse(submittedAt) > Date.parse(assignment.dueAt) && !assignment.allowLate) fail('assignment_due')
  if (typeof input.clientSubmissionId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(input.clientSubmissionId)) {
    fail('client_submission_id_invalid')
  }
  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (body.length > 50_000) fail('submission_body_too_long')
  const attachmentIds = input.attachmentIds ?? []
  if (!Array.isArray(attachmentIds) || attachmentIds.some((id) => (typeof id !== 'string' && typeof id !== 'number') || !String(id).trim())) {
    fail('submission_attachment_invalid')
  }
  if (attachmentIds.length > 20) fail('submission_attachments_too_many')
  if (new Set(attachmentIds.map(String)).size !== attachmentIds.length) fail('submission_attachments_duplicate')
  if (!body && attachmentIds.length === 0) fail('submission_content_required')

  return {
    id: submissionId,
    tenantId: principal.tenantId,
    courseRunId: context.courseRunId,
    assignmentId: assignment.id,
    studentUserId: principal.userId,
    clientSubmissionId: input.clientSubmissionId,
    body,
    attachmentIds: [...attachmentIds],
    status: 'submitted',
    submittedAt,
    attemptNumber: 1,
  }
}

export function gradeSubmission({ principal, membership, context, assignment, submission, gradeId, now, input }: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
  assignment: AssignmentRecord
  submission: SubmissionRecord
  gradeId: string | number
  now: string
  input: { score: number; feedback: string }
}): GradeRecord {
  const access = accessFor(principal, membership, context)
  if (!hasLearningCapability(access, 'submission.review')) fail('submission_review_denied')
  if (!hasLearningCapability(access, 'grade.record')) fail('grade_record_denied')
  assertAssignmentScope(assignment, context)
  if (!sameId(submission.tenantId, context.tenantId)) fail('submission_tenant_mismatch')
  if (!sameId(submission.courseRunId, context.courseRunId)) fail('submission_course_run_mismatch')
  if (!sameId(submission.assignmentId, assignment.id)) fail('submission_assignment_mismatch')
  if (submission.status !== 'submitted' && submission.status !== 'returned') fail('submission_not_reviewable')
  requiredId(gradeId, 'grade_id_invalid')
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > assignment.maxScore) fail('grade_score_invalid')
  const feedback = typeof input.feedback === 'string' ? input.feedback.trim() : ''
  if (feedback.length > 20_000) fail('grade_feedback_too_long')

  return {
    id: gradeId,
    tenantId: principal.tenantId,
    courseRunId: context.courseRunId,
    assignmentId: assignment.id,
    submissionId: submission.id,
    studentUserId: submission.studentUserId,
    graderUserId: principal.userId,
    score: input.score,
    maxScore: assignment.maxScore,
    feedback,
    status: 'draft',
    gradedAt: timestamp(now, 'grade_timestamp_invalid'),
    publishedAt: null,
  }
}

export function publishGrade({ principal, membership, context, grade, now }: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
  grade: GradeRecord
  now: string
}): GradeRecord {
  const access = accessFor(principal, membership, context)
  if (!hasLearningCapability(access, 'grade.publish')) fail('grade_publish_denied')
  if (!sameId(grade.tenantId, context.tenantId)) fail('grade_tenant_mismatch')
  if (!sameId(grade.courseRunId, context.courseRunId)) fail('grade_course_run_mismatch')
  if (grade.status !== 'draft') fail('grade_publish_invalid_state')
  return { ...grade, status: 'published', publishedAt: timestamp(now, 'grade_timestamp_invalid') }
}
