import { describe, expect, it, vi } from 'vitest'
import {
  AccountingSyncError,
  createAccountingSnapshotReader,
  createFinanceEntityShadowComposition,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  loadFinanceReconciliationSnapshot,
  type AccountingReconciliationReadRepository,
  type FinanceReconciliationAccountingSnapshot,
  type FinanceReconciliationSnapshotReaders,
  type ReviewedAccountingSnapshotBinding,
} from '../src'

const surScope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  connectionId: 'accounting-sur',
}

const norteScope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-norte',
  connectionId: 'accounting-norte',
}

const surBinding: ReviewedAccountingSnapshotBinding = {
  ...surScope,
  integrationMode: 'read_only',
  connectionStatus: 'active',
  reviewReference: 'review://finance/entity-sur/accounting/v1',
}

const transaction: FinanceReconciliationAccountingSnapshot = {
  externalId: 'transaction-1',
  ...surScope,
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-22',
  amount: '100.00',
  currency: 'EUR',
  reference: 'receipt-1',
}

function repository(
  implementation: AccountingReconciliationReadRepository['listReconciliationTransactions'] = vi
    .fn()
    .mockResolvedValue({ items: [], nextCursor: null, snapshotVersion: 'snapshot-v1' })
): AccountingReconciliationReadRepository & {
  listReconciliationTransactions: ReturnType<typeof vi.fn>
} {
  return { listReconciliationTransactions: vi.fn(implementation) }
}

