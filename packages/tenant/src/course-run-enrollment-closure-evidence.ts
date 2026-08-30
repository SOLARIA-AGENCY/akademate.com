import { createHash } from 'node:crypto'

import {
  createRedactedCourseRunEnrollmentClosureObservation,
  planCourseRunEnrollmentClosure,
  type CourseRunEnrollmentClosureInput,
  type CourseRunEnrollmentClosureIssueCode,
  type CourseRunEnrollmentClosurePlan,
  type CourseRunEnrollmentClosureReason,
} from './course-run-enrollment-closure'
import {
  COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT,
  COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG,
  resolveCourseRunEnrollmentClosureRunnerGate,
} from './course-run-enrollment-closure-runner'

export type CourseRunEnrollmentClosureEvidenceRole =
  | 'before_start_open'
  | 'capacity_full_closes'
  | 'sixth_session_open'
  | 'seventh_session_closes'
  | 'cycle_before_deadline_open'
  | 'cycle_after_deadline_closes'
  | 'cycle_missing_deadline_blocked'
  | 'cross_scope_blocked'
  | 'paused_campaign_not_reactivated'

export interface CourseRunEnrollmentClosureEvidenceSample {
  readonly role: CourseRunEnrollmentClosureEvidenceRole
  readonly reviewReference: string
  readonly input: CourseRunEnrollmentClosureInput
}

export interface CourseRunEnrollmentClosureEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly CourseRunEnrollmentClosureEvidenceSample[]
}

export interface CourseRunEnrollmentClosureEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_course_run_enrollment_closure_shadow_evidence'
  readonly mode: 'nine_case_fail_closed_shadow_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canLoadSnapshot: false
  readonly canWrite: false
  readonly canPauseAds: false
  readonly canExecutePause: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly runnerContractDigest: string
  readonly cases: readonly {
    readonly role: CourseRunEnrollmentClosureEvidenceRole
    readonly verdict: 'planned' | 'blocked'
    readonly reason: CourseRunEnrollmentClosureReason
    readonly recommendedEnrollmentStatus: 'open' | 'closed' | 'scheduled' | 'always_open'
    readonly expectedIssue: CourseRunEnrollmentClosureIssueCode | null
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
    readonly metrics: CourseRunEnrollmentClosurePlan['summary']
  }[]
  readonly metrics: {
    readonly requiredCases: 9
    readonly plannedCases: 7
    readonly blockedCases: 2
    readonly openCases: 3
    readonly closedCases: 4
    readonly proposedPauseCases: 3
    readonly runnerGateCases: 4
    readonly runnerBlockedCases: 3
    readonly runnerStagingCases: 1
    readonly snapshotLoads: 0
    readonly writes: 0
    readonly pausesExecuted: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const ROLES: readonly CourseRunEnrollmentClosureEvidenceRole[] = [
  'before_start_open',
  'capacity_full_closes',
  'sixth_session_open',
  'seventh_session_closes',
  'cycle_before_deadline_open',
  'cycle_after_deadline_closes',
  'cycle_missing_deadline_blocked',
  'cross_scope_blocked',
  'paused_campaign_not_reactivated',
]

type SealedCase = CourseRunEnrollmentClosureEvidenceArtifact['cases'][number]

const EXPECTED: Readonly<
  Record<
    CourseRunEnrollmentClosureEvidenceRole,
    Pick<
      SealedCase,
      'verdict' | 'reason' | 'recommendedEnrollmentStatus' | 'expectedIssue' | 'metrics'
    >
  >
> = Object.freeze({
  before_start_open: expected(
    'planned',
    'open_before_start',
    'open',
    null,
    summary(0, 0, 1, 1, 0, 0)
  ),
  capacity_full_closes: expected(
    'planned',
    'capacity_full',
    'closed',
    null,
    summary(0, 0, 1, 1, 1, 0)
  ),
  sixth_session_open: expected(
    'planned',
    'open_within_session_limit',
    'open',
    null,
    summary(7, 6, 1, 1, 0, 0)
  ),
  seventh_session_closes: expected(
    'planned',
    'session_limit_reached',
    'closed',
    null,
    summary(7, 7, 1, 1, 1, 0)
  ),
  cycle_before_deadline_open: expected(
    'planned',
    'open_before_official_deadline',
    'open',
    null,
    summary(0, 0, 1, 1, 0, 0)
  ),
  cycle_after_deadline_closes: expected(
    'planned',
    'official_deadline_passed',
    'closed',
    null,
    summary(0, 0, 1, 1, 1, 0)
  ),
  cycle_missing_deadline_blocked: expected(
    'blocked',
    'blocked',
    'open',
    'official_deadline_missing',
    summary(0, 0, 1, 1, 0, 1)
  ),
  cross_scope_blocked: expected(
    'blocked',
    'blocked',
    'open',
    'scope_mismatch',
    summary(7, 7, 1, 1, 0, 2)
  ),
  paused_campaign_not_reactivated: expected(
    'planned',
    'manual_closure',
    'closed',
    null,
    summary(7, 7, 1, 0, 0, 0)
  ),
})

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set(['role', 'reviewReference', 'input'])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canLoadSnapshot',
  'canWrite',
  'canPauseAds',
  'canExecutePause',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'runnerContractDigest',
  'cases',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const CASE_KEYS = new Set([
  'role',
  'verdict',
  'reason',
  'recommendedEnrollmentStatus',
  'expectedIssue',
  'reviewReferenceDigest',
  'observationDigest',
  'metrics',
])
const SUMMARY_KEYS = new Set([
  'sessions',
  'elapsedSessions',
  'campaigns',
  'activeCampaigns',
  'proposedPauses',
  'issues',
])
const METRICS_KEYS = new Set([
  'requiredCases',
  'plannedCases',
  'blockedCases',
  'openCases',
  'closedCases',
  'proposedPauseCases',
  'runnerGateCases',
  'runnerBlockedCases',
  'runnerStagingCases',
  'snapshotLoads',
  'writes',
  'pausesExecuted',
])

/**
 * Executes nine pure planning cases and the runner gate contract. It never
 * invokes a snapshot loader and exposes no enrollment or Meta write callback.
 */
export function createCourseRunEnrollmentClosureEvidenceArtifact(
  input: CourseRunEnrollmentClosureEvidenceInput
): CourseRunEnrollmentClosureEvidenceArtifact {
  validateInput(input)
  const seenRoles = new Set<CourseRunEnrollmentClosureEvidenceRole>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const cases = input.samples.map((sample) => {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !ROLES.includes(sample.role) ||
      seenRoles.has(sample.role) ||
      !REVIEW_REFERENCE_PATTERN.test(sample.reviewReference) ||
      reviews.has(sample.reviewReference)
    ) {
      invalidEvidence()
    }
    seenRoles.add(sample.role)
    reviews.add(sample.reviewReference)

    let plan: CourseRunEnrollmentClosurePlan
    try {
      plan = planCourseRunEnrollmentClosure(sample.input)
    } catch {
      invalidEvidence()
    }
    validateRole(sample.role, plan)
    const observation = createRedactedCourseRunEnrollmentClosureObservation(plan)
    const expectedCase = EXPECTED[sample.role]
    return Object.freeze({
      role: sample.role,
      verdict: observation.verdict,
      reason: observation.decision.reason,
      recommendedEnrollmentStatus: observation.decision.recommendedEnrollmentStatus,
      expectedIssue: expectedCase.expectedIssue,
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(observation)),
      metrics: Object.freeze({ ...observation.metrics }),
    })
  })
  if (!ROLES.every((role) => seenRoles.has(role))) invalidEvidence()
  const canonicalCases = Object.freeze(cases.sort(compareCases))
  const runnerContractDigest = verifyRunnerContract()
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    runnerContractDigest,
    cases: canonicalCases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertCourseRunEnrollmentClosureEvidenceArtifact(artifact)
  return artifact
}

