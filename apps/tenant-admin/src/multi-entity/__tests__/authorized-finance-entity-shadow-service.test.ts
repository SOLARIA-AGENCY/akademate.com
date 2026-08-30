import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  type AccountingSnapshotReader,
  type ExternalOperationalFinanceReaders,
  type FinanceEntityShadowConfiguration,
  type FinanceReadAuthorizationInput,
} from '../../../../../packages/finance/src'
import type { ReviewedPayloadFinanceEntityPlan } from '../finance-payload-relationship-readers'
import {
  AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT,
  AUTHORIZED_FINANCE_ENTITY_SHADOW_FLAG,
  createAuthorizedFinanceEntityShadowService,
} from '../authorized-finance-entity-shadow-service'

const configuration: FinanceEntityShadowConfiguration = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  accountingConnectionId: 'connection-sur',
  integrationMode: 'read_only',
  connectionStatus: 'active',
  reviewReference: 'review://finance/entity-sur/service/v1',
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

const enabledEnvironment = {
  [AUTHORIZED_FINANCE_ENTITY_SHADOW_FLAG]: 'true',
  [AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT]: 'staging',
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

function payloadRequest(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return {
    user: { id: 12, role: 'admin', tenant: 7 },
    payload: { find },
  } as unknown as PayloadRequest
}

function readers() {
  const accounting: AccountingSnapshotReader = {
    readAccountingTransactions: vi.fn(async () => []),
  }
  const externalOperations: ExternalOperationalFinanceReaders = {
    readPaymentEvents: vi.fn(async () => []),
    readAdvertisingSpend: vi.fn(async () => []),
  }
  return { accounting, externalOperations }
}

function authorization(overrides: Partial<FinanceReadAuthorizationInput> = {}) {
  const base: FinanceReadAuthorizationInput = {
    configuredMode: 'shadow',
    currentEffectiveAllowed: true,
    principal: {
      userId: 'user-12',
      tenantId: configuration.tenantId,
      isPlatformSuperadmin: false,
    },
    scope: {
      tenantId: configuration.tenantId,
      legalEntityId: configuration.legalEntityId,
      connectionId: configuration.accountingConnectionId,
    },
    memberships: [
      {
        userId: 'user-12',
        tenantId: configuration.tenantId,
        legalEntityId: configuration.legalEntityId,
        status: 'active',
        capabilities: ['finance.read'],
      },
    ],
    reviewedConnections: [
      {
        scope: {
          tenantId: configuration.tenantId,
          legalEntityId: configuration.legalEntityId,
          connectionId: configuration.accountingConnectionId,
        },
        integrationMode: 'read_only',
        connectionStatus: 'active',
        reviewReference: 'review://finance/entity-sur/connection/v1',
      },
    ],
  }
  return { ...base, ...overrides }
}

function createService(
  find: ReturnType<typeof vi.fn>,
  auth: FinanceReadAuthorizationInput = authorization()
) {
  const sourceReaders = readers()
  return {
    service: createAuthorizedFinanceEntityShadowService({
      req: payloadRequest(find),
      authorization: auth,
      configuration,
      reviewedPayloadPlan: payloadPlan,
      ...sourceReaders,
    }),
    sourceReaders,
  }
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

describe('authorized finance entity shadow service', () => {
  it('does not perform source I/O while its feature flag is disabled', async () => {
    const find = vi.fn(async () => {
      throw new Error('source I/O must not happen')
    })
    const { service, sourceReaders } = createService(find)

    await expect(service.run({})).resolves.toMatchObject({
      status: 'skipped',
      reason: 'feature_flag_disabled',
      canReadProvider: false,
      canWrite: false,
      canApply: false,
    })
    expect(find).not.toHaveBeenCalled()
    expect(sourceReaders.accounting.readAccountingTransactions).not.toHaveBeenCalled()
  })

  it('blocks before I/O when the current effective decision denies access', async () => {
    const find = vi.fn()
    const { service, sourceReaders } = createService(
      find,
      authorization({ currentEffectiveAllowed: false })
    )

    await expect(service.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'skipped',
      reason: 'legacy_access_denied',
      authorization: { effectiveAllowed: false },
    })
    expect(find).not.toHaveBeenCalled()
    expect(sourceReaders.accounting.readAccountingTransactions).not.toHaveBeenCalled()
  })

  it('runs the single entity shadow only after legacy access and both staging gates pass', async () => {
    const find = vi.fn(async ({ collection }: { collection: string }) => {
      expect(collection).toBe('enrollments')
      return payloadPage([{ id: 101, course_run: 201, amount_paid: 0 }])
    })
    const { service, sourceReaders } = createService(find)

    await expect(service.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      authorization: {
        effectiveAllowed: true,
        proposedDecision: { allowed: true, reason: 'membership_allows' },
        divergence: false,
      },
      canReadProvider: true,
      canWrite: false,
      canApply: false,
      observation: { canWrite: false, canApply: false },
    })
    expect(find).toHaveBeenCalledOnce()
    expect(sourceReaders.accounting.readAccountingTransactions).toHaveBeenCalledOnce()
  })

  it('keeps legacy access effective while exposing future-policy divergence in shadow', async () => {
    const find = vi.fn(async () => payloadPage([{ id: 101, course_run: 201, amount_paid: 0 }]))
    const { service } = createService(find, authorization({ memberships: [] }))

    await expect(service.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'observed',
      authorization: {
        effectiveAllowed: true,
        proposedDecision: { allowed: false, reason: 'membership_missing' },
        divergence: true,
      },
      canWrite: false,
      canApply: false,
    })
  })

  it.each([
    ['tenant', { tenantId: 'tenant-other' }],
    ['legal entity', { legalEntityId: 'entity-north' }],
    ['accounting connection', { connectionId: 'connection-north' }],
  ])('fails closed when authorization and reader scopes differ by %s', async (_label, change) => {
    const find = vi.fn(async () => {
      throw new Error('source I/O must not happen')
    })
    const { service, sourceReaders } = createService(
      find,
      authorization({ scope: { ...authorization().scope, ...change } })
    )

    await expect(service.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'failed',
      reason: 'authorization_scope_mismatch',
      canReadProvider: false,
      canWrite: false,
      canApply: false,
    })
    expect(find).not.toHaveBeenCalled()
    expect(sourceReaders.accounting.readAccountingTransactions).not.toHaveBeenCalled()
    expect(sourceReaders.externalOperations.readPaymentEvents).not.toHaveBeenCalled()
    expect(sourceReaders.externalOperations.readAdvertisingSpend).not.toHaveBeenCalled()
  })

  it('fails closed for production or invalid staging environment before source I/O', async () => {
    const find = vi.fn()
    const { service, sourceReaders } = createService(find)

    for (const environment of [
      { ...enabledEnvironment, [AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT]: 'production' },
      { ...enabledEnvironment, [AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT]: 'local' },
    ]) {
      await expect(service.run(environment)).resolves.toMatchObject({
        status: 'skipped',
        canReadProvider: false,
        canWrite: false,
        canApply: false,
      })
    }
    expect(find).not.toHaveBeenCalled()
    expect(sourceReaders.accounting.readAccountingTransactions).not.toHaveBeenCalled()
  })
})
