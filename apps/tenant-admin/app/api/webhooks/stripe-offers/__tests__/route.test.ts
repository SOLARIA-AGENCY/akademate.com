import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { encryptSecret } from '@/src/domain/tenant-learner-stripe'

const { payloadMock, constructEvent } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  constructEvent: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMock) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/lib/offers/learner-stripe', () => ({
  createLearnerStripeClient: vi.fn(),
  constructLearnerWebhookEvent: constructEvent,
}))

import { POST } from '../[tenantId]/route'

describe('stripe-offers webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_platform_billing'
    payloadMock.find.mockResolvedValue({
      docs: [{
        tenant: 7,
        status: 'connected',
        publishable_key: 'pk_test_x',
        secret_ciphertext: encryptSecret('rk_test_learner'),
        webhook_secret_ciphertext: encryptSecret('whsec_tenant'),
        secret_last4: 'ner',
      }],
    })
    payloadMock.findByID.mockResolvedValue({
      id: 11,
      tenant: 7,
      title: 'Taller',
      public_slug: 'taller',
      checkout_enabled: true,
      amount_cents: 4900,
      currency: 'eur',
      capacity: 2,
      seats_taken: 0,
      source_type: 'course_run',
      source_course_run: 84,
      seat_holds: [{ id: 'hold_1', sessionId: 'cs_1', status: 'held', expiresAt: '2099-01-01T00:00:00.000Z' }],
    })
    payloadMock.create.mockResolvedValue({ id: 99 })
    payloadMock.update.mockResolvedValue({ id: 11 })
  })

  it('does not import platform billing stripe helpers', () => {
    const source = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '../[tenantId]/route.ts'),
      'utf8',
    )
    expect(source).not.toContain("from '@/lib/stripe'")
    expect(source).not.toContain("from '@payload-config/lib/stripe'")
    expect(source).not.toContain('STRIPE_SECRET_KEY')
    expect(source).not.toContain('getStripeClient')
  })

  it('confirms a hold and creates a paid lead without using the platform key', async () => {
    constructEvent.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          customer_details: { email: 'pago@test.com', name: 'Ana' },
          metadata: { offerId: '11', holdId: 'hold_1', source: 'activity-offer' },
        },
      },
    })

    const res = await POST(new NextRequest('http://localhost/api/webhooks/stripe-offers/7', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{"id":"evt_1"}',
    }), { params: Promise.resolve({ tenantId: '7' }) })

    expect(res.status).toBe(200)
    expect(constructEvent).toHaveBeenCalledWith('{"id":"evt_1"}', 'sig_test', 'whsec_tenant')
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'leads',
      data: expect.objectContaining({ source_form: 'offer_checkout', email: 'pago@test.com' }),
    }))
    expect(payloadMock.update).toHaveBeenCalled()
  })
})
