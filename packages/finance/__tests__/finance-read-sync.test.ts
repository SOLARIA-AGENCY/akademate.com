import { describe, expect, it, vi } from 'vitest'
import {
  AccountingSyncError,
  normalizeAccountingTransactions,
  synchronizeAccountingReadModel,
  type AccountingConnectionScope,
  type AccountingImportStore,
  type AccountingReadClient,
  type ExternalAccountingTransaction,
} from '../src'

const scope: AccountingConnectionScope = {
  tenantId: '018f47a2-4a7b-7d01-9a2f-9d4ab1c25e10',
  legalEntityId: '018f47a2-4a7b-7d02-8a2f-9d4ab1c25e11',
  connectionId: '018f47a2-4a7b-7d03-aa2f-9d4ab1c25e12',
  provider: 'test-provider',
  externalCompanyId: 'company-external',
  integrationMode: 'read_only',
  connectionStatus: 'active',
}

const transaction: ExternalAccountingTransaction = {
  externalId: 'movement-1',
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-22',
  valueOn: '2026-07-23',
  amount: '1250.50',
  currency: 'EUR',
  description: 'Matricula',
  sourceUpdatedAt: '2026-07-22T10:00:00+02:00',
}

function createStore(): AccountingImportStore & {
  beginSync: ReturnType<typeof vi.fn>
  upsertTransactions: ReturnType<typeof vi.fn>
  completeSync: ReturnType<typeof vi.fn>
  failSync: ReturnType<typeof vi.fn>
} {
  return {
    beginSync: vi.fn().mockResolvedValue({ syncRunId: 'sync-1' }),
    upsertTransactions: vi
      .fn()
      .mockImplementation(
        async (input: Parameters<AccountingImportStore['upsertTransactions']>[0]) => ({
          upserted: input.transactions.length,
          skipped: 0,
        })
      ),
    completeSync: vi.fn().mockResolvedValue(undefined),
    failSync: vi.fn().mockResolvedValue(undefined),
  }
}

describe('accounting transaction normalization', () => {
  it('uses trusted scope and produces a stable source hash', () => {
    const first = normalizeAccountingTransactions(scope, [transaction])[0]
    const second = normalizeAccountingTransactions(scope, [{ ...transaction }])[0]

    expect(first).toMatchObject({
      tenantId: scope.tenantId,
      legalEntityId: scope.legalEntityId,
      connectionId: scope.connectionId,
      sourceUpdatedAt: '2026-07-22T08:00:00.000Z',
    })
    expect(first?.sourceHash).toMatch(/^[a-f0-9]{64}$/)
    expect(first?.sourceHash).toBe(second?.sourceHash)
  })

  it('rejects duplicate external IDs in one provider page', () => {
    expect(() =>
      normalizeAccountingTransactions(scope, [transaction, { ...transaction }])
    ).toThrowError(
      expect.objectContaining<AccountingSyncError>({
        code: 'ACCOUNTING_DUPLICATE_EXTERNAL_ID',
      })
    )
  })

  it.each([
    { field: 'amount', value: '12.345' },
    { field: 'amount', value: '01.20' },
    { field: 'currency', value: 'eur' },
    { field: 'bookedOn', value: '2026-02-30' },
    { field: 'kind', value: 'owner_draw' },
    { field: 'status', value: 'deleted' },
  ] as const)('rejects invalid $field values', ({ field, value }) => {
    expect(() =>
      normalizeAccountingTransactions(scope, [{ ...transaction, [field]: value }])
    ).toThrow(AccountingSyncError)
  })
})

