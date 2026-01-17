'use client'

import { useCallback } from 'react'
import { useSWRConfig } from 'swr'
import type { PlanTier } from '@payload-config/types/billing'

interface SubscriptionActions {
  changePlan: (planTier: PlanTier, interval: 'month' | 'year') => Promise<void>
  cancelSubscription: (reason?: string, immediately?: boolean) => Promise<void>
  openBillingPortal: () => Promise<void>
  resumeSubscription: () => Promise<void>
}

export function useSubscription(options: {
  tenantId?: string
  subscriptionId?: string
  stripeCustomerId?: string
} = {}): SubscriptionActions {
  const { mutate } = useSWRConfig()
  const { tenantId, subscriptionId, stripeCustomerId } = options

  const changePlan = useCallback(
    async (planTier: PlanTier, interval: 'month' | 'year') => {
      if (!tenantId) {
        throw new Error('Missing tenantId')
      }

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          planTier,
          interval,
          successUrl: `${window.location.origin}/facturacion?success=true`,
          cancelUrl: `${window.location.origin}/facturacion?canceled=true`,
          stripeCustomerId: stripeCustomerId ?? undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await res.json()

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    },
    []
  )

  const cancelSubscription = useCallback(
    async (reason?: string, immediately = false) => {
      if (!subscriptionId) {
        throw new Error('Missing subscriptionId')
      }

      const res = await fetch(`/api/billing/subscriptions/${subscriptionId}?immediately=${immediately}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to cancel subscription')
      }

      // Refresh subscription data
      if (tenantId) {
        mutate(`/api/billing/subscriptions?tenantId=${tenantId}`)
      }
    },
    [mutate, subscriptionId, tenantId]
  )

  const resumeSubscription = useCallback(async () => {
    if (!subscriptionId) {
      throw new Error('Missing subscriptionId')
    }

    const res = await fetch(`/api/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancelAtPeriodEnd: false,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to resume subscription')
    }

    // Refresh subscription data
    if (tenantId) {
      mutate(`/api/billing/subscriptions?tenantId=${tenantId}`)
    }
  }, [mutate, subscriptionId, tenantId])

  const openBillingPortal = useCallback(async () => {
    if (!tenantId || !stripeCustomerId) {
      throw new Error('Missing billing context')
    }

    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        stripeCustomerId,
        returnUrl: window.location.href,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to open billing portal')
    }

    const data = await res.json()

    // Redirect to Stripe Billing Portal
    if (data.url) {
      window.location.href = data.url
    }
  }, [tenantId, stripeCustomerId])

  return {
    changePlan,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
  }
}
