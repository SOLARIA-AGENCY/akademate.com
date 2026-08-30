import { describe, expect, it, vi } from 'vitest'
import {
  ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT,
  ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG,
  createAccountingReadSourceResolver as createAccountingReadSourceResolverImpl,
  createAccountingSyncShadowPlanner,
  resolveAccountingSyncShadowPlannerGate,
  type AccountingImportStore,
  type AccountingReadClientFactory,
  type AccountingReadSourceResolverOptions,
  type AccountingSyncShadowCandidate,
  type ReviewedAccountingSourceRegistration,
} from '../src'

const tenantId = '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10'
const enabledEnvironment = {
  [ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG]: 'true',
  [ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT]: 'staging',
}

function registration(index: number): ReviewedAccountingSourceRegistration {
  return {
    tenantId,
    legalEntityId: `018f47a2-4a7b-7d02-8a2f-9d4ab1c25e1${index}`,
    connectionId: `018f47a2-4a7b-7d03-aa2f-9d4ab1c25e2${index}`,
    provider: 'cep-accounting-vendor',
    externalCompanyId: `company-${index}`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    secretReference: `op://cep/accounting/entity-${index}`,
    reviewReference: `review://finance/source/entity-${index}/v1`,
  }
}

function createAccountingReadSourceResolver(
  options: Omit<AccountingReadSourceResolverOptions, 'requiredEntities'>
) {
  return createAccountingReadSourceResolverImpl({
    ...options,
    requiredEntities: options.registrations.map(({ tenantId: currentTenantId, legalEntityId }) => ({
      tenantId: currentTenantId,
      legalEntityId,
    })),
  })
}

function store(): AccountingImportStore & {
  readonly beginSync: ReturnType<typeof vi.fn>
  readonly upsertTransactions: ReturnType<typeof vi.fn>
  readonly completeSync: ReturnType<typeof vi.fn>
  readonly failSync: ReturnType<typeof vi.fn>
} {
  return {
    beginSync: vi.fn(),
    upsertTransactions: vi.fn(),
    completeSync: vi.fn(),
    failSync: vi.fn(),
  }
}

function candidate(
  index: number,
  role: AccountingSyncShadowCandidate['role'] = 'existing_entity'
): AccountingSyncShadowCandidate {
  const source = registration(index)
  return {
    source: {
      tenantId: source.tenantId,
      legalEntityId: source.legalEntityId,
      connectionId: source.connectionId,
    },
    role,
    reviewReference: `review://finance/sync-plan/entity-${index}/v1`,
    ...(role === 'cep_sur_pilot_candidate'
      ? { pilotReviewReference: 'review://finance/sync-plan/cep-sur-pilot/v1' }
      : {}),
    store: store(),
  }
}

function candidates(): readonly AccountingSyncShadowCandidate[] {
  return [candidate(3, 'cep_sur_pilot_candidate'), candidate(1), candidate(2)]
}

function factory(): AccountingReadClientFactory & {
  readonly createReadClient: ReturnType<typeof vi.fn>
  readonly readers: ReturnType<typeof vi.fn>[]
} {
  const readers: ReturnType<typeof vi.fn>[] = []
  return {
    provider: 'cep-accounting-vendor',
    readers,
    createReadClient: vi.fn().mockImplementation(async (input) => {
      const listTransactions = vi.fn()
      readers.push(listTransactions)
      return {
        provider: 'cep-accounting-vendor',
        listTransactions,
        authorization: {
          access: 'read_only',
          grantedPermissions: ['transactions:read'],
          tenantId: input.tenantId,
          legalEntityId: input.legalEntityId,
          connectionId: input.connectionId,
          externalCompanyId: input.externalCompanyId,
        },
      }
    }),
  }
}

function assertStoresUnused(sources: readonly AccountingSyncShadowCandidate[]): void {
  for (const source of sources) {
    expect(source.store.beginSync).not.toHaveBeenCalled()
    expect(source.store.upsertTransactions).not.toHaveBeenCalled()
    expect(source.store.completeSync).not.toHaveBeenCalled()
    expect(source.store.failSync).not.toHaveBeenCalled()
  }
}

