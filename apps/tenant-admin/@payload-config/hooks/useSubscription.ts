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

export function useSubscription(): SubscriptionActions {
  const { mutate } = useSWRConfig()

  const changePlan = useCallback(
    async (planTier: PlanTier, interval: 'month' | 'year') => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier,
          interval,
          successUrl: `${window.location.origin}/facturacion?success=true`,
          cancelUrl: `${window.location.origin}/facturacion?canceled=true`,
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
      const res = await fetch('/api/billing/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelAtPeriodEnd: !immediately,
          cancelReason: reason,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to cancel subscription')
      }

      // Refresh subscription data
      mutate('/api/billing/subscriptions')
    },
    [mutate]
  )

  const resumeSubscription = useCallback(async () => {
    const res = await fetch('/api/billing/subscriptions', {
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
    mutate('/api/billing/subscriptions')
  }, [mutate])

  const openBillingPortal = useCallback(async () => {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
  }, [])

  return {
    changePlan,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
  }
}
