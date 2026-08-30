import { createHash } from 'node:crypto'

import {
  FINANCE_ISOLATION_AUDIT_FLAG,
  type FinanceIsolationAuditObservation,
} from './isolation-audit'

export const FINANCE_ISOLATION_EVIDENCE_CASE_ROLES = [
  'three_entity_isolated',
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

export type FinanceIsolationEvidenceCaseRole =
  (typeof FINANCE_ISOLATION_EVIDENCE_CASE_ROLES)[number]

export interface FinanceIsolationStagingEvidenceSample {
  readonly role: FinanceIsolationEvidenceCaseRole
  readonly runReviewReference: string
  readonly observation: FinanceIsolationAuditObservation
}

export interface FinanceIsolationStagingEvidenceInput {
  readonly executionEnvironment: 'staging'
  readonly runnerFlag: typeof FINANCE_ISOLATION_AUDIT_FLAG
  readonly runnerFlagValue: true
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly samples: readonly FinanceIsolationStagingEvidenceSample[]
}

export interface FinanceIsolationCaseEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_isolation_case_evidence'
  readonly role: FinanceIsolationEvidenceCaseRole
  readonly verdict: 'isolated_observed' | 'breach_rejected'
  readonly runReviewReferenceDigest: string
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface FinanceIsolationStagingEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_finance_isolation_staging_evidence'
  readonly mode: 'four_case_content_addressed_isolation_matrix'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly metrics: {
    readonly requiredCases: 4
    readonly observedCases: 4
    readonly isolatedCases: 1
    readonly rejectedCases: 3
    readonly expectedEntities: 3
    readonly requiredPositiveSurfaces: 15
  }
  readonly cases: readonly FinanceIsolationCaseEvidenceArtifact[]
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'executionEnvironment',
  'runnerFlag',
  'runnerFlagValue',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'samples',
])
const SAMPLE_KEYS = new Set(['role', 'runReviewReference', 'observation'])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'verdict',
  'canWrite',
  'canApply',
  'metrics',
])
const OBSERVATION_METRIC_KEYS = new Set([
  'expectedEntities',
  'evaluatedEntities',
  'evaluatedSurfaces',
  'isolationBreaches',
])
const CASE_KEYS = new Set([
  'schemaVersion',
  'kind',
  'role',
  'verdict',
  'runReviewReferenceDigest',
  'observationDigest',
  'artifactDigest',
  'evidenceReference',
])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'artifactDigest',
  'evidenceReference',
  'metrics',
  'cases',
])
const MANIFEST_METRIC_KEYS = new Set([
  'requiredCases',
  'observedCases',
  'isolatedCases',
  'rejectedCases',
  'expectedEntities',
  'requiredPositiveSurfaces',
])

/**
 * Seals a redacted positive isolation observation and three reviewed negative
 * observations. Scenario roles are review classifications; this artifact does
 * not claim that staging ran and cannot itself mark readiness verified.
 */
