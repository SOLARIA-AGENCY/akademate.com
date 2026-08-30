import { describe, expect, it, vi } from 'vitest'
import {
  createExternalOperationalFinanceReaders,
  loadFinanceReconciliationSnapshot,
  type ExternalAdvertisingSpendReadClient,
  type ExternalPaymentReadClient,
  type FinanceReconciliationSnapshotReaders,
  type ReviewedAdvertisingSpendSourceBinding,
  type ReviewedPaymentSourceBinding,
} from '../src'

const surScope = { tenantId: 'tenant-cep', legalEntityId: 'entity-sur' }
const norteScope = { tenantId: 'tenant-cep', legalEntityId: 'entity-norte' }

function paymentClient(
  implementation: ExternalPaymentReadClient['listPaymentEvents'] = vi
    .fn()
    .mockResolvedValue({ items: [], nextCursor: null, snapshotVersion: 'snapshot-v1' })
): ExternalPaymentReadClient & { listPaymentEvents: ReturnType<typeof vi.fn> } {
  return { provider: 'payments-provider', listPaymentEvents: vi.fn(implementation) }
}

function advertisingClient(
  implementation: ExternalAdvertisingSpendReadClient['listDailyAdvertisingSpend'] = vi
    .fn()
    .mockResolvedValue({ items: [], nextCursor: null, snapshotVersion: 'snapshot-v1' })
): ExternalAdvertisingSpendReadClient & {
  listDailyAdvertisingSpend: ReturnType<typeof vi.fn>
} {
  return { provider: 'ads-provider', listDailyAdvertisingSpend: vi.fn(implementation) }
}

function paymentSource(
  change: Partial<ReviewedPaymentSourceBinding> = {}
): ReviewedPaymentSourceBinding {
  return {
    ...surScope,
    sourceConnectionId: 'payment-connection-sur',
    provider: 'payments-provider',
    externalAccountId: 'payments-sur',
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewReference: 'review://cep-sur/payments/v1',
    client: paymentClient(),
    enrollmentMappings: [{ externalId: 'external-enrollment-101', localId: 101 }],
    ...change,
  }
}

function advertisingSource(
  change: Partial<ReviewedAdvertisingSpendSourceBinding> = {}
): ReviewedAdvertisingSpendSourceBinding {
  return {
    ...surScope,
    sourceConnectionId: 'advertising-connection-sur',
    provider: 'ads-provider',
    externalAccountId: 'ads-sur',
    integrationMode: 'read_only',
    connectionStatus: 'active',
    reviewReference: 'review://cep-sur/advertising/v1',
    client: advertisingClient(),
    campaignMappings: [{ externalId: 'external-campaign-301', localId: 301 }],
    ...change,
  }
}

