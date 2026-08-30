import { createHash } from 'node:crypto'

export type MultiEntitySchemaAuthority = 'payload' | 'drizzle_control_plane'

export interface MultiEntitySchemaAuthorityReviewEvidenceInput {
  readonly reviewEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly decisionReference: string
  readonly authority: MultiEntitySchemaAuthority
  readonly schemaFingerprintDigest: string
  readonly schemaExpansionPlanDigest: string
}

export interface MultiEntitySchemaAuthorityReviewEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_schema_authority_review_evidence'
  readonly gate: 'schema_authority_decided'
  readonly mode: 'explicit_payload_or_control_plane_review'
  readonly verdict: 'review_recorded_no_execution_authority'
  readonly canReadPayload: false
  readonly canWrite: false
  readonly canApply: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly productionMigrationApplied: false
  readonly productionBackfillApplied: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly decisionReferenceDigest: string
  readonly authority: MultiEntitySchemaAuthority
  readonly authorityDigest: string
  readonly schemaFingerprintDigest: string
  readonly schemaExpansionPlanDigest: string
  readonly metrics: {
    readonly reviewedDecisions: 1
    readonly schemaReads: 0
    readonly migrationsApplied: 0
    readonly backfillsApplied: 0
    readonly productionWrites: 0
    readonly runtimeActivations: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'reviewEnvironment',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'decisionReference',
  'authority',
  'schemaFingerprintDigest',
  'schemaExpansionPlanDigest',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'gate',
  'mode',
  'verdict',
  'canReadPayload',
  'canWrite',
  'canApply',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canActivate',
  'canChangePermissions',
  'productionMigrationApplied',
  'productionBackfillApplied',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'decisionReferenceDigest',
  'authority',
  'authorityDigest',
  'schemaFingerprintDigest',
  'schemaExpansionPlanDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const METRIC_KEYS = new Set([
  'reviewedDecisions',
  'schemaReads',
  'migrationsApplied',
  'backfillsApplied',
  'productionWrites',
  'runtimeActivations',
])

/**
 * Records an explicit Payload-versus-control-plane decision without selecting
 * a migration authority at runtime or changing any database state.
 */
export function createMultiEntitySchemaAuthorityReviewEvidenceArtifact(
  input: MultiEntitySchemaAuthorityReviewEvidenceInput
): MultiEntitySchemaAuthorityReviewEvidenceArtifact {
  validateInput(input)
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    decisionReferenceDigest: digest(input.decisionReference),
    authority: input.authority,
    authorityDigest: digest(input.authority),
    schemaFingerprintDigest: input.schemaFingerprintDigest,
    schemaExpansionPlanDigest: input.schemaExpansionPlanDigest,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertMultiEntitySchemaAuthorityReviewEvidenceArtifact(artifact)
  return artifact
}

export function assertMultiEntitySchemaAuthorityReviewEvidenceArtifact(
  value: unknown
): asserts value is MultiEntitySchemaAuthorityReviewEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as MultiEntitySchemaAuthorityReviewEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_schema_authority_review_evidence' ||
    artifact.gate !== 'schema_authority_decided' ||
    artifact.mode !== 'explicit_payload_or_control_plane_review' ||
    artifact.verdict !== 'review_recorded_no_execution_authority' ||
    artifact.canReadPayload !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canDeploy !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    artifact.productionMigrationApplied !== false ||
    artifact.productionBackfillApplied !== false ||
    !DIGEST_PATTERN.test(artifact.sourceDigest) ||
    !DIGEST_PATTERN.test(artifact.targetTenantDigest) ||
    artifact.sourceDigest === artifact.targetTenantDigest ||
    !DIGEST_PATTERN.test(artifact.campaignReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.readinessReviewReferenceDigest) ||
    !DIGEST_PATTERN.test(artifact.decisionReferenceDigest) ||
    !['payload', 'drizzle_control_plane'].includes(artifact.authority) ||
    artifact.authorityDigest !== digest(artifact.authority) ||
    !DIGEST_PATTERN.test(artifact.schemaFingerprintDigest) ||
    !DIGEST_PATTERN.test(artifact.schemaExpansionPlanDigest) ||
    artifact.schemaExpansionPlanDigest === artifact.schemaFingerprintDigest ||
    !artifact.metrics ||
    typeof artifact.metrics !== 'object' ||
    !exactKeys(artifact.metrics, METRIC_KEYS) ||
    artifact.metrics.reviewedDecisions !== 1 ||
    artifact.metrics.schemaReads !== 0 ||
    artifact.metrics.migrationsApplied !== 0 ||
    artifact.metrics.backfillsApplied !== 0 ||
    artifact.metrics.productionWrites !== 0 ||
    artifact.metrics.runtimeActivations !== 0 ||
    !DIGEST_PATTERN.test(artifact.artifactDigest) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }

  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    decisionReferenceDigest: artifact.decisionReferenceDigest,
    authority: artifact.authority,
    authorityDigest: artifact.authorityDigest,
    schemaFingerprintDigest: artifact.schemaFingerprintDigest,
    schemaExpansionPlanDigest: artifact.schemaExpansionPlanDigest,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeMultiEntitySchemaAuthorityReviewEvidenceArtifact(
  input: MultiEntitySchemaAuthorityReviewEvidenceInput
): string {
  return JSON.stringify(createMultiEntitySchemaAuthorityReviewEvidenceArtifact(input))
}

function validateInput(input: MultiEntitySchemaAuthorityReviewEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.reviewEnvironment !== 'staging' ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !validReview(input.decisionReference) ||
    input.decisionReference === input.campaignReviewReference ||
    input.decisionReference === input.readinessReviewReference ||
    !['payload', 'drizzle_control_plane'].includes(input.authority) ||
    !validDigest(input.schemaFingerprintDigest) ||
    !validDigest(input.schemaExpansionPlanDigest) ||
    input.schemaExpansionPlanDigest === input.schemaFingerprintDigest
  ) {
    invalidEvidence()
  }
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly decisionReferenceDigest: string
  readonly authority: MultiEntitySchemaAuthority
  readonly authorityDigest: string
  readonly schemaFingerprintDigest: string
  readonly schemaExpansionPlanDigest: string
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_schema_authority_review_evidence' as const,
    gate: 'schema_authority_decided' as const,
    mode: 'explicit_payload_or_control_plane_review' as const,
    verdict: 'review_recorded_no_execution_authority' as const,
    canReadPayload: false as const,
    canWrite: false as const,
    canApply: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    productionMigrationApplied: false as const,
    productionBackfillApplied: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    decisionReferenceDigest: input.decisionReferenceDigest,
    authority: input.authority,
    authorityDigest: input.authorityDigest,
    schemaFingerprintDigest: input.schemaFingerprintDigest,
    schemaExpansionPlanDigest: input.schemaExpansionPlanDigest,
    metrics: Object.freeze({
      reviewedDecisions: 1 as const,
      schemaReads: 0 as const,
      migrationsApplied: 0 as const,
      backfillsApplied: 0 as const,
      productionWrites: 0 as const,
      runtimeActivations: 0 as const,
    }),
  })
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_PATTERN.test(value)
}

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function digest(value: string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_SCHEMA_AUTHORITY_EVIDENCE_INVALID')
}