describe('read-only accounting synchronization', () => {
  it('reads paginated data and persists only normalized trusted-scope records', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi
        .fn()
        .mockResolvedValueOnce({ items: [transaction], nextCursor: 'page-2' })
        .mockResolvedValueOnce({
          items: [{ ...transaction, externalId: 'movement-2' }],
          nextCursor: null,
        }),
    }
    const store = createStore()

    const result = await synchronizeAccountingReadModel({ scope, client, store })

    expect(result).toEqual({
      syncRunId: 'sync-1',
      nextCursor: null,
      pages: 2,
      received: 2,
      upserted: 2,
      skipped: 0,
    })
    expect(client.listTransactions).toHaveBeenCalledTimes(2)
    expect(store.upsertTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        scope,
        transactions: [
          expect.objectContaining({
            tenantId: scope.tenantId,
            legalEntityId: scope.legalEntityId,
            connectionId: scope.connectionId,
          }),
        ],
      })
    )
    expect(store.completeSync).toHaveBeenCalledOnce()
    expect(store.failSync).not.toHaveBeenCalled()
  })

  it('fails closed on a repeated cursor', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn().mockResolvedValue({ items: [], nextCursor: 'same-cursor' }),
    }
    const store = createStore()

    await expect(
      synchronizeAccountingReadModel({ scope, client, store, cursor: 'same-cursor' })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_CURSOR_DID_NOT_ADVANCE' })
    expect(store.failSync).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'ACCOUNTING_CURSOR_DID_NOT_ADVANCE' })
    )
  })

  it('sanitizes unknown provider errors before persisting or rethrowing them', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn().mockRejectedValue(new Error('token=super-secret-value')),
    }
    const store = createStore()

    await expect(synchronizeAccountingReadModel({ scope, client, store })).rejects.toMatchObject({
      code: 'ACCOUNTING_PROVIDER_READ_FAILED',
      message: 'External accounting read failed.',
    })
    expect(store.failSync).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'ACCOUNTING_PROVIDER_READ_FAILED',
        errorSummary: 'External accounting read failed.',
      })
    )
    expect(JSON.stringify(store.failSync.mock.calls)).not.toContain('super-secret-value')
  })

  it('rejects malformed trusted scope before starting a sync run', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn(),
    }
    const store = createStore()

    await expect(
      synchronizeAccountingReadModel({
        scope: { ...scope, legalEntityId: 'cep-sur' },
        client,
        store,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_INVALID_SCOPE' })
    expect(store.beginSync).not.toHaveBeenCalled()
    expect(client.listTransactions).not.toHaveBeenCalled()
  })

  it('fails closed when the persistence layer returns inconsistent counts', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn().mockResolvedValue({ items: [transaction], nextCursor: null }),
    }
    const store = createStore()
    store.upsertTransactions.mockResolvedValueOnce({ upserted: 2, skipped: 0 })

    await expect(synchronizeAccountingReadModel({ scope, client, store })).rejects.toMatchObject({
      code: 'ACCOUNTING_STORE_COUNT_MISMATCH',
    })
    expect(store.completeSync).not.toHaveBeenCalled()
    expect(store.failSync).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: 'ACCOUNTING_STORE_COUNT_MISMATCH' })
    )
  })

  it('stops at the configured page bound instead of looping indefinitely', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi
        .fn()
        .mockResolvedValueOnce({ items: [], nextCursor: 'page-2' })
        .mockResolvedValueOnce({ items: [], nextCursor: 'page-3' }),
    }
    const store = createStore()

    await expect(
      synchronizeAccountingReadModel({ scope, client, store, maxPages: 2 })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_PAGE_LIMIT_REACHED' })
    expect(client.listTransactions).toHaveBeenCalledTimes(2)
  })

  it('rejects inactive connections before any external or database operation', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn(),
    }
    const store = createStore()

    await expect(
      synchronizeAccountingReadModel({
        scope: { ...scope, connectionStatus: 'suspended' } as AccountingConnectionScope,
        client,
        store,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_CONNECTION_INACTIVE' })
    expect(client.listTransactions).not.toHaveBeenCalled()
    expect(store.beginSync).not.toHaveBeenCalled()
  })

  it('rejects a provider adapter that does not belong to the configured connection', async () => {
    const client: AccountingReadClient = {
      provider: 'other-provider',
      listTransactions: vi.fn(),
    }
    const store = createStore()

    await expect(synchronizeAccountingReadModel({ scope, client, store })).rejects.toMatchObject({
      code: 'ACCOUNTING_PROVIDER_MISMATCH',
      message: 'Accounting client does not match the configured connection provider.',
    })
    expect(client.listTransactions).not.toHaveBeenCalled()
    expect(store.beginSync).not.toHaveBeenCalled()
  })

  it('rejects a non-read-only integration mode before any external or database operation', async () => {
    const client: AccountingReadClient = {
      provider: 'test-provider',
      listTransactions: vi.fn(),
    }
    const store = createStore()

    await expect(
      synchronizeAccountingReadModel({
        scope: { ...scope, integrationMode: 'read_write' } as AccountingConnectionScope,
        client,
        store,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNTING_INTEGRATION_NOT_READ_ONLY' })
    expect(client.listTransactions).not.toHaveBeenCalled()
    expect(store.beginSync).not.toHaveBeenCalled()
  })

  it.each([
    { field: 'provider', value: ' test-provider' },
    { field: 'externalCompanyId', value: 'company-external ' },
  ] as const)(
    'rejects a non-canonical $field before selecting an external company',
    async ({ field, value }) => {
      const client: AccountingReadClient = {
        provider: 'test-provider',
        listTransactions: vi.fn(),
      }
      const store = createStore()

      await expect(
        synchronizeAccountingReadModel({
          scope: { ...scope, [field]: value },
          client,
          store,
        })
      ).rejects.toMatchObject({ code: 'ACCOUNTING_INVALID_SCOPE' })
      expect(client.listTransactions).not.toHaveBeenCalled()
      expect(store.beginSync).not.toHaveBeenCalled()
    }
  )
})
