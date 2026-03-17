/**
 * @fileoverview Mock Billing Data for Testing
 * Realistic test data for billing components
 */

import type {
  Subscription,
  Invoice,
  PaymentMethod,
  PaymentTransaction,
} from '@payload-config/types/billing'

// ============================================================================
// Mock Subscriptions
// ============================================================================

export const mockSubscriptionActive: Subscription = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  plan: 'pro',
  status: 'active',
  stripeSubscriptionId: 'sub_1234567890',
  stripeCustomerId: 'cus_1234567890',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

export const mockSubscriptionTrialing: Subscription = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  plan: 'starter',
  status: 'trialing',
  stripeSubscriptionId: 'sub_1234567891',
  stripeCustomerId: 'cus_1234567890',
  currentPeriodStart: new Date('2025-01-15'),
  currentPeriodEnd: new Date('2025-02-15'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: new Date('2025-01-15'),
  trialEnd: new Date('2025-01-29'),
  metadata: {},
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
}

export const mockSubscriptionPastDue: Subscription = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  plan: 'pro',
  status: 'past_due',
  stripeSubscriptionId: 'sub_1234567892',
  stripeCustomerId: 'cus_1234567890',
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-15'),
}

export const mockSubscriptionCanceled: Subscription = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  plan: 'starter',
  status: 'canceled',
  stripeSubscriptionId: 'sub_1234567893',
  stripeCustomerId: 'cus_1234567890',
  currentPeriodStart: new Date('2024-11-01'),
  currentPeriodEnd: new Date('2024-12-01'),
  cancelAtPeriodEnd: false,
  canceledAt: new Date('2024-11-15'),
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2024-11-15'),
}

export const mockSubscriptionCancelScheduled: Subscription = {
  id: '123e4567-e89b-12d3-a456-426614174005',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  plan: 'enterprise',
  status: 'active',
  stripeSubscriptionId: 'sub_1234567894',
  stripeCustomerId: 'cus_1234567890',
  currentPeriodStart: new Date('2025-01-01'),
  currentPeriodEnd: new Date('2025-02-01'),
  cancelAtPeriodEnd: true,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
}

// ============================================================================
// Mock Invoices
// ============================================================================

export const mockInvoicePaid: Invoice = {
  id: '123e4567-e89b-12d3-a456-426614174010',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
  stripeInvoiceId: 'in_1234567890',
  number: 'INV-2025-001',
  status: 'paid',
  currency: 'EUR',
  subtotal: 29900,
  tax: 6279,
  total: 36179,
  amountPaid: 36179,
  amountDue: 0,
  dueDate: new Date('2025-01-15'),
  paidAt: new Date('2025-01-10'),
  hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_123',
  invoicePdfUrl: 'https://invoice.stripe.com/i/acct_123/test_123/pdf',
  lineItems: [
    {
      description: 'Plan Pro - Mensual',
      quantity: 1,
      unitAmount: 29900,
      amount: 29900,
    },
  ],
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-10'),
}

export const mockInvoiceOpen: Invoice = {
  id: '123e4567-e89b-12d3-a456-426614174011',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
  stripeInvoiceId: 'in_1234567891',
  number: 'INV-2025-002',
  status: 'open',
  currency: 'EUR',
  subtotal: 29900,
  tax: 6279,
  total: 36179,
  amountPaid: 0,
  amountDue: 36179,
  dueDate: new Date('2025-02-15'),
  paidAt: null,
  hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_124',
  invoicePdfUrl: 'https://invoice.stripe.com/i/acct_123/test_124/pdf',
  lineItems: [
    {
      description: 'Plan Pro - Mensual',
      quantity: 1,
      unitAmount: 29900,
      amount: 29900,
    },
  ],
  metadata: {},
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-02-01'),
}

export const mockInvoiceDraft: Invoice = {
  id: '123e4567-e89b-12d3-a456-426614174012',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
  stripeInvoiceId: 'in_1234567892',
  number: 'DRAFT-2025-003',
  status: 'draft',
  currency: 'EUR',
  subtotal: 29900,
  tax: 6279,
  total: 36179,
  amountPaid: 0,
  amountDue: 36179,
  dueDate: null,
  paidAt: null,
  hostedInvoiceUrl: null,
  invoicePdfUrl: null,
  lineItems: [
    {
      description: 'Plan Pro - Mensual',
      quantity: 1,
      unitAmount: 29900,
      amount: 29900,
    },
  ],
  metadata: {},
  createdAt: new Date('2025-02-28'),
  updatedAt: new Date('2025-02-28'),
}

export const mockInvoiceVoid: Invoice = {
  id: '123e4567-e89b-12d3-a456-426614174013',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
  stripeInvoiceId: 'in_1234567893',
  number: 'INV-2024-999',
  status: 'void',
  currency: 'EUR',
  subtotal: 19900,
  tax: 4179,
  total: 24079,
  amountPaid: 0,
  amountDue: 0,
  dueDate: new Date('2024-12-15'),
  paidAt: null,
  hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_125',
  invoicePdfUrl: 'https://invoice.stripe.com/i/acct_123/test_125/pdf',
  lineItems: [
    {
      description: 'Plan Starter - Mensual',
      quantity: 1,
      unitAmount: 19900,
      amount: 19900,
    },
  ],
  metadata: {},
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-10'),
}

