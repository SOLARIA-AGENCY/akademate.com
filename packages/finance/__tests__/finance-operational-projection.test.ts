import { describe, expect, it } from 'vitest'
import { projectOperationalFinanceRecords, type OperationalFinanceProjectionInput } from '../src'

const input: OperationalFinanceProjectionInput = {
  targetTenantId: 'cep',
  targetLegalEntityId: 'entity-sur',
  enrollments: [{ id: 10, tenantId: 'cep', legalEntityId: 'entity-sur', amountPaid: 1250.5 }],
  paymentEvents: [
    {
      id: 100,
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      enrollment: { id: 10 },
      status: 'paid',
      amount: 1250.5,
      currency: 'EUR',
      paidAt: '2026-07-21T15:30:00.000Z',
      transactionReference: 'MATRICULA-100',
    },
  ],
  campaigns: [{ id: 'campaign-1', tenantId: 'cep', legalEntityId: 'entity-sur' }],
  advertisingSpend: [
    {
      id: 'campaign-1:2026-07-21',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campaign: 'campaign-1',
      rangeSince: '2026-07-21',
      rangeUntil: '2026-07-21',
      amount: '500.25',
      currency: 'EUR',
      metricState: 'loaded',
    },
  ],
}

describe('operational finance projection', () => {
  it('projects event-level payments and daily advertising spend deterministically', () => {
    const before = JSON.stringify(input)
    const result = projectOperationalFinanceRecords(input)
    const reordered = projectOperationalFinanceRecords({
      ...input,
      enrollments: [...input.enrollments].reverse(),
      paymentEvents: [...input.paymentEvents].reverse(),
      campaigns: [...input.campaigns].reverse(),
      advertisingSpend: [...input.advertisingSpend].reverse(),
    })

    expect(result).toEqual(reordered)
    expect(result).toEqual({
      mode: 'read_only_operational_projection',
      canWrite: false,
      canApply: false,
      ready: true,
      records: [
        {
          id: 'advertising_spend:campaign-1:2026-07-21',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          source: 'advertising_spend',
          occurredOn: '2026-07-21',
          amount: '500.25',
          currency: 'EUR',
          reference: 'meta:campaign-1:2026-07-21',
        },
        {
          id: 'payment:100',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          source: 'enrollment_payment',
          occurredOn: '2026-07-21',
          amount: '1250.50',
          currency: 'EUR',
          reference: 'MATRICULA-100',
        },
      ],
      issues: [],
      summary: {
        sourceRecords: 2,
        projectedRecords: 2,
        ignoredRecords: 0,
        blockedRecords: 0,
        issues: 0,
      },
    })
    expect(JSON.stringify(input)).toBe(before)
  })

  it('ignores unsettled payments and confirmed zero spend without inventing movements', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      enrollments: [{ ...input.enrollments[0]!, amountPaid: 0 }],
      paymentEvents: [{ ...input.paymentEvents[0]!, status: 'pending' }],
      advertisingSpend: [{ ...input.advertisingSpend[0]!, amount: 0, metricState: 'zero_real' }],
    })

    expect(result).toMatchObject({
      ready: true,
      records: [],
      summary: { sourceRecords: 2, projectedRecords: 0, ignoredRecords: 2, blockedRecords: 0 },
    })
  })

  it('blocks payment events whose enrollment or entity cannot be proven', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      paymentEvents: [
        { ...input.paymentEvents[0]!, id: 'missing-parent', enrollment: 'missing' },
        { ...input.paymentEvents[0]!, id: 'other-entity', legalEntityId: 'entity-norte' },
      ],
      enrollments: [{ ...input.enrollments[0]!, amountPaid: null }],
      advertisingSpend: [],
    })

    expect(result.ready).toBe(false)
    expect(result.records).toEqual([])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'relationship_missing', recordId: 'missing-parent' }),
        expect.objectContaining({ code: 'scope_mismatch', recordId: 'other-entity' }),
      ])
    )
  })

  it('does not invent payment events from an unmatched cumulative enrollment total', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      paymentEvents: [],
      advertisingSpend: [],
    })

    expect(result).toMatchObject({
      ready: false,
      records: [],
      issues: [
        {
          code: 'enrollment_payment_total_mismatch',
          recordType: 'enrollment',
          recordId: '10',
        },
      ],
    })
  })

  it('removes otherwise valid payment events when their sum differs from amount_paid', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      enrollments: [{ ...input.enrollments[0]!, amountPaid: '2000.00' }],
      advertisingSpend: [],
    })

    expect(result.ready).toBe(false)
    expect(result.records).toEqual([])
    expect(result.issues).toContainEqual({
      code: 'enrollment_payment_total_mismatch',
      recordType: 'enrollment',
      recordId: '10',
    })
  })

  it('rejects refunds, multi-day ranges and unavailable Meta metrics', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      enrollments: [{ ...input.enrollments[0]!, amountPaid: null }],
      paymentEvents: [{ ...input.paymentEvents[0]!, status: 'refunded' }],
      advertisingSpend: [
        {
          ...input.advertisingSpend[0]!,
          id: 'multi-day',
          rangeSince: '2026-07-20',
        },
        { ...input.advertisingSpend[0]!, id: 'api-error', metricState: 'api_error' },
      ],
    })

    expect(result.ready).toBe(false)
    expect(result.records).toEqual([])
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'payment_refund_unsupported',
        'advertising_range_not_daily',
        'advertising_metric_unavailable',
      ])
    )
  })

  it('fails closed for malformed money, dates, currency and zero-state contradictions', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      enrollments: [{ ...input.enrollments[0]!, amountPaid: null }],
      paymentEvents: [
        { ...input.paymentEvents[0]!, id: 'bad-money', amount: '12.345' },
        { ...input.paymentEvents[0]!, id: 'bad-date', paidAt: '2026-02-30' },
        { ...input.paymentEvents[0]!, id: 'bad-currency', currency: 'eur' },
      ],
      advertisingSpend: [
        { ...input.advertisingSpend[0]!, id: 'zero-mismatch', metricState: 'zero_real' },
      ],
    })

    expect(result.ready).toBe(false)
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'invalid_amount',
        'invalid_date',
        'invalid_currency',
        'advertising_zero_state_mismatch',
      ])
    )
  })

  it('does not copy unrelated enrollment or campaign data into finance records', () => {
    const result = projectOperationalFinanceRecords({
      ...input,
      enrollments: [{ ...input.enrollments[0]!, studentName: 'private-student-name' } as never],
      campaigns: [{ ...input.campaigns[0]!, campaignName: 'secret-campaign-name' } as never],
    })
    const serialized = JSON.stringify(result.records)

    expect(serialized).not.toContain('private-student-name')
    expect(serialized).not.toContain('secret-campaign-name')
  })

  it('bounds the number of source records before projection', () => {
    expect(() => projectOperationalFinanceRecords({ ...input, maxSourceRecords: 1 })).toThrowError(
      expect.objectContaining({ code: 'FINANCE_OPERATIONAL_PROJECTION_LIMIT_EXCEEDED' })
    )
  })

  it('bounds enrollment and campaign relationships even when there are no movements', () => {
    expect(() =>
      projectOperationalFinanceRecords({
        ...input,
        enrollments: Array.from({ length: 3 }, (_, id) => ({
          id,
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
        })),
        campaigns: [],
        paymentEvents: [],
        advertisingSpend: [],
        maxRelationshipRecords: 2,
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'FINANCE_OPERATIONAL_PROJECTION_RELATIONSHIP_LIMIT_EXCEEDED',
      })
    )
  })

  it('rejects invalid relationship limits before building parent maps', () => {
    expect(() =>
      projectOperationalFinanceRecords({ ...input, maxRelationshipRecords: 0 })
    ).toThrowError(
      expect.objectContaining({
        code: 'FINANCE_OPERATIONAL_PROJECTION_INVALID_RELATIONSHIP_LIMIT',
      })
    )
  })

  it('returns a safe scope error for non-text identifiers', () => {
    expect(() =>
      projectOperationalFinanceRecords({ ...input, targetTenantId: null as never })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_OPERATIONAL_PROJECTION_INVALID_SCOPE' })
    )
  })
})
