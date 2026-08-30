import { describe, expect, it, vi } from 'vitest'
import {
  synchronizeIndependentAccountingConnections,
  type AccountingConnectionScope,
  type AccountingImportStore,
  type AccountingReadClient,
  type SynchronizeAccountingInput,
} from '../src'

const tenantId = '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10'

function scope(index: number): AccountingConnectionScope {
  return {
    tenantId,
    legalEntityId: `018f47a2-4a7b-7d02-8a2f-9d4ab1c25e1${index}`,
    connectionId: `018f47a2-4a7b-7d03-aa2f-9d4ab1c25e2${index}`,
    provider: `provider-${index}`,
    externalCompanyId: `company-${index}`,
    integrationMode: 'read_only',
    connectionStatus: 'active',
  }
}

function job(
  index: number,
  providerError?: Error
): SynchronizeAccountingInput & {
  readonly client: AccountingReadClient & { listTransactions: ReturnType<typeof vi.fn> }
  readonly store: AccountingImportStore & { beginSync: ReturnType<typeof vi.fn> }
} {
  const connectionScope = scope(index)
  const client = {
    provider: connectionScope.provider,
    listTransactions: providerError
      ? vi.fn().mockRejectedValue(providerError)
      : vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  }
  const store = {
    beginSync: vi.fn().mockResolvedValue({ syncRunId: `sync-${index}` }),
    upsertTransactions: vi.fn().mockResolvedValue({ upserted: 0, skipped: 0 }),
    completeSync: vi.fn().mockResolvedValue(undefined),
    failSync: vi.fn().mockResolvedValue(undefined),
  }

  return { scope: connectionScope, client, store }
}

describe('independent accounting synchronization', () => {
  it('runs one isolated read for each legal entity in deterministic order', async () => {
    const sur = job(3)
    const norte = job(1)
    const santaCruz = job(2)

    const result = await synchronizeIndependentAccountingConnections({
      tenantId,
      jobs: [sur, norte, santaCruz],
    })

    expect(result).toMatchObject({ total: 3, completed: 3, failed: 0 })
    expect(result.outcomes.map(({ legalEntityId }) => legalEntityId)).toEqual([
      norte.scope.legalEntityId,
      santaCruz.scope.legalEntityId,
      sur.scope.legalEntityId,
    ])
    for (const current of [norte, santaCruz, sur]) {
      expect(current.client.listTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ externalCompanyId: current.scope.externalCompanyId })
      )
      expect(current.store.beginSync).toHaveBeenCalledWith(
        expect.objectContaining({ scope: current.scope })
      )
    }
  })

  it('validates the complete batch before any external or persistence operation', async () => {
    const first = job(1)
    const duplicateEntity = job(2)
    const invalidJob = {
      ...duplicateEntity,
      scope: { ...duplicateEntity.scope, legalEntityId: first.scope.legalEntityId },
    }

    await expect(
      synchronizeIndependentAccountingConnections({
        tenantId,
        jobs: [first, invalidJob],
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_BATCH_DUPLICATE_ENTITY' })
    expect(first.client.listTransactions).not.toHaveBeenCalled()
    expect(first.store.beginSync).not.toHaveBeenCalled()
    expect(invalidJob.client.listTransactions).not.toHaveBeenCalled()
    expect(invalidJob.store.beginSync).not.toHaveBeenCalled()
  })

  it('contains a provider failure to its entity and continues the next connection', async () => {
    const failed = job(1, new Error('token=must-not-leak'))
    const completed = job(2)

    const result = await synchronizeIndependentAccountingConnections({
      tenantId,
      jobs: [failed, completed],
    })

    expect(result).toMatchObject({ total: 2, completed: 1, failed: 1 })
    expect(result.outcomes[0]).toMatchObject({
      status: 'failed',
      legalEntityId: failed.scope.legalEntityId,
      errorCode: 'ACCOUNTING_PROVIDER_READ_FAILED',
      errorSummary: 'External accounting read failed.',
    })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
    expect(completed.client.listTransactions).toHaveBeenCalledOnce()
  })

  it('rejects a cross-tenant job before starting any connection', async () => {
    const valid = job(1)
    const foreign = job(2)
    const foreignJob = {
      ...foreign,
      scope: {
        ...foreign.scope,
        tenantId: '018f47a2-4a7b-7d01-9a2f-9d4ab1c25eff',
      },
    }

    await expect(
      synchronizeIndependentAccountingConnections({
        tenantId,
        jobs: [valid, foreignJob],
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_BATCH_TENANT_MISMATCH' })
    expect(valid.client.listTransactions).not.toHaveBeenCalled()
    expect(valid.store.beginSync).not.toHaveBeenCalled()
  })
})
