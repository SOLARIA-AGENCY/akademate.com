import { createHash } from 'node:crypto'

import { createRedactedUnifiedLedgerObservation } from './multi-entity-ledger-observability'
import {
  assertMultiEntityRestoredBackupEvidenceArtifact,
  type MultiEntityRestoredBackupEvidenceArtifact,
} from './multi-entity-restored-backup-evidence'
import { createUnifiedLedgerEvidenceManifest } from './multi-entity-shadow-evidence'
import {
  reportMultiEntityShadowOwnership,
  type MultiEntityShadowOwnershipReportInput,
} from './multi-entity-shadow-ownership-report'
import {
  planUnifiedMultiEntityShadow,
  type UnifiedMultiEntityShadowInput,
} from './multi-entity-unified-shadow-plan'

export const MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_FLAG =
  'AKADEMATE_CEP_STAGING_SHADOW_ENTRYPOINT_ENABLED'
export const MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'
export const MULTI_ENTITY_STAGING_SHADOW_MAX_RECORDS = 100_000

export interface ContentAddressedStagingSnapshot<T> {
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly snapshotDigest: string
  readonly value: T
}

/**
 * Deliberately read-only adapter surface. Persistence, restore, mutation and
 * permission callbacks are not part of this contract and extra keys fail closed.
 */
export interface MultiEntityStagingShadowReadAdapters {
  readonly readUnifiedSnapshot: () => Promise<
    ContentAddressedStagingSnapshot<UnifiedMultiEntityShadowInput>
  >
  readonly readOwnershipSnapshot: () => Promise<
    ContentAddressedStagingSnapshot<MultiEntityShadowOwnershipReportInput>
  >
  readonly readRestoredBackupEvidence: () => Promise<MultiEntityRestoredBackupEvidenceArtifact>
}

export interface MultiEntityStagingShadowEntrypointOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly expectedSourceDigest: string
  readonly expectedTargetTenantDigest: string
  readonly adapters: MultiEntityStagingShadowReadAdapters
}

export type MultiEntityStagingShadowBlockReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'input_contract_invalid'
  | 'adapter_contract_invalid'
  | 'snapshot_load_failed'
  | 'snapshot_limit_exceeded'
  | 'snapshot_digest_inconsistent'
  | 'evidence_digest_inconsistent'
  | 'shadow_evaluation_failed'

export interface MultiEntityStagingShadowBlockedResult {
  readonly status: 'blocked'
  readonly reason: MultiEntityStagingShadowBlockReason
  readonly canWrite: false
  readonly canApply: false
  readonly canRestore: false
  readonly canChangePermissions: false
}

export interface MultiEntityStagingShadowExecutionRecord {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_staging_shadow_execution'
  readonly mode: 'read_only_external_evidence_validation'
  readonly verdict: 'eligible_for_manual_review' | 'blocked'
  readonly canWrite: false
  readonly canApply: false
  readonly canRestore: false
  readonly canChangePermissions: false
  readonly inputBindingDigest: string
  readonly metrics: {
    readonly ledger: ReturnType<typeof createUnifiedLedgerEvidenceManifest>['metrics']
    readonly ownership: {
      readonly ready: number
      readonly missing: number
      readonly ambiguous: number
      readonly crossScope: number
    }
    readonly backup: {
      readonly externalRestoreReports: 1
      readonly externalVerificationReports: 1
      readonly payloadDigestMatches: true
      readonly contractBackupReads: 0
      readonly contractDatabaseWrites: 0
      readonly migrationsApplied: 0
      readonly runtimeActivations: 0
      readonly permissionChanges: 0
    }
  }
  readonly executionDigest: string
  readonly executionReference: `evidence://sha256/${string}`
}

export interface MultiEntityStagingShadowRecordedResult {
  readonly status: 'recorded'
  readonly reason: 'shadow_execution_recorded'
  readonly canWrite: false
  readonly canApply: false
  readonly canRestore: false
  readonly canChangePermissions: false
  readonly record: MultiEntityStagingShadowExecutionRecord
  readonly serializedRecord: string
}

export type MultiEntityStagingShadowEntrypointResult =
  | MultiEntityStagingShadowBlockedResult
  | MultiEntityStagingShadowRecordedResult

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const OPTION_KEYS = new Set([
  'environment',
  'expectedSourceDigest',
  'expectedTargetTenantDigest',
  'adapters',
])
const ADAPTER_KEYS = new Set([
  'readUnifiedSnapshot',
  'readOwnershipSnapshot',
  'readRestoredBackupEvidence',
])