export const mockInvoices: Invoice[] = [
  mockInvoicePaid,
  mockInvoiceOpen,
  mockInvoiceDraft,
  mockInvoiceVoid,
]

// ============================================================================
// Mock Payment Methods
// ============================================================================

export const mockPaymentMethodCard: PaymentMethod = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  stripePaymentMethodId: 'pm_1234567890',
  type: 'card',
  isDefault: true,
  card: {
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2026,
  },
  sepaDebit: null,
  billingDetails: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+34600000000',
    address: {
      line1: 'Calle Principal 123',
      line2: null,
      city: 'Madrid',
      state: 'Madrid',
      postalCode: '28001',
      country: 'ES',
    },
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

export const mockPaymentMethodCardExpired: PaymentMethod = {
  id: '123e4567-e89b-12d3-a456-426614174021',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  stripePaymentMethodId: 'pm_1234567891',
  type: 'card',
  isDefault: false,
  card: {
    brand: 'mastercard',
    last4: '5555',
    expMonth: 6,
    expYear: 2024,
  },
  sepaDebit: null,
  billingDetails: {
    name: 'Jane Doe',
    email: null,
    phone: null,
    address: null,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockPaymentMethodSepa: PaymentMethod = {
  id: '123e4567-e89b-12d3-a456-426614174022',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  stripePaymentMethodId: 'pm_1234567892',
  type: 'sepa_debit',
  isDefault: false,
  card: null,
  sepaDebit: {
    bankCode: 'DEUTESBB',
    last4: '3000',
    country: 'DE',
  },
  billingDetails: {
    name: 'Company GmbH',
    email: 'billing@company.de',
    phone: null,
    address: {
      line1: 'Hauptstraße 1',
      line2: null,
      city: 'Berlin',
      state: null,
      postalCode: '10115',
      country: 'DE',
    },
  },
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-01-10'),
}

export const mockPaymentMethods: PaymentMethod[] = [
  mockPaymentMethodCard,
  mockPaymentMethodCardExpired,
  mockPaymentMethodSepa,
]

// ============================================================================
// Mock Transactions
// ============================================================================

export const mockTransactionSucceeded: PaymentTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174030',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  invoiceId: '123e4567-e89b-12d3-a456-426614174010',
  stripePaymentIntentId: 'pi_1234567890',
  stripeChargeId: 'ch_1234567890',
  amount: 36179,
  currency: 'EUR',
  status: 'succeeded',
  paymentMethodType: 'card',
  description: 'Pago mensual - Plan Pro',
  failureCode: null,
  failureMessage: null,
  metadata: {},
  createdAt: new Date('2025-01-10'),
  updatedAt: new Date('2025-01-10'),
}

export const mockTransactionFailed: PaymentTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174031',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  invoiceId: '123e4567-e89b-12d3-a456-426614174011',
  stripePaymentIntentId: 'pi_1234567891',
  stripeChargeId: null,
  amount: 36179,
  currency: 'EUR',
  status: 'failed',
  paymentMethodType: 'card',
  description: 'Pago mensual - Plan Pro',
  failureCode: 'card_declined',
  failureMessage: 'Your card was declined',
  metadata: {},
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-02-01'),
}

export const mockTransactionPending: PaymentTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174032',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  invoiceId: '123e4567-e89b-12d3-a456-426614174011',
  stripePaymentIntentId: 'pi_1234567892',
  stripeChargeId: null,
  amount: 36179,
  currency: 'EUR',
  status: 'pending',
  paymentMethodType: 'sepa_debit',
  description: 'Pago mensual - Plan Pro',
  failureCode: null,
  failureMessage: null,
  metadata: {},
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-02-01'),
}

export const mockTransactionRefunded: PaymentTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174033',
  tenantId: '123e4567-e89b-12d3-a456-426614174001',
  invoiceId: '123e4567-e89b-12d3-a456-426614174010',
  stripePaymentIntentId: 'pi_1234567893',
  stripeChargeId: 'ch_1234567891',
  amount: 36179,
  currency: 'EUR',
  status: 'refunded',
  paymentMethodType: 'card',
  description: 'Reembolso - Plan Pro',
  failureCode: null,
  failureMessage: null,
  metadata: {},
  createdAt: new Date('2024-12-15'),
  updatedAt: new Date('2024-12-20'),
}

export const mockTransactions: PaymentTransaction[] = [
  mockTransactionSucceeded,
  mockTransactionFailed,
  mockTransactionPending,
  mockTransactionRefunded,
]

// ============================================================================
// Helper Functions
// ============================================================================

export const createMockSubscription = (
  overrides?: Partial<Subscription>
): Subscription => ({
  ...mockSubscriptionActive,
  ...overrides,
})

export const createMockInvoice = (overrides?: Partial<Invoice>): Invoice => ({
  ...mockInvoicePaid,
  ...overrides,
})

export const createMockPaymentMethod = (
  overrides?: Partial<PaymentMethod>
): PaymentMethod => ({
  ...mockPaymentMethodCard,
  ...overrides,
})

export const createMockTransaction = (
  overrides?: Partial<PaymentTransaction>
): PaymentTransaction => ({
  ...mockTransactionSucceeded,
  ...overrides,
})
