import {
  createFinanceReconciliationSnapshotLoader,
  type FinanceReconciliationSnapshotLoaderOptions,
  type FinanceReconciliationSnapshotReaders,
} from './snapshot-loader'
import {
  runFinanceReconciliationShadowEvidence,
  type FinanceReconciliationShadowRunnerResult,
} from './reconciliation-shadow-runner'
import { AccountingSyncError } from './sync-error'

export type FinanceEntityShadowRolloutStage = 'pre_pilot_validation' | 'cep_sur_pilot'

export interface FinanceEntityShadowConfiguration {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly accountingConnectionId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly reviewReference: string
  readonly rolloutStage: FinanceEntityShadowRolloutStage
  readonly pilotReviewReference?: string
}

export interface FinanceEntityShadowSourceReaders {
  readonly accounting: Pick<FinanceReconciliationSnapshotReaders, 'readAccountingTransactions'>
  readonly payloadRelationships: Pick<
    FinanceReconciliationSnapshotReaders,
    'readEnrollments' | 'readCampaigns'
  >
  readonly externalOperations: Pick<
    FinanceReconciliationSnapshotReaders,
    'readPaymentEvents' | 'readAdvertisingSpend'
  >
}

export type FinanceEntityShadowLoaderLimits = Pick<
  FinanceReconciliationSnapshotLoaderOptions,
  | 'maxAccountingTransactions'
  | 'maxSourceRecords'
  | 'maxRelationshipRecords'
  | 'dateWindowDays'
  | 'maxComparisons'
>

export interface FinanceEntityShadowCompositionOptions {
  readonly configuration: FinanceEntityShadowConfiguration
  readonly sources: FinanceEntityShadowSourceReaders
  readonly limits?: FinanceEntityShadowLoaderLimits
}

export interface FinanceEntityShadowComposition {
  readonly schemaVersion: 1
  readonly mode: 'single_entity_read_only_shadow'
  readonly rolloutStage: FinanceEntityShadowRolloutStage
  readonly canWrite: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<FinanceReconciliationShadowRunnerResult>
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Composes exactly one entity's accounting, Payload relationship and external
 * operational readers behind the existing staging-only shadow gate. It does
 * not expose a multi-entity batch or any persistence capability.
 */
export function createFinanceEntityShadowComposition(
  options: FinanceEntityShadowCompositionOptions
): FinanceEntityShadowComposition {
  const configuration = validateConfiguration(options.configuration)
  const readers = captureReaders(options.sources)
  const loadSnapshot = createFinanceReconciliationSnapshotLoader({
    scope: Object.freeze({
      tenantId: configuration.tenantId,
      legalEntityId: configuration.legalEntityId,
      connectionId: configuration.accountingConnectionId,
    }),
    readers,
    ...copyLimits(options.limits),
  })

  return Object.freeze({
    schemaVersion: 1,
    mode: 'single_entity_read_only_shadow',
    rolloutStage: configuration.rolloutStage,
    canWrite: false,
    canApply: false,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runFinanceReconciliationShadowEvidence({ environment, loadSnapshot }),
  })
}

function validateConfiguration(
  configuration: FinanceEntityShadowConfiguration
): FinanceEntityShadowConfiguration {
  if (
    !configuration ||
    typeof configuration !== 'object' ||
    !validIdentifier(configuration.tenantId) ||
    !validIdentifier(configuration.legalEntityId) ||
    !validIdentifier(configuration.accountingConnectionId) ||
    configuration.integrationMode !== 'read_only' ||
    configuration.connectionStatus !== 'active' ||
    !validReviewReference(configuration.reviewReference) ||
    !['pre_pilot_validation', 'cep_sur_pilot'].includes(configuration.rolloutStage)
  ) {
    throw compositionError(
      'FINANCE_ENTITY_SHADOW_CONFIGURATION_INVALID',
      'Finance entity shadow configuration is invalid.'
    )
  }

  if (
    configuration.rolloutStage === 'cep_sur_pilot'
      ? !validReviewReference(configuration.pilotReviewReference) ||
        configuration.pilotReviewReference === configuration.reviewReference
      : configuration.pilotReviewReference !== undefined
  ) {
    throw compositionError(
      'FINANCE_ENTITY_SHADOW_PILOT_REVIEW_INVALID',
      'Finance entity shadow pilot review is invalid.'
    )
  }

  return Object.freeze({
    tenantId: configuration.tenantId,
    legalEntityId: configuration.legalEntityId,
    accountingConnectionId: configuration.accountingConnectionId,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewReference: configuration.reviewReference,
    rolloutStage: configuration.rolloutStage,
    ...(configuration.pilotReviewReference === undefined
      ? {}
      : { pilotReviewReference: configuration.pilotReviewReference }),
  })
}

function captureReaders(
  sources: FinanceEntityShadowSourceReaders
): FinanceReconciliationSnapshotReaders {
  if (!sources || typeof sources !== 'object') {
    throw compositionError(
      'FINANCE_ENTITY_SHADOW_READER_INVALID',
      'Finance entity shadow reader is invalid.'
    )
  }
  return Object.freeze({
    readAccountingTransactions: captureReader(sources.accounting, 'readAccountingTransactions'),
    readEnrollments: captureReader(sources.payloadRelationships, 'readEnrollments'),
    readCampaigns: captureReader(sources.payloadRelationships, 'readCampaigns'),
    readPaymentEvents: captureReader(sources.externalOperations, 'readPaymentEvents'),
    readAdvertisingSpend: captureReader(sources.externalOperations, 'readAdvertisingSpend'),
  })
}

function captureReader<TSource extends object, TKey extends keyof TSource>(
  source: TSource,
  key: TKey
): Extract<TSource[TKey], (...args: never[]) => unknown> {
  const reader = source?.[key]
  if (typeof reader !== 'function') {
    throw compositionError(
      'FINANCE_ENTITY_SHADOW_READER_INVALID',
      'Finance entity shadow reader is invalid.'
    )
  }
  return reader.bind(source) as Extract<TSource[TKey], (...args: never[]) => unknown>
}

function copyLimits(
  limits: FinanceEntityShadowLoaderLimits | undefined
): FinanceEntityShadowLoaderLimits {
  if (!limits) return Object.freeze({})
  return Object.freeze({
    ...(limits.maxAccountingTransactions === undefined
      ? {}
      : { maxAccountingTransactions: limits.maxAccountingTransactions }),
    ...(limits.maxSourceRecords === undefined ? {} : { maxSourceRecords: limits.maxSourceRecords }),
    ...(limits.maxRelationshipRecords === undefined
      ? {}
      : { maxRelationshipRecords: limits.maxRelationshipRecords }),
    ...(limits.dateWindowDays === undefined ? {} : { dateWindowDays: limits.dateWindowDays }),
    ...(limits.maxComparisons === undefined ? {} : { maxComparisons: limits.maxComparisons }),
  })
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function compositionError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
