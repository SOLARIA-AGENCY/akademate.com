import { createHash } from 'node:crypto'

import type {
  NominalPermissionLockedPhase,
  NominalPermissionPhaseLockObservation,
  NominalPermissionRequestedAction,
} from './multi-entity-nominal-permission-phase-lock'

export interface NominalPermissionPhaseLockEvidenceSample {
  readonly phase: NominalPermissionLockedPhase
  readonly requestedAction: NominalPermissionRequestedAction
  readonly reviewReference: string
  readonly observation: NominalPermissionPhaseLockObservation
}

export interface NominalPermissionPhaseLockEvidenceInput {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly NominalPermissionPhaseLockEvidenceSample[]
}

export interface NominalPermissionPhaseLockEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_nominal_permission_phase_lock_evidence'
  readonly mode: 'max_permissive_deny_matrix'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canGenerateNominalMatrix: false
  readonly canApplyPermissionChange: false
  readonly canBulkChangePermissions: false
  readonly canUsePlatformSuperadmin: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly {
    readonly phase: NominalPermissionLockedPhase
    readonly requestedAction: NominalPermissionRequestedAction
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
  }[]
  readonly metrics: {
    readonly requiredCases: 4
    readonly lockedCases: 4
    readonly phases: 2
    readonly requestedActions: 2
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const PHASES = ['implementation', 'staging_validation'] as const
const ACTIONS = ['generate_nominal_matrix', 'apply_permission_change'] as const
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set(['phase', 'requestedAction', 'reviewReference', 'observation'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canGenerateNominalMatrix',
  'canApplyPermissionChange',
  'canBulkChangePermissions',
  'canUsePlatformSuperadmin',
  'requiresManualPerUserRollback',
  'reasons',
  'metrics',
])
const OBSERVATION_METRICS_KEYS = new Set([
  'blockingReasons',
  'accessBaselineUnchanged',
  'stagingBundleReadyForReview',
  'authorizationDisabled',
])
const CASE_KEYS = new Set([
  'phase',
  'requestedAction',
  'reviewReferenceDigest',
  'observationDigest',
])
const METRICS_KEYS = new Set(['requiredCases', 'lockedCases', 'phases', 'requestedActions'])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canGenerateNominalMatrix',
  'canApplyPermissionChange',
  'canBulkChangePermissions',
  'canUsePlatformSuperadmin',
  'canBindAutomatically',
  'canMarkVerified',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'cases',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])

/**
 * Seals the four maximally permissive deny-only cases. This artifact can prove
 * only that the implementation/staging contract remained locked for both
 * nominal actions at the bound source digest; it cannot unlock a later phase.
 */
export function createNominalPermissionPhaseLockEvidenceArtifact(
  input: NominalPermissionPhaseLockEvidenceInput
): NominalPermissionPhaseLockEvidenceArtifact {
  validateInput(input)
  const cases = input.samples
    .map((sample) =>
      Object.freeze({
        phase: sample.phase,
        requestedAction: sample.requestedAction,
        reviewReferenceDigest: digest(sample.reviewReference),
        observationDigest: digest(JSON.stringify(expectedObservation(sample.requestedAction))),
      })
    )
    .sort(compareCases)
  const canonical = canonicalArtifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    cases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertNominalPermissionPhaseLockEvidenceArtifact(
  value: unknown
): asserts value is NominalPermissionPhaseLockEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as NominalPermissionPhaseLockEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_nominal_permission_phase_lock_evidence' ||
    artifact.mode !== 'max_permissive_deny_matrix' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canGenerateNominalMatrix !== false ||
    artifact.canApplyPermissionChange !== false ||
    artifact.canBulkChangePermissions !== false ||
    artifact.canUsePlatformSuperadmin !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validBoundDigests(artifact) ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 4 ||
    !artifact.metrics ||
    typeof artifact.metrics !== 'object' ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 4 ||
    artifact.metrics.lockedCases !== 4 ||
    artifact.metrics.phases !== 2 ||
    artifact.metrics.requestedActions !== 2
  ) {
    invalidEvidence()
  }
  validateSealedCases(artifact.cases)
  const canonical = canonicalArtifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    cases: artifact.cases,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeNominalPermissionPhaseLockEvidenceArtifact(
  input: NominalPermissionPhaseLockEvidenceInput
): string {
  return JSON.stringify(createNominalPermissionPhaseLockEvidenceArtifact(input))
}

function validateInput(input: NominalPermissionPhaseLockEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !validReviewReference(input.campaignReviewReference) ||
    !validReviewReference(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !Array.isArray(input.samples) ||
    input.samples.length !== 4
  ) {
    invalidEvidence()
  }
  const combinations = new Set<string>()
  const reviewReferences = new Set([input.campaignReviewReference, input.readinessReviewReference])
  for (const sample of input.samples) {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !PHASES.includes(sample.phase) ||
      !ACTIONS.includes(sample.requestedAction) ||
      !validReviewReference(sample.reviewReference) ||
      reviewReferences.has(sample.reviewReference)
    ) {
      invalidEvidence()
    }
    const key = caseKey(sample)
    if (combinations.has(key)) invalidEvidence()
    combinations.add(key)
    reviewReferences.add(sample.reviewReference)
    validateObservation(sample.observation, sample.requestedAction)
  }
  if (expectedCaseKeys().some((key) => !combinations.has(key))) invalidEvidence()
}

