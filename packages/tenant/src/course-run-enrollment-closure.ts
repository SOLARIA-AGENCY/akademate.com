export const COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS = 6 as const
export const COURSE_RUN_ENROLLMENT_TIME_ZONE = 'Europe/Madrid' as const

export type CourseRunEnrollmentClosureReason =
  | 'open_before_start'
  | 'open_within_session_limit'
  | 'open_before_official_deadline'
  | 'scheduled'
  | 'capacity_full'
  | 'session_limit_reached'
  | 'official_deadline_passed'
  | 'manual_closure'
  | 'operational_closure'
  | 'blocked'

export type CourseRunEnrollmentClosureIssueCode =
  | 'scope_mismatch'
  | 'capacity_invalid'
  | 'official_deadline_missing'
  | 'session_calendar_missing'
  | 'session_calendar_incomplete'
  | 'unsupported_training_type'

export interface CourseRunEnrollmentClosureScope {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly courseRunId: string
}

export interface CourseRunEnrollmentClosureCourseRun extends CourseRunEnrollmentClosureScope {
  readonly trainingType: 'private' | 'fped' | 'cycle' | 'other'
  readonly operationalStatus:
    | 'draft'
    | 'published'
    | 'enrollment_open'
    | 'enrollment_closed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
  readonly enrollmentStatus: 'open' | 'closed' | 'scheduled' | 'always_open'
  readonly startDate: string
  readonly maxStudents: number
  readonly currentEnrollments: number
  readonly officialEnrollmentDeadline?: string
}

export interface CourseRunEnrollmentClosureSession extends CourseRunEnrollmentClosureScope {
  readonly id: string
  readonly startsAt: string
  readonly status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
}

export interface CourseRunEnrollmentClosureCampaign extends CourseRunEnrollmentClosureScope {
  readonly id: string
  readonly status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
}

export interface CourseRunEnrollmentClosureInput {
  readonly scope: CourseRunEnrollmentClosureScope
  readonly now: string
  readonly courseRun: CourseRunEnrollmentClosureCourseRun
  readonly sessions: readonly CourseRunEnrollmentClosureSession[]
  readonly campaigns: readonly CourseRunEnrollmentClosureCampaign[]
}

export interface CourseRunEnrollmentClosureIssue {
  readonly code: CourseRunEnrollmentClosureIssueCode
  readonly surface: 'course_run' | 'session' | 'campaign'
}

export interface CourseRunEnrollmentClosurePlan {
  readonly mode: 'shadow_enrollment_closure'
  readonly canWrite: false
  readonly canPauseAds: false
  readonly ready: boolean
  readonly decision: {
    readonly currentEnrollmentStatus: CourseRunEnrollmentClosureCourseRun['enrollmentStatus']
    readonly recommendedEnrollmentStatus: CourseRunEnrollmentClosureCourseRun['enrollmentStatus']
    readonly reason: CourseRunEnrollmentClosureReason
    readonly elapsedSessions: number
    readonly maxJoinedSessions: 6
    readonly courseOperationalStatusUnchanged: true
  }
  readonly campaignActions: readonly {
    readonly campaignId: string
    readonly operation: 'propose_pause'
    readonly reason: Exclude<
      CourseRunEnrollmentClosureReason,
      | 'open_before_start'
      | 'open_within_session_limit'
      | 'open_before_official_deadline'
      | 'scheduled'
      | 'blocked'
    >
  }[]
  readonly issues: readonly CourseRunEnrollmentClosureIssue[]
  readonly summary: {
    readonly sessions: number
    readonly elapsedSessions: number
    readonly campaigns: number
    readonly activeCampaigns: number
    readonly proposedPauses: number
    readonly issues: number
  }
}

export interface RedactedCourseRunEnrollmentClosureObservation {
  readonly schemaVersion: 1
  readonly kind: 'cep_course_run_enrollment_closure_shadow'
  readonly mode: 'shadow_observation'
  readonly verdict: 'planned' | 'blocked'
  readonly canWrite: false
  readonly canPauseAds: false
  readonly decision: {
    readonly recommendedEnrollmentStatus: CourseRunEnrollmentClosureCourseRun['enrollmentStatus']
    readonly reason: CourseRunEnrollmentClosureReason
    readonly courseOperationalStatusUnchanged: true
  }
  readonly metrics: CourseRunEnrollmentClosurePlan['summary']
}