/**
 * Creates the digest adapters must bind to a snapshot. Object keys and array
 * elements are canonicalized so equivalent read order produces the same digest.
 */
export function digestMultiEntityStagingShadowSnapshot(value: unknown): string {
  return digest(canonicalSerialize(value))
}

/**
 * Executes one local staging shadow pass. It does not register an endpoint,
 * schedule a job, read a backup payload or expose a persistence callback.
 */
export async function runMultiEntityStagingShadowEntrypoint(
  options: MultiEntityStagingShadowEntrypointOptions
): Promise<MultiEntityStagingShadowEntrypointResult> {
  const gate = resolveGate(options?.environment)
  if (gate) return blocked(gate)

  if (!validOptions(options)) return blocked('input_contract_invalid')
  if (!validAdapters(options.adapters)) return blocked('adapter_contract_invalid')

  let unified: ContentAddressedStagingSnapshot<UnifiedMultiEntityShadowInput>
  let ownership: ContentAddressedStagingSnapshot<MultiEntityShadowOwnershipReportInput>
  let backup: MultiEntityRestoredBackupEvidenceArtifact
  try {
    ;[unified, ownership, backup] = await Promise.all([
      options.adapters.readUnifiedSnapshot(),
      options.adapters.readOwnershipSnapshot(),
      options.adapters.readRestoredBackupEvidence(),
    ])
  } catch {
    return blocked('snapshot_load_failed')
  }

  if (!validSnapshotEnvelope(unified) || !validSnapshotEnvelope(ownership)) {
    return blocked('snapshot_digest_inconsistent')
  }
  if (!snapshotsWithinBounds(unified.value, ownership.value)) {
    return blocked('snapshot_limit_exceeded')
  }
  if (
    unified.snapshotDigest !== digestMultiEntityStagingShadowSnapshot(unified.value) ||
    ownership.snapshotDigest !== digestMultiEntityStagingShadowSnapshot(ownership.value)
  ) {
    return blocked('snapshot_digest_inconsistent')
  }

  try {
    assertMultiEntityRestoredBackupEvidenceArtifact(backup)
  } catch {
    return blocked('evidence_digest_inconsistent')
  }

  const boundArtifacts = [unified, ownership, backup]
  if (
    boundArtifacts.some(
      (artifact) =>
        artifact.sourceDigest !== options.expectedSourceDigest ||
        artifact.targetTenantDigest !== options.expectedTargetTenantDigest
    ) ||
    ownership.value.targetTenantId !== unified.value.targetTenantId
  ) {
    return blocked('evidence_digest_inconsistent')
  }

  try {
    const ledgerPlan = planUnifiedMultiEntityShadow(unified.value)
    const ledgerManifest = createUnifiedLedgerEvidenceManifest([
      createRedactedUnifiedLedgerObservation(ledgerPlan),
    ])
    const ownershipReport = reportMultiEntityShadowOwnership(ownership.value)
    const inputBindingDigest = digest(
      canonicalSerialize({
        sourceDigest: options.expectedSourceDigest,
        targetTenantDigest: options.expectedTargetTenantDigest,
        unifiedSnapshotDigest: unified.snapshotDigest,
        ownershipSnapshotDigest: ownership.snapshotDigest,
        restoredBackupEvidenceDigest: backup.artifactDigest,
      })
    )
    const verdict =
      ledgerManifest.verdict === 'ready' &&
      ownershipReport.summary.missing === 0 &&
      ownershipReport.summary.ambiguous === 0 &&
      ownershipReport.summary.cross_scope === 0
        ? 'eligible_for_manual_review'
        : 'blocked'
    const payload = Object.freeze({
      schemaVersion: 1 as const,
      kind: 'cep_multi_entity_staging_shadow_execution' as const,
      mode: 'read_only_external_evidence_validation' as const,
      verdict,
      canWrite: false as const,
      canApply: false as const,
      canRestore: false as const,
      canChangePermissions: false as const,
      inputBindingDigest,
      metrics: Object.freeze({
        ledger: ledgerManifest.metrics,
        ownership: Object.freeze({
          ready: ownershipReport.summary.ready,
          missing: ownershipReport.summary.missing,
          ambiguous: ownershipReport.summary.ambiguous,
          crossScope: ownershipReport.summary.cross_scope,
        }),
        backup: Object.freeze({
          externalRestoreReports: backup.metrics.externalRestoreReports,
          externalVerificationReports: backup.metrics.externalVerificationReports,
          payloadDigestMatches: backup.metrics.payloadDigestMatches,
          contractBackupReads: backup.metrics.contractBackupReads,
          contractDatabaseWrites: backup.metrics.contractDatabaseWrites,
          migrationsApplied: backup.metrics.migrationsApplied,
          runtimeActivations: backup.metrics.runtimeActivations,
          permissionChanges: backup.metrics.permissionChanges,
        }),
      }),
    })
    const executionDigest = digest(JSON.stringify(payload))
    const record = Object.freeze({
      ...payload,
      executionDigest,
      executionReference: `evidence://sha256/${executionDigest.slice('sha256:'.length)}` as const,
    })

    return Object.freeze({
      status: 'recorded',
      reason: 'shadow_execution_recorded',
      canWrite: false,
      canApply: false,
      canRestore: false,
      canChangePermissions: false,
      record,
      serializedRecord: JSON.stringify(record),
    })
  } catch {
    return blocked('shadow_evaluation_failed')
  }
}

