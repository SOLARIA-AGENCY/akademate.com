import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Hardcoded plan prices until Stripe/billing is integrated
const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  professional: 299,
  enterprise: 599,
}

function derivePlan(limits?: { maxUsers?: number; maxCourses?: number } | null): string {
  const max = limits?.maxUsers ?? 0
  if (max >= 100) return 'enterprise'
  if (max >= 20) return 'professional'
  return 'starter'
}

export async function GET() {
  const db = getDb()

  try {
    // Fetch active tenants with limits
    const { rows: tenants } = await db.query<{
      id: string
      limits: { maxUsers?: number; maxCourses?: number } | null
      active: boolean
      created_at: string
    }>(`SELECT id, limits, active, created_at FROM tenants WHERE active = true`)

    // Calculate current MRR
    let mrrEur = 0
    const planBreakdown: Record<string, { count: number; mrr: number }> = {}

    for (const t of tenants) {
      const plan = derivePlan(t.limits as { maxUsers?: number; maxCourses?: number } | null)
      const price = PLAN_PRICES[plan] ?? 199
      mrrEur += price
      if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, mrr: 0 }
      planBreakdown[plan].count++
      planBreakdown[plan].mrr += price
    }

    const arrEur = mrrEur * 12

    // Try to get last month's tenant count for trend
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { rows: lastMonthRows } = await db
      .query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM tenants WHERE active = true AND created_at < $1`,
        [thirtyDaysAgo.toISOString()]
      )
      .catch(() => ({ rows: [{ count: String(tenants.length) }] }))

    const lastMonthActive = parseInt(lastMonthRows[0]?.count ?? '0', 10)
    const lastMonthMrr = lastMonthActive * (PLAN_PRICES['starter'] ?? 199) // conservative estimate

    const mrrGrowthPct =
      lastMonthMrr > 0 ? Math.round(((mrrEur - lastMonthMrr) / lastMonthMrr) * 100) : null

    return NextResponse.json(
      {
        mrr_eur: mrrEur,
        arr_eur: arrEur,
        mrr_growth_pct: mrrGrowthPct,
        active_tenants: tenants.length,
        plan_breakdown: planBreakdown,
        calculated_at: new Date().toISOString(),
      },
      {
        headers: { 'X-Data-As-Of': new Date().toISOString() },
      }
    )
  } catch (error) {
    console.error('[ops/mrr] error', error)
    return NextResponse.json({ error: 'Error calculando MRR', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
