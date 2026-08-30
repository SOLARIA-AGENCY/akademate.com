import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, authMock, brandingMock, stripeCreate } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  authMock: vi.fn(),
  brandingMock: vi.fn(),
  stripeCreate: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMock) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/api/leads/_lib/auth', () => ({ getAuthenticatedUserContext: authMock }))
vi.mock('@/app/lib/server/tenant-host-branding', () => ({
  getTenantHostBranding: brandingMock,
}))
vi.mock('@/app/lib/offers/learner-stripe', () => ({
  createLearnerStripeClient: vi.fn(() => ({
    checkout: { sessions: { create: stripeCreate } },
  })),
  constructLearnerWebhookEvent: vi.fn(),
}))

import { GET, POST } from '../route'
import { PATCH } from '../[id]/route'
import { POST as CHECKOUT } from '../[id]/checkout/route'
import { encryptSecret } from '@/src/domain/tenant-learner-stripe'

const tenantId = 7
const courseRun = {
  id: 84,
  tenant: tenantId,
  codigo: 'NOR-2026-043',
  max_students: 2,
  current_enrollments: 0,
  price_snapshot: 49,
  course: { name: 'Taller de yoga' },
}

function offerDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 11,
    tenant: tenantId,
    title: 'Taller de yoga',
    public_slug: 'taller-de-yoga-nor-2026-043',
    activity_kind: 'course_run',
    checkout_enabled: false,
    amount_cents: 4900,
    currency: 'eur',
    capacity: 2,
    seats_taken: 0,
    waitlist_enabled: true,
    source_type: 'course_run',
    source_course_run: 84,
    seat_holds: [],
    ...overrides,
  }
}

describe('activity offers admin + checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId: 1, tenantId, role: 'gestor' })
    brandingMock.mockResolvedValue({ tenantId: String(tenantId), origin: 'http://localhost:3002' })
    payloadMock.find.mockResolvedValue({ docs: [] })
    payloadMock.create.mockImplementation(async ({ data }: any) => ({ id: 11, ...data }))
    payloadMock.update.mockImplementation(async ({ data, id }: any) => ({ id, ...data }))
    process.env.STRIPE_SECRET_KEY = 'sk_test_platform_billing'
  })

  it('generates a default-off offer from a convocatoria', async () => {
    payloadMock.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [courseRun] })
      .mockResolvedValueOnce({ docs: [] })

    const res = await POST(new NextRequest('http://localhost/api/offers', {
      method: 'POST',
      body: JSON.stringify({ courseRunId: 84 }),
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.offer.checkoutEnabled).toBe(false)
    expect(body.data.offer.sourceType).toBe('course_run')
    expect(body.data.offer.publicPath).toBe('/p/ofertas/taller-de-yoga-nor-2026-043')
  })

  it('refuses to publish checkout when Stripe is disconnected', async () => {
    payloadMock.findByID.mockResolvedValueOnce(offerDoc())
    payloadMock.find.mockResolvedValueOnce({ docs: [] })

    const res = await PATCH(new NextRequest('http://localhost/api/offers/11', {
      method: 'PATCH',
      body: JSON.stringify({ checkoutEnabled: true }),
    }), { params: Promise.resolve({ id: '11' }) })
    const body = await res.json()
    expect(res.status).toBe(409)
    expect(body.code).toBe('stripe_disconnected')
  })

  it('rejects checkout when the offer is off or the last seat is held', async () => {
    payloadMock.findByID.mockResolvedValue(offerDoc())
    payloadMock.find.mockResolvedValue({ docs: [] })
    const off = await CHECKOUT(new NextRequest('http://localhost/api/offers/11/checkout', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@test.com', gdprConsent: true }),
    }), { params: Promise.resolve({ id: '11' }) })
    expect(off.status).toBe(409)

    payloadMock.findByID.mockResolvedValue(offerDoc({
      checkout_enabled: true,
      capacity: 1,
      seats_taken: 0,
      seat_holds: [{ id: 'hold_1', status: 'held', expiresAt: '2099-01-01T00:00:00.000Z' }],
    }))
    payloadMock.find.mockResolvedValue({
      docs: [{
        tenant: tenantId,
        status: 'connected',
        publishable_key: 'pk_test_x',
        secret_ciphertext: encryptSecret('rk_test_learner'),
        webhook_secret_ciphertext: '',
        secret_last4: 'ner',
      }],
    })
    const soldOut = await CHECKOUT(new NextRequest('http://localhost/api/offers/11/checkout', {
      method: 'POST',
      body: JSON.stringify({ email: 'b@test.com', gdprConsent: true }),
    }), { params: Promise.resolve({ id: '11' }) })
    const soldOutBody = await soldOut.json()
    expect(soldOut.status).toBe(409)
    expect(soldOutBody.code).toBe('sold_out')
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it('creates a hosted checkout session with the tenant key, not platform billing', async () => {
    stripeCreate.mockResolvedValueOnce({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/cs_test_1' })
    payloadMock.findByID.mockResolvedValue(offerDoc({ checkout_enabled: true }))
    payloadMock.find.mockResolvedValue({
      docs: [{
        tenant: tenantId,
        status: 'connected',
        publishable_key: 'pk_test_x',
        secret_ciphertext: encryptSecret('rk_test_learner'),
        webhook_secret_ciphertext: encryptSecret('whsec_abc'),
        secret_last4: 'ner',
      }],
    })

    const res = await CHECKOUT(new NextRequest('http://localhost/api/offers/11/checkout', {
      method: 'POST',
      body: JSON.stringify({ email: 'pago@test.com', gdprConsent: true }),
    }), { params: Promise.resolve({ id: '11' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.url).toContain('checkout.stripe.com')
    expect(stripeCreate).toHaveBeenCalled()
    const session = stripeCreate.mock.calls[0][0]
    expect(session.mode).toBe('payment')
    expect(session.metadata.source).toBe('activity-offer')
  })

  it('GET returns stripe gate and existing offer for a convocatoria', async () => {
    payloadMock.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [offerDoc()] })
    const res = await GET(new NextRequest('http://localhost/api/offers?courseRunId=84'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.stripe.connected).toBe(false)
    expect(body.data.offer.checkoutEnabled).toBe(false)
  })
})