function resolveGate(
  environment: Readonly<Record<string, string | undefined>> | undefined
): MultiEntityStagingShadowBlockReason | null {
  const values = environment ?? process.env
  if (values[MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_FLAG] !== 'true') return 'flag_disabled'
  const target = values[MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_ENVIRONMENT]?.trim().toLowerCase()
  if (target === 'production') return 'production_forbidden'
  return target === 'staging' ? null : 'environment_missing_or_invalid'
}

function validOptions(value: unknown): value is MultiEntityStagingShadowEntrypointOptions {
  if (!isRecord(value) || !exactKeys(value, OPTION_KEYS)) return false
  return (
    validDigest(value.expectedSourceDigest) &&
    validDigest(value.expectedTargetTenantDigest) &&
    value.expectedSourceDigest !== value.expectedTargetTenantDigest &&
    isRecord(value.adapters)
  )
}

function validAdapters(value: unknown): value is MultiEntityStagingShadowReadAdapters {
  if (!isRecord(value) || !exactKeys(value, ADAPTER_KEYS)) return false
  return [...ADAPTER_KEYS].every((key) => typeof value[key] === 'function')
}

function validSnapshotEnvelope(value: unknown): value is ContentAddressedStagingSnapshot<unknown> {
  return (
    isRecord(value) &&
    exactKeys(value, new Set(['sourceDigest', 'targetTenantDigest', 'snapshotDigest', 'value'])) &&
    validDigest(value.sourceDigest) &&
    validDigest(value.targetTenantDigest) &&
    validDigest(value.snapshotDigest) &&
    'value' in value
  )
}

function snapshotsWithinBounds(
  unified: UnifiedMultiEntityShadowInput,
  ownership: MultiEntityShadowOwnershipReportInput
): boolean {
  if (!isRecord(unified) || !isRecord(ownership)) return false
  const unifiedCollections = [
    unified.classrooms,
    unified.courseRuns,
    unified.enrollments,
    unified.leads,
    unified.campaigns,
    unified.advertisingSpends,
    unified.explicitResolutions,
    unified.topology?.legalEntities,
    unified.topology?.campuses,
    unified.topology?.campusBindings,
    unified.topology?.staffAssignments,
    unified.topology?.accountingConnections,
  ]
  const ownershipCollections = [
    ownership.records,
    ownership.legalEntities,
    ownership.campusBindings,
  ]
  if (![...unifiedCollections, ...ownershipCollections].every(Array.isArray)) return false

  const requestedLimits = [unified.maxRecords, ownership.maxRecords].filter(
    (value): value is number => value !== undefined
  )
  if (
    requestedLimits.some(
      (value) =>
        !Number.isSafeInteger(value) || value < 1 || value > MULTI_ENTITY_STAGING_SHADOW_MAX_RECORDS
    )
  ) {
    return false
  }
  const effectiveLimit = Math.min(MULTI_ENTITY_STAGING_SHADOW_MAX_RECORDS, ...requestedLimits)
  return [...unifiedCollections, ...ownershipCollections].every(
    (records) => records.length <= effectiveLimit
  )
}

function canonicalSerialize(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid canonical value.')
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map(canonicalize)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    )
  }
  throw new Error('Invalid canonical value.')
}

function blocked(
  reason: MultiEntityStagingShadowBlockReason
): MultiEntityStagingShadowBlockedResult {
  return Object.freeze({
    status: 'blocked',
    reason,
    canWrite: false,
    canApply: false,
    canRestore: false,
    canChangePermissions: false,
  })
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