export function createFinanceIsolationStagingEvidenceManifest(
  input: FinanceIsolationStagingEvidenceInput
): FinanceIsolationStagingEvidenceManifest {
  validateInput(input)
  const campaignReviewReferenceDigest = digest(input.campaignReviewReference)
  const readinessReviewReferenceDigest = digest(input.readinessReviewReference)
  const cases = Object.freeze(
    input.samples
      .map((sample) => createCaseArtifact(sample))
      .sort((left, right) => left.role.localeCompare(right.role))
  )
  const metrics = Object.freeze({
    requiredCases: 4 as const,
    observedCases: 4 as const,
    isolatedCases: 1 as const,
    rejectedCases: 3 as const,
    expectedEntities: 3 as const,
    requiredPositiveSurfaces: 15 as const,
  })
  const canonical = canonicalManifest({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest,
    readinessReviewReferenceDigest,
    metrics,
    cases,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

export function assertFinanceIsolationStagingEvidenceManifest(
  value: unknown
): asserts value is FinanceIsolationStagingEvidenceManifest {
  if (!value || typeof value !== 'object' || !exactKeys(value, MANIFEST_KEYS)) invalidEvidence()
  const manifest = value as FinanceIsolationStagingEvidenceManifest
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_finance_isolation_staging_evidence' ||
    manifest.mode !== 'four_case_content_addressed_isolation_matrix' ||
    manifest.verdict !== 'eligible_for_manual_staging_binding' ||
    manifest.canBindAutomatically !== false ||
    manifest.canMarkVerified !== false ||
    manifest.canDeploy !== false ||
    manifest.canActivate !== false ||
    manifest.canChangePermissions !== false ||
    !validBoundDigests(manifest) ||
    !manifest.metrics ||
    typeof manifest.metrics !== 'object' ||
    !exactKeys(manifest.metrics, MANIFEST_METRIC_KEYS) ||
    manifest.metrics.requiredCases !== 4 ||
    manifest.metrics.observedCases !== 4 ||
    manifest.metrics.isolatedCases !== 1 ||
    manifest.metrics.rejectedCases !== 3 ||
    manifest.metrics.expectedEntities !== 3 ||
    manifest.metrics.requiredPositiveSurfaces !== 15 ||
    !Array.isArray(manifest.cases) ||
    manifest.cases.length !== 4
  ) {
    invalidEvidence()
  }

  const roles = new Set<FinanceIsolationEvidenceCaseRole>()
  const reviewDigests = new Set<string>([
    manifest.campaignReviewReferenceDigest,
    manifest.readinessReviewReferenceDigest,
  ])
  const observationDigests = new Set<string>()
  let previousRole = ''
  for (const artifact of manifest.cases) {
    assertCaseArtifact(artifact)
    if (
      (previousRole && previousRole.localeCompare(artifact.role) >= 0) ||
      roles.has(artifact.role) ||
      reviewDigests.has(artifact.runReviewReferenceDigest) ||
      observationDigests.has(artifact.observationDigest)
    ) {
      invalidEvidence()
    }
    previousRole = artifact.role
    roles.add(artifact.role)
    reviewDigests.add(artifact.runReviewReferenceDigest)
    observationDigests.add(artifact.observationDigest)
  }
  if (FINANCE_ISOLATION_EVIDENCE_CASE_ROLES.some((role) => !roles.has(role))) invalidEvidence()

  const canonical = canonicalManifest({
    sourceDigest: manifest.sourceDigest,
    targetTenantDigest: manifest.targetTenantDigest,
    campaignReviewReferenceDigest: manifest.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: manifest.readinessReviewReferenceDigest,
    metrics: manifest.metrics,
    cases: manifest.cases,
  })
  if (
    manifest.artifactDigest !== digest(JSON.stringify(canonical)) ||
    manifest.evidenceReference !== evidenceReference(manifest.artifactDigest)
  ) {
    invalidEvidence()
  }
}

export function serializeFinanceIsolationStagingEvidenceManifest(
  input: FinanceIsolationStagingEvidenceInput
): string {
  return JSON.stringify(createFinanceIsolationStagingEvidenceManifest(input))
}

function validateInput(input: FinanceIsolationStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.executionEnvironment !== 'staging' ||
    input.runnerFlag !== FINANCE_ISOLATION_AUDIT_FLAG ||
    input.runnerFlagValue !== true ||
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

  const roles = new Set<FinanceIsolationEvidenceCaseRole>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  const observationDigests = new Set<string>()
  for (const sample of input.samples) {
    if (
      !sample ||
      typeof sample !== 'object' ||
      !exactKeys(sample, SAMPLE_KEYS) ||
      !FINANCE_ISOLATION_EVIDENCE_CASE_ROLES.includes(sample.role) ||
      roles.has(sample.role) ||
      !validReviewReference(sample.runReviewReference) ||
      reviews.has(sample.runReviewReference) ||
      !validObservationForRole(sample.observation, sample.role)
    ) {
      invalidEvidence()
    }
    const observationDigest = digest(
      JSON.stringify(canonicalObservationPayload(sample.observation))
    )
    if (observationDigests.has(observationDigest)) invalidEvidence()
    roles.add(sample.role)
    reviews.add(sample.runReviewReference)
    observationDigests.add(observationDigest)
  }
  if (FINANCE_ISOLATION_EVIDENCE_CASE_ROLES.some((role) => !roles.has(role))) invalidEvidence()
}

function validObservationForRole(
  observation: FinanceIsolationAuditObservation,
  role: FinanceIsolationEvidenceCaseRole
): boolean {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'three_entity_finance_isolation_audit' ||
    observation.canWrite !== false ||
    observation.canApply !== false ||
    !observation.metrics ||
    typeof observation.metrics !== 'object' ||
    !exactKeys(observation.metrics, OBSERVATION_METRIC_KEYS) ||
    observation.metrics.expectedEntities !== 3 ||
    !positiveInteger(observation.metrics.evaluatedEntities) ||
    observation.metrics.evaluatedEntities > 3 ||
    observation.metrics.evaluatedSurfaces !== observation.metrics.evaluatedEntities * 5 ||
    !nonNegativeInteger(observation.metrics.isolationBreaches)
  ) {
    return false
  }
  if (role === 'three_entity_isolated') {
    return (
      observation.verdict === 'isolated' &&
      observation.metrics.evaluatedEntities === 3 &&
      observation.metrics.evaluatedSurfaces === 15 &&
      observation.metrics.isolationBreaches === 0
    )
  }
  return observation.verdict === 'breach_detected' && observation.metrics.isolationBreaches > 0
}

function createCaseArtifact(
  sample: FinanceIsolationStagingEvidenceSample
): FinanceIsolationCaseEvidenceArtifact {
  const canonicalObservation = canonicalObservationPayload(sample.observation)
  const observationDigest = digest(JSON.stringify(canonicalObservation))
  const canonical = {
    schemaVersion: 1 as const,
    kind: 'cep_finance_isolation_case_evidence' as const,
    role: sample.role,
    verdict:
      sample.role === 'three_entity_isolated'
        ? ('isolated_observed' as const)
        : ('breach_rejected' as const),
    runReviewReferenceDigest: digest(sample.runReviewReference),
    observationDigest,
  }
  const artifactDigest = digest(JSON.stringify(canonical))
  return Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
}

function assertCaseArtifact(artifact: FinanceIsolationCaseEvidenceArtifact): void {
  if (
    !artifact ||
    typeof artifact !== 'object' ||
    !exactKeys(artifact, CASE_KEYS) ||
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_finance_isolation_case_evidence' ||
    !FINANCE_ISOLATION_EVIDENCE_CASE_ROLES.includes(artifact.role) ||
    artifact.verdict !==
      (artifact.role === 'three_entity_isolated' ? 'isolated_observed' : 'breach_rejected') ||
    !DIGEST_PATTERN.test(artifact.runReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.observationDigest)
  ) {
    invalidEvidence()
  }
  const canonical = {
    schemaVersion: artifact.schemaVersion,
    kind: artifact.kind,
    role: artifact.role,
    verdict: artifact.verdict,
    runReviewReferenceDigest: artifact.runReviewReferenceDigest,
    observationDigest: artifact.observationDigest,
  }
  if (
    artifact.artifactDigest !== digest(JSON.stringify(canonical)) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
}

function canonicalObservationPayload(observation: FinanceIsolationAuditObservation) {
  return {
    schemaVersion: observation.schemaVersion,
    mode: observation.mode,
    verdict: observation.verdict,
    canWrite: observation.canWrite,
    canApply: observation.canApply,
    metrics: {
      expectedEntities: observation.metrics.expectedEntities,
      evaluatedEntities: observation.metrics.evaluatedEntities,
      evaluatedSurfaces: observation.metrics.evaluatedSurfaces,
      isolationBreaches: observation.metrics.isolationBreaches,
    },
  }
}

function canonicalManifest(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly metrics: FinanceIsolationStagingEvidenceManifest['metrics']
  readonly cases: readonly FinanceIsolationCaseEvidenceArtifact[]
}) {
  return {
    schemaVersion: 1 as const,
    kind: 'cep_finance_isolation_staging_evidence' as const,
    mode: 'four_case_content_addressed_isolation_matrix' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    metrics: input.metrics,
    cases: input.cases,
  }
}

function validBoundDigests(manifest: FinanceIsolationStagingEvidenceManifest): boolean {
  return (
    DIGEST_PATTERN.test(manifest.sourceDigest) &&
    DIGEST_PATTERN.test(manifest.targetTenantDigest) &&
    manifest.sourceDigest !== manifest.targetTenantDigest &&
    DIGEST_PATTERN.test(manifest.campaignReviewReferenceDigest) &&
    DIGEST_PATTERN.test(manifest.readinessReviewReferenceDigest) &&
    manifest.campaignReviewReferenceDigest !== manifest.readinessReviewReferenceDigest &&
    DIGEST_PATTERN.test(manifest.artifactDigest) &&
    typeof manifest.evidenceReference === 'string'
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

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
}
