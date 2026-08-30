import { createHash } from 'node:crypto'

export type MultiEntityRuntimeMigrationEvidenceGate =
  | 'node22_runtime_verified'
  | 'expand_only_migration_reviewed'
  | 'migration_dry_run_verified'
  | 'backfill_dry_run_verified'

interface CommonEvidenceInput {
  readonly environment: 'staging'
  readonly sourceSha: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly gateReviewReference: string
  readonly commandDigest: string
  readonly tool: string
  readonly toolVersion: string
  readonly exitStatus: 0
  readonly startedAtUtc: string
  readonly finishedAtUtc: string
  readonly executionReportDigest: string
  readonly verificationReportDigest: string
}

export interface MultiEntityNode22RuntimeEvidenceInput extends CommonEvidenceInput {
  readonly tool: 'node'
}

export interface MultiEntityExpandOnlyMigrationReviewEvidenceInput extends CommonEvidenceInput {
  readonly migrationPlanDigest: string
  readonly schemaBeforeDigest: string
  readonly schemaAfterDigest: string
  readonly expandOperationsReviewed: number
  readonly destructiveOperationsDetected: 0
}

export interface MultiEntityMigrationDryRunEvidenceInput extends CommonEvidenceInput {
  readonly backupManifestDigest: string
  readonly migrationPlanDigest: string
  readonly schemaBeforeDigest: string
  readonly schemaAfterDigest: string
}

export interface MultiEntityBackfillDryRunEvidenceInput extends CommonEvidenceInput {
  readonly backupManifestDigest: string
  readonly inputSnapshotDigest: string
  readonly backfillPlanDigest: string
  readonly postRunSnapshotDigest: string
}

interface CommonEvidenceArtifact {
  readonly schemaVersion: 1
  readonly environment: 'staging'
  readonly verdict: 'eligible_for_manual_staging_binding'
  readonly canExecute: false
  readonly canWrite: false
  readonly canApply: false
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceSha: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly campaignReviewReferenceDigest: string
  readonly readinessReviewReferenceDigest: string
  readonly gateReviewReferenceDigest: string
  readonly commandDigest: string
  readonly tool: string
  readonly toolVersion: string
  readonly exitStatus: 0
  readonly startedAtUtc: string
  readonly finishedAtUtc: string
  readonly executionReportDigest: string
  readonly verificationReportDigest: string
  readonly metrics: {
    readonly externalCommandsReviewed: 1
    readonly successfulExitStatuses: 1
    readonly sourceRegisteredStagingExecutionBindings: 0
    readonly contractDatabaseReads: 0
    readonly contractDatabaseWrites: 0
    readonly migrationsApplied: 0
    readonly backfillsApplied: 0
    readonly runtimeActivations: 0
    readonly permissionChanges: 0
  }
  readonly artifactDigest: string
  readonly evidenceReference: `evidence://sha256/${string}`
}

export interface MultiEntityNode22RuntimeEvidenceArtifact extends CommonEvidenceArtifact {
  readonly kind: 'cep_multi_entity_node22_runtime_evidence'
  readonly gate: 'node22_runtime_verified'
  readonly mode: 'content_addressed_external_runtime_review'
  readonly tool: 'node'
}

export interface MultiEntityExpandOnlyMigrationReviewEvidenceArtifact extends CommonEvidenceArtifact {
  readonly kind: 'cep_multi_entity_expand_only_migration_review_evidence'
  readonly gate: 'expand_only_migration_reviewed'
  readonly mode: 'content_addressed_external_expand_only_review'
  readonly migrationPlanDigest: string
  readonly schemaBeforeDigest: string
  readonly schemaAfterDigest: string
  readonly expandOperationsReviewed: number
  readonly destructiveOperationsDetected: 0
}

export interface MultiEntityMigrationDryRunEvidenceArtifact extends CommonEvidenceArtifact {
  readonly kind: 'cep_multi_entity_migration_dry_run_evidence'
  readonly gate: 'migration_dry_run_verified'
  readonly mode: 'content_addressed_external_migration_dry_run_review'
  readonly backupManifestDigest: string
  readonly migrationPlanDigest: string
  readonly schemaBeforeDigest: string
  readonly schemaAfterDigest: string
}

