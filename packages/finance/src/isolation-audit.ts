import {
  createFinanceReconciliationSnapshotLoader,
  type FinanceAccountingSnapshotScope,
  type FinanceReconciliationSnapshotLoaderOptions,
  type FinanceReconciliationSnapshotReaders,
} from './snapshot-loader'
import type { FinanceReconciliationPipelineInput } from './reconciliation-pipeline'
import type { FinanceSnapshotRelationship } from './operational-projection'
import { AccountingSyncError } from './sync-error'

export const FINANCE_ISOLATION_AUDIT_FLAG = 'AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED'
export const FINANCE_ISOLATION_AUDIT_ENVIRONMENT = 'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'
export const CEP_FINANCE_ISOLATION_EXPECTED_ENTITIES = 3

export type FinanceIsolationAuditRole = 'existing_entity' | 'cep_sur_pilot_candidate'

export interface FinanceIsolationAuditCandidate {
  readonly scope: FinanceAccountingSnapshotScope
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly role: FinanceIsolationAuditRole
  readonly reviewReference: string
  readonly pilotReviewReference?: string
  readonly readers: FinanceReconciliationSnapshotReaders
}

export type FinanceIsolationAuditLimits = Pick<
  FinanceReconciliationSnapshotLoaderOptions,
  'maxAccountingTransactions' | 'maxSourceRecords' | 'maxRelationshipRecords'
>

export interface FinanceIsolationAuditOptions {
  readonly candidates: readonly FinanceIsolationAuditCandidate[]
  readonly limits?: FinanceIsolationAuditLimits
}

export type FinanceIsolationAuditGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type FinanceIsolationAuditGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<FinanceIsolationAuditGateReason, 'staging_enabled'>
    }
  | { readonly enabled: true; readonly reason: 'staging_enabled' }

export interface FinanceIsolationAuditObservation {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_finance_isolation_audit'
  readonly verdict: 'isolated' | 'breach_detected'
  readonly canWrite: false
  readonly canApply: false
  readonly metrics: {
    readonly expectedEntities: 3
    readonly evaluatedEntities: number
    readonly evaluatedSurfaces: number
    readonly isolationBreaches: number
  }
}

export type FinanceIsolationAuditResult =
  | {
      readonly status: 'skipped'
      readonly reason: Exclude<FinanceIsolationAuditGateReason, 'staging_enabled'>
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'failed'
      readonly reason: 'snapshot_load_failed'
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'isolation_observed'
      readonly canWrite: false
      readonly canApply: false
      readonly observation: FinanceIsolationAuditObservation
      readonly serializedObservation: string
    }

export interface FinanceIsolationAudit {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_finance_isolation_audit'
  readonly expectedEntities: 3
  readonly canWrite: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<FinanceIsolationAuditResult>
}

interface PreparedCandidate {
  readonly scope: FinanceAccountingSnapshotScope
  readonly loadSnapshot: () => Promise<FinanceReconciliationPipelineInput>
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Audits exactly three entity snapshots sequentially. Snapshot data is checked
 * and discarded per entity; the result contains only redacted conformance
 * counters and never financial or identifying values.
 */
export function createFinanceIsolationAudit(
  options: FinanceIsolationAuditOptions
): FinanceIsolationAudit {
  const candidates = prepareCandidates(options)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_entity_finance_isolation_audit',
    expectedEntities: CEP_FINANCE_ISOLATION_EXPECTED_ENTITIES,
    canWrite: false,
    canApply: false,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runPreparedAudit(candidates, environment),
  })
}

export function resolveFinanceIsolationAuditGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): FinanceIsolationAuditGate {
  if (environment[FINANCE_ISOLATION_AUDIT_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }
  const explicitEnvironment = environment[FINANCE_ISOLATION_AUDIT_ENVIRONMENT]?.trim().toLowerCase()
  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

async function runPreparedAudit(
  candidates: readonly PreparedCandidate[],
  environment?: Readonly<Record<string, string | undefined>>
): Promise<FinanceIsolationAuditResult> {
  const gate = resolveFinanceIsolationAuditGate(environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
    })
  }

  let evaluatedEntities = 0
  let evaluatedSurfaces = 0
  for (const candidate of candidates) {
    let snapshot: FinanceReconciliationPipelineInput
    try {
      snapshot = await candidate.loadSnapshot()
    } catch {
      return Object.freeze({
        status: 'failed',
        reason: 'snapshot_load_failed',
        canWrite: false,
        canApply: false,
      })
    }

    const isolationBreaches = auditFinanceIsolationSnapshot(snapshot, candidate.scope)
    evaluatedEntities += 1
    evaluatedSurfaces += 5
    if (isolationBreaches > 0) {
      return observedResult({ evaluatedEntities, evaluatedSurfaces, isolationBreaches })
    }
  }

  return observedResult({ evaluatedEntities, evaluatedSurfaces, isolationBreaches: 0 })
}

function observedResult(metrics: {
  readonly evaluatedEntities: number
  readonly evaluatedSurfaces: number
  readonly isolationBreaches: number
}): FinanceIsolationAuditResult {
  const observation = Object.freeze({
    schemaVersion: 1 as const,
    mode: 'three_entity_finance_isolation_audit' as const,
    verdict: metrics.isolationBreaches === 0 ? ('isolated' as const) : ('breach_detected' as const),
    canWrite: false as const,
    canApply: false as const,
    metrics: Object.freeze({
      expectedEntities: CEP_FINANCE_ISOLATION_EXPECTED_ENTITIES,
      evaluatedEntities: metrics.evaluatedEntities,
      evaluatedSurfaces: metrics.evaluatedSurfaces,
      isolationBreaches: metrics.isolationBreaches,
    }),
  })
  return Object.freeze({
    status: 'observed',
    reason: 'isolation_observed',
    canWrite: false,
    canApply: false,
    observation,
    serializedObservation: JSON.stringify(observation),
  })
}

function prepareCandidates(options: FinanceIsolationAuditOptions): readonly PreparedCandidate[] {
  if (
    !options ||
    !Array.isArray(options.candidates) ||
    options.candidates.length !== CEP_FINANCE_ISOLATION_EXPECTED_ENTITIES
  ) {
    throw auditError(
      'FINANCE_ISOLATION_AUDIT_ENTITY_COUNT_INVALID',
      'Finance isolation audit requires exactly three entities.'
    )
  }

  const entityKeys = new Set<string>()
  const connectionIds = new Set<string>()
  const reviewReferences = new Set<string>()
  let tenantId: string | null = null
  let pilotCandidates = 0
  const prepared: PreparedCandidate[] = []

  for (const candidate of options.candidates) {
    validateCandidate(candidate)
    tenantId ??= candidate.scope.tenantId
    if (candidate.scope.tenantId !== tenantId) {
      throw auditError(
        'FINANCE_ISOLATION_AUDIT_TENANT_MISMATCH',
        'Finance isolation audit candidates must share one tenant.'
      )
    }

    const entityKey = `${candidate.scope.tenantId}\u0000${candidate.scope.legalEntityId}`
    if (entityKeys.has(entityKey)) {
      throw auditError(
        'FINANCE_ISOLATION_AUDIT_DUPLICATE_ENTITY',
        'Finance isolation audit contains a duplicate entity.'
      )
    }
    if (connectionIds.has(candidate.scope.connectionId)) {
      throw auditError(
        'FINANCE_ISOLATION_AUDIT_SHARED_CONNECTION',
        'Finance isolation audit contains a shared accounting connection.'
      )
    }
    if (
      reviewReferences.has(candidate.reviewReference) ||
      (candidate.pilotReviewReference !== undefined &&
        reviewReferences.has(candidate.pilotReviewReference))
    ) {
      throw auditError(
        'FINANCE_ISOLATION_AUDIT_REVIEW_REUSED',
        'Finance isolation audit review references must be unique.'
      )
    }

    entityKeys.add(entityKey)
    connectionIds.add(candidate.scope.connectionId)
    reviewReferences.add(candidate.reviewReference)
    if (candidate.pilotReviewReference !== undefined) {
      reviewReferences.add(candidate.pilotReviewReference)
    }
    if (candidate.role === 'cep_sur_pilot_candidate') pilotCandidates += 1

    const readers = captureReaders(candidate.readers)
    const scope = Object.freeze({ ...candidate.scope })
    prepared.push(
      Object.freeze({
        scope,
        loadSnapshot: createFinanceReconciliationSnapshotLoader({
          scope,
          readers,
          ...copyLimits(options.limits),
        }),
      })
    )
  }

  if (pilotCandidates !== 1) {
    throw auditError(
      'FINANCE_ISOLATION_AUDIT_PILOT_COUNT_INVALID',
      'Finance isolation audit requires one CEP Sur pilot candidate.'
    )
  }

  return Object.freeze(
    prepared.sort(
      (left, right) =>
        left.scope.legalEntityId.localeCompare(right.scope.legalEntityId) ||
        left.scope.connectionId.localeCompare(right.scope.connectionId)
    )
  )
}

