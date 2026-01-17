'use client'

import useSWR from 'swr'
import type { Subscription, Invoice, PaymentMethod, PaymentTransaction } from '@payload-config/types/billing'

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
  transactions: PaymentTransaction[]
  transactionsLoading: boolean
  transactionsError: Error | null
  mutate: () => void
}

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

const normalizeDate = (value: string | Date | null | undefined) => {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

const mapInvoice = (invoice: any, subscription: Subscription | null): Invoice => ({
  id: invoice.id,
  tenantId: subscription?.tenantId ?? '',
  subscriptionId: subscription?.id ?? null,
  stripeInvoiceId: invoice.id ?? null,
  number: invoice.number ?? invoice.id,
  status: invoice.status ?? 'open',
  currency: (invoice.currency ?? 'EUR').toUpperCase(),
  subtotal: invoice.subtotal ?? 0,
  tax: invoice.tax ?? 0,
  total: invoice.total ?? 0,
  amountPaid: invoice.amountPaid ?? invoice.amount_paid ?? 0,
  amountDue: invoice.amountDue ?? invoice.amount_due ?? 0,
  dueDate: normalizeDate(invoice.dueDate ?? invoice.due_date),
  paidAt: normalizeDate(invoice.paidAt ?? invoice.paid_at),
  hostedInvoiceUrl: invoice.hostedInvoiceUrl ?? invoice.hosted_invoice_url ?? null,
  invoicePdfUrl: invoice.invoicePdfUrl ?? invoice.invoice_pdf ?? null,
  lineItems: invoice.lineItems ?? [],
  metadata: invoice.metadata ?? {},
  createdAt: normalizeDate(invoice.createdAt ?? invoice.created) ?? new Date(),
  updatedAt: normalizeDate(invoice.updatedAt ?? invoice.createdAt ?? invoice.created) ?? new Date(),
})

const mapPaymentMethod = (method: any, subscription: Subscription | null): PaymentMethod => ({
  id: method.id,
  tenantId: subscription?.tenantId ?? '',
  stripePaymentMethodId: method.id,
  type: method.type ?? 'card',
  isDefault: Boolean(method.isDefault),
  card: method.card ? {
    brand: method.card.brand,
    last4: method.card.last4,
    expMonth: method.card.expMonth ?? method.card.exp_month,
    expYear: method.card.expYear ?? method.card.exp_year,
  } : null,
  sepaDebit: method.sepaDebit ? {
    bankCode: method.sepaDebit.bankCode,
    last4: method.sepaDebit.last4,
    country: method.sepaDebit.country,
  } : null,
  billingDetails: method.billingDetails ? {
    name: method.billingDetails.name ?? null,
    email: method.billingDetails.email ?? null,
    phone: method.billingDetails.phone ?? null,
    address: method.billingDetails.address ? {
      line1: method.billingDetails.address.line1 ?? null,
      line2: method.billingDetails.address.line2 ?? null,
      city: method.billingDetails.address.city ?? null,
      state: method.billingDetails.address.state ?? null,
      postalCode: method.billingDetails.address.postalCode ?? method.billingDetails.address.postal_code ?? null,
      country: method.billingDetails.address.country ?? null,
    } : null,
  } : undefined,
  createdAt: normalizeDate(method.createdAt ?? method.created) ?? new Date(),
  updatedAt: normalizeDate(method.updatedAt ?? method.createdAt ?? method.created) ?? new Date(),
})

const mapTransaction = (transaction: any): PaymentTransaction => ({
  id: transaction.id,
  tenantId: transaction.tenantId,
  invoiceId: transaction.invoiceId ?? null,
  stripePaymentIntentId: transaction.stripePaymentIntentId ?? null,
  stripeChargeId: transaction.stripeChargeId ?? null,
  amount: transaction.amount ?? 0,
  currency: (transaction.currency ?? 'EUR').toUpperCase(),
  status: transaction.status ?? 'pending',
  paymentMethodType: transaction.paymentMethodType ?? '',
  description: transaction.description ?? null,
  failureCode: transaction.failureCode ?? null,
  failureMessage: transaction.failureMessage ?? null,
  metadata: transaction.metadata ?? {},
  createdAt: normalizeDate(transaction.createdAt) ?? new Date(),
  updatedAt: normalizeDate(transaction.updatedAt ?? transaction.createdAt) ?? new Date(),
})

export function useBillingData(options: { tenantId?: string } = {}): BillingData {
  const { tenantId } = options
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: subscriptionLoading,
    mutate: mutateSubscription,
  } = useSWR<Subscription | null>(
    tenantId ? `/api/billing/subscriptions?tenantId=${tenantId}` : null,
    fetcher
  )

  const stripeCustomerId = subscription?.stripeCustomerId ?? null

  const {
    data: invoicesResponse,
    error: invoicesError,
    isLoading: invoicesLoading,
    mutate: mutateInvoices,
  } = useSWR<{ invoices: any[] }>(
    stripeCustomerId ? `/api/billing/invoices?customerId=${stripeCustomerId}` : null,
    fetcher
  )

  const {
    data: paymentMethodsResponse,
    error: paymentMethodsError,
    isLoading: paymentMethodsLoading,
    mutate: mutatePaymentMethods,
  } = useSWR<{ paymentMethods: any[] }>(
    stripeCustomerId ? `/api/billing/payment-methods?customerId=${stripeCustomerId}` : null,
    fetcher
  )

  const {
    data: transactionsResponse,
    error: transactionsError,
    isLoading: transactionsLoading,
    mutate: mutateTransactions,
  } = useSWR<{ transactions: any[] }>(
    tenantId ? `/api/billing/transactions?tenantId=${tenantId}` : null,
    fetcher
  )

  const mutate = () => {
    mutateSubscription()
    mutateInvoices()
    mutatePaymentMethods()
    mutateTransactions()
  }

  return {
    subscription: subscription ?? null,
    subscriptionLoading,
    subscriptionError,
    invoices: (invoicesResponse?.invoices ?? []).map((invoice) => mapInvoice(invoice, subscription ?? null)),
    invoicesLoading,
    invoicesError,
    paymentMethods: (paymentMethodsResponse?.paymentMethods ?? []).map((method) => mapPaymentMethod(method, subscription ?? null)),
    paymentMethodsLoading,
    paymentMethodsError,
    transactions: (transactionsResponse?.transactions ?? []).map(mapTransaction),
    transactionsLoading,
    transactionsError,
    mutate,
  }
}
