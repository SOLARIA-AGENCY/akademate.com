import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  type AccountingSnapshotReader,
  type ExternalOperationalFinanceReaders,
  type FinanceEntityShadowConfiguration,
} from '../../../../../packages/finance/src'
import {
  createPayloadFinanceEntityShadowComposition,
  PayloadFinanceEntityShadowCompositionError,
} from '../finance-entity-shadow-payload-composition'
import type { ReviewedPayloadFinanceEntityPlan } from '../finance-payload-relationship-readers'

const configuration: FinanceEntityShadowConfiguration = {
  tenantId: '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10',
  legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e11',
  accountingConnectionId: '018f47a2-4a7b-7d03-aa2f-9d4ab1c25e12',
  integrationMode: 'read_only',
  connectionStatus: 'active',
  reviewReference: 'review://finance/entity-sur/composition/v1',
  rolloutStage: 'cep_sur_pilot',
  pilotReviewReference: 'review://finance/entity-sur/pilot/v1',
}

const payloadPlan: ReviewedPayloadFinanceEntityPlan = {
  tenantId: configuration.tenantId,
  payloadTenantId: '7',
  legalEntityId: configuration.legalEntityId,
  reviewReference: 'review://finance/entity-sur/payload/v1',
  enrollmentIds: [101],
  courseRunIds: [201],
  campaignIds: [],
}

const staging = {
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

function payloadPage(docs: readonly Readonly<Record<string, unknown>>[]) {
  return {
    docs,
    page: 1,
    totalDocs: docs.length,
    totalPages: docs.length === 0 ? 0 : 1,
    hasNextPage: false,
    nextPage: null,
  }
}

function payloadRequest(find: ReturnType<typeof vi.fn>, tenant = 7): PayloadRequest {
  return {
    user: { id: 12, role: 'admin', tenant },
    payload: { find },
  } as unknown as PayloadRequest
}

function sources() {
  const accounting: AccountingSnapshotReader = {
    readAccountingTransactions: vi.fn(async () => []),
  }
  const externalOperations: ExternalOperationalFinanceReaders = {
    readPaymentEvents: vi.fn(async () => []),
    readAdvertisingSpend: vi.fn(async () => []),
  }
  return { accounting, externalOperations }
}

describe('Payload single-entity finance shadow composition', () => {
  it('runs CEP Sur through all readers and emits only redacted staging evidence', async () => {
    const find = vi.fn(async ({ collection }: { collection: string }) => {
      expect(collection).toBe('enrollments')
      return payloadPage([{ id: 101, course_run: 201, amount_paid: 0 }])
    })
    const injected = sources()
    const composition = createPayloadFinanceEntityShadowComposition({
      req: payloadRequest(find),
      configuration,
      reviewedPayloadPlan: payloadPlan,
      ...injected,
    })

    const result = await composition.run(staging)

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      observation: {
        mode: 'read_only_finance_reconciliation_shadow',
        metrics: { accountingTransactions: 0, sourceRecords: 0 },
      },
    })
    expect(find).toHaveBeenCalledOnce()
    expect(injected.accounting.readAccountingTransactions).toHaveBeenCalledOnce()
    expect(injected.externalOperations.readPaymentEvents).toHaveBeenCalledOnce()
    expect(injected.externalOperations.readAdvertisingSpend).toHaveBeenCalledOnce()
    for (const privateValue of [
      configuration.legalEntityId,
      configuration.accountingConnectionId,
      '101',
      '201',
    ]) {
      expect(JSON.stringify(result)).not.toContain(privateValue)
    }
  })

  it('performs no source I/O while disabled or in production', async () => {
    for (const environment of [
      {},
      {
        ...staging,
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
    ]) {
      const find = vi.fn(async () => Promise.reject(new Error('Payload must not run')))
      const injected = sources()
      const composition = createPayloadFinanceEntityShadowComposition({
        req: payloadRequest(find),
        configuration,
        reviewedPayloadPlan: payloadPlan,
        ...injected,
      })

      await expect(composition.run(environment)).resolves.toMatchObject({
        status: 'skipped',
        canWrite: false,
        canApply: false,
      })
      expect(find).not.toHaveBeenCalled()
      expect(injected.accounting.readAccountingTransactions).not.toHaveBeenCalled()
      expect(injected.externalOperations.readPaymentEvents).not.toHaveBeenCalled()
      expect(injected.externalOperations.readAdvertisingSpend).not.toHaveBeenCalled()
    }
  })

  it('rejects mismatched entity configuration before any source I/O', () => {
    const find = vi.fn()
    const injected = sources()

    expect(() =>
      createPayloadFinanceEntityShadowComposition({
        req: payloadRequest(find),
        configuration: {
          ...configuration,
          legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25eff',
        },
        reviewedPayloadPlan: payloadPlan,
        ...injected,
      })
    ).toThrowError(
      expect.objectContaining<Partial<PayloadFinanceEntityShadowCompositionError>>({
        code: 'FINANCE_PAYLOAD_ENTITY_SHADOW_SCOPE_MISMATCH',
      })
    )
    expect(find).not.toHaveBeenCalled()
    expect(injected.accounting.readAccountingTransactions).not.toHaveBeenCalled()
  })

  it('rejects a request from another tenant before any source I/O', () => {
    const find = vi.fn()
    const injected = sources()

    expect(() =>
      createPayloadFinanceEntityShadowComposition({
        req: payloadRequest(find, 8),
        configuration,
        reviewedPayloadPlan: payloadPlan,
        ...injected,
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH',
      })
    )
    expect(find).not.toHaveBeenCalled()
    expect(injected.accounting.readAccountingTransactions).not.toHaveBeenCalled()
  })

  it('exposes no configuration, batch or persistence surface', () => {
    const composition = createPayloadFinanceEntityShadowComposition({
      req: payloadRequest(vi.fn()),
      configuration,
      reviewedPayloadPlan: { ...payloadPlan, enrollmentIds: [], courseRunIds: [] },
      ...sources(),
    })

    expect(Object.keys(composition).sort()).toEqual([
      'canApply',
      'canWrite',
      'mode',
      'rolloutStage',
      'run',
      'schemaVersion',
    ])
    expect(composition).not.toHaveProperty('configuration')
    expect(composition).not.toHaveProperty('runBatch')
    expect(composition).not.toHaveProperty('store')
  })
})
