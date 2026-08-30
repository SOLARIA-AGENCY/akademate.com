import {
  auditFinanceIsolationSnapshot,
  createFinanceIsolationScopeDigest,
  resolveFinanceIsolationAuditGate,
  type FinanceIsolationAuditLimits,
  type FinanceIsolationAuditRole,
  type FinanceIsolationAuditGateReason,
} from './isolation-audit'
import {
  createFinanceReconciliationSnapshotLoader,
  type FinanceAccountingSnapshotScope,
  type FinanceReconciliationSnapshotReaders,
} from './snapshot-loader'
import { AccountingSyncError } from './sync-error'

export const FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES = [
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

export type FinanceEntityIsolationNegativeCaseRole =
  (typeof FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES)[number]

export interface FinanceEntityIsolationNegativeCase {
  readonly role: FinanceEntityIsolationNegativeCaseRole
  readonly runReviewReference: string
  readonly readers: FinanceReconciliationSnapshotReaders
}

export interface FinanceEntityIsolationNegativeAuditOptions {
  readonly scope: FinanceAccountingSnapshotScope
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly role: FinanceIsolationAuditRole
  readonly entityReviewReference: string
  readonly pilotReviewReference?: string
  readonly cases: readonly FinanceEntityIsolationNegativeCase[]
  readonly limits?: FinanceIsolationAuditLimits
}

export interface FinanceEntityIsolationNegativeCaseObservation {
  readonly role: FinanceEntityIsolationNegativeCaseRole
  readonly verdict: 'breach_detected' | 'isolation_gap'
  readonly isolationBreaches: number
}

export interface FinanceEntityIsolationNegativeAuditObservation {
  readonly schemaVersion: 1
  readonly mode: 'three_case_entity_finance_isolation_negative_audit'
  readonly scopeDigest: string
  readonly verdict: 'all_breaches_rejected' | 'gap_detected'
  readonly canWrite: false
  readonly canApply: false
  readonly metrics: {
    readonly expectedCases: 3
    readonly evaluatedCases: number
    readonly rejectedCases: number
    readonly gapCases: number
    readonly isolationBreaches: number
  }
  readonly cases: readonly FinanceEntityIsolationNegativeCaseObservation[]
}

export type FinanceEntityIsolationNegativeAuditResult =
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
      readonly reason: 'negative_cases_observed'
      readonly canWrite: false
      readonly canApply: false
      readonly observation: FinanceEntityIsolationNegativeAuditObservation
      readonly serializedObservation: string
    }

export interface FinanceEntityIsolationNegativeAudit {
  readonly schemaVersion: 1
  readonly mode: 'three_case_entity_finance_isolation_negative_audit'
  readonly expectedCases: 3
  readonly canWrite: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<FinanceEntityIsolationNegativeAuditResult>
}

interface PreparedCase {
  readonly role: FinanceEntityIsolationNegativeCaseRole
  readonly loadSnapshot: ReturnType<typeof createFinanceReconciliationSnapshotLoader>
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Runs three injected negative cases for one bound entity scope. It performs no
 * source discovery or persistence and emits only a scope digest and counters.
 */
export function createFinanceEntityIsolationNegativeAudit(
  options: FinanceEntityIsolationNegativeAuditOptions
): FinanceEntityIsolationNegativeAudit {
  const prepared = prepareOptions(options)
  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_case_entity_finance_isolation_negative_audit',
    expectedCases: 3,
    canWrite: false,
    canApply: false,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runPrepared(prepared.scope, prepared.cases, environment),
  })
}

