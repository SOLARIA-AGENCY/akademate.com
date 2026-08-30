import { createHash } from 'node:crypto'

export interface MultiEntityRestoredBackupEvidenceInput {
  readonly restoreEnvironment: 'staging'
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly backupManifestDigest: string
  readonly restoreExecutionReportDigest: string
  readonly verificationReportDigest: string
  readonly backupPayloadDigest: string
  readonly restoredPayloadDigest: string
}

export interface MultiEntityRestoredBackupEvidenceArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_restored_backup_evidence'
  readonly gate: 'restored_backup_verified'
  readonly mode: 'content_addressed_external_restore_review'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canReadBackup: false
  readonly canRestore: false
  readonly canWrite: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly backupManifestDigest: string
  readonly restoreExecutionReportDigest: string
  readonly verificationReportDigest: string
  readonly backupPayloadDigest: string
  readonly restoredPayloadDigest: string
  readonly metrics: {
    readonly externalRestoreReports: 1
    readonly externalVerificationReports: 1
    readonly payloadDigestMatches: true
    readonly contractBackupReads: 0
    readonly contractDatabaseReads: 0
    readonly contractDatabaseWrites: 0
    readonly migrationsApplied: 0
    readonly runtimeActivations: 0
    readonly permissionChanges: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'restoreEnvironment',
  'campaignReviewReference',
  'readinessReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'backupManifestDigest',
  'restoreExecutionReportDigest',
  'verificationReportDigest',
  'backupPayloadDigest',
  'restoredPayloadDigest',
])
const ARTIFACT_KEYS = new Set([
  'schemaVersion',
  'kind',
  'gate',
  'mode',
  'verdict',
  'canReadBackup',
  'canRestore',
  'canWrite',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canMigrate',
  'canActivate',
  'canChangePermissions',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'backupManifestDigest',
  'restoreExecutionReportDigest',
  'verificationReportDigest',
  'backupPayloadDigest',
  'restoredPayloadDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
])
const METRIC_KEYS = new Set([
  'externalRestoreReports',
  'externalVerificationReports',
  'payloadDigestMatches',
  'contractBackupReads',
  'contractDatabaseReads',
  'contractDatabaseWrites',
  'migrationsApplied',
  'runtimeActivations',
  'permissionChanges',
])

/**
 * Seals independently produced restore evidence. This pure contract does not
 * perform or attest a restore; it only enforces content-addressed report
 * binding and exact declared backup/restored payload digest equality.
 */
export function createMultiEntityRestoredBackupEvidenceArtifact(
  input: MultiEntityRestoredBackupEvidenceInput
): MultiEntityRestoredBackupEvidenceArtifact {
  validateInput(input)
  const canonical = artifactPayload({
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    backupManifestDigest: input.backupManifestDigest,
    restoreExecutionReportDigest: input.restoreExecutionReportDigest,
    verificationReportDigest: input.verificationReportDigest,
    backupPayloadDigest: input.backupPayloadDigest,
    restoredPayloadDigest: input.restoredPayloadDigest,
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  })
  assertMultiEntityRestoredBackupEvidenceArtifact(artifact)
  return artifact
}

export function assertMultiEntityRestoredBackupEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityRestoredBackupEvidenceArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, ARTIFACT_KEYS)) invalidEvidence()
  const artifact = value as MultiEntityRestoredBackupEvidenceArtifact
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== 'cep_multi_entity_restored_backup_evidence' ||
    artifact.gate !== 'restored_backup_verified' ||
    artifact.mode !== 'content_addressed_external_restore_review' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canReadBackup !== false ||
    artifact.canRestore !== false ||
    artifact.canWrite !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canDeploy !== false ||
    artifact.canMigrate !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !validBoundDigests(artifact) ||
    artifact.backupPayloadDigest !== artifact.restoredPayloadDigest ||
    !validMetrics(artifact.metrics) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }

  const canonical = artifactPayload({
    sourceDigest: artifact.sourceDigest,
    targetTenantDigest: artifact.targetTenantDigest,
    campaignReviewReferenceDigest: artifact.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: artifact.readinessReviewReferenceDigest,
    backupManifestDigest: artifact.backupManifestDigest,
    restoreExecutionReportDigest: artifact.restoreExecutionReportDigest,
    verificationReportDigest: artifact.verificationReportDigest,
    backupPayloadDigest: artifact.backupPayloadDigest,
    restoredPayloadDigest: artifact.restoredPayloadDigest,
  })
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

