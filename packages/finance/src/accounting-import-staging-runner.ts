import type {
  AccountingReadSourceResolver,
  ResolvedAccountingReadSource,
} from './accounting-source-registry'
import {
  ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES,
  prepareAccountingSyncCandidates,
  prepareAccountingSyncJobs,
  type AccountingSyncShadowCandidate,
  type PreparedAccountingSyncCandidate,
} from './accounting-sync-shadow-planner'
import {
  synchronizeIndependentAccountingConnections,
  type IndependentAccountingSyncBatchResult,
} from './independent-sync'

export const ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG =
  'AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED'
export const ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT = 'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export interface AccountingImportStagingRunnerOptions {
  readonly resolver: Pick<AccountingReadSourceResolver, 'resolveBatch'>
  readonly candidates: readonly AccountingSyncShadowCandidate[]
}

export type AccountingImportStagingRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type AccountingImportStagingRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<AccountingImportStagingRunnerGateReason, 'staging_enabled'>
    }
  | { readonly enabled: true; readonly reason: 'staging_enabled' }

export interface AccountingImportStagingObservation {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_accounting_import_staging'
  readonly verdict: 'completed' | 'partial_failure' | 'failed'
  readonly canReadProvider: true
  readonly canWriteProvider: false
  readonly canWriteLocal: true
  readonly canApply: false
  readonly metrics: {
    readonly expectedEntities: 3
    readonly attemptedEntities: 3
    readonly completedEntities: number
    readonly failedEntities: number
    readonly pilotCandidates: 1
  }
}

interface DisabledCapabilities {
  readonly canReadProvider: false
  readonly canWriteProvider: false
  readonly canWriteLocal: false
  readonly canApply: false
}

interface ExecutionCapabilities {
  readonly canReadProvider: true
  readonly canWriteProvider: false
  readonly canWriteLocal: true
  readonly canApply: false
}

export type AccountingImportStagingRunnerResult =
  | ({
      readonly status: 'skipped'
      readonly reason: Exclude<AccountingImportStagingRunnerGateReason, 'staging_enabled'>
    } & DisabledCapabilities)
  | ({
      readonly status: 'failed'
      readonly reason: 'source_resolution_failed' | 'source_validation_failed'
    } & DisabledCapabilities)
  | ({
      readonly status: 'failed'
      readonly reason: 'execution_failed'
    } & ExecutionCapabilities)
  | ({
      readonly status: 'observed'
      readonly reason: 'staging_import_observed'
      readonly observation: AccountingImportStagingObservation
      readonly serializedObservation: string
    } & ExecutionCapabilities)

export interface AccountingImportStagingRunner {
  readonly schemaVersion: 1
  readonly mode: 'three_entity_accounting_import_staging'
  readonly providerAccess: 'read_only'
  readonly localStoreAccess: 'write_import_only'
  readonly canWriteProvider: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<AccountingImportStagingRunnerResult>
}

/**
 * Executes three independent imports only under an explicit staging gate. The
 * external client contract has no write operation; local store writes are
 * limited to the injected import stores and are reported explicitly.
 */
export function createAccountingImportStagingRunner(
  options: AccountingImportStagingRunnerOptions
): AccountingImportStagingRunner {
  const candidates = prepareAccountingSyncCandidates(options?.candidates)
  const resolveBatch = captureResolver(options?.resolver)

  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_entity_accounting_import_staging',
    providerAccess: 'read_only',
    localStoreAccess: 'write_import_only',
    canWriteProvider: false,
    canApply: false,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runPreparedImport(candidates, resolveBatch, environment),
  })
}

export function resolveAccountingImportStagingRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): AccountingImportStagingRunnerGate {
  if (environment[ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }
  const explicitEnvironment =
    environment[ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT]?.trim().toLowerCase()
  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

async function runPreparedImport(
  candidates: readonly PreparedAccountingSyncCandidate[],
  resolveBatch: AccountingReadSourceResolver['resolveBatch'],
  environment?: Readonly<Record<string, string | undefined>>
): Promise<AccountingImportStagingRunnerResult> {
  const gate = resolveAccountingImportStagingRunnerGate(environment)
  if (gate.enabled === false) return skippedResult(gate.reason)

  let sources: readonly ResolvedAccountingReadSource[]
  try {
    sources = await resolveBatch({
      tenantId: candidates[0]!.source.tenantId,
      sources: candidates.map(({ source }) => source),
      maxConnections: ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES,
    })
  } catch {
    return preExecutionFailedResult('source_resolution_failed')
  }

  let jobs
  try {
    jobs = prepareAccountingSyncJobs(candidates, sources)
  } catch {
    return preExecutionFailedResult('source_validation_failed')
  }

  let observation: AccountingImportStagingObservation
  try {
    const result: IndependentAccountingSyncBatchResult =
      await synchronizeIndependentAccountingConnections({
        tenantId: candidates[0]!.source.tenantId,
        jobs,
        maxConnections: ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES,
      })
    observation = createObservation(result)
  } catch {
    return executionFailedResult()
  }

  return Object.freeze({
    status: 'observed',
    reason: 'staging_import_observed',
    canReadProvider: true,
    canWriteProvider: false,
    canWriteLocal: true,
    canApply: false,
    observation,
    serializedObservation: JSON.stringify(observation),
  })
}

function createObservation(
  result: IndependentAccountingSyncBatchResult
): AccountingImportStagingObservation {
  if (
    result.total !== ACCOUNTING_SYNC_SHADOW_EXPECTED_ENTITIES ||
    result.completed + result.failed !== result.total ||
    !Number.isSafeInteger(result.completed) ||
    !Number.isSafeInteger(result.failed) ||
    result.completed < 0 ||
    result.failed < 0
  ) {
    throw new Error('ACCOUNTING_IMPORT_STAGING_RESULT_INVALID')
  }

  const verdict =
    result.completed === result.total
      ? 'completed'
      : result.failed === result.total
        ? 'failed'
        : 'partial_failure'
  return Object.freeze({
    schemaVersion: 1,
    mode: 'three_entity_accounting_import_staging',
    verdict,
    canReadProvider: true,
    canWriteProvider: false,
    canWriteLocal: true,
    canApply: false,
    metrics: Object.freeze({
      expectedEntities: 3,
      attemptedEntities: 3,
      completedEntities: result.completed,
      failedEntities: result.failed,
      pilotCandidates: 1,
    }),
  })
}

function captureResolver(
  resolver: Pick<AccountingReadSourceResolver, 'resolveBatch'> | undefined
): AccountingReadSourceResolver['resolveBatch'] {
  if (!resolver || typeof resolver.resolveBatch !== 'function') {
    throw new Error('ACCOUNTING_IMPORT_STAGING_RESOLVER_INVALID')
  }
  return resolver.resolveBatch.bind(resolver)
}

function skippedResult(
  reason: Exclude<AccountingImportStagingRunnerGateReason, 'staging_enabled'>
): AccountingImportStagingRunnerResult {
  return Object.freeze({
    status: 'skipped',
    reason,
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
  })
}

function preExecutionFailedResult(
  reason: 'source_resolution_failed' | 'source_validation_failed'
): AccountingImportStagingRunnerResult {
  return Object.freeze({
    status: 'failed',
    reason,
    canReadProvider: false,
    canWriteProvider: false,
    canWriteLocal: false,
    canApply: false,
  })
}

function executionFailedResult(): AccountingImportStagingRunnerResult {
  return Object.freeze({
    status: 'failed',
    reason: 'execution_failed',
    canReadProvider: true,
    canWriteProvider: false,
    canWriteLocal: true,
    canApply: false,
  })
}