describe('accounting sync shadow planner gate', () => {
  it.each([
    [{}, 'flag_disabled'],
    [{ [ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG]: 'true',
        [ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG]: 'true',
        [ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ] as const)('fails closed outside explicit staging: %o', (environment, reason) => {
    expect(resolveAccountingSyncShadowPlannerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
  })
})

describe('three-entity accounting sync shadow planner', () => {
  it('prepares three isolated jobs without reading providers or calling stores', async () => {
    const reviewed = [registration(3), registration(1), registration(2)]
    const providerFactory = factory()
    const resolver = createAccountingReadSourceResolver({
      registrations: reviewed,
      factories: [providerFactory],
    })
    const sources = candidates()
    const planner = createAccountingSyncShadowPlanner({ resolver, candidates: sources })

    const result = await planner.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'sync_plan_prepared',
      canReadProvider: false,
      canWriteProvider: false,
      canWriteLocal: false,
      canApply: false,
      observation: {
        schemaVersion: 1,
        mode: 'three_entity_accounting_sync_shadow_plan',
        verdict: 'prepared',
        metrics: {
          expectedEntities: 3,
          preparedEntities: 3,
          isolatedSources: 3,
          isolatedStores: 3,
          pilotCandidates: 1,
        },
      },
    })
    expect(providerFactory.createReadClient).toHaveBeenCalledTimes(3)
    for (const reader of providerFactory.readers) expect(reader).not.toHaveBeenCalled()
    assertStoresUnused(sources)

    const serialized = JSON.stringify(result)
    for (const source of [...reviewed, ...sources]) {
      expect(serialized).not.toContain(source.reviewReference)
      if ('secretReference' in source) expect(serialized).not.toContain(source.secretReference)
      if ('pilotReviewReference' in source && source.pilotReviewReference) {
        expect(serialized).not.toContain(source.pilotReviewReference)
      }
    }
    expect(serialized).not.toContain(tenantId)
    expect(serialized).not.toContain('company-')
  })

  it.each([
    [{}, 'flag_disabled'],
    [
      {
        [ACCOUNTING_SYNC_SHADOW_PLANNER_FLAG]: 'true',
        [ACCOUNTING_SYNC_SHADOW_PLANNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ] as const)('does no source or store work when skipped: %s', async (environment, reason) => {
    const sources = candidates()
    const resolveBatch = vi.fn()
    const planner = createAccountingSyncShadowPlanner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    await expect(planner.run(environment)).resolves.toMatchObject({ status: 'skipped', reason })
    expect(resolveBatch).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it('redacts source resolution failures and performs no store work', async () => {
    const sources = candidates()
    const resolveBatch = vi
      .fn()
      .mockRejectedValue(new Error('op://cep/accounting/entity-3 token=must-not-leak'))
    const planner = createAccountingSyncShadowPlanner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    const result = await planner.run(enabledEnvironment)

    expect(result).toMatchObject({ status: 'failed', reason: 'source_resolution_failed' })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
    assertStoresUnused(sources)
  })

  it('rejects a malicious cross-scope resolver result', async () => {
    const sources = candidates()
    const foreign = registration(3)
    const resolveBatch = vi.fn().mockResolvedValue([
      {
        scope: {
          ...foreign,
          tenantId: '018f47a2-4a7b-7d09-9a2f-9d4ab1c25e90',
        },
        client: { provider: foreign.provider, listTransactions: vi.fn() },
      },
      {
        scope: registration(1),
        client: { provider: registration(1).provider, listTransactions: vi.fn() },
      },
      {
        scope: registration(2),
        client: { provider: registration(2).provider, listTransactions: vi.fn() },
      },
    ])
    const planner = createAccountingSyncShadowPlanner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    await expect(planner.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'failed',
      reason: 'source_validation_failed',
    })
    assertStoresUnused(sources)
  })

  it('rejects a shared client returned by an injected resolver', async () => {
    const sources = candidates()
    const sharedClient = { provider: 'cep-accounting-vendor', listTransactions: vi.fn() }
    const resolveBatch = vi.fn().mockResolvedValue(
      [registration(1), registration(2), registration(3)].map((source) => ({
        scope: source,
        client: sharedClient,
      }))
    )
    const planner = createAccountingSyncShadowPlanner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    await expect(planner.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'failed',
      reason: 'source_validation_failed',
    })
    expect(sharedClient.listTransactions).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it('rejects a store shared across legal entities before source resolution', () => {
    const sources = [...candidates()]
    sources[1] = { ...sources[1]!, store: sources[0]!.store }
    const resolveBatch = vi.fn()

    expect(() =>
      createAccountingSyncShadowPlanner({ resolver: { resolveBatch }, candidates: sources })
    ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_SYNC_SHADOW_SHARED_STORE' }))
    expect(resolveBatch).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it('rejects candidates from different tenants before source resolution', () => {
    const sources = [...candidates()]
    sources[1] = {
      ...sources[1]!,
      source: {
        ...sources[1]!.source,
        tenantId: '018f47a2-4a7b-7d09-9a2f-9d4ab1c25e90',
      },
    }
    const resolveBatch = vi.fn()

    expect(() =>
      createAccountingSyncShadowPlanner({ resolver: { resolveBatch }, candidates: sources })
    ).toThrow(expect.objectContaining({ code: 'ACCOUNTING_SYNC_SHADOW_TENANT_MISMATCH' }))
    expect(resolveBatch).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it.each([
    [candidates().slice(0, 2), 'ACCOUNTING_SYNC_SHADOW_ENTITY_COUNT_INVALID'],
    [
      candidates().map(({ pilotReviewReference: _pilotReviewReference, ...source }) => ({
        ...source,
        role: 'existing_entity' as const,
      })),
      'ACCOUNTING_SYNC_SHADOW_PILOT_COUNT_INVALID',
    ],
    [
      candidates().map((source, index) =>
        index === 1 ? { ...source, reviewReference: sourcesReview(candidates()[0]!) } : source
      ),
      'ACCOUNTING_SYNC_SHADOW_REVIEW_REUSED',
    ],
  ] as const)('rejects an invalid reviewed candidate plan with %s', (sources, code) => {
    expect(() =>
      createAccountingSyncShadowPlanner({
        resolver: { resolveBatch: vi.fn() },
        candidates: sources,
      })
    ).toThrow(expect.objectContaining({ code }))
  })
})

function sourcesReview(source: AccountingSyncShadowCandidate): string {
  return source.reviewReference
}
