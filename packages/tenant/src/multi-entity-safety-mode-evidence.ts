import { createHash } from 'node:crypto'

import {
  MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE,
  MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
  type MultiEntityRollbackFlagState,
} from './multi-entity-rollback-drill'
import type { MultiEntityShadowEvaluation } from './multi-entity-shadow'

interface SafetyEvidenceContext {
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
}

export interface MultiEntityFeatureFlagsDefaultOffEvidenceInput extends SafetyEvidenceContext {
  readonly flagState: MultiEntityRollbackFlagState
}

export interface MultiEntityFeatureFlagsDefaultOffEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_feature_flags_default_off_evidence'
  readonly mode: 'content_addressed_configuration_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canEnableFlags: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly flagStateDigest: string
  readonly metrics: {
    readonly knownFlags: 9
    readonly booleanFlags: 8
    readonly enabledBooleanFlags: 0
    readonly authorizationModeDisabled: true
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface MultiEntityAuthorizationShadowEvidenceSample {
  readonly reviewReference: string
  readonly legacyAllowed: boolean
  readonly proposedAllowed: boolean
  readonly observation: MultiEntityShadowEvaluation
}

export interface MultiEntityAuthorizationShadowEvidenceInput extends SafetyEvidenceContext {
  readonly samples: readonly MultiEntityAuthorizationShadowEvidenceSample[]
}

export interface MultiEntityAuthorizationShadowEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_authorization_shadow_evidence'
  readonly mode: 'legacy_effective_four_case_matrix'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canEnforceProposedAuthorization: false
  readonly canActivateAuthorization: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly cases: readonly {
    readonly legacyAllowed: boolean
    readonly proposedAllowed: boolean
    readonly proposedReason: string
    readonly reviewReferenceDigest: string
    readonly observationDigest: string
  }[]
  readonly metrics: {
    readonly requiredCases: 4
    readonly legacyGranted: 2
    readonly legacyDenied: 2
    readonly proposedGranted: 2
    readonly proposedDenied: 2
    readonly divergences: 2
    readonly effectiveDecisionMismatches: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const CONTEXT_KEYS = [
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
] as const
const FLAGS_INPUT_KEYS = new Set([...CONTEXT_KEYS, 'flagState'])
const AUTH_INPUT_KEYS = new Set([...CONTEXT_KEYS, 'samples'])
const FLAG_STATE_KEYS = new Set([
  ...MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
  MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE,
])
const FLAGS_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canEnableFlags',
  'canActivateAuthorization',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'flagStateDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const FLAGS_METRICS_KEYS = new Set([
  'knownFlags',
  'booleanFlags',
  'enabledBooleanFlags',
  'authorizationModeDisabled',
])
const AUTH_SAMPLE_KEYS = new Set([
  'reviewReference',
  'legacyAllowed',
  'proposedAllowed',
  'observation',
])
const OBSERVATION_KEYS = new Set([
  'mode',
  'decisionSource',
  'effectiveAllowed',
  'proposedDecision',
  'divergence',
])
const PROPOSED_DECISION_KEYS = new Set(['allowed', 'reason'])
const PROPOSED_REASONS = new Set([
  'membership_allows',
  'no_active_membership',
  'capability_missing',
  'campus_required',
  'campus_out_of_scope',
])
const AUTH_ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canEnforceProposedAuthorization',
  'canActivateAuthorization',
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
const AUTH_CASE_KEYS = new Set([
  'legacyAllowed',
  'proposedAllowed',
  'proposedReason',
  'reviewReferenceDigest',
  'observationDigest',
])
const AUTH_METRICS_KEYS = new Set([
  'requiredCases',
  'legacyGranted',
  'legacyDenied',
  'proposedGranted',
  'proposedDenied',
  'divergences',
  'effectiveDecisionMismatches',
])

