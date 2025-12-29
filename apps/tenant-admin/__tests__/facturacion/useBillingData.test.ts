import { renderHook, waitFor } from '@testing-library/react'
import { useBillingData } from '../../@payload-config/hooks/useBillingData'
import type { Subscription, Invoice, PaymentMethod } from '../../../packages/types/src/index'

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn((url: string) => {
    const mockData = {
      '/api/billing/subscriptions': {
        data: mockSubscription,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      },
      '/api/billing/invoices': {
        data: mockInvoices,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      },
      '/api/billing/payment-methods': {
        data: mockPaymentMethods,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      },
    }
    return mockData[url] || { data: null, error: null, isLoading: false, mutate: jest.fn() }
  }),
}))

const mockSubscription: Subscription = {
  id: '1',
  tenantId: 'tenant-1',
  plan: 'pro',
  status: 'active',
  stripeSubscriptionId: 'sub_123',
  stripeCustomerId: 'cus_123',
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    subscriptionId: '1',
    stripeInvoiceId: 'in_123',
    number: 'INV-001',
    status: 'paid',
    currency: 'EUR',
    subtotal: 29900,
    tax: 0,
    total: 29900,
    amountPaid: 29900,
    amountDue: 0,
    dueDate: null,
    paidAt: new Date('2024-12-01'),
    hostedInvoiceUrl: 'https://invoice.stripe.com/i/123',
    invoicePdfUrl: 'https://invoice.stripe.com/i/123/pdf',
    lineItems: [],
    metadata: {},
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
  },
]

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    stripePaymentMethodId: 'pm_123',
    type: 'card',
    isDefault: true,
    card: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
    },
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
  },
]

describe('useBillingData', () => {
  it('returns subscription data', async () => {
    const { result } = renderHook(() => useBillingData())

    await waitFor(() => {
      expect(result.current.subscription).toEqual(mockSubscription)
      expect(result.current.subscriptionLoading).toBe(false)
      expect(result.current.subscriptionError).toBe(null)
    })
  })

  it('returns invoices data', async () => {
    const { result } = renderHook(() => useBillingData())

    await waitFor(() => {
      expect(result.current.invoices).toEqual(mockInvoices)
      expect(result.current.invoicesLoading).toBe(false)
      expect(result.current.invoicesError).toBe(null)
    })
  })

  it('returns payment methods data', async () => {
    const { result } = renderHook(() => useBillingData())

    await waitFor(() => {
      expect(result.current.paymentMethods).toEqual(mockPaymentMethods)
      expect(result.current.paymentMethodsLoading).toBe(false)
      expect(result.current.paymentMethodsError).toBe(null)
    })
  })

  it('provides mutate function', async () => {
    const { result } = renderHook(() => useBillingData())

    await waitFor(() => {
      expect(typeof result.current.mutate).toBe('function')
    })
  })
})
