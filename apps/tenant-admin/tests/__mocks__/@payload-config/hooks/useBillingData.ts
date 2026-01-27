import { vi } from 'vitest'

export interface UseBillingDataOptions {
  tenantId: string
}

export interface BillingDataResult {
  subscription: unknown
  subscriptionLoading: boolean
  subscriptionError: unknown
  invoices: unknown[]
  invoicesLoading: boolean
  invoicesError: unknown
  paymentMethods: unknown[]
  paymentMethodsLoading: boolean
  paymentMethodsError: unknown
  transactions: unknown[]
  transactionsLoading: boolean
  transactionsError: unknown
  mutate: () => void
}

export function useBillingData(_options: UseBillingDataOptions): BillingDataResult {
  return {
    subscription: null,
    subscriptionLoading: false,
    subscriptionError: null,
    invoices: [],
    invoicesLoading: false,
    invoicesError: null,
    paymentMethods: [],
    paymentMethodsLoading: false,
    paymentMethodsError: null,
    transactions: [],
    transactionsLoading: false,
    transactionsError: null,
    mutate: vi.fn(),
  }
}