export function assertCourseRunEnrollmentClosureEvidenceArtifact(
  value: unknown
): asserts value is CourseRunEnrollmentClosureEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as CourseRunEnrollmentClosureEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_course_run_enrollment_closure_shadow_evidence' ||
    artifact.mode !== 'nine_case_fail_closed_shadow_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canLoadSnapshot !== false ||
    artifact.canWrite !== false ||
    artifact.canPauseAds !== false ||
    artifact.canExecutePause !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    !validDigest(artifact.runnerContractDigest) ||
    artifact.runnerContractDigest !== verifyRunnerContract() ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 9 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 9 ||
    artifact.metrics.plannedCases !== 7 ||
    artifact.metrics.blockedCases !== 2 ||
    artifact.metrics.openCases !== 3 ||
    artifact.metrics.closedCases !== 4 ||
    artifact.metrics.proposedPauseCases !== 3 ||
    artifact.metrics.runnerGateCases !== 4 ||
    artifact.metrics.runnerBlockedCases !== 3 ||
    artifact.metrics.runnerStagingCases !== 1 ||
    artifact.metrics.snapshotLoads !== 0 ||
    artifact.metrics.writes !== 0 ||
    artifact.metrics.pausesExecuted !== 0 ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const contextReviews = new Set([
    artifact.campaignReviewReferenceDigest,
    artifact.readinessReviewReferenceDigest,
  ])
  if (
    artifact.cases.some(({ reviewReferenceDigest }) => contextReviews.has(reviewReferenceDigest))
  ) {
    invalidEvidence()
  }
  validateSealedCases(artifact.cases)
  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    runnerContractDigest: artifact.runnerContractDigest,
    cases: artifact.cases,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeCourseRunEnrollmentClosureEvidenceArtifact(
  input: CourseRunEnrollmentClosureEvidenceInput
): string {
  return JSON.stringify(createCourseRunEnrollmentClosureEvidenceArtifact(input))
}

function validateInput(input: CourseRunEnrollmentClosureEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 9
  ) {
    invalidEvidence()
  }
}

function validateRole(
  role: CourseRunEnrollmentClosureEvidenceRole,
  plan: CourseRunEnrollmentClosurePlan
): void {
  const expectedCase = EXPECTED[role]
  const expectedIssues = expectedCase.expectedIssue === null ? [] : [expectedCase.expectedIssue]
  if (
    (plan.ready ? 'planned' : 'blocked') !== expectedCase.verdict ||
    plan.decision.reason !== expectedCase.reason ||
    plan.decision.recommendedEnrollmentStatus !== expectedCase.recommendedEnrollmentStatus ||
    plan.decision.courseOperationalStatusUnchanged !== true ||
    plan.canWrite !== false ||
    plan.canPauseAds !== false ||
    !sameSummary(plan.summary, expectedCase.metrics) ||
    !sameValues([...new Set(plan.issues.map(({ code }) => code))].sort(), expectedIssues.sort())
  ) {
    invalidEvidence()
  }
  if (
    plan.campaignActions.length !== expectedCase.metrics.proposedPauses ||
    plan.campaignActions.some(({ operation }) => operation !== 'propose_pause')
  ) {
    invalidEvidence()
  }
}

