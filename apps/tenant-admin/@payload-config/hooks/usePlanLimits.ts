'use client'

import useSWR from 'swr'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { getLimit, type ResourceKey } from '../lib/planLimits'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) return null
  return r.json()
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface LimitCheck {
  allowed: boolean
  limit: number
  current: number
  plan: string
}

/**
 * Infer plan from tenant DB limits.
 * Enterprise tenants have limits >= 999999 set by superadmin.
 * Pro tenants have limits above starter defaults.
 */
function inferPlanFromLimits(limits?: { maxCourses?: number; maxUsers?: number }): string | null {
  if (!limits) return null
  const maxCourses = limits.maxCourses ?? 0
  const maxUsers = limits.maxUsers ?? 0
  if (maxCourses >= 999999 || maxUsers >= 999999) return 'enterprise'
  if (maxCourses > 100 || maxUsers > 50) return 'pro'
  return null
}

export function usePlanLimits() {
  const { branding } = useTenantBranding()
  const tenantId = branding.tenantId

  const isValidUuid = Boolean(tenantId && UUID_REGEX.test(tenantId))

  const { data: subscription } = useSWR(
    isValidUuid ? `/api/billing/subscriptions?tenantId=${tenantId}` : null,
    fetcher
  )

  // Also fetch tenant limits from config API to infer plan when no subscription exists
  const { data: limitsResponse } = useSWR(
    tenantId ? `/api/config?section=limits&tenantId=${tenantId}` : null,
    fetcher
  )
  const tenantData = limitsResponse?.data ? { limits: limitsResponse.data } : undefined

  // Determine plan: subscription > tenant limits inference > default starter
  const subscriptionPlan = subscription?.plan
  const inferredPlan = inferPlanFromLimits(tenantData?.limits)
  const plan: string = subscriptionPlan ?? inferredPlan ?? 'starter'

  function checkLimit(resource: ResourceKey, current: number): LimitCheck {
    const limit = getLimit(plan, resource)
    return { allowed: limit === Infinity || current < limit, limit, current, plan }
  }

  return { plan, checkLimit }
}