describe('accounting reconciliation snapshot reader', () => {
  it('reads a stable paginated snapshot with exact scope and strips additional accounting fields', async () => {
    const listReconciliationTransactions = vi
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            ...transaction,
            description: 'must-not-leak',
            counterpartyName: 'private-counterparty',
            accountCode: 'private-account',
            costCenter: 'private-cost-center',
            sourceHash: 'private-source-hash',
          },
        ],
        nextCursor: 'cursor-2',
        snapshotVersion: 'snapshot-v1',
      })
      .mockResolvedValueOnce({
        items: [],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })
    const reader = createAccountingSnapshotReader({
      repository: repository(listReconciliationTransactions),
      reviewedBindings: [surBinding],
      pageSize: 25,
    })

    const result = await reader.readAccountingTransactions(surScope)

    expect(listReconciliationTransactions).toHaveBeenNthCalledWith(1, {
      ...surScope,
      cursor: null,
      pageSize: 25,
      orderBy: 'external_id_asc',
    })
    expect(listReconciliationTransactions).toHaveBeenNthCalledWith(2, {
      ...surScope,
      cursor: 'cursor-2',
      pageSize: 25,
      orderBy: 'external_id_asc',
    })
    expect(result).toEqual([transaction])
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[0])).toBe(true)
    for (const privateValue of [
      'must-not-leak',
      'private-counterparty',
      'private-account',
      'private-cost-center',
      'private-source-hash',
    ]) {
      expect(JSON.stringify(result)).not.toContain(privateValue)
    }
  })

  it('selects one reviewed entity and connection without reading another', async () => {
    const repo = repository(async (input) => ({
      items: [
        {
          ...transaction,
          tenantId: input.tenantId,
          legalEntityId: input.legalEntityId,
          connectionId: input.connectionId,
        },
      ],
      nextCursor: null,
      snapshotVersion: 'snapshot-v1',
    }))
    const reader = createAccountingSnapshotReader({
      repository: repo,
      reviewedBindings: [
        surBinding,
        {
          ...norteScope,
          integrationMode: 'read_only',
          connectionStatus: 'active',
          reviewReference: 'review://finance/entity-norte/accounting/v1',
        },
      ],
    })

    const result = await reader.readAccountingTransactions(norteScope)

    expect(repo.listReconciliationTransactions).toHaveBeenCalledOnce()
    expect(repo.listReconciliationTransactions).toHaveBeenCalledWith(
      expect.objectContaining(norteScope)
    )
    expect(result[0]).toMatchObject(norteScope)
    expect(JSON.stringify(repo.listReconciliationTransactions.mock.calls)).not.toContain(
      'entity-sur'
    )
  })

  it('composes with the snapshot loader using only the minimal accounting projection', async () => {
    const accounting = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [transaction],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
    })
    const readers: FinanceReconciliationSnapshotReaders = {
      ...accounting,
      readEnrollments: vi.fn(async () => [
        { id: 101, tenantId: 'tenant-cep', legalEntityId: 'entity-sur', amountPaid: '100.00' },
      ]),
      readCampaigns: vi.fn(async () => []),
      readPaymentEvents: vi.fn(async () => [
        {
          id: 'payment-1',
          tenantId: 'tenant-cep',
          legalEntityId: 'entity-sur',
          enrollment: 101,
          status: 'paid',
          amount: '100.00',
          currency: 'EUR',
          paidAt: '2026-07-22',
          transactionReference: 'receipt-1',
        },
      ]),
      readAdvertisingSpend: vi.fn(async () => []),
    }

    const result = await loadFinanceReconciliationSnapshot({ scope: surScope, readers })

    expect(result.accountingTransactions).toEqual([transaction])
    expect(Object.keys(result.accountingTransactions[0]!).sort()).toEqual([
      'amount',
      'bookedOn',
      'connectionId',
      'currency',
      'externalId',
      'kind',
      'legalEntityId',
      'reference',
      'status',
      'tenantId',
    ])
  })

  it('composes into the staging-only single-entity shadow execution', async () => {
    const accounting = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [transaction],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
    })
    const composition = createFinanceEntityShadowComposition({
      configuration: {
        ...surScope,
        accountingConnectionId: surScope.connectionId,
        integrationMode: 'read_only',
        connectionStatus: 'active',
        reviewReference: 'review://finance/entity-sur/shadow/v1',
        rolloutStage: 'pre_pilot_validation',
      },
      sources: {
        accounting,
        payloadRelationships: {
          readEnrollments: vi.fn(async () => [
            {
              id: 101,
              tenantId: 'tenant-cep',
              legalEntityId: 'entity-sur',
              amountPaid: '100.00',
            },
          ]),
          readCampaigns: vi.fn(async () => []),
        },
        externalOperations: {
          readPaymentEvents: vi.fn(async () => [
            {
              id: 'payment-1',
              tenantId: 'tenant-cep',
              legalEntityId: 'entity-sur',
              enrollment: 101,
              status: 'paid',
              amount: '100.00',
              currency: 'EUR',
              paidAt: '2026-07-22',
              transactionReference: 'receipt-1',
            },
          ]),
          readAdvertisingSpend: vi.fn(async () => []),
        },
      },
    })

    await expect(
      composition.run({
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
      })
    ).resolves.toMatchObject({
      status: 'observed',
      observation: { verdict: 'planned', metrics: { proposed: 1 } },
    })
  })

  it.each([
    [{ tenantId: ' tenant-cep ' }, 'FINANCE_ACCOUNTING_SNAPSHOT_PLAN_INVALID'],
    [{ integrationMode: 'write' as never }, 'FINANCE_ACCOUNTING_SNAPSHOT_PLAN_INVALID'],
    [{ connectionStatus: 'inactive' as never }, 'FINANCE_ACCOUNTING_SNAPSHOT_PLAN_INVALID'],
    [{ reviewReference: 'not-reviewed' }, 'FINANCE_ACCOUNTING_SNAPSHOT_PLAN_INVALID'],
  ])('rejects an invalid binding before repository I/O: %o', (change, code) => {
    const repo = repository()
    expect(() =>
      createAccountingSnapshotReader({
        repository: repo,
        reviewedBindings: [{ ...surBinding, ...change }],
      })
    ).toThrowError(expect.objectContaining({ code }))
    expect(repo.listReconciliationTransactions).not.toHaveBeenCalled()
  })

  it('rejects duplicate entity bindings and shared connections before I/O', () => {
    const repo = repository()
    expect(() =>
      createAccountingSnapshotReader({
        repository: repo,
        reviewedBindings: [surBinding, { ...surBinding, connectionId: 'accounting-sur-2' }],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ACCOUNTING_SNAPSHOT_DUPLICATE_ENTITY' })
    )
    expect(() =>
      createAccountingSnapshotReader({
        repository: repo,
        reviewedBindings: [
          surBinding,
          {
            ...surBinding,
            legalEntityId: 'entity-norte',
            reviewReference: 'review://finance/entity-norte/accounting/v1',
          },
        ],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ACCOUNTING_SNAPSHOT_SHARED_CONNECTION' })
    )
    expect(repo.listReconciliationTransactions).not.toHaveBeenCalled()
  })

  it('fails closed for unreviewed and malformed runtime scopes without I/O', async () => {
    const repo = repository()
    const reader = createAccountingSnapshotReader({
      repository: repo,
      reviewedBindings: [surBinding],
    })

    await expect(reader.readAccountingTransactions(norteScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_NOT_REVIEWED',
    })
    await expect(
      reader.readAccountingTransactions({ ...surScope, tenantId: ' tenant-cep ' })
    ).rejects.toMatchObject({ code: 'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_INVALID' })
    expect(repo.listReconciliationTransactions).not.toHaveBeenCalled()
  })

  it.each([
    [{ tenantId: 'other-tenant' }, 'tenant'],
    [{ legalEntityId: 'entity-norte' }, 'entity'],
    [{ connectionId: 'accounting-norte' }, 'connection'],
  ])('rejects a cross-scope %s record from the repository', async (change) => {
    const reader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [{ ...transaction, ...change }],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
    })

    await expect(reader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_MISMATCH',
    })
  })

  it.each([
    [null],
    [{ ...transaction, kind: 'unknown' }],
    [{ ...transaction, status: 'unknown' }],
    [{ ...transaction, amount: { raw: '100.00' } }],
    [{ ...transaction, amount: '01.00' }],
    [{ ...transaction, amount: '1.234' }],
    [{ ...transaction, currency: null }],
    [{ ...transaction, currency: 'eur' }],
    [{ ...transaction, bookedOn: '2026-02-30' }],
  ])('rejects a malformed runtime record: %o', async (invalidRecord) => {
    const reader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [invalidRecord] as never,
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
    })

    await expect(reader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_RECORD_INVALID',
    })
  })

  it('rejects duplicate IDs across pages and snapshot-version drift', async () => {
    const duplicateRepository = repository()
    duplicateRepository.listReconciliationTransactions
      .mockResolvedValueOnce({
        items: [transaction],
        nextCursor: 'cursor-2',
        snapshotVersion: 'snapshot-v1',
      })
      .mockResolvedValueOnce({
        items: [transaction],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })
    const duplicateReader = createAccountingSnapshotReader({
      repository: duplicateRepository,
      reviewedBindings: [surBinding],
    })
    await expect(duplicateReader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_DUPLICATE_RECORD',
    })

    const driftRepository = repository()
    driftRepository.listReconciliationTransactions
      .mockResolvedValueOnce({
        items: [],
        nextCursor: 'cursor-2',
        snapshotVersion: 'snapshot-v1',
      })
      .mockResolvedValueOnce({
        items: [],
        nextCursor: null,
        snapshotVersion: 'snapshot-v2',
      })
    const driftReader = createAccountingSnapshotReader({
      repository: driftRepository,
      reviewedBindings: [surBinding],
    })
    await expect(driftReader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_VERSION_CHANGED',
    })
  })

  it('rejects records that violate the declared stable external-ID order', async () => {
    const reader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [
          { ...transaction, externalId: 'transaction-2' },
          { ...transaction, externalId: 'transaction-1' },
        ],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
    })

    await expect(reader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_ORDER_INVALID',
    })
  })

  it('detects cursor cycles and page-limit exhaustion', async () => {
    const cycleReader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [],
        nextCursor: 'same-cursor',
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
      maxPages: 2,
    })
    await expect(cycleReader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_CURSOR_CYCLE',
    })

    const limitedReader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [],
        nextCursor: 'more-pages',
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
      maxPages: 1,
    })
    await expect(limitedReader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_PAGE_LIMIT_EXCEEDED',
    })
  })

  it('enforces the record limit before returning a partial snapshot', async () => {
    const reader = createAccountingSnapshotReader({
      repository: repository(async () => ({
        items: [transaction, { ...transaction, externalId: 'transaction-2' }],
        nextCursor: null,
        snapshotVersion: 'snapshot-v1',
      })),
      reviewedBindings: [surBinding],
      maxRecords: 1,
    })

    await expect(reader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_RECORD_LIMIT_EXCEEDED',
    })
  })

  it('rejects malformed pages and invalid pagination options before unsafe use', async () => {
    const malformedReader = createAccountingSnapshotReader({
      repository: repository(
        async () =>
          ({
            items: null,
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          }) as never
      ),
      reviewedBindings: [surBinding],
    })
    await expect(malformedReader.readAccountingTransactions(surScope)).rejects.toMatchObject({
      code: 'FINANCE_ACCOUNTING_SNAPSHOT_PAGE_INVALID',
    })

    for (const [change, code] of [
      [{ pageSize: 0 }, 'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_PAGE_SIZE'],
      [{ pageSize: 501 }, 'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_PAGE_SIZE'],
      [{ maxPages: 0 }, 'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_MAX_PAGES'],
      [{ maxRecords: 1_001 }, 'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_MAX_RECORDS'],
    ] as const) {
      expect(() =>
        createAccountingSnapshotReader({
          repository: repository(),
          reviewedBindings: [surBinding],
          ...change,
        })
      ).toThrowError(expect.objectContaining({ code }))
    }
  })

  it('sanitizes every repository failure, including misleading AccountingSyncError instances', async () => {
    for (const failure of [
      new Error('database-password=must-not-leak'),
      new AccountingSyncError('MALICIOUS_CODE', 'token=must-not-leak'),
    ]) {
      const reader = createAccountingSnapshotReader({
        repository: repository(async () => {
          throw failure
        }),
        reviewedBindings: [surBinding],
      })

      const result = reader.readAccountingTransactions(surScope)
      await expect(result).rejects.toMatchObject({
        code: 'FINANCE_ACCOUNTING_SNAPSHOT_READ_FAILED',
        safeSummary: 'Accounting snapshot repository read failed.',
      })
      await expect(result).rejects.not.toThrow('must-not-leak')
    }
  })

  it('rejects a missing repository synchronously', () => {
    expect(() =>
      createAccountingSnapshotReader({
        repository: null as never,
        reviewedBindings: [surBinding],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ACCOUNTING_SNAPSHOT_REPOSITORY_INVALID' })
    )
  })
})
