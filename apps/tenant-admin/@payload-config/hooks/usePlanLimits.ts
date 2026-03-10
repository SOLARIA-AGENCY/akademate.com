'use client'

import useSWR from 'swr'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { getLimit, type ResourceKey } from '../lib/planLimits'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface LimitCheck {
  allowed: boolean
  limit: number
  current: number
  plan: string
}

export function usePlanLimits() {
  const { branding } = useTenantBranding()
  const tenantId = branding.tenantId

  const isValidUuid = Boolean(tenantId && UUID_REGEX.test(tenantId))

  const { data: subscription } = useSWR(
    isValidUuid ? `/api/billing/subscriptions?tenantId=${tenantId}` : null,
    fetcher
  )

  const plan: string = subscription?.plan ?? 'starter'

  function checkLimit(resource: ResourceKey, current: number): LimitCheck {
    const limit = getLimit(plan, resource)
    return { allowed: limit === Infinity || current < limit, limit, current, plan }
  }

  return { plan, checkLimit }
}
