import type { PayloadRequest } from 'payload'

import {
  createFinanceEntityShadowComposition,
  type AccountingSnapshotReader,
  type ExternalOperationalFinanceReaders,
  type FinanceEntityShadowComposition,
  type FinanceEntityShadowConfiguration,
  type FinanceEntityShadowLoaderLimits,
} from '../../../../packages/finance/src'
import {
  createPayloadFinanceRelationshipReaders,
  type ReviewedPayloadFinanceEntityPlan,
} from './finance-payload-relationship-readers'

export interface PayloadFinanceEntityShadowCompositionOptions {
  readonly req: PayloadRequest
  readonly configuration: FinanceEntityShadowConfiguration
  readonly reviewedPayloadPlan: ReviewedPayloadFinanceEntityPlan
  readonly accounting: AccountingSnapshotReader
  readonly externalOperations: ExternalOperationalFinanceReaders
  readonly payloadLimits?: {
    readonly pageSize?: number
    readonly maxPages?: number
    readonly maxRecords?: number
  }
  readonly reconciliationLimits?: FinanceEntityShadowLoaderLimits
}

export type PayloadFinanceEntityShadowCompositionErrorCode =
  'FINANCE_PAYLOAD_ENTITY_SHADOW_SCOPE_MISMATCH'

export class PayloadFinanceEntityShadowCompositionError extends Error {
  constructor(readonly code: PayloadFinanceEntityShadowCompositionErrorCode) {
    super('Finance Payload entity shadow composition is invalid.')
    this.name = 'PayloadFinanceEntityShadowCompositionError'
  }
}

/**
 * Composes exactly one reviewed Payload entity with injected accounting and
 * external-operation readers. The returned package contract remains
 * staging-only and exposes neither configuration nor write capabilities.
 */
export function createPayloadFinanceEntityShadowComposition(
  options: PayloadFinanceEntityShadowCompositionOptions
): FinanceEntityShadowComposition {
  assertMatchingScope(options)
  const payloadRelationships = createPayloadFinanceRelationshipReaders({
    req: options.req,
    reviewedPlans: [options.reviewedPayloadPlan],
    ...copyPayloadLimits(options.payloadLimits),
  })

  return createFinanceEntityShadowComposition({
    configuration: options.configuration,
    sources: Object.freeze({
      accounting: options.accounting,
      payloadRelationships,
      externalOperations: options.externalOperations,
    }),
    limits: options.reconciliationLimits,
  })
}

function assertMatchingScope(options: PayloadFinanceEntityShadowCompositionOptions): void {
  if (
    !options ||
    !options.configuration ||
    !options.reviewedPayloadPlan ||
    options.configuration.tenantId !== options.reviewedPayloadPlan.tenantId ||
    options.configuration.legalEntityId !== options.reviewedPayloadPlan.legalEntityId
  ) {
    throw compositionError()
  }
}

function copyPayloadLimits(
  limits: PayloadFinanceEntityShadowCompositionOptions['payloadLimits']
): PayloadFinanceEntityShadowCompositionOptions['payloadLimits'] {
  if (!limits) return Object.freeze({})
  return Object.freeze({
    ...(limits.pageSize === undefined ? {} : { pageSize: limits.pageSize }),
    ...(limits.maxPages === undefined ? {} : { maxPages: limits.maxPages }),
    ...(limits.maxRecords === undefined ? {} : { maxRecords: limits.maxRecords }),
  })
}

function compositionError(): PayloadFinanceEntityShadowCompositionError {
  return new PayloadFinanceEntityShadowCompositionError(
    'FINANCE_PAYLOAD_ENTITY_SHADOW_SCOPE_MISMATCH'
  )
}