function validateCandidate(candidate: FinanceIsolationAuditCandidate): void {
  const pilotShape =
    candidate?.role === 'cep_sur_pilot_candidate'
      ? validReviewReference(candidate.pilotReviewReference) &&
        candidate.pilotReviewReference !== candidate.reviewReference
      : candidate?.role === 'existing_entity' && candidate.pilotReviewReference === undefined

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !validScope(candidate.scope) ||
    candidate.integrationMode !== 'read_only' ||
    candidate.connectionStatus !== 'active' ||
    !validReviewReference(candidate.reviewReference) ||
    !pilotShape
  ) {
    throw auditError(
      'FINANCE_ISOLATION_AUDIT_CANDIDATE_INVALID',
      'Finance isolation audit candidate is invalid.'
    )
  }
}

function captureReaders(
  readers: FinanceReconciliationSnapshotReaders
): FinanceReconciliationSnapshotReaders {
  if (!readers || typeof readers !== 'object') throw invalidReaderError()
  return Object.freeze({
    readAccountingTransactions: captureReader(readers, 'readAccountingTransactions'),
    readEnrollments: captureReader(readers, 'readEnrollments'),
    readCampaigns: captureReader(readers, 'readCampaigns'),
    readPaymentEvents: captureReader(readers, 'readPaymentEvents'),
    readAdvertisingSpend: captureReader(readers, 'readAdvertisingSpend'),
  })
}

function captureReader<TKey extends keyof FinanceReconciliationSnapshotReaders>(
  readers: FinanceReconciliationSnapshotReaders,
  key: TKey
): FinanceReconciliationSnapshotReaders[TKey] {
  const reader = readers[key]
  if (typeof reader !== 'function') throw invalidReaderError()
  return reader.bind(readers) as FinanceReconciliationSnapshotReaders[TKey]
}

