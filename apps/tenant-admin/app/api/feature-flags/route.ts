/**
 * @fileoverview Feature Flags API
 * Evaluate and update feature flags per tenant
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, featureFlags, tenants } from '@/@payload-config/lib/db'

/** Override entry for a specific tenant */
interface FlagOverride {
  tenantId: string
  value: unknown
}

/** Feature flag from database */
interface FeatureFlag {
  id: string
  key: string
  type: string
  defaultValue: unknown
  overrides: FlagOverride[]
  planRequirement: string | null
}

/** Tenant record from database */
interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  mrr: number
  domains: string[]
  branding: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/** Evaluated feature flag with computed values */
interface EvaluatedFlag extends FeatureFlag {
  overrideValue: unknown
  effectiveValue: unknown
  eligible: boolean
}

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

const isEligibleForPlan = (tenantPlan: string, planRequirement?: string | null): boolean => {
  if (!planRequirement) return true
  if (!(tenantPlan in planRank) || !(planRequirement in planRank)) return true
  return planRank[tenantPlan] >= planRank[planRequirement]
}

const hashToPercentage = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100
  }
  return hash
}

const evaluateFlag = (flag: FeatureFlag, tenantPlan: string, tenantId: string): EvaluatedFlag => {
  const overrides = flag.overrides ?? []
  const override = overrides.find((entry: FlagOverride) => entry.tenantId === tenantId)
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const validation = FeatureFlagsQuerySchema.safeParse({ tenantId })

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid tenantId' }, { status: 400 })
    }

    // Type assertion needed: db has conditional type that prevents proper inference
    const tenantResults = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, validation.data.tenantId))
      .limit(1)
      .execute() as Tenant[]

    const tenant = tenantResults[0]

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Type assertion needed: db has conditional type that prevents proper inference
    const flags = await db.select().from(featureFlags).execute() as FeatureFlag[]
    const evaluated = flags.map((flag: FeatureFlag) =>
      evaluateFlag(flag, tenant.plan, validation.data.tenantId)
    )

    return NextResponse.json({
      tenantId: validation.data.tenantId,
      plan: tenant.plan,
      flags: evaluated,
    })
  } catch (error: unknown) {
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

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()
    const validation = UpdateFlagSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, key, value } = validation.data

    // Type assertion needed: db has conditional type that prevents proper inference
    const flagResults = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key))
      .limit(1)
      .execute() as FeatureFlag[]

    const flag = flagResults[0]

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    const overrides: FlagOverride[] = Array.isArray(flag.overrides)
      ? flag.overrides
      : []
    const existingIndex = overrides.findIndex((entry: FlagOverride) => entry.tenantId === tenantId)

    const newOverrides = [...overrides]
    if (existingIndex >= 0) {
      newOverrides[existingIndex] = { tenantId, value }
    } else {
      newOverrides.push({ tenantId, value })
    }

    // Type assertion needed: db has conditional type that prevents proper inference
    await (db
      .update(featureFlags)
      .set({ overrides: newOverrides })
      .where(eq(featureFlags.key, key))
      .execute() as Promise<unknown>)

    return NextResponse.json({
      key,
      tenantId,
      overrideValue: value,
    })
  } catch (error: unknown) {
    console.error('Feature flags update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    )
  }
}
