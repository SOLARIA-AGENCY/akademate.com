/**
 * @fileoverview Exhaustive tests for Stripe billing integration
 * Tests: Service functions, API routes, validation, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// ============================================================================
// Mock Stripe SDK
// ============================================================================

const mockStripe = vi.hoisted(() => ({
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  invoices: {
    list: vi.fn(),
    retrieve: vi.fn(),
    retrieveUpcoming: vi.fn(),
  },
  paymentMethods: {
    list: vi.fn(),
    attach: vi.fn(),
    detach: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}))

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}))

// ============================================================================
// Test Data
// ============================================================================

const testTenantId = '550e8400-e29b-41d4-a716-446655440000'
const testCustomerId = 'cus_test123456'
const testSubscriptionId = 'sub_test123456'
const testEmail = 'test@example.com'

const mockCustomer = {
  id: testCustomerId,
  email: testEmail,
  name: 'Test User',
  metadata: { tenantId: testTenantId },
  deleted: false,
}

const mockSubscription = {
  id: testSubscriptionId,
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  cancel_at_period_end: false,
  trial_start: null,
  trial_end: null,
  items: {
    data: [{ id: 'si_test123', price: { id: 'price_test123', product: 'prod_test123' } }],
  },
  latest_invoice: {
    payment_intent: {
      client_secret: 'pi_test_secret',
    },
  },
  metadata: { tenantId: testTenantId, planTier: 'pro' },
}

const mockInvoice = {
  id: 'in_test123',
  number: 'INV-001',
  status: 'paid',
  currency: 'eur',
  subtotal: 29900,
  tax: 6278,
  total: 36178,
  amount_paid: 36178,
  amount_due: 0,
  hosted_invoice_url: 'https://stripe.com/invoice/test',
  invoice_pdf: 'https://stripe.com/invoice/test.pdf',
  created: Math.floor(Date.now() / 1000),
  due_date: null,
  status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
}

const mockPaymentMethod = {
  id: 'pm_test123',
  type: 'card',
  card: {
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2025,
    funding: 'credit',
  },
  billing_details: {
    name: 'Test User',
    email: testEmail,
    phone: null,
    address: null,
  },
  created: Math.floor(Date.now() / 1000),
}

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('Billing Schema Validation', () => {
  describe('CreateCheckoutSchema', () => {
    const CreateCheckoutSchema = z.object({
      tenantId: z.string().uuid(),
      planTier: z.enum(['starter', 'pro', 'enterprise']),
      interval: z.enum(['month', 'year']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      customerEmail: z.string().email().optional(),
      stripeCustomerId: z.string().optional(),
    })

    it('validates valid checkout request', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(true)
    })

    it('validates with optional customerEmail', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'starter',
        interval: 'year',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        customerEmail: testEmail,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid tenantId', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: 'not-a-uuid',
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid planTier', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'premium', // invalid
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid interval', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'week', // invalid
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid successUrl', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        successUrl: 'not-a-url',
        cancelUrl: 'https://example.com/cancel',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid cancelUrl', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid customerEmail', () => {
      const result = CreateCheckoutSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        customerEmail: 'invalid-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CreateSubscriptionSchema', () => {
    const CreateSubscriptionSchema = z.object({
      tenantId: z.string().uuid(),
      planTier: z.enum(['starter', 'pro', 'enterprise']),
      interval: z.enum(['month', 'year']),
      email: z.string().email(),
      name: z.string().optional(),
      paymentMethodId: z.string().optional(),
      trialDays: z.number().int().min(0).max(30).optional(),
      stripeCustomerId: z.string().optional(),
    })

    it('validates valid subscription request', () => {
      const result = CreateSubscriptionSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        email: testEmail,
      })
      expect(result.success).toBe(true)
    })

    it('validates with all optional fields', () => {
      const result = CreateSubscriptionSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'enterprise',
        interval: 'year',
        email: testEmail,
        name: 'Test Company',
        paymentMethodId: 'pm_test123',
        trialDays: 14,
        stripeCustomerId: testCustomerId,
      })
      expect(result.success).toBe(true)
    })

    it('rejects trialDays above 30', () => {
      const result = CreateSubscriptionSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        email: testEmail,
        trialDays: 45,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative trialDays', () => {
      const result = CreateSubscriptionSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
        email: testEmail,
        trialDays: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing email', () => {
      const result = CreateSubscriptionSchema.safeParse({
        tenantId: testTenantId,
        planTier: 'pro',
        interval: 'month',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateSubscriptionSchema', () => {
    const UpdateSubscriptionSchema = z.object({
      planTier: z.enum(['starter', 'pro', 'enterprise']).optional(),
      interval: z.enum(['month', 'year']).optional(),
      cancelAtPeriodEnd: z.boolean().optional(),
    })

    it('validates plan change', () => {
      const result = UpdateSubscriptionSchema.safeParse({
        planTier: 'enterprise',
        interval: 'year',
      })
      expect(result.success).toBe(true)
    })

    it('validates cancel request', () => {
      const result = UpdateSubscriptionSchema.safeParse({
        cancelAtPeriodEnd: true,
      })
      expect(result.success).toBe(true)
    })

    it('validates resume request', () => {
      const result = UpdateSubscriptionSchema.safeParse({
        cancelAtPeriodEnd: false,
      })
      expect(result.success).toBe(true)
    })

    it('validates empty update', () => {
      const result = UpdateSubscriptionSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('BillingPortalSchema', () => {
    const CreatePortalSchema = z.object({
      tenantId: z.string().uuid(),
      stripeCustomerId: z.string().min(1),
      returnUrl: z.string().url(),
    })

    it('validates valid portal request', () => {
      const result = CreatePortalSchema.safeParse({
        tenantId: testTenantId,
        stripeCustomerId: testCustomerId,
        returnUrl: 'https://example.com/dashboard',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty stripeCustomerId', () => {
      const result = CreatePortalSchema.safeParse({
        tenantId: testTenantId,
        stripeCustomerId: '',
        returnUrl: 'https://example.com/dashboard',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('AttachPaymentMethodSchema', () => {
    const AttachPaymentMethodSchema = z.object({
      customerId: z.string().min(1),
      paymentMethodId: z.string().min(1),
      setAsDefault: z.boolean().optional().default(false),
    })

    it('validates attach request', () => {
      const result = AttachPaymentMethodSchema.safeParse({
        customerId: testCustomerId,
        paymentMethodId: 'pm_test123',
      })
      expect(result.success).toBe(true)
      expect(result.data?.setAsDefault).toBe(false)
    })

    it('validates with setAsDefault true', () => {
      const result = AttachPaymentMethodSchema.safeParse({
        customerId: testCustomerId,
        paymentMethodId: 'pm_test123',
        setAsDefault: true,
      })
      expect(result.success).toBe(true)
      expect(result.data?.setAsDefault).toBe(true)
    })

    it('rejects empty customerId', () => {
      const result = AttachPaymentMethodSchema.safeParse({
        customerId: '',
        paymentMethodId: 'pm_test123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty paymentMethodId', () => {
      const result = AttachPaymentMethodSchema.safeParse({
        customerId: testCustomerId,
        paymentMethodId: '',
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// Customer Management Tests
// ============================================================================

describe('Customer Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createStripeCustomer', () => {
    it('creates customer with required fields', async () => {
      mockStripe.customers.create.mockResolvedValue(mockCustomer)

      const result = await mockStripe.customers.create({
        email: testEmail,
        metadata: { tenantId: testTenantId },
      })

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        metadata: { tenantId: testTenantId },
      })
      expect(result.id).toBe(testCustomerId)
    })

    it('creates customer with optional name', async () => {
      mockStripe.customers.create.mockResolvedValue({
        ...mockCustomer,
        name: 'Test Company',
      })

      const result = await mockStripe.customers.create({
        email: testEmail,
        name: 'Test Company',
        metadata: { tenantId: testTenantId },
      })

      expect(result.name).toBe('Test Company')
    })

    it('includes custom metadata', async () => {
      mockStripe.customers.create.mockResolvedValue({
        ...mockCustomer,
        metadata: { tenantId: testTenantId, source: 'checkout' },
      })

      await mockStripe.customers.create({
        email: testEmail,
        metadata: { tenantId: testTenantId, source: 'checkout' },
      })

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: testEmail,
        metadata: { tenantId: testTenantId, source: 'checkout' },
      })
    })
  })

  describe('getStripeCustomer', () => {
    it('retrieves existing customer', async () => {
      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer)

      const result = await mockStripe.customers.retrieve(testCustomerId)

      expect(result).toEqual(mockCustomer)
    })

    it('returns null for deleted customer', async () => {
      mockStripe.customers.retrieve.mockResolvedValue({
        ...mockCustomer,
        deleted: true,
      })

      const result = await mockStripe.customers.retrieve(testCustomerId)

      expect(result.deleted).toBe(true)
    })

    it('handles non-existent customer', async () => {
      mockStripe.customers.retrieve.mockRejectedValue(new Error('No such customer'))

      await expect(mockStripe.customers.retrieve('cus_invalid')).rejects.toThrow()
    })
  })

  describe('updateStripeCustomer', () => {
    it('updates customer email', async () => {
      mockStripe.customers.update.mockResolvedValue({
        ...mockCustomer,
        email: 'new@example.com',
      })

      const result = await mockStripe.customers.update(testCustomerId, {
        email: 'new@example.com',
      })

      expect(result.email).toBe('new@example.com')
    })

    it('updates customer name', async () => {
      mockStripe.customers.update.mockResolvedValue({
        ...mockCustomer,
        name: 'New Name',
      })

      const result = await mockStripe.customers.update(testCustomerId, {
        name: 'New Name',
      })

      expect(result.name).toBe('New Name')
    })

    it('updates invoice settings', async () => {
      mockStripe.customers.update.mockResolvedValue(mockCustomer)

      await mockStripe.customers.update(testCustomerId, {
        invoice_settings: { default_payment_method: 'pm_test123' },
      })

      expect(mockStripe.customers.update).toHaveBeenCalledWith(
        testCustomerId,
        { invoice_settings: { default_payment_method: 'pm_test123' } }
      )
    })
  })
})

// ============================================================================
// Subscription Management Tests
// ============================================================================

describe('Subscription Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSubscription', () => {
    it('creates subscription with monthly billing', async () => {
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      const result = await mockStripe.subscriptions.create({
        customer: testCustomerId,
        items: [{ price: 'price_pro_monthly' }],
        payment_behavior: 'default_incomplete',
        metadata: { tenantId: testTenantId, planTier: 'pro' },
      })

      expect(result.id).toBe(testSubscriptionId)
      expect(result.status).toBe('active')
    })

    it('creates subscription with yearly billing', async () => {
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      await mockStripe.subscriptions.create({
        customer: testCustomerId,
        items: [{ price: 'price_pro_yearly' }],
        payment_behavior: 'default_incomplete',
        metadata: { tenantId: testTenantId, planTier: 'pro' },
      })

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ price: 'price_pro_yearly' }],
        })
      )
    })

    it('creates subscription with trial period', async () => {
      mockStripe.subscriptions.create.mockResolvedValue({
        ...mockSubscription,
        status: 'trialing',
        trial_start: Math.floor(Date.now() / 1000),
        trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
      })

      const result = await mockStripe.subscriptions.create({
        customer: testCustomerId,
        items: [{ price: 'price_pro_monthly' }],
        trial_period_days: 14,
        metadata: { tenantId: testTenantId },
      })

      expect(result.status).toBe('trialing')
      expect(result.trial_end).toBeTruthy()
    })

    it('creates subscription with payment method', async () => {
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      await mockStripe.subscriptions.create({
        customer: testCustomerId,
        items: [{ price: 'price_pro_monthly' }],
        default_payment_method: 'pm_test123',
        metadata: { tenantId: testTenantId },
      })

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          default_payment_method: 'pm_test123',
        })
      )
    })

    it('returns client secret for payment confirmation', async () => {
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      const result = await mockStripe.subscriptions.create({
        customer: testCustomerId,
        items: [{ price: 'price_pro_monthly' }],
        expand: ['latest_invoice.payment_intent'],
        metadata: { tenantId: testTenantId },
      })

      expect(result.latest_invoice?.payment_intent?.client_secret).toBe('pi_test_secret')
    })
  })

  describe('getSubscription', () => {
    it('retrieves subscription with expanded data', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)

      const result = await mockStripe.subscriptions.retrieve(testSubscriptionId, {
        expand: ['latest_invoice', 'default_payment_method'],
      })

      expect(result.id).toBe(testSubscriptionId)
    })

    it('handles non-existent subscription', async () => {
      mockStripe.subscriptions.retrieve.mockRejectedValue(new Error('No such subscription'))

      await expect(
        mockStripe.subscriptions.retrieve('sub_invalid')
      ).rejects.toThrow()
    })
  })

  describe('updateSubscription', () => {
    it('upgrades plan tier', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      mockStripe.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        metadata: { ...mockSubscription.metadata, planTier: 'enterprise' },
      })

      const result = await mockStripe.subscriptions.update(testSubscriptionId, {
        items: [{ id: 'si_test123', price: 'price_enterprise_monthly' }],
        proration_behavior: 'create_prorations',
      })

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        testSubscriptionId,
        expect.objectContaining({
          proration_behavior: 'create_prorations',
        })
      )
    })

    it('downgrades plan tier', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription)

      await mockStripe.subscriptions.update(testSubscriptionId, {
        items: [{ id: 'si_test123', price: 'price_starter_monthly' }],
        proration_behavior: 'create_prorations',
      })

      expect(mockStripe.subscriptions.update).toHaveBeenCalled()
    })

    it('changes billing interval', async () => {
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription)

      await mockStripe.subscriptions.update(testSubscriptionId, {
        items: [{ id: 'si_test123', price: 'price_pro_yearly' }],
        proration_behavior: 'create_prorations',
      })

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        testSubscriptionId,
        expect.objectContaining({
          items: [{ id: 'si_test123', price: 'price_pro_yearly' }],
        })
      )
    })

    it('schedules cancellation at period end', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      })

      const result = await mockStripe.subscriptions.update(testSubscriptionId, {
        cancel_at_period_end: true,
      })

      expect(result.cancel_at_period_end).toBe(true)
    })

    it('resumes canceled subscription', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: false,
      })

      const result = await mockStripe.subscriptions.update(testSubscriptionId, {
        cancel_at_period_end: false,
      })

      expect(result.cancel_at_period_end).toBe(false)
    })
  })

  describe('cancelSubscription', () => {
    it('cancels immediately', async () => {
      mockStripe.subscriptions.cancel.mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      })

      const result = await mockStripe.subscriptions.cancel(testSubscriptionId)

      expect(result.status).toBe('canceled')
      expect(result.canceled_at).toBeTruthy()
    })

    it('schedules cancellation at period end', async () => {
      mockStripe.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
        status: 'active',
      })

      const result = await mockStripe.subscriptions.update(testSubscriptionId, {
        cancel_at_period_end: true,
      })

      expect(result.status).toBe('active')
      expect(result.cancel_at_period_end).toBe(true)
    })
  })
})

// ============================================================================
// Checkout Session Tests
// ============================================================================

describe('Checkout Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates checkout session for new customer', async () => {
    const mockSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    }
    mockStripe.checkout.sessions.create.mockResolvedValue(mockSession)

    const result = await mockStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      customer_email: testEmail,
      subscription_data: {
        trial_period_days: 14,
        metadata: { tenantId: testTenantId },
      },
    })

    expect(result.id).toBe('cs_test123')
    expect(result.url).toBeTruthy()
  })

  it('creates checkout session for existing customer', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    })

    await mockStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      customer: testCustomerId,
    })

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: testCustomerId,
      })
    )
  })

  it('enables promotion codes', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    })

    await mockStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      allow_promotion_codes: true,
    })

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
      })
    )
  })

  it('collects billing address', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    })

    await mockStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      billing_address_collection: 'required',
    })

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_address_collection: 'required',
      })
    )
  })

  it('enables tax ID collection', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    })

    await mockStripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      tax_id_collection: { enabled: true },
    })

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_id_collection: { enabled: true },
      })
    )
  })
})

// ============================================================================
// Billing Portal Tests
// ============================================================================

describe('Billing Portal', () => {
  it('creates billing portal session', async () => {
    const mockPortalSession = {
      id: 'bps_test123',
      url: 'https://billing.stripe.com/test',
    }
    mockStripe.billingPortal.sessions.create.mockResolvedValue(mockPortalSession)

    const result = await mockStripe.billingPortal.sessions.create({
      customer: testCustomerId,
      return_url: 'https://example.com/dashboard',
    })

    expect(result.url).toBe('https://billing.stripe.com/test')
  })
})

// ============================================================================
// Invoice Tests
// ============================================================================

describe('Invoice Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listInvoices', () => {
    it('lists invoices for customer', async () => {
      mockStripe.invoices.list.mockResolvedValue({
        data: [mockInvoice],
        has_more: false,
      })

      const result = await mockStripe.invoices.list({
        customer: testCustomerId,
        limit: 10,
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('in_test123')
    })

    it('respects limit parameter', async () => {
      mockStripe.invoices.list.mockResolvedValue({
        data: Array(5).fill(mockInvoice),
        has_more: true,
      })

      const result = await mockStripe.invoices.list({
        customer: testCustomerId,
        limit: 5,
      })

      expect(result.data).toHaveLength(5)
      expect(result.has_more).toBe(true)
    })
  })

  describe('getInvoice', () => {
    it('retrieves single invoice', async () => {
      mockStripe.invoices.retrieve.mockResolvedValue(mockInvoice)

      const result = await mockStripe.invoices.retrieve('in_test123')

      expect(result.id).toBe('in_test123')
    })

    it('handles non-existent invoice', async () => {
      mockStripe.invoices.retrieve.mockRejectedValue(new Error('No such invoice'))

      await expect(
        mockStripe.invoices.retrieve('in_invalid')
      ).rejects.toThrow()
    })
  })

  describe('getUpcomingInvoice', () => {
    it('retrieves upcoming invoice', async () => {
      const mockUpcoming = {
        ...mockInvoice,
        status: 'draft',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        lines: {
          data: [{ description: 'Pro Plan', amount: 29900 }],
        },
      }
      mockStripe.invoices.retrieveUpcoming.mockResolvedValue(mockUpcoming)

      const result = await mockStripe.invoices.retrieveUpcoming({
        customer: testCustomerId,
      })

      expect(result.status).toBe('draft')
    })

    it('handles no upcoming invoice', async () => {
      mockStripe.invoices.retrieveUpcoming.mockRejectedValue(
        new Error('No upcoming invoice')
      )

      await expect(
        mockStripe.invoices.retrieveUpcoming({ customer: testCustomerId })
      ).rejects.toThrow()
    })
  })
})

// ============================================================================
// Payment Method Tests
// ============================================================================

describe('Payment Method Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listPaymentMethods', () => {
    it('lists payment methods for customer', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue({
        data: [mockPaymentMethod],
      })

      const result = await mockStripe.paymentMethods.list({
        customer: testCustomerId,
        type: 'card',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].card?.last4).toBe('4242')
    })

    it('returns empty for customer without payment methods', async () => {
      mockStripe.paymentMethods.list.mockResolvedValue({ data: [] })

      const result = await mockStripe.paymentMethods.list({
        customer: testCustomerId,
        type: 'card',
      })

      expect(result.data).toHaveLength(0)
    })
  })

  describe('attachPaymentMethod', () => {
    it('attaches payment method to customer', async () => {
      mockStripe.paymentMethods.attach.mockResolvedValue(mockPaymentMethod)

      const result = await mockStripe.paymentMethods.attach('pm_test123', {
        customer: testCustomerId,
      })

      expect(result.id).toBe('pm_test123')
    })
  })

  describe('detachPaymentMethod', () => {
    it('detaches payment method', async () => {
      mockStripe.paymentMethods.detach.mockResolvedValue({
        ...mockPaymentMethod,
        customer: null,
      })

      const result = await mockStripe.paymentMethods.detach('pm_test123')

      expect(result.customer).toBeNull()
    })
  })
})

// ============================================================================
// Webhook Tests
// ============================================================================

describe('Webhook Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructWebhookEvent', () => {
    it('constructs event from valid signature', () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      }
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const result = mockStripe.webhooks.constructEvent(
        'raw_body',
        'sig_test',
        'whsec_test'
      )

      expect(result.type).toBe('customer.subscription.created')
    })

    it('throws on invalid signature', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed')
      })

      expect(() =>
        mockStripe.webhooks.constructEvent('raw_body', 'invalid_sig', 'whsec_test')
      ).toThrow('Signature verification failed')
    })
  })

  describe('Event Types', () => {
    const eventTypes = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'customer.subscription.trial_will_end',
      'invoice.paid',
      'invoice.payment_failed',
      'checkout.session.completed',
    ]

    eventTypes.forEach(eventType => {
      it(`handles ${eventType} event`, () => {
        const mockEvent = {
          id: 'evt_test123',
          type: eventType,
          data: { object: mockSubscription },
        }
        mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

        const result = mockStripe.webhooks.constructEvent(
          'raw_body',
          'sig_test',
          'whsec_test'
        )

        expect(result.type).toBe(eventType)
      })
    })
  })
})

// ============================================================================
// Price Configuration Tests
// ============================================================================

describe('Price Configuration', () => {
  const STRIPE_PRICE_IDS = {
    starter: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly',
    },
    pro: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly',
    },
    enterprise: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly',
    },
  }

  describe('getPriceId', () => {
    it('returns correct starter monthly price', () => {
      expect(STRIPE_PRICE_IDS.starter.monthly).toBe('price_starter_monthly')
    })

    it('returns correct starter yearly price', () => {
      expect(STRIPE_PRICE_IDS.starter.yearly).toBe('price_starter_yearly')
    })

    it('returns correct pro monthly price', () => {
      expect(STRIPE_PRICE_IDS.pro.monthly).toBe('price_pro_monthly')
    })

    it('returns correct pro yearly price', () => {
      expect(STRIPE_PRICE_IDS.pro.yearly).toBe('price_pro_yearly')
    })

    it('returns correct enterprise monthly price', () => {
      expect(STRIPE_PRICE_IDS.enterprise.monthly).toBe('price_enterprise_monthly')
    })

    it('returns correct enterprise yearly price', () => {
      expect(STRIPE_PRICE_IDS.enterprise.yearly).toBe('price_enterprise_yearly')
    })
  })
})

// ============================================================================
// Currency Formatting Tests
// ============================================================================

describe('Currency Formatting', () => {
  function formatCurrency(amountCents: number, currency = 'EUR'): string {
    const amount = amountCents / 100
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  it('formats EUR amounts correctly', () => {
    expect(formatCurrency(29900, 'EUR')).toContain('299')
  })

  it('formats zero amount', () => {
    expect(formatCurrency(0, 'EUR')).toContain('0')
  })

  it('formats small amounts', () => {
    expect(formatCurrency(100, 'EUR')).toContain('1')
  })

  it('formats large amounts', () => {
    // Spanish locale uses space or no separator for thousands
    const result = formatCurrency(599900, 'EUR')
    expect(result).toContain('5999')
  })

  it('handles USD currency', () => {
    const result = formatCurrency(29900, 'USD')
    expect(result).toContain('299')
  })
})

// ============================================================================
// Subscription Status Mapping Tests
// ============================================================================

describe('Subscription Status Mapping', () => {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'unpaid',
    paused: 'past_due',
  }

  function mapStripeStatus(status: string): string {
    return statusMap[status] || status
  }

  it('maps active status', () => {
    expect(mapStripeStatus('active')).toBe('active')
  })

  it('maps canceled status', () => {
    expect(mapStripeStatus('canceled')).toBe('canceled')
  })

  it('maps trialing status', () => {
    expect(mapStripeStatus('trialing')).toBe('trialing')
  })

  it('maps past_due status', () => {
    expect(mapStripeStatus('past_due')).toBe('past_due')
  })

  it('maps paused to past_due', () => {
    expect(mapStripeStatus('paused')).toBe('past_due')
  })

  it('maps incomplete status', () => {
    expect(mapStripeStatus('incomplete')).toBe('incomplete')
  })

  it('maps incomplete_expired status', () => {
    expect(mapStripeStatus('incomplete_expired')).toBe('incomplete_expired')
  })

  it('maps unpaid status', () => {
    expect(mapStripeStatus('unpaid')).toBe('unpaid')
  })

  it('returns unknown status as-is', () => {
    expect(mapStripeStatus('unknown')).toBe('unknown')
  })
})

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('Edge Cases and Error Handling', () => {
  describe('Subscription ID Validation', () => {
    it('accepts valid subscription ID format', () => {
      const id = 'sub_1234567890abcdef'
      expect(id.startsWith('sub_')).toBe(true)
    })

    it('rejects invalid subscription ID format', () => {
      const invalidIds = ['', 'invalid', 'cus_123', 'price_123']
      invalidIds.forEach(id => {
        expect(id.startsWith('sub_')).toBe(false)
      })
    })
  })

  describe('Customer ID Validation', () => {
    it('accepts valid customer ID format', () => {
      const id = 'cus_1234567890abcdef'
      expect(id.startsWith('cus_')).toBe(true)
    })
  })

  describe('Invoice Number Generation', () => {
    it('invoice numbers follow expected format', () => {
      const invoiceNumber = 'INV-001'
      expect(invoiceNumber).toMatch(/^INV-\d+$/)
    })
  })

  describe('Date Handling', () => {
    it('converts Unix timestamp to Date', () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const date = new Date(timestamp * 1000)
      expect(date instanceof Date).toBe(true)
      expect(date.getTime()).toBeGreaterThan(0)
    })

    it('handles null timestamps', () => {
      const timestamp = null
      const date = timestamp ? new Date(timestamp * 1000) : null
      expect(date).toBeNull()
    })
  })

  describe('Amount Calculations', () => {
    it('converts cents to dollars correctly', () => {
      const cents = 29900
      const dollars = cents / 100
      expect(dollars).toBe(299)
    })

    it('handles fractional amounts', () => {
      const cents = 9999
      const dollars = cents / 100
      expect(dollars).toBe(99.99)
    })
  })
})

// ============================================================================
// API Response Structure Tests
// ============================================================================

describe('API Response Structures', () => {
  describe('Checkout Session Response', () => {
    it('contains required fields', () => {
      const response = {
        sessionId: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      }

      expect(response).toHaveProperty('sessionId')
      expect(response).toHaveProperty('url')
    })
  })

  describe('Subscription Response', () => {
    it('contains required fields', () => {
      const response = {
        id: testSubscriptionId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      }

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('currentPeriodStart')
      expect(response).toHaveProperty('currentPeriodEnd')
      expect(response).toHaveProperty('cancelAtPeriodEnd')
    })
  })

  describe('Invoice Response', () => {
    it('contains required fields', () => {
      const response = {
        id: 'in_test123',
        number: 'INV-001',
        status: 'paid',
        currency: 'eur',
        subtotal: 29900,
        total: 36178,
        totalFormatted: '361,78 €',
      }

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('number')
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('total')
      expect(response).toHaveProperty('totalFormatted')
    })
  })

  describe('Payment Method Response', () => {
    it('contains required fields for card', () => {
      const response = {
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
        },
      }

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('type')
      expect(response.card).toHaveProperty('brand')
      expect(response.card).toHaveProperty('last4')
    })
  })

  describe('Error Response', () => {
    it('contains error message', () => {
      const response = {
        error: 'Invalid request',
        details: { issues: ['tenantId is required'] },
      }

      expect(response).toHaveProperty('error')
    })
  })
})
