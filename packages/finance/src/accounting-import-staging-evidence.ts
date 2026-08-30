import { createHash } from 'node:crypto'

import {
  ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
  type AccountingImportStagingObservation,
} from './accounting-import-staging-runner'

export interface AccountingImportStagingEvidenceInput {
  readonly executionEnvironment: 'staging'
  readonly runnerFlag: typeof ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG
  readonly runnerFlagValue: true
  readonly runReviewReference: string
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly observation: AccountingImportStagingObservation
}

export interface AccountingImportStagingEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_accounting_import_staging_evidence'
  readonly mode: 'content_addressed_observation'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly reviewReferenceDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly observationDigest: string
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
  readonly metrics: AccountingImportStagingObservation['metrics']
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'executionEnvironment',
  'runnerFlag',
  'runnerFlagValue',
  'runReviewReference',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'observation',
])
const OBSERVATION_KEYS = new Set([
  'schemaVersion',
  'mode',
  'verdict',
  'canReadProvider',
  'canWriteProvider',
  'canWriteLocal',
  'canApply',
  'metrics',
])
const METRICS_KEYS = new Set([
  'expectedEntities',
  'attemptedEntities',
  'completedEntities',
  'failedEntities',
  'pilotCandidates',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'verdict',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'reviewReferenceDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'observationDigest',
  'artifactDigest',
  'evidenceReference',
  'metrics',
])

/**
 * Seals one successful staging observation into a deterministic artifact. The
 * artifact is eligible for manual binding, but is neither signed nor proof
 * that the declared environment, source or tenant actually produced the run.
 */
export function createAccountingImportStagingEvidenceArtifact(
  input: AccountingImportStagingEvidenceInput
): AccountingImportStagingEvidenceArtifact {
  validateInput(input)

  const metrics = Object.freeze({
    expectedEntities: input.observation.metrics.expectedEntities,
    attemptedEntities: input.observation.metrics.attemptedEntities,
    completedEntities: input.observation.metrics.completedEntities,
    failedEntities: input.observation.metrics.failedEntities,
    pilotCandidates: input.observation.metrics.pilotCandidates,
  })
  const reviewReferenceDigest = digest(input.runReviewReference)
  const campaignReviewReferenceDigest = digest(input.campaignReviewReference)
  const readinessReviewReferenceDigest = digest(input.readinessReviewReference)
  const observationDigest = digest(
    JSON.stringify({
      schemaVersion: input.observation.schemaVersion,
      mode: input.observation.mode,
      verdict: input.observation.verdict,
      canReadProvider: input.observation.canReadProvider,
      canWriteProvider: input.observation.canWriteProvider,
      canWriteLocal: input.observation.canWriteLocal,
      canApply: input.observation.canApply,
      metrics,
    })
  )
  const canonicalPayload = canonicalArtifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    reviewReferenceDigest,
    campaignReviewReferenceDigest,
    readinessReviewReferenceDigest,
    observationDigest,
    metrics,
  })
  const artifactDigest = digest(JSON.stringify(canonicalPayload))

  return Object.freeze({
    ...canonicalPayload,
    artifactDigest,
    evidenceReference: `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`,
  })
}

export function assertAccountingImportStagingEvidenceArtifact(
  value: unknown
): asserts value is AccountingImportStagingEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as AccountingImportStagingEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_accounting_import_staging_evidence' ||
    artifact.mode !== 'content_addressed_observation' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canDeploy !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !DIGEST_PATTERN.test(artifact.sourceDigest) ||
    !DIGEST_PATTERN.test(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !DIGEST_PATTERN.test(artifact.reviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.observationDigest) ||
    !DIGEST_PATTERN.test(artifact.artifactDigest) ||
    artifact.evidenceReference !==
      `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}` ||
    !artifact.metrics ||
    typeof artifact.metrics !== 'object' ||
    !exactKeys(artifact.metrics, METRICS_KEYS) ||
    artifact.metrics.expectedEntities !== 3 ||
    artifact.metrics.attemptedEntities !== 3 ||
    artifact.metrics.completedEntities !== 3 ||
    artifact.metrics.failedEntities !== 0 ||
    artifact.metrics.pilotCandidates !== 1
  ) {
    invalidEvidence()
  }

  const canonical = canonicalArtifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    reviewReferenceDigest: artifact.reviewReferenceDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    observationDigest: artifact.observationDigest,
    metrics: artifact.metrics,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeAccountingImportStagingEvidenceArtifact(
  input: AccountingImportStagingEvidenceInput
): string {
  return JSON.stringify(createAccountingImportStagingEvidenceArtifact(input))
}

function validateInput(input: AccountingImportStagingEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.executionEnvironment !== 'staging' ||
    input.runnerFlag !== ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG ||
    input.runnerFlagValue !== true ||
    !REVIEW_REFERENCE_PATTERN.test(input.runReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    new Set([
      input.runReviewReference,
      input.campaignReviewReference,
      input.readinessReviewReference,
    ]).size !== 3 ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest
  ) {
    invalidEvidence()
  }
  validateObservation(input.observation)
}

function validateObservation(observation: AccountingImportStagingObservation): void {
  if (
    !observation ||
    typeof observation !== 'object' ||
    !exactKeys(observation, OBSERVATION_KEYS) ||
    observation.schemaVersion !== 1 ||
    observation.mode !== 'three_entity_accounting_import_staging' ||
    observation.verdict !== 'completed' ||
    observation.canReadProvider !== true ||
    observation.canWriteProvider !== false ||
    observation.canWriteLocal !== true ||
    observation.canApply !== false ||
    !observation.metrics ||
    typeof observation.metrics !== 'object' ||
    !exactKeys(observation.metrics, METRICS_KEYS) ||
    observation.metrics.expectedEntities !== 3 ||
    observation.metrics.attemptedEntities !== 3 ||
    observation.metrics.completedEntities !== 3 ||
    observation.metrics.failedEntities !== 0 ||
    observation.metrics.pilotCandidates !== 1
  ) {
    invalidEvidence()
  }
}

function canonicalArtifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly reviewReferenceDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly observationDigest: string
  readonly metrics: AccountingImportStagingObservation['metrics']
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_accounting_import_staging_evidence' as const,
    mode: 'content_addressed_observation' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    reviewReferenceDigest: input.reviewReferenceDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    observationDigest: input.observationDigest,
    metrics: Object.freeze({
      expectedEntities: input.metrics.expectedEntities,
      attemptedEntities: input.metrics.attemptedEntities,
      completedEntities: input.metrics.completedEntities,
      failedEntities: input.metrics.failedEntities,
      pilotCandidates: input.metrics.pilotCandidates,
    }),
  })
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

function invalidEvidence(): never {
  throw new Error('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
}
