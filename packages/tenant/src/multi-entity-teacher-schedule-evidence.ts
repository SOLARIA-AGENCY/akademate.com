import { createHash } from 'node:crypto'

import {
  createRedactedTeacherScheduleObservation,
  type RedactedTeacherScheduleObservation,
} from './multi-entity-teacher-schedule-observability'
import {
  planPayloadTeacherScheduleShadow,
  type PayloadTeacherScheduleProjectionIssueCode,
  type PayloadTeacherScheduleSnapshot,
} from './multi-entity-teacher-schedule-projection'
import {
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG,
  resolveTeacherScheduleShadowRunnerGate,
} from './multi-entity-teacher-schedule-runner'
import type { MultiEntityTeacherScheduleIssueCode } from './multi-entity-teacher-schedule'

export type TeacherScheduleShadowEvidenceRole =
  | 'shared_non_overlapping_ready'
  | 'shared_overlapping_blocked'
  | 'adjacent_slots_ready'
  | 'different_teacher_overlap_ready'
  | 'missing_assignment_blocked'
  | 'ambiguous_assignment_blocked'
  | 'cross_tenant_blocked'
  | 'cancelled_overlap_ignored'

export interface TeacherScheduleShadowEvidenceSample {
  readonly role: TeacherScheduleShadowEvidenceRole
  readonly reviewReference: string
  readonly snapshot: PayloadTeacherScheduleSnapshot
}

export interface TeacherScheduleShadowEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly TeacherScheduleShadowEvidenceSample[]
}

export interface TeacherScheduleShadowEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_teacher_schedule_shadow_evidence'
  readonly mode: 'eight_case_shared_teacher_schedule_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canLoadSnapshot: false
  readonly canWrite: false
  readonly canApply: false
  readonly canAssignTeacher: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly runnerContractDigest: string
  readonly cases: readonly {
    readonly role: TeacherScheduleShadowEvidenceRole
    readonly verdict: 'ready' | 'blocked'
    readonly expectedProjectionIssue: PayloadTeacherScheduleProjectionIssueCode | null
    readonly expectedValidationIssue: MultiEntityTeacherScheduleIssueCode | null
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
    readonly projection: RedactedTeacherScheduleObservation['projection']
    readonly validation: RedactedTeacherScheduleObservation['validation']
  }[]
  readonly metrics: {
    readonly requiredCases: 8
    readonly readyCases: 4
    readonly blockedCases: 4
    readonly projectionBlockedCases: 3
    readonly validationConflictCases: 1
    readonly sharedTeacherReadyCases: 2
    readonly runnerGateCases: 4
    readonly runnerBlockedCases: 3
    readonly runnerStagingCases: 1
    readonly snapshotLoads: 0
    readonly writes: 0
    readonly assignmentsChanged: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

type SealedCase = TeacherScheduleShadowEvidenceArtifact['cases'][number]
type RoleExpectation = Pick<
  SealedCase,
  'verdict' | 'expectedProjectionIssue' | 'expectedValidationIssue'
>

const ROLES: readonly TeacherScheduleShadowEvidenceRole[] = [
  'shared_non_overlapping_ready',
  'shared_overlapping_blocked',
  'adjacent_slots_ready',
  'different_teacher_overlap_ready',
  'missing_assignment_blocked',
  'ambiguous_assignment_blocked',
  'cross_tenant_blocked',
  'cancelled_overlap_ignored',
]
const EXPECTED: Readonly<Record<TeacherScheduleShadowEvidenceRole, RoleExpectation>> =
  Object.freeze({
    shared_non_overlapping_ready: expectation('ready', null, null),
    shared_overlapping_blocked: expectation('blocked', null, 'teacher_schedule_overlap'),
    adjacent_slots_ready: expectation('ready', null, null),
    different_teacher_overlap_ready: expectation('ready', null, null),
    missing_assignment_blocked: expectation('blocked', 'staff_assignment_missing', null),
    ambiguous_assignment_blocked: expectation('blocked', 'staff_assignment_ambiguous', null),
    cross_tenant_blocked: expectation('blocked', 'record_outside_target_tenant', null),
    cancelled_overlap_ignored: expectation('ready', null, null),
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
const SAMPLE_KEYS = new Set(['role', 'reviewReference', 'snapshot'])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canLoadSnapshot',
  'canWrite',
  'canApply',
  'canAssignTeacher',
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
  'expectedProjectionIssue',
  'expectedValidationIssue',
  'reviewReferenceDigest',
  'observationDigest',
  'projection',
  'validation',
])
const PROJECTION_KEYS = new Set([
  'sourceCourseRuns',
  'projectedCourseRuns',
  'blockedCourseRuns',
  'outsideTargetTenant',
  'unresolvedAssignments',
  'courseRunsWithoutTeachers',
  'topologyIssues',
  'issues',
])
const VALIDATION_KEYS = new Set([
  'activeCourseRuns',
  'conflictEligibleCourseRuns',
  'teacherBookings',
  'blockedCourseRuns',
  'conflicts',
  'issues',
])
const METRICS_KEYS = new Set([
  'requiredCases',
  'readyCases',
  'blockedCases',
  'projectionBlockedCases',
  'validationConflictCases',
  'sharedTeacherReadyCases',
  'runnerGateCases',
  'runnerBlockedCases',
  'runnerStagingCases',
  'snapshotLoads',
  'writes',
  'assignmentsChanged',
])

/** Executes the projection and validator over eight reviewed, identifier-free cases. */
export function createTeacherScheduleShadowEvidenceArtifact(
  input: TeacherScheduleShadowEvidenceInput
): TeacherScheduleShadowEvidenceArtifact {
  validateInput(input)
  const seenRoles = new Set<TeacherScheduleShadowEvidenceRole>()
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
    let observation: RedactedTeacherScheduleObservation
    try {
      observation = createRedactedTeacherScheduleObservation(
        planPayloadTeacherScheduleShadow(sample.snapshot)
      )
    } catch {
      invalidEvidence()
    }
    validateRole(sample.role, observation)
    const expected = EXPECTED[sample.role]
    return Object.freeze({
      role: sample.role,
      verdict: observation.verdict,
      expectedProjectionIssue: expected.expectedProjectionIssue,
      expectedValidationIssue: expected.expectedValidationIssue,
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(observation)),
      projection: Object.freeze({ ...observation.projection }),
      validation: Object.freeze({ ...observation.validation }),
    })
  })
  if (!ROLES.every((role) => seenRoles.has(role))) invalidEvidence()
  const canonicalCases = Object.freeze(cases.sort(compareCases))
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    runnerContractDigest: verifyRunnerContract(),
    cases: canonicalCases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertTeacherScheduleShadowEvidenceArtifact(artifact)
  return artifact
}