export interface MultiEntityBackfillDryRunEvidenceArtifact extends CommonEvidenceArtifact {
  readonly kind: 'cep_multi_entity_backfill_dry_run_evidence'
  readonly gate: 'backfill_dry_run_verified'
  readonly mode: 'content_addressed_external_backfill_dry_run_review'
  readonly backupManifestDigest: string
  readonly inputSnapshotDigest: string
  readonly backfillPlanDigest: string
  readonly postRunSnapshotDigest: string
}

type AnyInput =
  | MultiEntityNode22RuntimeEvidenceInput
  | MultiEntityExpandOnlyMigrationReviewEvidenceInput
  | MultiEntityMigrationDryRunEvidenceInput
  | MultiEntityBackfillDryRunEvidenceInput
type AnyArtifact =
  | MultiEntityNode22RuntimeEvidenceArtifact
  | MultiEntityExpandOnlyMigrationReviewEvidenceArtifact
  | MultiEntityMigrationDryRunEvidenceArtifact
  | MultiEntityBackfillDryRunEvidenceArtifact

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const SOURCE_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const TOOL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/
const VERSION_PATTERN = /^v?[0-9]+(?:\.[0-9]+){1,3}(?:[-+][A-Za-z0-9._-]+)?$/
const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
const COMMON_INPUT_KEYS = [
  'environment',
  'sourceSha',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReference',
  'readinessReviewReference',
  'gateReviewReference',
  'commandDigest',
  'tool',
  'toolVersion',
  'exitStatus',
  'startedAtUtc',
  'finishedAtUtc',
  'executionReportDigest',
  'verificationReportDigest',
] as const
const COMMON_ARTIFACT_KEYS = [
  'schemaVersion',
  'kind',
  'gate',
  'mode',
  'environment',
  'verdict',
  'canExecute',
  'canWrite',
  'canApply',
  'canBindAutomatically',
  'canMarkVerified',
  'canDeploy',
  'canMigrate',
  'canActivate',
  'canChangePermissions',
  'sourceSha',
  'sourceDigest',
  'targetTenantDigest',
  'campaignReviewReferenceDigest',
  'readinessReviewReferenceDigest',
  'gateReviewReferenceDigest',
  'commandDigest',
  'tool',
  'toolVersion',
  'exitStatus',
  'startedAtUtc',
  'finishedAtUtc',
  'executionReportDigest',
  'verificationReportDigest',
  'metrics',
  'artifactDigest',
  'evidenceReference',
] as const
const METRIC_KEYS = new Set([
  'externalCommandsReviewed',
  'successfulExitStatuses',
  'sourceRegisteredStagingExecutionBindings',
  'contractDatabaseReads',
  'contractDatabaseWrites',
  'migrationsApplied',
  'backfillsApplied',
  'runtimeActivations',
  'permissionChanges',
])