/** Seals the exact known configuration in its maximally disabled state. */
export function createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact(
  input: MultiEntityFeatureFlagsDefaultOffEvidenceInput
): MultiEntityFeatureFlagsDefaultOffEvidenceArtifact {
  validateContext(input, FLAGS_INPUT_KEYS)
  if (
    !input.flagState ||
    typeof input.flagState !== 'object' ||
    !exactKeys(input.flagState, FLAG_STATE_KEYS) ||
    MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS.some((flag) => input.flagState[flag] !== false) ||
    input.flagState[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE] !== 'disabled'
  ) {
    invalidEvidence()
  }
  const flagStateDigest = digest(
    JSON.stringify({
      booleanFlags: MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS.map((flag) => [
        flag,
        input.flagState[flag],
      ]),
      authorizationMode: input.flagState[MULTI_ENTITY_ROLLBACK_AUTHORIZATION_MODE],
    })
  )
  const canonical = flagsPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    flagStateDigest,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityFeatureFlagsDefaultOffEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, FLAGS_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityFeatureFlagsDefaultOffEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_feature_flags_default_off_evidence' ||
    artifact.mode !== 'content_addressed_configuration_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canEnableFlags !== false ||
    artifact.canActivateAuthorization !== false ||
    artifact.canChangePermissions !== false ||
    !validContextDigests(artifact) ||
    !DIGEST_PATTERN.test(artifact.flagStateDigest) ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, FLAGS_METRICS_KEYS) ||
    artifact.metrics.knownFlags !== 9 ||
    artifact.metrics.booleanFlags !== 8 ||
    artifact.metrics.enabledBooleanFlags !== 0 ||
    artifact.metrics.authorizationModeDisabled !== true ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  const canonical = flagsPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    flagStateDigest: artifact.flagStateDigest,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

/** Seals all four legacy/proposed combinations while legacy stays effective. */
export function createMultiEntityAuthorizationShadowEvidenceArtifact(
  input: MultiEntityAuthorizationShadowEvidenceInput
): MultiEntityAuthorizationShadowEvidenceArtifact {
  validateContext(input, AUTH_INPUT_KEYS)
  if (!Array.isArray(input.samples) || input.samples.length !== 4) invalidEvidence()
  const combinations = new Set<string>()
  const reviewReferences = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const cases = input.samples.map((sample) => {
    validateAuthorizationSample(sample)
    const combination = `${sample.legacyAllowed}:${sample.proposedAllowed}`
    if (combinations.has(combination) || reviewReferences.has(sample.reviewReference)) {
      invalidEvidence()
    }
    combinations.add(combination)
    reviewReferences.add(sample.reviewReference)
    return Object.freeze({
      legacyAllowed: sample.legacyAllowed,
      proposedAllowed: sample.proposedAllowed,
      proposedReason: sample.observation.proposedDecision!.reason,
      reviewReferenceDigest: digest(sample.reviewReference),
      observationDigest: digest(JSON.stringify(sample.observation)),
    })
  })
  if (
    !['false:false', 'false:true', 'true:false', 'true:true'].every((key) => combinations.has(key))
  ) {
    invalidEvidence()
  }
  const canonicalCases = Object.freeze(cases.sort(compareCases))
  const canonical = authorizationPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    cases: canonicalCases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertMultiEntityAuthorizationShadowEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityAuthorizationShadowEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, AUTH_ARTIFACT_KEYS)) {
    invalidEvidence()
  }
  const artifact = value as MultiEntityAuthorizationShadowEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_authorization_shadow_evidence' ||
    artifact.mode !== 'legacy_effective_four_case_matrix' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canEnforceProposedAuthorization !== false ||
    artifact.canActivateAuthorization !== false ||
    artifact.canChangePermissions !== false ||
    !validContextDigests(artifact) ||
    !Array.isArray(artifact.cases) ||
    artifact.cases.length !== 4 ||
    !artifact.metrics ||
    !exactKeys(artifact.metrics, AUTH_METRICS_KEYS) ||
    artifact.metrics.requiredCases !== 4 ||
    artifact.metrics.legacyGranted !== 2 ||
    artifact.metrics.legacyDenied !== 2 ||
    artifact.metrics.proposedGranted !== 2 ||
    artifact.metrics.proposedDenied !== 2 ||
    artifact.metrics.divergences !== 2 ||
    artifact.metrics.effectiveDecisionMismatches !== 0 ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  validateCases(artifact.cases)
  const canonical = authorizationPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    cases: artifact.cases,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

