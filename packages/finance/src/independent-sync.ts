import type { AccountingSyncResult } from './contracts'
import {
  assertAccountingReadBinding,
  synchronizeAccountingReadModel,
  type SynchronizeAccountingInput,
} from './sync'
import { AccountingSyncError, sanitizeAccountingError } from './sync-error'

export interface IndependentAccountingSyncBatchInput {
  readonly tenantId: string
  readonly jobs: readonly SynchronizeAccountingInput[]
  readonly maxConnections?: number
}

export type IndependentAccountingSyncOutcome =
  | {
      readonly status: 'completed'
      readonly tenantId: string
      readonly legalEntityId: string
      readonly connectionId: string
      readonly result: AccountingSyncResult
    }
  | {
      readonly status: 'failed'
      readonly tenantId: string
      readonly legalEntityId: string
      readonly connectionId: string
      readonly errorCode: string
      readonly errorSummary: string
    }

export interface IndependentAccountingSyncBatchResult {
  readonly tenantId: string
  readonly total: number
  readonly completed: number
  readonly failed: number
  readonly outcomes: readonly IndependentAccountingSyncOutcome[]
}

const DEFAULT_MAX_CONNECTIONS = 50

/**
 * Runs one read-only synchronization per legal entity without aggregating
 * transactions or sharing provider state. The complete batch is validated
 * before any external or persistence operation begins.
 */
export async function synchronizeIndependentAccountingConnections(
  input: IndependentAccountingSyncBatchInput
): Promise<IndependentAccountingSyncBatchResult> {
  const jobs = validateBatch(input)
  const outcomes: IndependentAccountingSyncOutcome[] = []

  for (const job of jobs) {
    try {
      const result = await synchronizeAccountingReadModel(job)
      outcomes.push({
        status: 'completed',
        tenantId: job.scope.tenantId,
        legalEntityId: job.scope.legalEntityId,
        connectionId: job.scope.connectionId,
        result,
      })
    } catch (error) {
      const safeError = sanitizeAccountingError(error)
      outcomes.push({
        status: 'failed',
        tenantId: job.scope.tenantId,
        legalEntityId: job.scope.legalEntityId,
        connectionId: job.scope.connectionId,
        errorCode: safeError.code,
        errorSummary: safeError.safeSummary,
      })
    }
  }

  const completed = outcomes.filter(({ status }) => status === 'completed').length
  return {
    tenantId: input.tenantId,
    total: outcomes.length,
    completed,
    failed: outcomes.length - completed,
    outcomes,
  }
}

function validateBatch(
  input: IndependentAccountingSyncBatchInput
): readonly SynchronizeAccountingInput[] {
  const maxConnections = input.maxConnections ?? DEFAULT_MAX_CONNECTIONS
  if (!Number.isInteger(maxConnections) || maxConnections < 1 || maxConnections > 100) {
    throw batchError('ACCOUNTING_BATCH_INVALID_LIMIT', 'Accounting batch limit is invalid.')
  }
  if (input.jobs.length === 0 || input.jobs.length > maxConnections) {
    throw batchError(
      'ACCOUNTING_BATCH_SIZE_INVALID',
      'Accounting batch must contain a bounded set of connections.'
    )
  }

  const connectionIds = new Set<string>()
  const legalEntityIds = new Set<string>()

  for (const job of input.jobs) {
    if (job.scope.tenantId !== input.tenantId) {
      throw batchError(
        'ACCOUNTING_BATCH_TENANT_MISMATCH',
        'Accounting batch contains a connection from another tenant.'
      )
    }

    assertAccountingReadBinding(job.scope, job.client)

    if (connectionIds.has(job.scope.connectionId)) {
      throw batchError(
        'ACCOUNTING_BATCH_DUPLICATE_CONNECTION',
        'Accounting batch contains a duplicate connection.'
      )
    }
    connectionIds.add(job.scope.connectionId)

    if (legalEntityIds.has(job.scope.legalEntityId)) {
      throw batchError(
        'ACCOUNTING_BATCH_DUPLICATE_ENTITY',
        'Accounting batch requires one connection per legal entity.'
      )
    }
    legalEntityIds.add(job.scope.legalEntityId)
  }

  return [...input.jobs].sort(
    (left, right) =>
      left.scope.legalEntityId.localeCompare(right.scope.legalEntityId) ||
      left.scope.connectionId.localeCompare(right.scope.connectionId)
  )
}

function batchError(code: string, summary: string): AccountingSyncError {
  return new AccountingSyncError(code, summary)
}