const CONFIG = Object.freeze({
  node22_runtime_verified: Object.freeze({
    kind: 'cep_multi_entity_node22_runtime_evidence' as const,
    mode: 'content_addressed_external_runtime_review' as const,
    inputKeys: new Set(COMMON_INPUT_KEYS),
    artifactKeys: new Set(COMMON_ARTIFACT_KEYS),
  }),
  expand_only_migration_reviewed: Object.freeze({
    kind: 'cep_multi_entity_expand_only_migration_review_evidence' as const,
    mode: 'content_addressed_external_expand_only_review' as const,
    inputKeys: new Set([
      ...COMMON_INPUT_KEYS,
      'migrationPlanDigest',
      'schemaBeforeDigest',
      'schemaAfterDigest',
      'expandOperationsReviewed',
      'destructiveOperationsDetected',
    ]),
    artifactKeys: new Set([
      ...COMMON_ARTIFACT_KEYS,
      'migrationPlanDigest',
      'schemaBeforeDigest',
      'schemaAfterDigest',
      'expandOperationsReviewed',
      'destructiveOperationsDetected',
    ]),
  }),
  migration_dry_run_verified: Object.freeze({
    kind: 'cep_multi_entity_migration_dry_run_evidence' as const,
    mode: 'content_addressed_external_migration_dry_run_review' as const,
    inputKeys: new Set([
      ...COMMON_INPUT_KEYS,
      'backupManifestDigest',
      'migrationPlanDigest',
      'schemaBeforeDigest',
      'schemaAfterDigest',
    ]),
    artifactKeys: new Set([
      ...COMMON_ARTIFACT_KEYS,
      'backupManifestDigest',
      'migrationPlanDigest',
      'schemaBeforeDigest',
      'schemaAfterDigest',
    ]),
  }),
  backfill_dry_run_verified: Object.freeze({
    kind: 'cep_multi_entity_backfill_dry_run_evidence' as const,
    mode: 'content_addressed_external_backfill_dry_run_review' as const,
    inputKeys: new Set([
      ...COMMON_INPUT_KEYS,
      'backupManifestDigest',
      'inputSnapshotDigest',
      'backfillPlanDigest',
      'postRunSnapshotDigest',
    ]),
    artifactKeys: new Set([
      ...COMMON_ARTIFACT_KEYS,
      'backupManifestDigest',
      'inputSnapshotDigest',
      'backfillPlanDigest',
      'postRunSnapshotDigest',
    ]),
  }),
})

/**
 * Seals externally produced runtime evidence. It never invokes Node or grants
 * execution authority; Node 22, the command outcome and reports remain bound
 * to the reviewed source and staging context.
 */
export function createMultiEntityNode22RuntimeEvidenceArtifact(
  input: MultiEntityNode22RuntimeEvidenceInput
): MultiEntityNode22RuntimeEvidenceArtifact {
  return createArtifact(
    'node22_runtime_verified',
    input
  ) as MultiEntityNode22RuntimeEvidenceArtifact
}

export function assertMultiEntityNode22RuntimeEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityNode22RuntimeEvidenceArtifact {
  assertArtifact('node22_runtime_verified', value)
}

/** Seals a static expand-only review; it cannot apply the reviewed migration. */
export function createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact(
  input: MultiEntityExpandOnlyMigrationReviewEvidenceInput
): MultiEntityExpandOnlyMigrationReviewEvidenceArtifact {
  return createArtifact(
    'expand_only_migration_reviewed',
    input
  ) as MultiEntityExpandOnlyMigrationReviewEvidenceArtifact
}

export function assertMultiEntityExpandOnlyMigrationReviewEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityExpandOnlyMigrationReviewEvidenceArtifact {
  assertArtifact('expand_only_migration_reviewed', value)
}

/** Seals an external dry-run report; it cannot read or modify the database. */
export function createMultiEntityMigrationDryRunEvidenceArtifact(
  input: MultiEntityMigrationDryRunEvidenceInput
): MultiEntityMigrationDryRunEvidenceArtifact {
  return createArtifact(
    'migration_dry_run_verified',
    input
  ) as MultiEntityMigrationDryRunEvidenceArtifact
}

export function assertMultiEntityMigrationDryRunEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityMigrationDryRunEvidenceArtifact {
  assertArtifact('migration_dry_run_verified', value)
}

/** Seals an external backfill dry-run whose pre/post snapshot digests match. */
export function createMultiEntityBackfillDryRunEvidenceArtifact(
  input: MultiEntityBackfillDryRunEvidenceInput
): MultiEntityBackfillDryRunEvidenceArtifact {
  return createArtifact(
    'backfill_dry_run_verified',
    input
  ) as MultiEntityBackfillDryRunEvidenceArtifact
}

export function assertMultiEntityBackfillDryRunEvidenceArtifact(
  value: unknown
): asserts value is MultiEntityBackfillDryRunEvidenceArtifact {
  assertArtifact('backfill_dry_run_verified', value)
}

