/**
 * @fileoverview Feature Flags API
 * Evaluate and update feature flags per tenant
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, featureFlags, tenants } from '@/@payload-config/lib/db'

const FeatureFlagsQuerySchema = z.object({
  tenantId: z.string().uuid(),
})

const UpdateFlagSchema = z.object({
  tenantId: z.string().uuid(),
  key: z.string().min(1),
  value: z.unknown(),
})

const planRank: Record<string, number> = {
  starter: 0,
  pro: 1,
  enterprise: 2,
}

const isEligibleForPlan = (tenantPlan: string, planRequirement?: string | null) => {
  if (!planRequirement) return true
  if (!(tenantPlan in planRank) || !(planRequirement in planRank)) return true
  return planRank[tenantPlan] >= planRank[planRequirement]
}

const hashToPercentage = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100
  }
  return hash
}

const evaluateFlag = (flag: any, tenantPlan: string, tenantId: string) => {
  const override = (flag.overrides || []).find((entry: any) => entry.tenantId === tenantId)
  const overrideValue = override ? override.value : undefined
  const eligible = isEligibleForPlan(tenantPlan, flag.planRequirement)
  const baseValue = overrideValue ?? flag.defaultValue

  if (!eligible) {
    return {
      ...flag,
      overrideValue: overrideValue ?? null,
      effectiveValue: flag.type === 'variant' ? baseValue : false,
      eligible,
    }
  }

  if (flag.type === 'percentage') {
    const rollout = typeof baseValue === 'number' ? baseValue : 0
    const bucket = hashToPercentage(tenantId)
    return {
      ...flag,
      overrideValue: overrideValue ?? null,
      effectiveValue: bucket < rollout,
      eligible,
    }
  }

  return {
    ...flag,
    overrideValue: overrideValue ?? null,
    effectiveValue: baseValue,
    eligible,
  }
}

// ============================================================================
// GET /api/feature-flags?tenantId=...
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const validation = FeatureFlagsQuerySchema.safeParse({ tenantId })

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid tenantId' }, { status: 400 })
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, validation.data.tenantId))
      .limit(1)
      .execute()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const flags = await db.select().from(featureFlags).execute()
    const evaluated = flags.map((flag) =>
      evaluateFlag(flag, tenant.plan, validation.data.tenantId)
    )

    return NextResponse.json({
      tenantId: validation.data.tenantId,
      plan: tenant.plan,
      flags: evaluated,
    })
  } catch (error) {
    console.error('Feature flags fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/feature-flags
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = UpdateFlagSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, key, value } = validation.data

    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .limit(1)
      .execute()

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    const overrides = Array.isArray(flag.overrides) ? [...flag.overrides] : []
    const existingIndex = overrides.findIndex((entry) => entry.tenantId === tenantId)

    if (existingIndex >= 0) {
      overrides[existingIndex] = { tenantId, value }
    } else {
      overrides.push({ tenantId, value })
    }

    await db
      .update(featureFlags)
      .set({ overrides })
      .where(eq(featureFlags.key, key))
      .execute()

    return NextResponse.json({
      key,
      tenantId,
      overrideValue: value,
    })
  } catch (error) {
    console.error('Feature flags update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    )
  }
}