/** Pure scope/relationship checker shared by disconnected audit runners. */
export function auditFinanceIsolationSnapshot(
  snapshot: FinanceReconciliationPipelineInput,
  scope: FinanceAccountingSnapshotScope
): number {
  let breaches = 0
  if (
    snapshot.tenantId !== scope.tenantId ||
    snapshot.legalEntityId !== scope.legalEntityId ||
    snapshot.connectionId !== scope.connectionId ||
    snapshot.operational.targetTenantId !== scope.tenantId ||
    snapshot.operational.targetLegalEntityId !== scope.legalEntityId
  ) {
    breaches += 1
  }

  breaches += auditScopedRecords(
    snapshot.accountingTransactions,
    scope,
    (record) => record.externalId,
    true
  ).breaches
  const enrollments = auditScopedRecords(
    snapshot.operational.enrollments,
    scope,
    (record) => relationshipId(record.id),
    false
  )
  breaches += enrollments.breaches
  const campaigns = auditScopedRecords(
    snapshot.operational.campaigns,
    scope,
    (record) => relationshipId(record.id),
    false
  )
  breaches += campaigns.breaches
  const payments = auditScopedRecords(
    snapshot.operational.paymentEvents,
    scope,
    (record) => relationshipId(record.id),
    false
  )
  breaches += payments.breaches
  for (const payment of snapshot.operational.paymentEvents) {
    const parentId = relationshipId(payment.enrollment)
    if (parentId === null || !enrollments.ids.has(parentId)) breaches += 1
  }
  const advertising = auditScopedRecords(
    snapshot.operational.advertisingSpend,
    scope,
    (record) => relationshipId(record.id),
    false
  )
  breaches += advertising.breaches
  for (const spend of snapshot.operational.advertisingSpend) {
    const parentId = relationshipId(spend.campaign)
    if (parentId === null || !campaigns.ids.has(parentId)) breaches += 1
  }

  return breaches
}

/** Creates a redacted, deterministic binding for tenant/entity/connection scope. */
export function createFinanceIsolationScopeDigest(scope: FinanceAccountingSnapshotScope): string {
  if (!validScope(scope)) {
    throw auditError(
      'FINANCE_ISOLATION_AUDIT_SCOPE_INVALID',
      'Finance isolation audit scope is invalid.'
    )
  }
  return `sha256:${createHash('sha256')
    .update(JSON.stringify([scope.tenantId, scope.legalEntityId, scope.connectionId]))
    .digest('hex')}`
}

function auditScopedRecords<
  T extends { readonly tenantId: string; readonly legalEntityId: string },
>(
  records: readonly T[],
  scope: FinanceAccountingSnapshotScope,
  getId: (record: T) => string | null,
  requireConnection: boolean
): { readonly breaches: number; readonly ids: ReadonlySet<string> } {
  let breaches = 0
  const ids = new Set<string>()
  for (const record of records) {
    const id = getId(record)
    if (
      !id ||
      ids.has(id) ||
      record.tenantId !== scope.tenantId ||
      record.legalEntityId !== scope.legalEntityId ||
      (requireConnection &&
        (record as { readonly connectionId?: string }).connectionId !== scope.connectionId)
    ) {
      breaches += 1
    }
    if (id) ids.add(id)
  }
  return { breaches, ids }
}

function relationshipId(value: FinanceSnapshotRelationship): string | null {
  const candidate = typeof value === 'object' && value !== null ? value.id : value
  if (typeof candidate === 'number') {
    return Number.isSafeInteger(candidate) && candidate > 0 ? String(candidate) : null
  }
  return validIdentifier(candidate) ? candidate : null
}

function copyLimits(limits: FinanceIsolationAuditLimits | undefined): FinanceIsolationAuditLimits {
  if (!limits) return Object.freeze({})
  return Object.freeze({
    ...(limits.maxAccountingTransactions === undefined
      ? {}
      : { maxAccountingTransactions: limits.maxAccountingTransactions }),
    ...(limits.maxSourceRecords === undefined ? {} : { maxSourceRecords: limits.maxSourceRecords }),
    ...(limits.maxRelationshipRecords === undefined
      ? {}
      : { maxRelationshipRecords: limits.maxRelationshipRecords }),
  })
}

function validScope(scope: FinanceAccountingSnapshotScope): boolean {
  return (
    !!scope &&
    typeof scope === 'object' &&
    validIdentifier(scope.tenantId) &&
    validIdentifier(scope.legalEntityId) &&
    validIdentifier(scope.connectionId)
  )
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function invalidReaderError(): AccountingSyncError {
  return auditError(
    'FINANCE_ISOLATION_AUDIT_READER_INVALID',
    'Finance isolation audit reader is invalid.'
  )
}

function auditError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
import { createHash } from 'node:crypto'