function validateAuthorizationSample(sample: MultiEntityAuthorizationShadowEvidenceSample): void {
  const observation = sample?.observation
  if (
    !sample ||
    typeof sample !== 'object' ||
    !exactKeys(sample, AUTH_SAMPLE_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(sample.reviewReference) ||
    typeof sample.legacyAllowed !== 'boolean' ||
    typeof sample.proposedAllowed !== 'boolean' ||
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.mode !== 'shadow' ||
    observation.decisionSource !== 'legacy' ||
    observation.effectiveAllowed !== sample.legacyAllowed ||
    !observation.proposedDecision ||
    typeof observation.proposedDecision !== 'object' ||
    !exactKeys(observation.proposedDecision, PROPOSED_DECISION_KEYS) ||
    observation.proposedDecision.allowed !== sample.proposedAllowed ||
    !PROPOSED_REASONS.has(observation.proposedDecision.reason) ||
    observation.divergence !== (sample.legacyAllowed !== sample.proposedAllowed)
  ) {
    invalidEvidence()
  }
}

function validateCases(cases: MultiEntityAuthorizationShadowEvidenceArtifact['cases']): void {
  const combinations = new Set<string>()
  const reviews = new Set<string>()
  let previous = ''
  for (const entry of cases) {
    const serialized = JSON.stringify(entry)
    const combination = `${entry?.legacyAllowed}:${entry?.proposedAllowed}`
    if (
      !entry ||
      typeof entry !== 'object' ||
      !exactKeys(entry, AUTH_CASE_KEYS) ||
      typeof entry.legacyAllowed !== 'boolean' ||
      typeof entry.proposedAllowed !== 'boolean' ||
      !PROPOSED_REASONS.has(entry.proposedReason) ||
      !DIGEST_PATTERN.test(entry.reviewReferenceDigest) ||
      !DIGEST_PATTERN.test(entry.observationDigest) ||
      combinations.has(combination) ||
      reviews.has(entry.reviewReferenceDigest) ||
      (previous !== '' && previous.localeCompare(serialized) >= 0)
    ) {
      invalidEvidence()
    }
    combinations.add(combination)
    reviews.add(entry.reviewReferenceDigest)
    previous = serialized
  }
  if (
    !['false:false', 'false:true', 'true:false', 'true:true'].every((key) => combinations.has(key))
  ) {
    invalidEvidence()
  }
}

function validateContext(input: SafetyEvidenceContext, expectedKeys: ReadonlySet<string>): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, expectedKeys) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest
  ) {
    invalidEvidence()
  }
}

function flagsPayload(
  input: Pick<
    MultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'flagStateDigest'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_feature_flags_default_off_evidence' as const,
    mode: 'content_addressed_configuration_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canEnableFlags: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    ...input,
    metrics: Object.freeze({
      knownFlags: 9 as const,
      booleanFlags: 8 as const,
      enabledBooleanFlags: 0 as const,
      authorizationModeDisabled: true as const,
    }),
  })
}

function authorizationPayload(
  input: Pick<
    MultiEntityAuthorizationShadowEvidenceArtifact,
    | 'sourceDigest'
    | 'targetTenantDigest'
    | 'campaignReviewReferenceDigest'
    | 'readinessReviewReferenceDigest'
    | 'cases'
  >
) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_authorization_shadow_evidence' as const,
    mode: 'legacy_effective_four_case_matrix' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canEnforceProposedAuthorization: false as const,
    canActivateAuthorization: false as const,
    canChangePermissions: false as const,
    ...input,
    metrics: Object.freeze({
      requiredCases: 4 as const,
      legacyGranted: 2 as const,
      legacyDenied: 2 as const,
      proposedGranted: 2 as const,
      proposedDenied: 2 as const,
      divergences: 2 as const,
      effectiveDecisionMismatches: 0 as const,
    }),
  })
}

function validContextDigests(
  artifact:
    | MultiEntityFeatureFlagsDefaultOffEvidenceArtifact
    | MultiEntityAuthorizationShadowEvidenceArtifact
): boolean {
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
  left: MultiEntityAuthorizationShadowEvidenceArtifact['cases'][number],
  right: MultiEntityAuthorizationShadowEvidenceArtifact['cases'][number]
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

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(artifactDigest: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_SAFETY_MODE_EVIDENCE_INVALID')
}