export function assertTeacherScheduleShadowEvidenceArtifact(
  value: unknown
): asserts value is TeacherScheduleShadowEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as TeacherScheduleShadowEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_teacher_schedule_shadow_evidence' ||
    artifact.mode !== 'eight_case_shared_teacher_schedule_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canLoadSnapshot !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canAssignTeacher !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validDigest(artifact.sourceDigest) ||
    !validDigest(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !validDigest(artifact.campaignReviewReferenceDigest) ||
    !validDigest(artifact.readinessReviewReferenceDigest) ||
    artifact.campaignReviewReferenceDigest === artifact.readinessReviewReferenceDigest ||
    artifact.runnerContractDigest !== verifyRunnerContract() ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 8 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 8 ||
    artifact.metrics.readyCases !== 4 ||
    artifact.metrics.blockedCases !== 4 ||
    artifact.metrics.projectionBlockedCases !== 3 ||
    artifact.metrics.validationConflictCases !== 1 ||
    artifact.metrics.sharedTeacherReadyCases !== 2 ||
    artifact.metrics.runnerGateCases !== 4 ||
    artifact.metrics.runnerBlockedCases !== 3 ||
    artifact.metrics.runnerStagingCases !== 1 ||
    artifact.metrics.snapshotLoads !== 0 ||
    artifact.metrics.writes !== 0 ||
    artifact.metrics.assignmentsChanged !== 0 ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
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

export function serializeTeacherScheduleShadowEvidenceArtifact(
  input: TeacherScheduleShadowEvidenceInput
): string {
  return JSON.stringify(createTeacherScheduleShadowEvidenceArtifact(input))
}

function validateInput(input: TeacherScheduleShadowEvidenceInput): void {
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
    input.samples.length !== 8
  ) {
    invalidEvidence()
  }
}

function validateRole(
  role: TeacherScheduleShadowEvidenceRole,
  observation: RedactedTeacherScheduleObservation
): void {
  const expected = EXPECTED[role]
  const projectionIssues = Object.keys(observation.projectionIssueCounts)
  const validationIssues = Object.keys(observation.validationIssueCounts)
  if (
    observation.verdict !== expected.verdict ||
    (expected.expectedProjectionIssue === null
      ? projectionIssues.length !== 0
      : observation.projectionIssueCounts[expected.expectedProjectionIssue] !== 1) ||
    (expected.expectedValidationIssue === null
      ? validationIssues.length !== 0
      : observation.validationIssueCounts[expected.expectedValidationIssue] !== 1)
  ) {
    invalidEvidence()
  }
  if (role === 'shared_non_overlapping_ready' || role === 'adjacent_slots_ready') {
    if (
      observation.projection.projectedCourseRuns !== 2 ||
      observation.validation.teacherBookings !== 2 ||
      observation.validation.conflicts !== 0
    ) {
      invalidEvidence()
    }
  } else if (role === 'shared_overlapping_blocked') {
    if (
      observation.projection.projectedCourseRuns !== 2 ||
      observation.validation.conflicts !== 1 ||
      observation.validation.blockedCourseRuns !== 2
    ) {
      invalidEvidence()
    }
  } else if (role === 'different_teacher_overlap_ready') {
    if (observation.validation.teacherBookings !== 2 || observation.validation.conflicts !== 0) {
      invalidEvidence()
    }
  } else if (role === 'missing_assignment_blocked') {
    if (
      observation.projection.unresolvedAssignments !== 1 ||
      observation.projection.courseRunsWithoutTeachers !== 1
    ) {
      invalidEvidence()
    }
  } else if (role === 'ambiguous_assignment_blocked') {
    if (
      observation.projection.unresolvedAssignments !== 1 ||
      observation.projection.courseRunsWithoutTeachers !== 1
    ) {
      invalidEvidence()
    }
  } else if (role === 'cross_tenant_blocked') {
    if (
      observation.projection.projectedCourseRuns !== 0 ||
      observation.projection.outsideTargetTenant !== 1
    ) {
      invalidEvidence()
    }
  } else if (
    observation.validation.activeCourseRuns !== 1 ||
    observation.validation.conflictEligibleCourseRuns !== 1 ||
    observation.validation.conflicts !== 0
  ) {
    invalidEvidence()
  }
}