function validateObservation(
  observation: NominalPermissionPhaseLockObservation,
  action: NominalPermissionRequestedAction
): void {
  const expected = expectedObservation(action)
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== expected.schemaVersion ||
    observation.kind !== expected.kind ||
    observation.mode !== expected.mode ||
    observation.verdict !== expected.verdict ||
    observation.canGenerateNominalMatrix !== false ||
    observation.canApplyPermissionChange !== false ||
    observation.canBulkChangePermissions !== false ||
    observation.canUsePlatformSuperadmin !== false ||
    observation.requiresManualPerUserRollback !== true ||
    !Array.isArray(observation.reasons) ||
    observation.reasons.length !== expected.reasons.length ||
    observation.reasons.some((reason, index) => reason !== expected.reasons[index]) ||
    !observation.metrics ||
    typeof observation.metrics !== 'object' ||
    !exactKeys(observation.metrics, OBSERVATION_METRICS_KEYS) ||
    JSON.stringify(observation.metrics) !== JSON.stringify(expected.metrics)
  ) {
    invalidEvidence()
  }
}

function validateSealedCases(
  cases: readonly NominalPermissionPhaseLockEvidenceArtifact['cases'][number][]
): void {
  const keys = new Set<string>()
  const references = new Set<string>()
  let previous: NominalPermissionPhaseLockEvidenceArtifact['cases'][number] | undefined
  for (const current of cases) {
    if (
      !current ||
      typeof current !== 'object' ||
      !exactKeys(current, CASE_KEYS) ||
      !PHASES.includes(current.phase) ||
      !ACTIONS.includes(current.requestedAction) ||
      !DIGEST_PATTERN.test(current.reviewReferenceDigest) ||
      !DIGEST_PATTERN.test(current.observationDigest) ||
      current.observationDigest !==
        digest(JSON.stringify(expectedObservation(current.requestedAction))) ||
      references.has(current.reviewReferenceDigest) ||
      (previous !== undefined && compareCases(previous, current) >= 0)
    ) {
      invalidEvidence()
    }
    const key = caseKey(current)
    if (keys.has(key)) invalidEvidence()
    keys.add(key)
    references.add(current.reviewReferenceDigest)
    previous = current
  }
  if (expectedCaseKeys().some((key) => !keys.has(key))) invalidEvidence()
}

function expectedObservation(
  action: NominalPermissionRequestedAction
): NominalPermissionPhaseLockObservation {
  return {
    schemaVersion: 1,
    kind: 'cep_nominal_permission_phase_lock',
    mode: 'deny_only_during_implementation',
    verdict: 'locked',
    canGenerateNominalMatrix: false,
    canApplyPermissionChange: false,
    canBulkChangePermissions: false,
    canUsePlatformSuperadmin: false,
    requiresManualPerUserRollback: true,
    reasons: [
      'final_solution_validation_not_proven',
      'explicit_manual_authorization_missing',
      'manual_per_user_rollback_not_approved',
      'platform_superadmin_not_business_authority',
      action === 'generate_nominal_matrix'
        ? 'matrix_generation_forbidden_during_implementation'
        : 'permission_application_forbidden_during_implementation',
    ],
    metrics: {
      blockingReasons: 5,
      accessBaselineUnchanged: true,
      stagingBundleReadyForReview: true,
      authorizationDisabled: true,
    },
  }
}

function canonicalArtifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly NominalPermissionPhaseLockEvidenceArtifact['cases'][number][]
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_nominal_permission_phase_lock_evidence' as const,
    mode: 'max_permissive_deny_matrix' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canGenerateNominalMatrix: false as const,
    canApplyPermissionChange: false as const,
    canBulkChangePermissions: false as const,
    canUsePlatformSuperadmin: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    cases: Object.freeze(input.cases.map((item) => Object.freeze({ ...item }))),
    metrics: Object.freeze({
      requiredCases: 4 as const,
      lockedCases: 4 as const,
      phases: 2 as const,
      requestedActions: 2 as const,
    }),
  })
}

function expectedCaseKeys(): string[] {
  return PHASES.flatMap((phase) =>
    ACTIONS.map((requestedAction) => `${phase}\u0000${requestedAction}`)
  )
}

function caseKey(
  value: Pick<NominalPermissionPhaseLockEvidenceSample, 'phase' | 'requestedAction'>
) {
  return `${value.phase}\u0000${value.requestedAction}`
}

function compareCases(
  left: Pick<NominalPermissionPhaseLockEvidenceSample, 'phase' | 'requestedAction'>,
  right: Pick<NominalPermissionPhaseLockEvidenceSample, 'phase' | 'requestedAction'>
): number {
  return caseKey(left).localeCompare(caseKey(right))
}

function validBoundDigests(artifact: NominalPermissionPhaseLockEvidenceArtifact): boolean {
  return (
    DIGEST_PATTERN.test(artifact.sourceDigest) &&
    DIGEST_PATTERN.test(artifact.targetTenantDigest) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) &&
    DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) &&
    artifact.campaignReviewReferenceDigest !== artifact.readinessReviewReferenceDigest &&
    DIGEST_PATTERN.test(artifact.artifactDigest) &&
    artifact.evidenceReference === evidenceReference(artifact.artifactDigest)
  )
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_EVIDENCE_INVALID')
}