function createArtifact(
  gate: MultiEntityRuntimeMigrationEvidenceGate,
  input: AnyInput
): AnyArtifact {
  validateInput(gate, input)
  const config = CONFIG[gate]
  const specific = specificFields(gate, input)
  const canonical = Object.freeze({
    schemaVersion: 1 as const,
    kind: config.kind,
    gate,
    mode: config.mode,
    environment: 'staging' as const,
    verdict: 'eligible_for_manual_staging_binding' as const,
    canExecute: false as const,
    canWrite: false as const,
    canApply: false as const,
    canBindAutomatically: false as const,
    canMarkVerified: false as const,
    canDeploy: false as const,
    canMigrate: false as const,
    canActivate: false as const,
    canChangePermissions: false as const,
    sourceSha: input.sourceSha,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    campaignReviewReferenceDigest: digest(input.campaignReviewReference),
    readinessReviewReferenceDigest: digest(input.readinessReviewReference),
    gateReviewReferenceDigest: digest(input.gateReviewReference),
    commandDigest: input.commandDigest,
    tool: input.tool,
    toolVersion: input.toolVersion,
    exitStatus: 0 as const,
    startedAtUtc: input.startedAtUtc,
    finishedAtUtc: input.finishedAtUtc,
    executionReportDigest: input.executionReportDigest,
    verificationReportDigest: input.verificationReportDigest,
    ...specific,
    metrics: Object.freeze({
      externalCommandsReviewed: 1 as const,
      successfulExitStatuses: 1 as const,
      sourceRegisteredStagingExecutionBindings: 0 as const,
      contractDatabaseReads: 0 as const,
      contractDatabaseWrites: 0 as const,
      migrationsApplied: 0 as const,
      backfillsApplied: 0 as const,
      runtimeActivations: 0 as const,
      permissionChanges: 0 as const,
    }),
  })
  const artifactDigest = digest(JSON.stringify(canonical))
  const artifact = Object.freeze({
    ...canonical,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  }) as AnyArtifact
  assertArtifact(gate, artifact)
  return artifact
}

function validateInput(gate: MultiEntityRuntimeMigrationEvidenceGate, input: AnyInput): void {
  if (!input || typeof input !== 'object' || !exactKeys(input, CONFIG[gate].inputKeys)) {
    invalidEvidence()
  }
  const refs = [
    input.campaignReviewReference,
    input.readinessReviewReference,
    input.gateReviewReference,
  ]
  const digests = [
    input.sourceDigest,
    input.targetTenantDigest,
    input.commandDigest,
    input.executionReportDigest,
    input.verificationReportDigest,
  ]
  if (
    input.environment !== 'staging' ||
    !SOURCE_SHA_PATTERN.test(input.sourceSha) ||
    !digests.every(validDigest) ||
    new Set(digests).size !== digests.length ||
    !refs.every(validReview) ||
    new Set(refs).size !== refs.length ||
    !TOOL_PATTERN.test(input.tool) ||
    !VERSION_PATTERN.test(input.toolVersion) ||
    input.exitStatus !== 0 ||
    !validWindow(input.startedAtUtc, input.finishedAtUtc)
  ) {
    invalidEvidence()
  }
  validateSpecificInput(gate, input)
}