function verifyRunnerContract(): string {
  const cases = [
    resolveTeacherScheduleShadowRunnerGate({}),
    resolveTeacherScheduleShadowRunnerGate({
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'development',
    }),
    resolveTeacherScheduleShadowRunnerGate({
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'production',
    }),
    resolveTeacherScheduleShadowRunnerGate({
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG]: 'true',
      [MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
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
      MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_FLAG,
      MULTI_ENTITY_TEACHER_SCHEDULE_SHADOW_RUNNER_ENVIRONMENT,
      cases,
    ])
  )
}

function validateSealedCases(cases: TeacherScheduleShadowEvidenceArtifact['cases']): void {
  const roles = new Set<TeacherScheduleShadowEvidenceRole>()
  const reviews = new Set<string>()
  let previous = ''
  for (const entry of cases) {
    const serialized = JSON.stringify(entry)
    const expected = EXPECTED[entry.role]
    if (
      !entry ||
      typeof entry !== 'object' ||
      !exactKeys(entry, CASE_KEYS) ||
      !ROLES.includes(entry.role) ||
      roles.has(entry.role) ||
      !expected ||
      entry.verdict !== expected.verdict ||
      entry.expectedProjectionIssue !== expected.expectedProjectionIssue ||
      entry.expectedValidationIssue !== expected.expectedValidationIssue ||
      !validDigest(entry.reviewReferenceDigest) ||
      reviews.has(entry.reviewReferenceDigest) ||
      !validDigest(entry.observationDigest) ||
      !validMetricObject(entry.projection, PROJECTION_KEYS) ||
      !validMetricObject(entry.validation, VALIDATION_KEYS) ||
      (previous !== '' && previous.localeCompare(serialized) >= 0)
    ) {
      invalidEvidence()
    }
    validateRole(entry.role, {
      mode: 'shadow_teacher_schedule_observation',
      verdict: entry.verdict,
      projection: entry.projection,
      validation: entry.validation,
      projectionIssueCounts:
        entry.expectedProjectionIssue === null ? {} : { [entry.expectedProjectionIssue]: 1 },
      validationIssueCounts:
        entry.expectedValidationIssue === null ? {} : { [entry.expectedValidationIssue]: 1 },
    })
    roles.add(entry.role)
    reviews.add(entry.reviewReferenceDigest)
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
  readonly cases: TeacherScheduleShadowEvidenceArtifact['cases']
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_teacher_schedule_shadow_evidence' as const,
    mode: 'eight_case_shared_teacher_schedule_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canLoadSnapshot: false as const,
    canWrite: false as const,
    canApply: false as const,
    canAssignTeacher: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    runnerContractDigest: input.runnerContractDigest,
    cases: input.cases,
    metrics: Object.freeze({
      requiredCases: 8 as const,
      readyCases: 4 as const,
      blockedCases: 4 as const,
      projectionBlockedCases: 3 as const,
      validationConflictCases: 1 as const,
      sharedTeacherReadyCases: 2 as const,
      runnerGateCases: 4 as const,
      runnerBlockedCases: 3 as const,
      runnerStagingCases: 1 as const,
      snapshotLoads: 0 as const,
      writes: 0 as const,
      assignmentsChanged: 0 as const,
    }),
  }
}

function expectation(
  verdict: 'ready' | 'blocked',
  expectedProjectionIssue: PayloadTeacherScheduleProjectionIssueCode | null,
  expectedValidationIssue: MultiEntityTeacherScheduleIssueCode | null
): RoleExpectation {
  return Object.freeze({ verdict, expectedProjectionIssue, expectedValidationIssue })
}

function validMetricObject(value: object, keys: ReadonlySet<string>): boolean {
  return exactKeys(value, keys) && Object.values(value).every(nonNegativeInteger)
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function compareCases(left: SealedCase, right: SealedCase): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
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
  throw new Error('TEACHER_SCHEDULE_SHADOW_EVIDENCE_INVALID')
}
