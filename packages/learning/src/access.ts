export type LearningCapability =
  | 'assignment.manage'
  | 'assignment.submit'
  | 'attendance.record'
  | 'course.author'
  | 'course.consume'
  | 'grade.publish'
  | 'grade.read-published'
  | 'grade.record'
  | 'submission.read-own'
  | 'submission.review'

export type LearningRole = 'instructor' | 'student'
export type LearningMembershipStatus = 'active' | 'suspended' | 'revoked' | 'completed'

export type LearningPrincipal = {
  userId: string | number
  tenantId: string | number
  active: boolean
  platformRole?: string
}

export type LearningMembership = {
  userId: string | number
  tenantId: string | number
  courseRunId: string | number
  role: LearningRole
  status: LearningMembershipStatus
  staffProfileId?: string | number | null
  studentProfileId?: string | number | null
  validFrom?: string | null
  validUntil?: string | null
}

export type LearningContext = {
  tenantId: string | number
  courseRunId: string | number
  now?: string
}

export type LearningAccess =
  | { allowed: true; capabilities: LearningCapability[] }
  | { allowed: false; reason: string; capabilities: [] }

const INSTRUCTOR_CAPABILITIES: LearningCapability[] = [
  'assignment.manage',
  'attendance.record',
  'course.author',
  'course.consume',
  'grade.publish',
  'grade.record',
  'submission.review',
]

const STUDENT_CAPABILITIES: LearningCapability[] = [
  'assignment.submit',
  'course.consume',
  'grade.read-published',
  'submission.read-own',
]

function sameId(left: string | number, right: string | number) {
  return String(left) === String(right)
}

function denied(reason: string): LearningAccess {
  return { allowed: false, reason, capabilities: [] }
}

function parseBoundary(value: string | null | undefined) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function resolveLearningAccess({
  principal,
  membership,
  context,
}: {
  principal: LearningPrincipal
  membership: LearningMembership | null | undefined
  context: LearningContext
}): LearningAccess {
  if (!principal.active) return denied('principal_inactive')
  if (!membership) return denied('membership_required')
  if (!sameId(principal.tenantId, context.tenantId) || !sameId(membership.tenantId, context.tenantId)) {
    return denied('tenant_mismatch')
  }
  if (!sameId(membership.userId, principal.userId)) return denied('user_mismatch')
  if (!sameId(membership.courseRunId, context.courseRunId)) return denied('course_run_mismatch')
  if (membership.status !== 'active') return denied('membership_inactive')
  if (membership.role !== 'instructor' && membership.role !== 'student') return denied('membership_invalid_role')

  const now = Date.parse(context.now ?? new Date().toISOString())
  const validFrom = parseBoundary(membership.validFrom)
  const validUntil = parseBoundary(membership.validUntil)
  if (!Number.isFinite(now) || Number.isNaN(validFrom) || Number.isNaN(validUntil)) return denied('membership_invalid_window')
  if (validFrom !== null && now < validFrom) return denied('membership_not_started')
  if (validUntil !== null && now > validUntil) return denied('membership_expired')

  if (membership.role === 'instructor') {
    if (membership.staffProfileId === null || membership.staffProfileId === undefined) return denied('staff_profile_required')
    return { allowed: true, capabilities: [...INSTRUCTOR_CAPABILITIES] }
  }

  if (membership.studentProfileId === null || membership.studentProfileId === undefined) return denied('student_profile_required')
  return { allowed: true, capabilities: [...STUDENT_CAPABILITIES] }
}

export function hasLearningCapability(access: LearningAccess, capability: LearningCapability) {
  return access.allowed && access.capabilities.includes(capability)
}
