import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Tenants that became inactive this month (churned)
    const { rows: churnedThisMonth } = await db
      .query<{ id: string; name: string; limits: { maxUsers?: number } | null; updated_at?: string }>(
        `SELECT id, name, limits, updated_at
         FROM tenants
         WHERE active = false
           AND updated_at >= $1`,
        [firstOfMonth.toISOString()]
      )
      .catch(() => ({ rows: [] }))

    // Total active tenants at start of month (proxy: created before month start)
    const { rows: activeAtMonthStart } = await db
      .query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM tenants WHERE created_at < $1`,
        [firstOfMonth.toISOString()]
      )
      .catch(() => ({ rows: [{ count: '1' }] }))

    const activeAtStart = parseInt(activeAtMonthStart[0]?.count ?? '1', 10)

    // Calculate churned MRR
    let churnedMrr = 0
    for (const t of churnedThisMonth) {
      const plan = derivePlan(t.limits)
      churnedMrr += PLAN_PRICES[plan] ?? 199
    }

    // Logo churn rate = churned / active at start of month
    const logoChurnRate =
      activeAtStart > 0
        ? Math.round((churnedThisMonth.length / activeAtStart) * 100 * 10) / 10
        : 0

    return NextResponse.json(
      {
        churned_count: churnedThisMonth.length,
        churned_mrr_eur: churnedMrr,
        logo_churn_rate_pct: logoChurnRate,
        active_at_month_start: activeAtStart,
        churned_tenants: churnedThisMonth.map((t) => ({
          id: t.id,
          name: t.name,
          plan: derivePlan(t.limits),
          mrr_lost: PLAN_PRICES[derivePlan(t.limits)] ?? 199,
        })),
        period_start: firstOfMonth.toISOString(),
        calculated_at: new Date().toISOString(),
      },
      {
        headers: { 'X-Data-As-Of': new Date().toISOString() },
      }
    )
  } catch (error) {
    console.error('[ops/churn] error', error)
    return NextResponse.json({ error: 'Error calculando churn', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