export function serializeMultiEntityRestoredBackupEvidenceArtifact(
  input: MultiEntityRestoredBackupEvidenceInput
): string {
  return JSON.stringify(createMultiEntityRestoredBackupEvidenceArtifact(input))
}

function validateInput(input: MultiEntityRestoredBackupEvidenceInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    input.restoreEnvironment !== 'staging' ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !validDigest(input.sourceDigest) ||
    !validDigest(input.targetTenantDigest) ||
    input.sourceDigest === input.targetTenantDigest ||
    !validDigest(input.backupManifestDigest) ||
    !validDigest(input.restoreExecutionReportDigest) ||
    !validDigest(input.verificationReportDigest) ||
    new Set([
      input.backupManifestDigest,
      input.restoreExecutionReportDigest,
      input.verificationReportDigest,
    ]).size !== 3 ||
    !validDigest(input.backupPayloadDigest) ||
    !validDigest(input.restoredPayloadDigest) ||
    input.backupPayloadDigest !== input.restoredPayloadDigest
  ) {
    invalidEvidence()
  }
}

function artifactPayload(input: {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly backupManifestDigest: string
  readonly restoreExecutionReportDigest: string
  readonly verificationReportDigest: string
  readonly backupPayloadDigest: string
  readonly restoredPayloadDigest: string
}) {
  return Object.freeze({
    schemaVersion: 1 as const,
    kind: 'cep_multi_entity_restored_backup_evidence' as const,
    gate: 'restored_backup_verified' as const,
    mode: 'content_addressed_external_restore_review' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canReadBackup: false as const,
    canRestore: false as const,
    canWrite: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canMigrate: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: input.campaignReviewReferenceDigest,
    readinessReviewReferenceDigest: input.readinessReviewReferenceDigest,
    backupManifestDigest: input.backupManifestDigest,
    restoreExecutionReportDigest: input.restoreExecutionReportDigest,
    verificationReportDigest: input.verificationReportDigest,
    backupPayloadDigest: input.backupPayloadDigest,
    restoredPayloadDigest: input.restoredPayloadDigest,
    metrics: Object.freeze({
      externalRestoreReports: 1 as const,
      externalVerificationReports: 1 as const,
      payloadDigestMatches: true as const,
      contractBackupReads: 0 as const,
      contractDatabaseReads: 0 as const,
      contractDatabaseWrites: 0 as const,
      migrationsApplied: 0 as const,
      runtimeActivations: 0 as const,
      permissionChanges: 0 as const,
    }),
  })
}

function validBoundDigests(artifact: MultiEntityRestoredBackupEvidenceArtifact): boolean {
  const digests = [
    artifact.sourceDigest,
    artifact.targetTenantDigest,
    artifact.campaignReviewReferenceDigest,
    artifact.readinessReviewReferenceDigest,
    artifact.backupManifestDigest,
    artifact.restoreExecutionReportDigest,
    artifact.verificationReportDigest,
    artifact.backupPayloadDigest,
    artifact.restoredPayloadDigest,
    artifact.artifactDigest,
  ]
  return (
    digests.every(validDigest) &&
    artifact.sourceDigest !== artifact.targetTenantDigest &&
    new Set([
      artifact.backupManifestDigest,
      artifact.restoreExecutionReportDigest,
      artifact.verificationReportDigest,
    ]).size === 3
  )
}

function validMetrics(metrics: MultiEntityRestoredBackupEvidenceArtifact['metrics']): boolean {
  return (
    !!metrics &&
    typeof metrics === 'object' &&
    exactKeys(metrics, METRIC_KEYS) &&
    metrics.externalRestoreReports === 1 &&
    metrics.externalVerificationReports === 1 &&
    metrics.payloadDigestMatches === true &&
    metrics.contractBackupReads === 0 &&
    metrics.contractDatabaseReads === 0 &&
    metrics.contractDatabaseWrites === 0 &&
    metrics.migrationsApplied === 0 &&
    metrics.runtimeActivations === 0 &&
    metrics.permissionChanges === 0
  )
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
  throw new Error('MULTI_ENTITY_RESTORED_BACKUP_EVIDENCE_INVALID')
}
