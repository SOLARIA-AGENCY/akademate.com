import { describe, expect, it } from 'vitest'

import { projectPaidOfferPaymentEvents } from './finance-payment-projection.ts'

const principal = { userId: 1, tenantId: 7, active: true as const, platformRole: 'admin' }

describe('canonical payment projection', () => {
  it('projects each event once and keeps amount mismatches under review', async () => {
    const inserts: unknown[][] = []
    const tx = {
      async unsafe<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
        if (query.includes('FROM paid_offer_payment_events')) {
          return [
            { id: 12, tenant_id: 7, provider: 'stripe', normalized_status: 'succeeded', amount_cents: 1000, currency: 'EUR', order_amount_cents: 1000 },
            { id: 13, tenant_id: 7, provider: 'paypal', normalized_status: 'succeeded', amount_cents: 900, currency: 'EUR', order_amount_cents: 1000 },
          ] as unknown as T[]
        }
        inserts.push(params)
        return [{ id: 'projection-id' }] as unknown as T[]
      },
    }
    const result = await projectPaidOfferPaymentEvents({ tx, principal, afterEventId: null, limit: 100 })
    expect(result).toEqual({ projected: 2, lastEventId: 13 })
    expect(inserts[0]).toEqual([7, 12, 'stripe', 'succeeded', 1000, 'EUR'])
    expect(inserts[1]).toEqual([7, 13, 'paypal', 'requires_review', 900, 'EUR'])
  })

  it('does not read another tenant and clamps an invalid limit', async () => {
    let queryParams: unknown[] = []
    const tx = {
      async unsafe<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
        if (query.includes('FROM paid_offer_payment_events')) queryParams = params
        return [] as T[]
      },
    }
    await expect(projectPaidOfferPaymentEvents({ tx, principal, afterEventId: null, limit: 99999 })).resolves.toEqual({ projected: 0, lastEventId: null })
    expect(queryParams).toEqual([7, 0, 500])
  })

  it('rejects non-finance roles before querying', async () => {
    const tx = { unsafe: async () => { throw new Error('must not query') } }
    await expect(projectPaidOfferPaymentEvents({ tx, principal: { ...principal, platformRole: 'teacher' }, afterEventId: null, limit: 10 })).rejects.toMatchObject({ code: 'finance_forbidden' })
  })
})
