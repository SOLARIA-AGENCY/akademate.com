'use client'

import useSWR from 'swr'
import type { Subscription, Invoice, PaymentMethod } from '@payload-config/types/billing'

interface BillingData {
  subscription: Subscription | null
  subscriptionLoading: boolean
  subscriptionError: Error | null
  invoices: Invoice[]
  invoicesLoading: boolean
  invoicesError: Error | null
  paymentMethods: PaymentMethod[]
  paymentMethodsLoading: boolean
  paymentMethodsError: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

export function useBillingData(): BillingData {
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: subscriptionLoading,
    mutate: mutateSubscription,
  } = useSWR<Subscription | null>('/api/billing/subscriptions', fetcher)

  const {
    data: invoices,
    error: invoicesError,
    isLoading: invoicesLoading,
    mutate: mutateInvoices,
  } = useSWR<Invoice[]>('/api/billing/invoices', fetcher)

  const {
    data: paymentMethods,
    error: paymentMethodsError,
    isLoading: paymentMethodsLoading,
    mutate: mutatePaymentMethods,
  } = useSWR<PaymentMethod[]>('/api/billing/payment-methods', fetcher)

  const mutate = () => {
    mutateSubscription()
    mutateInvoices()
    mutatePaymentMethods()
  }

  return {
    subscription: subscription ?? null,
    subscriptionLoading,
    subscriptionError,
    invoices: invoices ?? [],
    invoicesLoading,
    invoicesError,
    paymentMethods: paymentMethods ?? [],
    paymentMethodsLoading,
    paymentMethodsError,
    mutate,
  }
}
