/**
 * @fileoverview Usage Meter API
 * Manage subscription usage meters per tenant
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import { db, subscriptions } from '@/@payload-config/lib/db'

const UsageMetricSchema = z.object({
  metric: z.string().min(1),
  value: z.number().nonnegative(),
  unit: z.string().optional(),
  limit: z.union([z.number().nonnegative(), z.string().min(1)]).optional(),
})

const UpdateUsageSchema = z.object({
  tenantId: z.string().uuid(),
  usage: z.array(UsageMetricSchema).min(1),
})

const TenantQuerySchema = z.object({
  tenantId: z.string().uuid(),
})

// ============================================================================
// GET /api/billing/usage?tenantId=...
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const validation = TenantQuerySchema.safeParse({ tenantId })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tenantId' },
        { status: 400 }
      )
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, validation.data.tenantId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1)
      .execute()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      usage: subscription.usageMeter ?? [],
    })
  } catch (error) {
    console.error('Get usage meter error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage meter' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/billing/usage
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = UpdateUsageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, usage } = validation.data

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1)
      .execute()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const currentUsage = subscription.usageMeter ?? []
    const usageMap = new Map(currentUsage.map((item) => [item.metric, item]))

    usage.forEach((metric) => {
      usageMap.set(metric.metric, {
        metric: metric.metric,
        value: metric.value,
        unit: metric.unit ?? null,
        limit: metric.limit ?? null,
        updatedAt: now,
      })
    })

    const nextUsage = Array.from(usageMap.values())

    await db
      .update(subscriptions)
      .set({
        usageMeter: nextUsage,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .execute()

    return NextResponse.json({
      subscriptionId: subscription.id,
      tenantId,
      usage: nextUsage,
    })
  } catch (error) {
    console.error('Update usage meter error:', error)
    return NextResponse.json(
      { error: 'Failed to update usage meter' },
      { status: 500 }
    )
  }
}