describe('external operational finance readers', () => {
  it('reads paginated payments with an explicit reviewed scope and strips extra fields', async () => {
    const listPaymentEvents = vi
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            externalId: 'payment-1',
            externalEnrollmentId: 'external-enrollment-101',
            status: 'paid',
            amount: '125.50',
            currency: 'EUR',
            paidAt: '2026-07-21',
            transactionReference: 'receipt-1',
            cardholderName: 'must-not-leak',
          },
        ],
        nextCursor: 'cursor-2',
        snapshotVersion: 'snapshot-v1',
      })
      .mockResolvedValueOnce({ items: [], nextCursor: null, snapshotVersion: 'snapshot-v1' })
    const source = paymentSource({ client: paymentClient(listPaymentEvents) })
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [source],
      advertisingSpendSources: [],
      pageSize: 25,
    })

    const result = await readers.readPaymentEvents(surScope)

    expect(listPaymentEvents).toHaveBeenNthCalledWith(1, {
      externalAccountId: 'payments-sur',
      cursor: null,
      pageSize: 25,
    })
    expect(listPaymentEvents).toHaveBeenNthCalledWith(2, {
      externalAccountId: 'payments-sur',
      cursor: 'cursor-2',
      pageSize: 25,
    })
    expect(result).toEqual([
      {
        id: 'payment/payments-provider/payments-sur/payment-1',
        ...surScope,
        enrollment: 101,
        status: 'paid',
        amount: '125.50',
        currency: 'EUR',
        paidAt: '2026-07-21',
        transactionReference: 'receipt-1',
      },
    ])
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result[0])).toBe(true)
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('projects one immutable daily advertising record without expanding its date range', async () => {
    const listDailyAdvertisingSpend = vi.fn().mockResolvedValue({
      items: [
        {
          externalCampaignId: 'external-campaign-301',
          spendDate: '2026-07-22',
          amount: '42.10',
          currency: 'EUR',
          metricState: 'loaded',
          accountName: 'must-not-leak',
        },
      ],
      nextCursor: null,
      snapshotVersion: 'snapshot-v1',
    })
    const source = advertisingSource({
      client: advertisingClient(listDailyAdvertisingSpend),
    })
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [],
      advertisingSpendSources: [source],
    })

    const result = await readers.readAdvertisingSpend(surScope)

    expect(result).toEqual([
      {
        id: 'advertising/ads-provider/ads-sur/external-campaign-301%2F2026-07-22',
        ...surScope,
        campaign: 301,
        rangeSince: '2026-07-22',
        rangeUntil: '2026-07-22',
        amount: '42.10',
        currency: 'EUR',
        metricState: 'loaded',
      },
    ])
    expect(Object.isFrozen(result[0])).toBe(true)
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('selects independent clients by legal entity and never forwards entity identifiers', async () => {
    const surClient = paymentClient()
    const norteClient = paymentClient()
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [
        paymentSource({ client: surClient }),
        paymentSource({
          ...norteScope,
          sourceConnectionId: 'payment-connection-norte',
          externalAccountId: 'payments-norte',
          reviewReference: 'review://cep-norte/payments/v1',
          client: norteClient,
        }),
      ],
      advertisingSpendSources: [],
    })

    await readers.readPaymentEvents(norteScope)

    expect(surClient.listPaymentEvents).not.toHaveBeenCalled()
    expect(norteClient.listPaymentEvents).toHaveBeenCalledWith({
      externalAccountId: 'payments-norte',
      cursor: null,
      pageSize: 100,
    })
    expect(JSON.stringify(norteClient.listPaymentEvents.mock.calls)).not.toContain('entity-norte')
    expect(JSON.stringify(norteClient.listPaymentEvents.mock.calls)).not.toContain('tenant-cep')
  })

  it('composes only the two external readers into the existing reconciliation loader', async () => {
    const externalReaders = createExternalOperationalFinanceReaders({
      paymentSources: [paymentSource()],
      advertisingSpendSources: [advertisingSource()],
    })
    const readers: FinanceReconciliationSnapshotReaders = {
      readAccountingTransactions: vi.fn(async () => []),
      readEnrollments: vi.fn(async () => [{ id: 101, ...surScope, amountPaid: 0 }]),
      readCampaigns: vi.fn(async () => [{ id: 301, ...surScope }]),
      ...externalReaders,
    }

    const result = await loadFinanceReconciliationSnapshot({
      scope: { ...surScope, connectionId: 'accounting-sur' },
      readers,
    })

    expect(result.operational.paymentEvents).toEqual([])
    expect(result.operational.advertisingSpend).toEqual([])
    expect(Object.keys(externalReaders).sort()).toEqual([
      'readAdvertisingSpend',
      'readPaymentEvents',
    ])
  })

  it.each([
    ['payment', () => paymentSource({ provider: 'other-provider' })],
    ['advertising', () => advertisingSource({ reviewReference: 'ticket-without-review-scheme' })],
    ['payment', () => paymentSource({ integrationMode: 'write' as never })],
    [
      'payment',
      () =>
        paymentSource({
          enrollmentMappings: [
            { externalId: 'same', localId: 101 },
            { externalId: 'same', localId: 102 },
          ],
        }),
    ],
    [
      'advertising',
      () =>
        advertisingSource({
          campaignMappings: [
            { externalId: 'campaign-1', localId: 301 },
            { externalId: 'campaign-2', localId: 301 },
          ],
        }),
    ],
  ])('rejects an invalid reviewed %s plan before provider I/O', (dataset, makeSource) => {
    const source = makeSource()
    const create = () =>
      createExternalOperationalFinanceReaders({
        paymentSources: dataset === 'payment' ? [source as ReviewedPaymentSourceBinding] : [],
        advertisingSpendSources:
          dataset === 'advertising' ? [source as ReviewedAdvertisingSpendSourceBinding] : [],
      })

    expect(create).toThrowError(
      expect.objectContaining({
        code:
          dataset === 'payment' && source.provider === 'other-provider'
            ? 'FINANCE_EXTERNAL_SOURCE_PROVIDER_MISMATCH'
            : 'FINANCE_EXTERNAL_SOURCE_PLAN_INVALID',
      })
    )
  })

  it('rejects duplicated scopes, connections and shared external accounts before I/O', () => {
    const duplicateScope = paymentSource({ externalAccountId: 'payments-sur-2' })
    expect(() =>
      createExternalOperationalFinanceReaders({
        paymentSources: [paymentSource(), duplicateScope],
        advertisingSpendSources: [],
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_EXTERNAL_SOURCE_DUPLICATE_SCOPE' }))

    expect(() =>
      createExternalOperationalFinanceReaders({
        paymentSources: [
          paymentSource(),
          paymentSource({
            ...norteScope,
            externalAccountId: 'payments-norte',
            reviewReference: 'review://cep-norte/payments/v1',
          }),
        ],
        advertisingSpendSources: [],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_EXTERNAL_SOURCE_DUPLICATE_CONNECTION' })
    )

    expect(() =>
      createExternalOperationalFinanceReaders({
        paymentSources: [
          paymentSource(),
          paymentSource({
            ...norteScope,
            sourceConnectionId: 'payment-connection-norte',
            reviewReference: 'review://cep-norte/payments/v1',
          }),
        ],
        advertisingSpendSources: [],
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_EXTERNAL_SOURCE_SHARED_ACCOUNT' }))
  })

  it('fails closed for an unreviewed or malformed scope without provider I/O', async () => {
    const client = paymentClient()
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [paymentSource({ client })],
      advertisingSpendSources: [],
    })

    await expect(readers.readPaymentEvents(norteScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_SCOPE_NOT_REVIEWED',
    })
    await expect(
      readers.readPaymentEvents({ tenantId: ' tenant-cep ', legalEntityId: 'entity-sur' })
    ).rejects.toMatchObject({ code: 'FINANCE_EXTERNAL_SOURCE_INVALID_SCOPE' })
    expect(client.listPaymentEvents).not.toHaveBeenCalled()
  })

  it.each([
    ['payment', 'unknown-enrollment', 'FINANCE_EXTERNAL_PAYMENT_RELATIONSHIP_UNREVIEWED'],
    ['advertising', 'unknown-campaign', 'FINANCE_EXTERNAL_ADVERTISING_RELATIONSHIP_UNREVIEWED'],
  ])('rejects an unreviewed %s relationship', async (dataset, externalRelationship, code) => {
    const payment = paymentClient(async () => ({
      items: [
        {
          externalId: 'payment-1',
          externalEnrollmentId: externalRelationship,
          status: 'paid',
          amount: '1.00',
          currency: 'EUR',
          paidAt: '2026-07-22',
        },
      ],
      nextCursor: null,
      snapshotVersion: 'snapshot-v1',
    }))
    const advertising = advertisingClient(async () => ({
      items: [
        {
          externalCampaignId: externalRelationship,
          spendDate: '2026-07-22',
          amount: '1.00',
          currency: 'EUR',
          metricState: 'loaded',
        },
      ],
      nextCursor: null,
      snapshotVersion: 'snapshot-v1',
    }))
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [paymentSource({ client: payment })],
      advertisingSpendSources: [advertisingSource({ client: advertising })],
    })

    const read =
      dataset === 'payment'
        ? readers.readPaymentEvents(surScope)
        : readers.readAdvertisingSpend(surScope)
    await expect(read).rejects.toMatchObject({ code })
  })

  it('detects duplicate payment records and duplicate campaign-day spend', async () => {
    const duplicatePayment = {
      externalId: 'payment-1',
      externalEnrollmentId: 'external-enrollment-101',
      status: 'paid' as const,
      amount: '1.00',
      currency: 'EUR',
      paidAt: '2026-07-22',
    }
    const duplicateSpend = {
      externalCampaignId: 'external-campaign-301',
      spendDate: '2026-07-22',
      amount: '1.00',
      currency: 'EUR',
      metricState: 'loaded' as const,
    }
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [
        paymentSource({
          client: paymentClient(async () => ({
            items: [duplicatePayment, duplicatePayment],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          })),
        }),
      ],
      advertisingSpendSources: [
        advertisingSource({
          client: advertisingClient(async () => ({
            items: [duplicateSpend, duplicateSpend],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          })),
        }),
      ],
    })

    await expect(readers.readPaymentEvents(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_DUPLICATE_RECORD',
    })
    await expect(readers.readAdvertisingSpend(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_ADVERTISING_DUPLICATE_RECORD',
    })
  })

  it('detects cursor cycles and bounded-page exhaustion', async () => {
    const cycleClient = paymentClient(async () => ({
      items: [],
      nextCursor: 'same-cursor',
      snapshotVersion: 'snapshot-v1',
    }))
    const pageLimitClient = advertisingClient(async () => ({
      items: [],
      nextCursor: 'another-page',
      snapshotVersion: 'snapshot-v1',
    }))
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [paymentSource({ client: cycleClient })],
      advertisingSpendSources: [advertisingSource({ client: pageLimitClient })],
      maxPages: 1,
    })

    await expect(readers.readPaymentEvents(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_PAGE_LIMIT_EXCEEDED',
    })
    const cycleReaders = createExternalOperationalFinanceReaders({
      paymentSources: [paymentSource({ client: cycleClient })],
      advertisingSpendSources: [],
      maxPages: 2,
    })
    await expect(cycleReaders.readPaymentEvents(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_CURSOR_CYCLE',
    })
    await expect(readers.readAdvertisingSpend(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_ADVERTISING_PAGE_LIMIT_EXCEEDED',
    })
  })

  it.each([
    [
      'payment',
      () => {
        const client = paymentClient(
          vi
            .fn()
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
        )
        return createExternalOperationalFinanceReaders({
          paymentSources: [paymentSource({ client })],
          advertisingSpendSources: [],
        }).readPaymentEvents(surScope)
      },
      'FINANCE_EXTERNAL_PAYMENT_SNAPSHOT_VERSION_CHANGED',
    ],
    [
      'advertising',
      () => {
        const client = advertisingClient(
          vi
            .fn()
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
        )
        return createExternalOperationalFinanceReaders({
          paymentSources: [],
          advertisingSpendSources: [advertisingSource({ client })],
        }).readAdvertisingSpend(surScope)
      },
      'FINANCE_EXTERNAL_ADVERTISING_SNAPSHOT_VERSION_CHANGED',
    ],
  ])('fails closed when the %s snapshot version changes between pages', async (_, read, code) => {
    await expect(read()).rejects.toMatchObject({ code })
  })

  it.each([
    [
      'payment',
      () =>
        createExternalOperationalFinanceReaders({
          paymentSources: [
            paymentSource({
              client: paymentClient(async () => ({
                items: [],
                nextCursor: null,
                snapshotVersion: ' ',
              })),
            }),
          ],
          advertisingSpendSources: [],
        }).readPaymentEvents(surScope),
      'FINANCE_EXTERNAL_PAYMENT_PAGE_INVALID',
    ],
    [
      'advertising',
      () =>
        createExternalOperationalFinanceReaders({
          paymentSources: [],
          advertisingSpendSources: [
            advertisingSource({
              client: advertisingClient(async () => ({
                items: [],
                nextCursor: null,
                snapshotVersion: ' ',
              })),
            }),
          ],
        }).readAdvertisingSpend(surScope),
      'FINANCE_EXTERNAL_ADVERTISING_PAGE_INVALID',
    ],
  ])('rejects a blank %s snapshot version', async (_, read, code) => {
    await expect(read()).rejects.toMatchObject({ code })
  })

  it.each([
    [
      'payment',
      () =>
        paymentSource({
          client: paymentClient(async () => ({
            items: [
              {
                externalId: 'payment-1',
                externalEnrollmentId: 'external-enrollment-101',
                status: 'paid',
                amount: '1.00',
                currency: 'EUR',
              },
              {
                externalId: 'payment-2',
                externalEnrollmentId: 'external-enrollment-101',
                status: 'paid',
                amount: '2.00',
                currency: 'EUR',
              },
            ],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          })),
        }),
      'FINANCE_EXTERNAL_PAYMENT_RECORD_LIMIT_EXCEEDED',
    ],
    [
      'advertising',
      () =>
        advertisingSource({
          client: advertisingClient(async () => ({
            items: [
              {
                externalCampaignId: 'external-campaign-301',
                spendDate: '2026-07-21',
                amount: '1.00',
                currency: 'EUR',
                metricState: 'loaded',
              },
              {
                externalCampaignId: 'external-campaign-301',
                spendDate: '2026-07-22',
                amount: '2.00',
                currency: 'EUR',
                metricState: 'loaded',
              },
            ],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          })),
        }),
      'FINANCE_EXTERNAL_ADVERTISING_RECORD_LIMIT_EXCEEDED',
    ],
  ])('fails closed before projecting an oversized %s page', async (dataset, makeSource, code) => {
    const source = makeSource()
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: dataset === 'payment' ? [source as ReviewedPaymentSourceBinding] : [],
      advertisingSpendSources:
        dataset === 'advertising' ? [source as ReviewedAdvertisingSpendSourceBinding] : [],
      maxRecords: 1,
    })

    const read =
      dataset === 'payment'
        ? readers.readPaymentEvents(surScope)
        : readers.readAdvertisingSpend(surScope)
    await expect(read).rejects.toMatchObject({ code })
  })

  it('sanitizes provider failures without exposing credentials or raw messages', async () => {
    const secret = 'token=must-not-leak'
    const readers = createExternalOperationalFinanceReaders({
      paymentSources: [
        paymentSource({
          client: paymentClient(async () => {
            throw new Error(secret)
          }),
        }),
      ],
      advertisingSpendSources: [],
    })

    const failure = readers.readPaymentEvents(surScope)
    await expect(failure).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_READ_FAILED',
      safeSummary: 'External operational finance read failed.',
    })
    await expect(failure).rejects.not.toThrow(secret)
  })

  it('rejects malformed pages and invalid runtime record variants with safe codes', async () => {
    const malformedPageReaders = createExternalOperationalFinanceReaders({
      paymentSources: [
        paymentSource({
          client: paymentClient(async () => ({ items: null, nextCursor: null }) as never),
        }),
      ],
      advertisingSpendSources: [],
    })
    await expect(malformedPageReaders.readPaymentEvents(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_PAGE_INVALID',
    })

    const invalidRecordReaders = createExternalOperationalFinanceReaders({
      paymentSources: [
        paymentSource({
          client: paymentClient(
            async () =>
              ({ items: [null], nextCursor: null, snapshotVersion: 'snapshot-v1' }) as never
          ),
        }),
      ],
      advertisingSpendSources: [],
    })
    await expect(invalidRecordReaders.readPaymentEvents(surScope)).rejects.toMatchObject({
      code: 'FINANCE_EXTERNAL_PAYMENT_RECORD_INVALID',
    })
  })

  it.each([
    [{ pageSize: 0 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_PAGE_SIZE'],
    [{ pageSize: 1_001 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_PAGE_SIZE'],
    [{ maxPages: 0 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_PAGES'],
    [{ maxPages: 1_001 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_PAGES'],
    [{ maxRecords: 0 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_RECORDS'],
    [{ maxRecords: 100_001 }, 'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_RECORDS'],
  ])('rejects unsafe pagination bounds before source preparation', (change, code) => {
    expect(() =>
      createExternalOperationalFinanceReaders({
        paymentSources: [],
        advertisingSpendSources: [],
        ...change,
      })
    ).toThrowError(expect.objectContaining({ code }))
  })
})