async function runPrepared(
  scope: FinanceAccountingSnapshotScope,
  cases: readonly PreparedCase[],
  environment?: Readonly<Record<string, string | undefined>>
): Promise<FinanceEntityIsolationNegativeAuditResult> {
  const gate = resolveFinanceIsolationAuditGate(environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
    })
  }

  const observations: FinanceEntityIsolationNegativeCaseObservation[] = []
  for (const current of cases) {
    try {
      const snapshot = await current.loadSnapshot()
      const isolationBreaches = auditFinanceIsolationSnapshot(snapshot, scope)
      observations.push(
        Object.freeze({
          role: current.role,
          verdict: isolationBreaches > 0 ? 'breach_detected' : 'isolation_gap',
          isolationBreaches,
        })
      )
    } catch {
      return Object.freeze({
        status: 'failed',
        reason: 'snapshot_load_failed',
        canWrite: false,
        canApply: false,
      })
    }
  }

  const rejectedCases = observations.filter(({ verdict }) => verdict === 'breach_detected').length
  const gapCases = observations.length - rejectedCases
  const observation: FinanceEntityIsolationNegativeAuditObservation = Object.freeze({
    schemaVersion: 1,
    mode: 'three_case_entity_finance_isolation_negative_audit',
    scopeDigest: createFinanceIsolationScopeDigest(scope),
    verdict: gapCases === 0 ? 'all_breaches_rejected' : 'gap_detected',
    canWrite: false,
    canApply: false,
    metrics: Object.freeze({
      expectedCases: 3,
      evaluatedCases: observations.length,
      rejectedCases,
      gapCases,
      isolationBreaches: observations.reduce(
        (total, current) => total + current.isolationBreaches,
        0
      ),
    }),
    cases: Object.freeze(observations),
  })
  return Object.freeze({
    status: 'observed',
    reason: 'negative_cases_observed',
    canWrite: false,
    canApply: false,
    observation,
    serializedObservation: JSON.stringify(observation),
  })
}

function prepareOptions(options: FinanceEntityIsolationNegativeAuditOptions): {
  readonly scope: FinanceAccountingSnapshotScope
  readonly cases: readonly PreparedCase[]
} {
  const pilotShape =
    options?.role === 'cep_sur_pilot_candidate'
      ? validReviewReference(options.pilotReviewReference) &&
        options.pilotReviewReference !== options.entityReviewReference
      : options?.role === 'existing_entity' && options.pilotReviewReference === undefined
  if (
    !options ||
    typeof options !== 'object' ||
    options.integrationMode !== 'read_only' ||
    options.connectionStatus !== 'active' ||
    !validReviewReference(options.entityReviewReference) ||
    !pilotShape ||
    !Array.isArray(options.cases) ||
    options.cases.length !== 3
  ) {
    invalidOptions('FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_OPTIONS_INVALID')
  }

  const scopeDigest = createFinanceIsolationScopeDigest(options.scope)
  if (!scopeDigest) invalidOptions('FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_OPTIONS_INVALID')
  const roles = new Set<FinanceEntityIsolationNegativeCaseRole>()
  const reviews = new Set(
    [options.entityReviewReference, options.pilotReviewReference].filter(Boolean)
  )
  const prepared = options.cases.map((current) => {
    if (
      !current ||
      typeof current !== 'object' ||
      !FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.includes(current.role) ||
      roles.has(current.role) ||
      !validReviewReference(current.runReviewReference) ||
      reviews.has(current.runReviewReference) ||
      !validReaders(current.readers)
    ) {
      invalidOptions('FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_CASE_INVALID')
    }
    roles.add(current.role)
    reviews.add(current.runReviewReference)
    return Object.freeze({
      role: current.role,
      loadSnapshot: createFinanceReconciliationSnapshotLoader({
        scope: Object.freeze({ ...options.scope }),
        readers: captureReaders(current.readers),
        ...copyLimits(options.limits),
      }),
    })
  })
  if (FINANCE_ENTITY_ISOLATION_NEGATIVE_CASE_ROLES.some((role) => !roles.has(role))) {
    invalidOptions('FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_CASE_INVALID')
  }
  return Object.freeze({
    scope: Object.freeze({ ...options.scope }),
    cases: Object.freeze(prepared.sort((left, right) => left.role.localeCompare(right.role))),
  })
}

function validReaders(readers: FinanceReconciliationSnapshotReaders): boolean {
  return (
    !!readers &&
    typeof readers === 'object' &&
    typeof readers.readAccountingTransactions === 'function' &&
    typeof readers.readEnrollments === 'function' &&
    typeof readers.readCampaigns === 'function' &&
    typeof readers.readPaymentEvents === 'function' &&
    typeof readers.readAdvertisingSpend === 'function'
  )
}

function captureReaders(
  readers: FinanceReconciliationSnapshotReaders
): FinanceReconciliationSnapshotReaders {
  return Object.freeze({
    readAccountingTransactions: readers.readAccountingTransactions.bind(readers),
    readEnrollments: readers.readEnrollments.bind(readers),
    readCampaigns: readers.readCampaigns.bind(readers),
    readPaymentEvents: readers.readPaymentEvents.bind(readers),
    readAdvertisingSpend: readers.readAdvertisingSpend.bind(readers),
  })
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

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function invalidOptions(code: string): never {
  throw new AccountingSyncError(code, 'Finance entity isolation negative audit is invalid.')
}
