import {
  planReadOnlyFinanceReconciliation,
  type FinanceReconciliationPipelineInput,
  type FinanceReconciliationPipelineResult,
} from './reconciliation-pipeline'

export const FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG =
  'AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED'
export const FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export type FinanceReconciliationShadowRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type FinanceReconciliationShadowRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<FinanceReconciliationShadowRunnerGateReason, 'staging_enabled'>
    }
  | {
      readonly enabled: true
      readonly reason: 'staging_enabled'
    }

export interface FinanceReconciliationShadowObservation {
  readonly schemaVersion: 1
  readonly mode: 'read_only_finance_reconciliation_shadow'
  readonly verdict: 'planned' | 'blocked'
  readonly canWrite: false
  readonly canApply: false
  readonly metrics: {
    readonly accountingTransactions: number
    readonly sourceRecords: number
    readonly projectedRecords: number
    readonly ignoredRecords: number
    readonly blockedRecords: number
    readonly projectionIssues: number
    readonly reconciliationTransactions: number
    readonly proposed: number
    readonly unmatched: number
    readonly ambiguous: number
    readonly conflicted: number
  }
}

export interface FinanceReconciliationShadowRunnerOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly loadSnapshot: () => Promise<FinanceReconciliationPipelineInput>
}

export type FinanceReconciliationShadowRunnerResult =
  | {
      readonly status: 'skipped'
      readonly reason: Exclude<FinanceReconciliationShadowRunnerGateReason, 'staging_enabled'>
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'failed'
      readonly reason: 'snapshot_load_failed' | 'reconciliation_planning_failed'
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'shadow_observed'
      readonly canWrite: false
      readonly canApply: false
      readonly observation: FinanceReconciliationShadowObservation
      readonly serializedObservation: string
    }

export function resolveFinanceReconciliationShadowRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): FinanceReconciliationShadowRunnerGate {
  if (environment[FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }

  const explicitEnvironment =
    environment[FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()

  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

/**
 * Executes one staging-only read observation. There is intentionally no store,
 * persistence callback, endpoint registration or apply capability.
 */
export async function runFinanceReconciliationShadowEvidence(
  options: FinanceReconciliationShadowRunnerOptions
): Promise<FinanceReconciliationShadowRunnerResult> {
  const gate = resolveFinanceReconciliationShadowRunnerGate(options.environment)
  if (gate.enabled === false) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
    })
  }

  let snapshot: FinanceReconciliationPipelineInput
  try {
    snapshot = await options.loadSnapshot()
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
  }

  try {
    const result = planReadOnlyFinanceReconciliation(snapshot)
    const observation = createRedactedObservation(snapshot.accountingTransactions.length, result)
    return Object.freeze({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      observation,
      serializedObservation: JSON.stringify(observation),
    })
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'reconciliation_planning_failed',
      canWrite: false,
      canApply: false,
    })
  }
}

function createRedactedObservation(
  accountingTransactions: number,
  result: FinanceReconciliationPipelineResult
): FinanceReconciliationShadowObservation {
  const reconciliation = result.reconciliation?.summary
  return Object.freeze({
    schemaVersion: 1,
    mode: 'read_only_finance_reconciliation_shadow',
    verdict: result.ready ? 'planned' : 'blocked',
    canWrite: false,
    canApply: false,
    metrics: Object.freeze({
      accountingTransactions,
      sourceRecords: result.projection.summary.sourceRecords,
      projectedRecords: result.projection.summary.projectedRecords,
      ignoredRecords: result.projection.summary.ignoredRecords,
      blockedRecords: result.projection.summary.blockedRecords,
      projectionIssues: result.projection.summary.issues,
      reconciliationTransactions: reconciliation?.total ?? 0,
      proposed: reconciliation?.proposed ?? 0,
      unmatched: reconciliation?.unmatched ?? 0,
      ambiguous: reconciliation?.ambiguous ?? 0,
      conflicted: reconciliation?.conflicted ?? 0,
    }),
  })
}
