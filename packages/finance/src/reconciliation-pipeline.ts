import type { AccountingTransactionKind, AccountingTransactionStatus } from './contracts'
import {
  projectOperationalFinanceRecords,
  type OperationalFinanceProjection,
  type OperationalFinanceProjectionInput,
} from './operational-projection'
import {
  planFinanceReconciliationBatch,
  type FinanceReconciliationBatchPlan,
  type ReconciliationAccountingTransaction,
} from './reconciliation'
import { AccountingSyncError } from './sync-error'

const MAX_PIPELINE_ACCOUNTING_TRANSACTIONS = 1_000

export interface FinanceReconciliationAccountingSnapshot {
  readonly externalId: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly kind: AccountingTransactionKind
  readonly status: AccountingTransactionStatus
  readonly bookedOn: string
  readonly amount: string
  readonly currency: string
  readonly reference?: string | null
}

export interface FinanceReconciliationPipelineInput {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly accountingTransactions: readonly FinanceReconciliationAccountingSnapshot[]
  readonly operational: OperationalFinanceProjectionInput
  readonly dateWindowDays?: number
  readonly maxComparisons?: number
}

interface FinanceReconciliationPipelineBase {
  readonly mode: 'read_only_reconciliation_pipeline'
  readonly canWrite: false
  readonly canApply: false
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
  readonly projection: OperationalFinanceProjection
}

export type FinanceReconciliationPipelineResult =
  | (FinanceReconciliationPipelineBase & {
      readonly status: 'blocked'
      readonly ready: false
      readonly reconciliation: null
    })
  | (FinanceReconciliationPipelineBase & {
      readonly status: 'planned'
      readonly ready: true
      readonly reconciliation: FinanceReconciliationBatchPlan
    })

/**
 * Joins one entity-scoped accounting read model with operational snapshots.
 * Partial operational projections never reach reconciliation, even if they
 * contain otherwise valid records.
 */
export function planReadOnlyFinanceReconciliation(
  input: FinanceReconciliationPipelineInput
): FinanceReconciliationPipelineResult {
  assertPipelineScope(input)
  const transactions = projectAccountingTransactions(input)
  const projection = projectOperationalFinanceRecords(input.operational)
  const base = {
    mode: 'read_only_reconciliation_pipeline' as const,
    canWrite: false as const,
    canApply: false as const,
    tenantId: input.tenantId,
    legalEntityId: input.legalEntityId,
    connectionId: input.connectionId,
    projection,
  }

  if (!projection.ready) {
    return {
      ...base,
      status: 'blocked',
      ready: false,
      reconciliation: null,
    }
  }

  return {
    ...base,
    status: 'planned',
    ready: true,
    reconciliation: planFinanceReconciliationBatch({
      tenantId: input.tenantId,
      legalEntityId: input.legalEntityId,
      transactions,
      operationalRecords: projection.records,
      ...(input.dateWindowDays === undefined ? {} : { dateWindowDays: input.dateWindowDays }),
      ...(input.maxComparisons === undefined ? {} : { maxComparisons: input.maxComparisons }),
    }),
  }
}

function assertPipelineScope(input: FinanceReconciliationPipelineInput): void {
  for (const [field, value] of Object.entries({
    tenantId: input.tenantId,
    legalEntityId: input.legalEntityId,
    connectionId: input.connectionId,
  })) {
    if (!validIdentifier(value)) {
      throw pipelineError(
        'FINANCE_RECONCILIATION_PIPELINE_INVALID_SCOPE',
        `Finance reconciliation pipeline field ${field} is invalid.`
      )
    }
  }

  if (
    input.operational.targetTenantId !== input.tenantId ||
    input.operational.targetLegalEntityId !== input.legalEntityId
  ) {
    throw pipelineError(
      'FINANCE_RECONCILIATION_PIPELINE_SCOPE_MISMATCH',
      'Operational projection scope does not match the reconciliation pipeline.'
    )
  }

  if (input.accountingTransactions.length > MAX_PIPELINE_ACCOUNTING_TRANSACTIONS) {
    throw pipelineError(
      'FINANCE_RECONCILIATION_PIPELINE_SIZE_EXCEEDED',
      'Accounting read model exceeds the reconciliation pipeline limit.'
    )
  }
}

function projectAccountingTransactions(
  input: FinanceReconciliationPipelineInput
): readonly ReconciliationAccountingTransaction[] {
  return input.accountingTransactions.map((transaction) => {
    if (transaction.tenantId !== input.tenantId) {
      throw pipelineError(
        'FINANCE_RECONCILIATION_PIPELINE_TENANT_MISMATCH',
        'Accounting read model contains another tenant.'
      )
    }
    if (transaction.legalEntityId !== input.legalEntityId) {
      throw pipelineError(
        'FINANCE_RECONCILIATION_PIPELINE_ENTITY_MISMATCH',
        'Accounting read model contains another legal entity.'
      )
    }
    if (transaction.connectionId !== input.connectionId) {
      throw pipelineError(
        'FINANCE_RECONCILIATION_PIPELINE_CONNECTION_MISMATCH',
        'Accounting read model contains another accounting connection.'
      )
    }

    return {
      id: transaction.externalId,
      tenantId: transaction.tenantId,
      legalEntityId: transaction.legalEntityId,
      kind: transaction.kind,
      status: transaction.status,
      bookedOn: transaction.bookedOn,
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.reference,
    }
  })
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 255 &&
    value.trim() === value
  )
}

function pipelineError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