const INPUT_KEYS = new Set(['scope', 'now', 'courseRun', 'sessions', 'campaigns'])
const SCOPE_KEYS = new Set(['tenantId', 'legalEntityId', 'courseRunId'])
const COURSE_RUN_KEYS = new Set([
  ...SCOPE_KEYS,
  'trainingType',
  'operationalStatus',
  'enrollmentStatus',
  'startDate',
  'maxStudents',
  'currentEnrollments',
  'officialEnrollmentDeadline',
])
const SESSION_KEYS = new Set([...SCOPE_KEYS, 'id', 'startsAt', 'status'])
const CAMPAIGN_KEYS = new Set([...SCOPE_KEYS, 'id', 'status'])
const TRAINING_TYPES = new Set(['private', 'fped', 'cycle', 'other'])
const OPERATIONAL_STATUSES = new Set([
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
])
const ENROLLMENT_STATUSES = new Set(['open', 'closed', 'scheduled', 'always_open'])
const SESSION_STATUSES = new Set(['scheduled', 'completed', 'cancelled', 'rescheduled'])
const CAMPAIGN_STATUSES = new Set(['draft', 'active', 'paused', 'completed', 'archived'])
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const OFFSET_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/
const MAX_RECORDS = 10_000

/**
 * Calculates the future enrollment and advertising decision without mutating
 * the course run, enrollments or campaigns. The sixth session remains open;
 * closure occurs when the seventh non-cancelled session starts.
 */
export function planCourseRunEnrollmentClosure(
  input: CourseRunEnrollmentClosureInput
): CourseRunEnrollmentClosurePlan {
  validateInput(input)
  const issues = collectIssues(input)
  const now = new Date(input.now)
  const sessions = [...input.sessions]
    .filter((session) => session.status !== 'cancelled')
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
  const elapsedSessions = sessions.filter(
    (session) => Date.parse(session.startsAt) <= now.getTime()
  ).length

  const ready = issues.length === 0
  const decision = ready
    ? decide(input.courseRun, sessions.length, elapsedSessions, now)
    : {
        currentEnrollmentStatus: input.courseRun.enrollmentStatus,
        recommendedEnrollmentStatus: input.courseRun.enrollmentStatus,
        reason: 'blocked' as const,
        elapsedSessions,
        maxJoinedSessions: COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS,
        courseOperationalStatusUnchanged: true as const,
      }
  const activeCampaigns = input.campaigns.filter((campaign) => campaign.status === 'active')
  const shouldPause =
    ready &&
    decision.recommendedEnrollmentStatus === 'closed' &&
    !['blocked', 'scheduled'].includes(decision.reason)
  const campaignActions = shouldPause
    ? activeCampaigns
        .map((campaign) => ({
          campaignId: campaign.id,
          operation: 'propose_pause' as const,
          reason:
            decision.reason as CourseRunEnrollmentClosurePlan['campaignActions'][number]['reason'],
        }))
        .sort((left, right) => left.campaignId.localeCompare(right.campaignId))
    : []

  const frozenIssues = Object.freeze(issues.map((issue) => Object.freeze(issue)))
  const frozenActions = Object.freeze(campaignActions.map((action) => Object.freeze(action)))
  const summary = Object.freeze({
    sessions: input.sessions.length,
    elapsedSessions,
    campaigns: input.campaigns.length,
    activeCampaigns: activeCampaigns.length,
    proposedPauses: frozenActions.length,
    issues: frozenIssues.length,
  })

  return Object.freeze({
    mode: 'shadow_enrollment_closure',
    canWrite: false,
    canPauseAds: false,
    ready,
    decision: Object.freeze(decision),
    campaignActions: frozenActions,
    issues: frozenIssues,
    summary,
  })
}

