import { createHash } from 'node:crypto'

import type { EntityScopedRecordType } from './multi-entity-backfill'
import {
  MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE,
  MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
  createRedactedMultiEntityRollbackObservation,
  planMultiEntityRollbackDrill,
  type MultiEntityRollbackDrillInput,
  type MultiEntityRollbackDrillPlan,
  type MultiEntityRollbackIssueCode,
} from './multi-entity-rollback-drill'

export type MultiEntityRollbackRehearsalRole =
  | 'full_reversible'
  | 'access_drift_blocked'
  | 'cross_tenant_blocked'
  | 'changed_record_blocked'

export interface MultiEntityRollbackRehearsalEvidenceSample {
  readonly role: MultiEntityRollbackRehearsalRole
  readonly reviewReference: string
  readonly drillInput: MultiEntityRollbackDrillInput
}

export interface MultiEntityRollbackRehearsalEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly MultiEntityRollbackRehearsalEvidenceSample[]
}

export interface MultiEntityRollbackRehearsalEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_rollback_rehearsal_evidence'
  readonly mode: 'four_case_fail_closed_rehearsal'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canWrite: false
  readonly canApply: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly accessBaselineDigest: string
  readonly cases: readonly {
    readonly role: MultiEntityRollbackRehearsalRole
    readonly verdict: 'ready_for_staging_rehearsal' | 'blocked'
    readonly expectedIssue: MultiEntityRollbackIssueCode | null
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
    readonly metrics: MultiEntityRollbackDrillPlan['summary']
  }[]
  readonly metrics: {
    readonly requiredCases: 4
    readonly readyCases: 1
    readonly blockedCases: 3
    readonly knownFlagsExercised: 9
    readonly recordTypesExercised: 6
    readonly negativeCases: 3
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const RECORD_TYPES: readonly EntityScopedRecordType[] = [
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
]
const ROLES: readonly MultiEntityRollbackRehearsalRole[] = [
  'full_reversible',
  'access_drift_blocked',
  'cross_tenant_blocked',
  'changed_record_blocked',
]
const EXPECTED_ISSUE: Readonly<
  Record<MultiEntityRollbackRehearsalRole, MultiEntityRollbackIssueCode | null>
> = Object.freeze({
  full_reversible: null,
  access_drift_blocked: 'access_baseline_changed',
  cross_tenant_blocked: 'record_outside_target_tenant',
  changed_record_blocked: 'record_changed_since_backfill',
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
const SAMPLE_KEYS = new Set(['role', 'reviewReference', 'drillInput'])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canWrite',
  'canApply',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'accessBaselineDigest',
  'cases',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const CASE_KEYS = new Set([
  'role',
  'verdict',
  'expectedIssue',
  'reviewReferenceDigest',
  'observationDigest',
  'metrics',
])
const CASE_METRICS_KEYS = new Set([
  'knownFlags',
  'flagsToDisable',
  'totalRecords',
  'reversibleRecords',
  'alreadyRestoredRecords',
  'conflictedRecords',
  'issues',
])
const METRICS_KEYS = new Set([
  'requiredCases',
  'readyCases',
  'blockedCases',
  'knownFlagsExercised',
  'recordTypesExercised',
  'negativeCases',
])

/**
 * Executes four pure rollback plans and seals their redacted observations. It
 * has no persistence callback and cannot apply any planned action.
 */
export function createMultiEntityRollbackRehearsalEvidenceArtifact(
  input: MultiEntityRollbackRehearsalEvidenceInput
): MultiEntityRollbackRehearsalEvidenceArtifact {
  validateInput(input)
  const seenRoles = new Set<MultiEntityRollbackRehearsalRole>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const cases = input.samples.map((sample) => {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !ROLES.includes(sample.role) ||
      seenRoles.has(sample.role) ||
      !REVIEW_REFERENCE_PATTERN.test(sample.reviewReference) ||
      reviews.has(sample.reviewReference) ||
      sample.drillInput?.reviewReference !== sample.reviewReference
    ) {
      invalidEvidence()
    }
    seenRoles.add(sample.role)
    reviews.add(sample.reviewReference)

    let plan: MultiEntityRollbackDrillPlan
    try {
      plan = planMultiEntityRollbackDrill(sample.drillInput)
    } catch {
      invalidEvidence()
    }
    validateRole(sample.role, sample.drillInput, plan)
    const observation = createRedactedMultiEntityRollbackObservation(plan)
    return Object.freeze({
      role: sample.role,
      verdict: observation.verdict,
      expectedIssue: EXPECTED_ISSUE[sample.role],
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(observation)),
      metrics: Object.freeze({ ...observation.metrics }),
    })
  })
  if (!ROLES.every((role) => seenRoles.has(role))) invalidEvidence()
  const canonicalCases = Object.freeze(cases.sort(compareCases))
  const fullRehearsal = input.samples.find(({ role }) => role === 'full_reversible')!
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    accessBaselineDigest: fullRehearsal.drillInput.accessBaseline.capturedDigest,
    cases: canonicalCases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityRollbackRehearsalEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityRollbackRehearsalEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityRollbackRehearsalEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_rollback_rehearsal_evidence' ||
    artifact.mode !== 'four_case_fail_closed_rehearsal' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validContextDigests(artifact) ||
    !DIGEST_PATTERN.test(artifact.accessBaselineDigest) ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 4 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 4 ||
    artifact.metrics.readyCases !== 1 ||
    artifact.metrics.blockedCases !== 3 ||
    artifact.metrics.knownFlagsExercised !== 9 ||
    artifact.metrics.recordTypesExercised !== 6 ||
    artifact.metrics.negativeCases !== 3 ||
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
    accessBaselineDigest: artifact.accessBaselineDigest,
    cases: artifact.cases,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

function validateInput(input: MultiEntityRollbackRehearsalEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 4
  ) {
    invalidEvidence()
  }
}

function validateRole(
  role: MultiEntityRollbackRehearsalRole,
  input: MultiEntityRollbackDrillInput,
  plan: MultiEntityRollbackDrillPlan
): void {
  if (role === 'full_reversible') {
    const recordTypes = new Set(input.records.map(({ recordType }) => recordType))
    if (
      !allControlsActive(input) ||
      input.accessBaseline.capturedDigest !== input.accessBaseline.currentDigest ||
      input.records.length !== 6 ||
      !RECORD_TYPES.every((recordType) => recordTypes.has(recordType)) ||
      input.records.some(
        (record) =>
          record.tenantId !== input.targetTenantId ||
          record.currentLegalEntityId !== record.expectedLegalEntityId
      ) ||
      !plan.ready ||
      plan.summary.flagsToDisable !== 9 ||
      plan.summary.reversibleRecords !== 6 ||
      plan.summary.conflictedRecords !== 0 ||
      plan.summary.issues !== 0
    ) {
      invalidEvidence()
    }
    return
  }

  if (!allControlsOff(input) || plan.ready || plan.issues.length !== 1) {
    invalidEvidence()
  }
  const expectedIssue = EXPECTED_ISSUE[role]
  if (plan.issues[0]!.code !== expectedIssue) invalidEvidence()

  if (role === 'access_drift_blocked') {
    if (
      input.accessBaseline.capturedDigest === input.accessBaseline.currentDigest ||
      input.records.length !== 0 ||
      plan.summary.totalRecords !== 0 ||
      plan.summary.conflictedRecords !== 0
    ) {
      invalidEvidence()
    }
    return
  }

  if (
    input.accessBaseline.capturedDigest !== input.accessBaseline.currentDigest ||
    input.records.length !== 1 ||
    plan.summary.totalRecords !== 1 ||
    plan.summary.reversibleRecords !== 0 ||
    plan.summary.conflictedRecords !== 1
  ) {
    invalidEvidence()
  }
  const record = input.records[0]!
  if (
    role === 'cross_tenant_blocked' &&
    (record.tenantId === input.targetTenantId ||
      record.currentLegalEntityId !== record.expectedLegalEntityId)
  ) {
    invalidEvidence()
  }
  if (
    role === 'changed_record_blocked' &&
    (record.tenantId !== input.targetTenantId ||
      record.currentLegalEntityId === null ||
      record.currentLegalEntityId === record.expectedLegalEntityId)
  ) {
    invalidEvidence()
  }
}

function allControlsActive(input: MultiEntityRollbackDrillInput): boolean {
  return (
    MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS.every((flag) => input.flagState[flag] === true) &&
    input.flagState[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] === 'shadow'
  )
}

function allControlsOff(input: MultiEntityRollbackDrillInput): boolean {
  return (
    MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS.every((flag) => input.flagState[flag] === false) &&
    input.flagState[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] === 'disabled'
  )
}

function validateSealedCases(cases: MultiEntityRollbackRehearsalEvidenceArtifact['cases']): void {
  const roles = new Set<MultiEntityRollbackRehearsalRole>()
  const reviews = new Set<string>()
  let previous = ''
  for (const entry of cases) {
    const serialized = JSON.stringify(entry)
    if (
      !entry ||
      typeof entry !== 'object' ||
      !exactKeys(entry, CASE_KEYS) ||
      !ROLES.includes(entry.role) ||
      roles.has(entry.role) ||
      entry.expectedIssue !== EXPECTED_ISSUE[entry.role] ||
      !DIGEST_PATTERN.test(entry.reviewReferenceDigest) ||
      reviews.has(entry.reviewReferenceDigest) ||
      !DIGEST_PATTERN.test(entry.observationDigest) ||
      !validCaseMetrics(entry.role, entry.verdict, entry.metrics) ||
      (previous !== '' && previous.localeCompare(serialized) >= 0)
    ) {
      invalidEvidence()
    }
    roles.add(entry.role)
    reviews.add(entry.reviewReferenceDigest)
    previous = serialized
  }
  if (!ROLES.every((role) => roles.has(role))) invalidEvidence()
}

function validCaseMetrics(
  role: MultiEntityRollbackRehearsalRole,
  verdict: 'ready_for_staging_rehearsal' | 'blocked',
  metrics: MultiEntityRollbackDrillPlan['summary']
): boolean {
  if (
    !metrics ||
    !exactKeys(metrics, CASE_METRICS_KEYS) ||
    metrics.knownFlags !== 9 ||
    ![
      metrics.flagsToDisable,
      metrics.totalRecords,
      metrics.reversibleRecords,
      metrics.alreadyRestoredRecords,
      metrics.conflictedRecords,
      metrics.issues,
    ].every(nonNegativeInteger)
  ) {
    return false
  }
  if (role === 'full_reversible') {
    return (
      verdict === 'ready_for_staging_rehearsal' &&
      metrics.flagsToDisable === 9 &&
      metrics.totalRecords === 6 &&
      metrics.reversibleRecords === 6 &&
      metrics.alreadyRestoredRecords === 0 &&
      metrics.conflictedRecords === 0 &&
      metrics.issues === 0
    )
  }
  if (role === 'access_drift_blocked') {
    return (
      verdict === 'blocked' &&
      metrics.flagsToDisable === 0 &&
      metrics.totalRecords === 0 &&
      metrics.reversibleRecords === 0 &&
      metrics.alreadyRestoredRecords === 0 &&
      metrics.conflictedRecords === 0 &&
      metrics.issues === 1
    )
  }
  return (
    verdict === 'blocked' &&
    metrics.flagsToDisable === 0 &&
    metrics.totalRecords === 1 &&
    metrics.reversibleRecords === 0 &&
    metrics.alreadyRestoredRecords === 0 &&
    metrics.conflictedRecords === 1 &&
    metrics.issues === 1
  )
}

function artifactPayload(
  input: Pick<
    MultiEntityRollbackRehearsalEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'accessBaselineDigest'
    | 'cases'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_rollback_rehearsal_evidence' as const,
    mode: 'four_case_fail_closed_rehearsal' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canWrite: false as const,
    canApply: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    ...input,
    metrics: Object.freeze({
      requiredCases: 4 as const,
      readyCases: 1 as const,
      blockedCases: 3 as const,
      knownFlagsExercised: 9 as const,
      recordTypesExercised: 6 as const,
      negativeCases: 3 as const,
    }),
  })
}

function validContextDigests(artifact: MultiEntityRollbackRehearsalEvidenceArtifact): boolean {
  return (
    [
      artifact.sourceDigest,
      artifact.targetTenantDigest,
      artifact.campaignReviewReferenceDigest,
      artifact.readinessReviewReferenceDigest,
      artifact.artifactDigest,
    ].every((value) => DIGEST_PATTERN.test(value)) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    artifact.campaignReviewReferenceDigest !== artifact.readinessReviewReferenceDigest
  )
}

function compareCases(
  left: MultiEntityRollbackRehearsalEvidenceArtifact['cases'][number],
  right: MultiEntityRollbackRehearsalEvidenceArtifact['cases'][number]
): number {
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

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(artifactDigest: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID')
}