function validateSpecificInput(gate: MultiEntityRuntimeMigrationEvidenceGate, input: AnyInput) {
  if (gate === 'node22_runtime_verified') {
    const node = input as MultiEntityNode22RuntimeEvidenceInput
    if (node.tool !== 'node' || !/^v22\.\d+\.\d+$/.test(node.toolVersion)) invalidEvidence()
    return
  }
  if (gate === 'expand_only_migration_reviewed') {
    const review = input as MultiEntityExpandOnlyMigrationReviewEvidenceInput
    if (
      !distinctDigests([
        review.migrationPlanDigest,
        review.schemaBeforeDigest,
        review.schemaAfterDigest,
      ]) ||
      !Number.isSafeInteger(review.expandOperationsReviewed) ||
      review.expandOperationsReviewed < 1 ||
      review.destructiveOperationsDetected !== 0
    ) {
      invalidEvidence()
    }
    return
  }
  if (gate === 'migration_dry_run_verified') {
    const migration = input as MultiEntityMigrationDryRunEvidenceInput
    if (
      !distinctDigests([
        migration.backupManifestDigest,
        migration.migrationPlanDigest,
        migration.schemaBeforeDigest,
        migration.schemaAfterDigest,
      ])
    ) {
      invalidEvidence()
    }
    return
  }
  const backfill = input as MultiEntityBackfillDryRunEvidenceInput
  if (
    ![
      backfill.backupManifestDigest,
      backfill.inputSnapshotDigest,
      backfill.backfillPlanDigest,
    ].every(validDigest) ||
    new Set([
      backfill.backupManifestDigest,
      backfill.inputSnapshotDigest,
      backfill.backfillPlanDigest,
    ]).size !== 3 ||
    backfill.postRunSnapshotDigest !== backfill.inputSnapshotDigest
  ) {
    invalidEvidence()
  }
}

function assertArtifact(
  expectedGate: MultiEntityRuntimeMigrationEvidenceGate,
  value: unknown
): asserts value is AnyArtifact {
  if (!value || typeof value !== 'object' || !exactKeys(value, CONFIG[expectedGate].artifactKeys)) {
    invalidEvidence()
  }
  const artifact = value as AnyArtifact
  const config = CONFIG[expectedGate]
  if (
    artifact.schemaVersion !== 1 ||
    artifact.kind !== config.kind ||
    artifact.gate !== expectedGate ||
    artifact.mode !== config.mode ||
    artifact.environment !== 'staging' ||
    artifact.verdict !== 'eligible_for_manual_staging_binding' ||
    artifact.canExecute !== false ||
    artifact.canWrite !== false ||
    artifact.canApply !== false ||
    artifact.canBindAutomatically !== false ||
    artifact.canMarkVerified !== false ||
    artifact.canDeploy !== false ||
    artifact.canMigrate !== false ||
    artifact.canActivate !== false ||
    artifact.canChangePermissions !== false ||
    !SOURCE_SHA_PATTERN.test(artifact.sourceSha) ||
    ![
      artifact.sourceDigest,
      artifact.targetTenantDigest,
      artifact.campaignReviewReferenceDigest,
      artifact.readinessReviewReferenceDigest,
      artifact.gateReviewReferenceDigest,
      artifact.commandDigest,
      artifact.executionReportDigest,
      artifact.verificationReportDigest,
      artifact.artifactDigest,
    ].every(validDigest) ||
    artifact.tool.length === 0 ||
    !TOOL_PATTERN.test(artifact.tool) ||
    !VERSION_PATTERN.test(artifact.toolVersion) ||
    artifact.exitStatus !== 0 ||
    !validWindow(artifact.startedAtUtc, artifact.finishedAtUtc) ||
    !validMetrics(artifact.metrics) ||
    artifact.evidenceReference !== evidenceReference(artifact.artifactDigest)
  ) {
    invalidEvidence()
  }
  validateSpecificArtifact(expectedGate, artifact)
  const canonical = { ...artifact } as Record<string, unknown>
  delete canonical.artifactDigest
  delete canonical.evidenceReference
  if (artifact.artifactDigest !== digest(JSON.stringify(canonical))) invalidEvidence()
}