function verifyRunnerContract(): string {
  const cases = [
    resolveCourseRunEnrollmentClosureRunnerGate({}),
    resolveCourseRunEnrollmentClosureRunnerGate({
      [COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG]: 'true',
      [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'development',
    }),
    resolveCourseRunEnrollmentClosureRunnerGate({
      [COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG]: 'true',
      [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'production',
    }),
    resolveCourseRunEnrollmentClosureRunnerGate({
      [COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG]: 'true',
      [COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT]: 'staging',
    }),
  ]
  if (
    JSON.stringify(cases) !==
    JSON.stringify([
      { enabled: false, reason: 'flag_disabled' },
      { enabled: false, reason: 'environment_missing_or_invalid' },
      { enabled: false, reason: 'production_forbidden' },
      { enabled: true, reason: 'staging_enabled' },
    ])
  ) {
    invalidEvidence()
  }
  return digest(
    JSON.stringify([
      COURSE_RUN_ENROLLMENT_CLOSURE_SHADOW_FLAG,
      COURSE_RUN_ENROLLMENT_CLOSURE_ENVIRONMENT,
      cases,
    ])
  )
}

function validateSealedCases(cases: CourseRunEnrollmentClosureEvidenceArtifact['cases']): void {
  const roles = new Set<CourseRunEnrollmentClosureEvidenceRole>()
  const reviews = new Set<string>()
  const observations = new Set<string>()
  let previous = ''
  for (const entry of cases) {
    const serialized = JSON.stringify(entry)
    const expectedCase = EXPECTED[entry.role]
    if (
      !entry ||
      typeof entry !== 'object' ||
      !exactKeys(entry, CASE_KEYS) ||
      !ROLES.includes(entry.role) ||
      roles.has(entry.role) ||
      !expectedCase ||
      entry.verdict !== expectedCase.verdict ||
      entry.reason !== expectedCase.reason ||
      entry.recommendedEnrollmentStatus !== expectedCase.recommendedEnrollmentStatus ||
      entry.expectedIssue !== expectedCase.expectedIssue ||
      !validDigest(entry.reviewReferenceDigest) ||
      reviews.has(entry.reviewReferenceDigest) ||
      !validDigest(entry.observationDigest) ||
      observations.has(entry.observationDigest) ||
      !sameSummary(entry.metrics, expectedCase.metrics) ||
      (previous !== '' && previous.localeCompare(serialized) >= 0)
    ) {
      invalidEvidence()
    }
    roles.add(entry.role)
    reviews.add(entry.reviewReferenceDigest)
    observations.add(entry.observationDigest)
    previous = serialized
  }
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly runnerContractDigest: string
  readonly cases: CourseRunEnrollmentClosureEvidenceArtifact['cases']
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_course_run_enrollment_closure_shadow_evidence' as const,
    mode: 'nine_case_fail_closed_shadow_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canLoadSnapshot: false as const,
    canWrite: false as const,
    canPauseAds: false as const,
    canExecutePause: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    runnerContractDigest: input.runnerContractDigest,
    cases: input.cases,
    metrics: Object.freeze({
      requiredCases: 9 as const,
      plannedCases: 7 as const,
      blockedCases: 2 as const,
      openCases: 3 as const,
      closedCases: 4 as const,
      proposedPauseCases: 3 as const,
      runnerGateCases: 4 as const,
      runnerBlockedCases: 3 as const,
      runnerStagingCases: 1 as const,
      snapshotLoads: 0 as const,
      writes: 0 as const,
      pausesExecuted: 0 as const,
    }),
  }
}

function expected(
  verdict: 'planned' | 'blocked',
  reason: CourseRunEnrollmentClosureReason,
  recommendedEnrollmentStatus: 'open' | 'closed' | 'scheduled' | 'always_open',
  expectedIssue: CourseRunEnrollmentClosureIssueCode | null,
  metrics: CourseRunEnrollmentClosurePlan['summary']
) {
  return Object.freeze({
    verdict,
    reason,
    recommendedEnrollmentStatus,
    expectedIssue,
    metrics,
  })
}

function summary(
  sessions: number,
  elapsedSessions: number,
  campaigns: number,
  activeCampaigns: number,
  proposedPauses: number,
  issues: number
): CourseRunEnrollmentClosurePlan['summary'] {
  return Object.freeze({
    sessions,
    elapsedSessions,
    campaigns,
    activeCampaigns,
    proposedPauses,
    issues,
  })
}

function sameSummary(
  left: CourseRunEnrollmentClosurePlan['summary'],
  right: CourseRunEnrollmentClosurePlan['summary']
): boolean {
  return (
    !!left &&
    exactKeys(left, SUMMARY_KEYS) &&
    Object.keys(right).every(
      (key) => left[key as keyof typeof left] === right[key as keyof typeof right]
    )
  )
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function compareCases(left: SealedCase, right: SealedCase): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

function exactKeys(value: object, expectedKeys: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expectedKeys.size &&
    keys.every((key) => expectedKeys.has(key)) &&
    [...expectedKeys].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('COURSE_RUN_ENROLLMENT_CLOSURE_EVIDENCE_INVALID')
}
