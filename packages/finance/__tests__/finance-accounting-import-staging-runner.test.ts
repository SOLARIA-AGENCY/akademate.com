import { describe, expect, it, vi } from 'vitest'
import {
  ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT,
  ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
  createAccountingImportStagingRunner,
  createAccountingReadSourceResolver as createAccountingReadSourceResolverImpl,
  resolveAccountingImportStagingRunnerGate,
  type AccountingImportStore,
  type AccountingReadClientFactory,
  type AccountingReadSourceResolverOptions,
  type AccountingSyncShadowCandidate,
  type ReviewedAccountingSourceRegistration,
} from '../src'

const tenantId = '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10'
const enabledEnvironment = {
  [ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG]: 'true',
  [ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT]: 'staging',
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

function importStore(index: number): AccountingImportStore & {
  readonly beginSync: ReturnType<typeof vi.fn>
  readonly upsertTransactions: ReturnType<typeof vi.fn>
  readonly completeSync: ReturnType<typeof vi.fn>
  readonly failSync: ReturnType<typeof vi.fn>
} {
  return {
    beginSync: vi.fn().mockResolvedValue({ syncRunId: `sync-${index}` }),
    upsertTransactions: vi.fn().mockImplementation(async ({ transactions }) => ({
      upserted: transactions.length,
      skipped: 0,
    })),
    completeSync: vi.fn().mockResolvedValue(undefined),
    failSync: vi.fn().mockResolvedValue(undefined),
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
    reviewReference: `review://finance/staging-import/entity-${index}/v1`,
    ...(role === 'cep_sur_pilot_candidate'
      ? { pilotReviewReference: 'review://finance/staging-import/cep-sur-pilot/v1' }
      : {}),
    store: importStore(index),
  }
}

function candidates(): readonly AccountingSyncShadowCandidate[] {
  return [candidate(3, 'cep_sur_pilot_candidate'), candidate(1), candidate(2)]
}

function factory(failingCompany?: string): AccountingReadClientFactory & {
  readonly createReadClient: ReturnType<typeof vi.fn>
  readonly readers: Map<string, ReturnType<typeof vi.fn>>
} {
  const readers = new Map<string, ReturnType<typeof vi.fn>>()
  return {
    provider: 'cep-accounting-vendor',
    readers,
    createReadClient: vi.fn().mockImplementation(async (input) => {
      const { externalCompanyId } = input
      const listTransactions =
        externalCompanyId === failingCompany
          ? vi.fn().mockRejectedValue(new Error('token=must-not-leak'))
          : vi.fn().mockResolvedValue({ items: [], nextCursor: null })
      readers.set(externalCompanyId, listTransactions)
      return {
        provider: 'cep-accounting-vendor',
        listTransactions,
        authorization: {
          access: 'read_only',
          grantedPermissions: ['transactions:read'],
          tenantId: input.tenantId,
          legalEntityId: input.legalEntityId,
          connectionId: input.connectionId,
          externalCompanyId,
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

describe('accounting import staging runner gate', () => {
  it.each([
    [{}, 'flag_disabled'],
    [{ [ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG]: 'true',
        [ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG]: 'true',
        [ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ] as const)('fails closed outside explicit staging: %o', (environment, reason) => {
    expect(resolveAccountingImportStagingRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
  })
})

describe('three-entity accounting import staging runner', () => {
  it('imports three independent read-only sources into three local stores', async () => {
    const reviewed = [registration(3), registration(1), registration(2)]
    const providerFactory = factory()
    const resolver = createAccountingReadSourceResolver({
      registrations: reviewed,
      factories: [providerFactory],
    })
    const sources = candidates()
    const runner = createAccountingImportStagingRunner({ resolver, candidates: sources })

    const result = await runner.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'staging_import_observed',
      canReadProvider: true,
      canWriteProvider: false,
      canWriteLocal: true,
      canApply: false,
      observation: {
        verdict: 'completed',
        metrics: {
          expectedEntities: 3,
          attemptedEntities: 3,
          completedEntities: 3,
          failedEntities: 0,
          pilotCandidates: 1,
        },
      },
    })
    expect(providerFactory.createReadClient).toHaveBeenCalledTimes(3)
    for (const reader of providerFactory.readers.values()) expect(reader).toHaveBeenCalledOnce()
    for (const source of sources) {
      expect(source.store.beginSync).toHaveBeenCalledOnce()
      expect(source.store.upsertTransactions).toHaveBeenCalledOnce()
      expect(source.store.completeSync).toHaveBeenCalledOnce()
      expect(source.store.failSync).not.toHaveBeenCalled()
    }

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
    expect(serialized).not.toContain('sync-')
  })

  it.each([
    [{}, 'flag_disabled'],
    [
      {
        [ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG]: 'true',
        [ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ] as const)('does no work when skipped: %o', async (environment, reason) => {
    const sources = candidates()
    const resolveBatch = vi.fn()
    const runner = createAccountingImportStagingRunner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    await expect(runner.run(environment)).resolves.toMatchObject({
      status: 'skipped',
      reason,
      canReadProvider: false,
      canWriteLocal: false,
    })
    expect(resolveBatch).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it('contains one provider failure and continues the other entity imports', async () => {
    const reviewed = [registration(1), registration(2), registration(3)]
    const providerFactory = factory('company-2')
    const resolver = createAccountingReadSourceResolver({
      registrations: reviewed,
      factories: [providerFactory],
    })
    const sources = candidates()
    const runner = createAccountingImportStagingRunner({ resolver, candidates: sources })

    const result = await runner.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'partial_failure',
        metrics: { completedEntities: 2, failedEntities: 1 },
      },
    })
    const failedStore = sources.find(
      ({ source }) => source.legalEntityId === registration(2).legalEntityId
    )!.store
    expect(failedStore.beginSync).toHaveBeenCalledOnce()
    expect(failedStore.completeSync).not.toHaveBeenCalled()
    expect(failedStore.failSync).toHaveBeenCalledOnce()
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('reports a redacted failed verdict when every provider read fails', async () => {
    const reviewed = [registration(1), registration(2), registration(3)]
    const readers: ReturnType<typeof vi.fn>[] = []
    const providerFactory: AccountingReadClientFactory = {
      provider: 'cep-accounting-vendor',
      createReadClient: vi.fn().mockImplementation(async (input) => {
        const listTransactions = vi.fn().mockRejectedValue(new Error('token=must-not-leak'))
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
    const resolver = createAccountingReadSourceResolver({
      registrations: reviewed,
      factories: [providerFactory],
    })
    const sources = candidates()
    const runner = createAccountingImportStagingRunner({ resolver, candidates: sources })

    const result = await runner.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'failed',
        metrics: { completedEntities: 0, failedEntities: 3 },
      },
    })
    for (const reader of readers) expect(reader).toHaveBeenCalledOnce()
    for (const source of sources) {
      expect(source.store.completeSync).not.toHaveBeenCalled()
      expect(source.store.failSync).toHaveBeenCalledOnce()
    }
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('redacts source resolution failure before any provider or store operation', async () => {
    const sources = candidates()
    const resolveBatch = vi
      .fn()
      .mockRejectedValue(new Error('op://cep/accounting/entity-3 token=must-not-leak'))
    const runner = createAccountingImportStagingRunner({
      resolver: { resolveBatch },
      candidates: sources,
    })

    const result = await runner.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'failed',
      reason: 'source_resolution_failed',
      canReadProvider: false,
      canWriteLocal: false,
    })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
    assertStoresUnused(sources)
  })

  it('rejects a cross-scope source before any provider or store operation', async () => {
    const sources = candidates()
    const readers = [vi.fn(), vi.fn(), vi.fn()]
    const resolved = [registration(1), registration(2), registration(3)].map((scope, index) => ({
      scope: index === 2 ? { ...scope, tenantId: '018f47a2-4a7b-7d09-9a2f-9d4ab1c25e90' } : scope,
      client: { provider: scope.provider, listTransactions: readers[index]! },
    }))
    const runner = createAccountingImportStagingRunner({
      resolver: { resolveBatch: vi.fn().mockResolvedValue(resolved) },
      candidates: sources,
    })

    await expect(runner.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'failed',
      reason: 'source_validation_failed',
      canReadProvider: false,
      canWriteLocal: false,
    })
    for (const reader of readers) expect(reader).not.toHaveBeenCalled()
    assertStoresUnused(sources)
  })

  it('exposes no provider write operation or runtime registration', async () => {
    const module = await import('../src/accounting-import-staging-runner')
    expect(
      Object.keys(module)
        .filter((key) => /create|resolve|flag|environment/i.test(key))
        .sort()
    ).toEqual([
      'ACCOUNTING_IMPORT_STAGING_RUNNER_ENVIRONMENT',
      'ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG',
      'createAccountingImportStagingRunner',
      'resolveAccountingImportStagingRunnerGate',
    ])
    expect(Object.keys(module).filter((key) => /route|cron|job|providerWrite/i.test(key))).toEqual(
      []
    )
  })
})