function validateSpecificArtifact(
  gate: MultiEntityRuntimeMigrationEvidenceGate,
  artifact: AnyArtifact
) {
  if (gate === 'node22_runtime_verified') {
    const node = artifact as MultiEntityNode22RuntimeEvidenceArtifact
    if (node.tool !== 'node' || !/^v22\.\d+\.\d+$/.test(node.toolVersion)) invalidEvidence()
    return
  }
  if (gate === 'expand_only_migration_reviewed') {
    const review = artifact as MultiEntityExpandOnlyMigrationReviewEvidenceArtifact
    if (
      !distinctDigests([
        review.migrationPlanDigest,
        review.schemaBeforeDigest,
        review.schemaAfterDigest,
      ]) ||
      !Number.isSafeInteger(review.expandOperationsReviewed) ||
      review.expandOperationsReviewed < 1 ||
      review.destructiveOperationsDetected !== 0
    ) {
      invalidEvidence()
    }
    return
  }
  if (gate === 'migration_dry_run_verified') {
    const migration = artifact as MultiEntityMigrationDryRunEvidenceArtifact
    if (
      !distinctDigests([
        migration.backupManifestDigest,
        migration.migrationPlanDigest,
        migration.schemaBeforeDigest,
        migration.schemaAfterDigest,
      ])
    ) {
      invalidEvidence()
    }
    return
  }
  const backfill = artifact as MultiEntityBackfillDryRunEvidenceArtifact
  if (
    ![
      backfill.backupManifestDigest,
      backfill.inputSnapshotDigest,
      backfill.backfillPlanDigest,
    ].every(validDigest) ||
    backfill.postRunSnapshotDigest !== backfill.inputSnapshotDigest
  ) {
    invalidEvidence()
  }
}

function specificFields(gate: MultiEntityRuntimeMigrationEvidenceGate, input: AnyInput) {
  if (gate === 'expand_only_migration_reviewed') {
    const value = input as MultiEntityExpandOnlyMigrationReviewEvidenceInput
    return {
      migrationPlanDigest: value.migrationPlanDigest,
      schemaBeforeDigest: value.schemaBeforeDigest,
      schemaAfterDigest: value.schemaAfterDigest,
      expandOperationsReviewed: value.expandOperationsReviewed,
      destructiveOperationsDetected: value.destructiveOperationsDetected,
    }
  }
  if (gate === 'migration_dry_run_verified') {
    const value = input as MultiEntityMigrationDryRunEvidenceInput
    return {
      backupManifestDigest: value.backupManifestDigest,
      migrationPlanDigest: value.migrationPlanDigest,
      schemaBeforeDigest: value.schemaBeforeDigest,
      schemaAfterDigest: value.schemaAfterDigest,
    }
  }
  if (gate === 'backfill_dry_run_verified') {
    const value = input as MultiEntityBackfillDryRunEvidenceInput
    return {
      backupManifestDigest: value.backupManifestDigest,
      inputSnapshotDigest: value.inputSnapshotDigest,
      backfillPlanDigest: value.backfillPlanDigest,
      postRunSnapshotDigest: value.postRunSnapshotDigest,
    }
  }
  return {}
}

function validMetrics(metrics: CommonEvidenceArtifact['metrics']): boolean {
  return (
    !!metrics &&
    typeof metrics === 'object' &&
    exactKeys(metrics, METRIC_KEYS) &&
    metrics.externalCommandsReviewed === 1 &&
    metrics.successfulExitStatuses === 1 &&
    metrics.sourceRegisteredStagingExecutionBindings === 0 &&
    metrics.contractDatabaseReads === 0 &&
    metrics.contractDatabaseWrites === 0 &&
    metrics.migrationsApplied === 0 &&
    metrics.backfillsApplied === 0 &&
    metrics.runtimeActivations === 0 &&
    metrics.permissionChanges === 0
  )
}

function validWindow(startedAtUtc: string, finishedAtUtc: string): boolean {
  if (!UTC_PATTERN.test(startedAtUtc) || !UTC_PATTERN.test(finishedAtUtc)) return false
  const started = Date.parse(startedAtUtc)
  const finished = Date.parse(finishedAtUtc)
  return Number.isFinite(started) && Number.isFinite(finished) && finished > started
}

function distinctDigests(values: readonly string[]): boolean {
  return values.every(validDigest) && new Set(values).size === values.length
}

function validDigest(value: string): boolean {
  return DIGEST_PATTERN.test(value)
}

function validReview(value: string): boolean {
  return REVIEW_REFERENCE_PATTERN.test(value)
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(value: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${value.slice('sha256:'.length)}`
}

function invalidEvidence(): never {
  throw new Error('MULTI_ENTITY_RUNTIME_MIGRATION_EVIDENCE_INVALID')
}