export function createRedactedCourseRunEnrollmentClosureObservation(
  plan: CourseRunEnrollmentClosurePlan
): RedactedCourseRunEnrollmentClosureObservation {
  validatePlan(plan)
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_course_run_enrollment_closure_shadow',
    mode: 'shadow_observation',
    verdict: plan.ready ? 'planned' : 'blocked',
    canWrite: false,
    canPauseAds: false,
    decision: Object.freeze({
      recommendedEnrollmentStatus: plan.decision.recommendedEnrollmentStatus,
      reason: plan.decision.reason,
      courseOperationalStatusUnchanged: true,
    }),
    metrics: Object.freeze({ ...plan.summary }),
  })
}

function decide(
  run: CourseRunEnrollmentClosureCourseRun,
  usableSessions: number,
  elapsedSessions: number,
  now: Date
): CourseRunEnrollmentClosurePlan['decision'] {
  const base = {
    currentEnrollmentStatus: run.enrollmentStatus,
    elapsedSessions,
    maxJoinedSessions: COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS,
    courseOperationalStatusUnchanged: true as const,
  }
  if (['completed', 'cancelled'].includes(run.operationalStatus)) {
    return { ...base, recommendedEnrollmentStatus: 'closed', reason: 'operational_closure' }
  }
  if (run.operationalStatus === 'draft') {
    return { ...base, recommendedEnrollmentStatus: 'scheduled', reason: 'scheduled' }
  }
  if (run.enrollmentStatus === 'closed' || run.operationalStatus === 'enrollment_closed') {
    return { ...base, recommendedEnrollmentStatus: 'closed', reason: 'manual_closure' }
  }
  if (run.currentEnrollments >= run.maxStudents) {
    return { ...base, recommendedEnrollmentStatus: 'closed', reason: 'capacity_full' }
  }
  if (run.enrollmentStatus === 'scheduled' && now.getTime() < Date.parse(run.startDate)) {
    return { ...base, recommendedEnrollmentStatus: 'scheduled', reason: 'scheduled' }
  }
  if (run.trainingType === 'cycle') {
    const today = dateKey(now)
    if (today > run.officialEnrollmentDeadline!) {
      return {
        ...base,
        recommendedEnrollmentStatus: 'closed',
        reason: 'official_deadline_passed',
      }
    }
    return {
      ...base,
      recommendedEnrollmentStatus: 'open',
      reason: 'open_before_official_deadline',
    }
  }
  if (now.getTime() < Date.parse(run.startDate)) {
    return { ...base, recommendedEnrollmentStatus: 'open', reason: 'open_before_start' }
  }
  if (usableSessions >= COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS + 1 && elapsedSessions >= 7) {
    return {
      ...base,
      recommendedEnrollmentStatus: 'closed',
      reason: 'session_limit_reached',
    }
  }
  return {
    ...base,
    recommendedEnrollmentStatus: 'open',
    reason: 'open_within_session_limit',
  }
}

function collectIssues(input: CourseRunEnrollmentClosureInput): CourseRunEnrollmentClosureIssue[] {
  const issues: CourseRunEnrollmentClosureIssue[] = []
  if (!sameScope(input.scope, input.courseRun)) {
    issues.push({ code: 'scope_mismatch', surface: 'course_run' })
  }
  for (const session of input.sessions) {
    if (!sameScope(input.scope, session)) {
      issues.push({ code: 'scope_mismatch', surface: 'session' })
    }
  }
  for (const campaign of input.campaigns) {
    if (!sameScope(input.scope, campaign)) {
      issues.push({ code: 'scope_mismatch', surface: 'campaign' })
    }
  }
  if (
    !Number.isSafeInteger(input.courseRun.maxStudents) ||
    input.courseRun.maxStudents <= 0 ||
    !Number.isSafeInteger(input.courseRun.currentEnrollments) ||
    input.courseRun.currentEnrollments < 0 ||
    input.courseRun.currentEnrollments > input.courseRun.maxStudents
  ) {
    issues.push({ code: 'capacity_invalid', surface: 'course_run' })
  }
  if (input.courseRun.trainingType === 'cycle') {
    if (!validDateOnly(input.courseRun.officialEnrollmentDeadline)) {
      issues.push({ code: 'official_deadline_missing', surface: 'course_run' })
    }
  } else if (input.courseRun.trainingType === 'other') {
    issues.push({ code: 'unsupported_training_type', surface: 'course_run' })
  } else if (Date.parse(input.now) >= Date.parse(input.courseRun.startDate)) {
    const usableSessions = input.sessions.filter((session) => session.status !== 'cancelled')
    if (usableSessions.length === 0) {
      issues.push({ code: 'session_calendar_missing', surface: 'session' })
    } else if (usableSessions.length < COURSE_RUN_ENROLLMENT_MAX_JOINED_SESSIONS + 1) {
      issues.push({ code: 'session_calendar_incomplete', surface: 'session' })
    }
  }
  return issues.sort((left, right) =>
    `${left.surface}:${left.code}`.localeCompare(`${right.surface}:${right.code}`)
  )
}

function validateInput(input: CourseRunEnrollmentClosureInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !exactKeys(input.scope, SCOPE_KEYS) ||
    !validScope(input.scope) ||
    !validOffsetDateTime(input.now) ||
    !validCourseRun(input.courseRun) ||
    !Array.isArray(input.sessions) ||
    input.sessions.length > MAX_RECORDS ||
    input.sessions.some((session) => !validSession(session)) ||
    new Set(input.sessions.map((session) => session.id)).size !== input.sessions.length ||
    !Array.isArray(input.campaigns) ||
    input.campaigns.length > MAX_RECORDS ||
    input.campaigns.some((campaign) => !validCampaign(campaign)) ||
    new Set(input.campaigns.map((campaign) => campaign.id)).size !== input.campaigns.length
  ) {
    throw closureError('COURSE_RUN_ENROLLMENT_CLOSURE_INPUT_INVALID')
  }
}

function validCourseRun(value: CourseRunEnrollmentClosureCourseRun): boolean {
  return (
    !!value &&
    exactKeys(value, COURSE_RUN_KEYS) &&
    validScope(value) &&
    TRAINING_TYPES.has(value.trainingType) &&
    OPERATIONAL_STATUSES.has(value.operationalStatus) &&
    ENROLLMENT_STATUSES.has(value.enrollmentStatus) &&
    validOffsetDateTime(value.startDate) &&
    typeof value.maxStudents === 'number' &&
    typeof value.currentEnrollments === 'number' &&
    (value.officialEnrollmentDeadline === undefined ||
      validDateOnly(value.officialEnrollmentDeadline))
  )
}

function validSession(value: CourseRunEnrollmentClosureSession): boolean {
  return (
    !!value &&
    exactKeys(value, SESSION_KEYS) &&
    validScope(value) &&
    validIdentifier(value.id) &&
    validOffsetDateTime(value.startsAt) &&
    SESSION_STATUSES.has(value.status)
  )
}

function validCampaign(value: CourseRunEnrollmentClosureCampaign): boolean {
  return (
    !!value &&
    exactKeys(value, CAMPAIGN_KEYS) &&
    validScope(value) &&
    validIdentifier(value.id) &&
    CAMPAIGN_STATUSES.has(value.status)
  )
}

function validScope(value: CourseRunEnrollmentClosureScope): boolean {
  return (
    !!value &&
    validIdentifier(value.tenantId) &&
    validIdentifier(value.legalEntityId) &&
    validIdentifier(value.courseRunId)
  )
}

function sameScope(
  expected: CourseRunEnrollmentClosureScope,
  actual: CourseRunEnrollmentClosureScope
): boolean {
  return (
    expected.tenantId === actual.tenantId &&
    expected.legalEntityId === actual.legalEntityId &&
    expected.courseRunId === actual.courseRunId
  )
}

function validatePlan(plan: CourseRunEnrollmentClosurePlan): void {
  if (
    !plan ||
    plan.mode !== 'shadow_enrollment_closure' ||
    plan.canWrite !== false ||
    plan.canPauseAds !== false ||
    plan.summary.issues !== plan.issues.length ||
    plan.summary.proposedPauses !== plan.campaignActions.length ||
    plan.ready !== (plan.issues.length === 0)
  ) {
    throw closureError('COURSE_RUN_ENROLLMENT_CLOSURE_PLAN_INVALID')
  }
}

function dateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COURSE_RUN_ENROLLMENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function validOffsetDateTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    OFFSET_DATE_TIME_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function validDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function exactKeys(value: object, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key))
}

function closureError(code: string): Error & { readonly code: string } {
  return Object.assign(new Error('Course-run enrollment closure input is invalid.'), { code })
}
