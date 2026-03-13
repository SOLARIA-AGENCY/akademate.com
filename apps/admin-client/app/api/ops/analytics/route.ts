import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  professional: 299,
  enterprise: 599,
}

function derivePlan(limits?: { maxUsers?: number } | null): string {
  const max = limits?.maxUsers ?? 0
  if (max >= 100) return 'enterprise'
  if (max >= 20) return 'professional'
  return 'starter'
}

export async function GET() {
  const db = getDb()

  try {
    // Monthly new signups for last 12 months
    const { rows: monthlySignups } = await db.query<{
      month: string
      new_tenants: string
    }>(`
      SELECT DATE_TRUNC('month', created_at) AS month,
             COUNT(*) AS new_tenants
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `)

    // Monthly churned (became inactive) - use updated_at as proxy
    const { rows: monthlyChurn } = await db.query<{
      month: string
      churned: string
    }>(`
      SELECT DATE_TRUNC('month', COALESCE(updated_at, created_at)) AS month,
             COUNT(*) AS churned
      FROM tenants
      WHERE active = false
        AND COALESCE(updated_at, created_at) >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', COALESCE(updated_at, created_at))
      ORDER BY month ASC
    `).catch(() => ({ rows: [] }))

    // All active tenants for MRR calculation
    const { rows: activeTenants } = await db.query<{
      limits: { maxUsers?: number } | null
      created_at: string
    }>(`SELECT limits, created_at FROM tenants WHERE active = true`)

    let totalMrr = 0
    let totalLtvEstimate = 0
    const avgTenureMonths = activeTenants.length > 0
      ? activeTenants.reduce((sum, t) => {
          const months = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
          return sum + months
        }, 0) / activeTenants.length
      : 0

    for (const t of activeTenants) {
      const price = PLAN_PRICES[derivePlan(t.limits)] ?? 199
      totalMrr += price
      totalLtvEstimate += price * Math.max(avgTenureMonths, 1)
    }

    const avgMrr = activeTenants.length > 0 ? totalMrr / activeTenants.length : 0
    const ltvEstimate = avgMrr * Math.max(avgTenureMonths, 1)

    // Build month map
    const churnMap: Record<string, number> = {}
    for (const r of monthlyChurn) {
      churnMap[r.month] = parseInt(r.churned, 10)
    }

    const trend = monthlySignups.map((r) => ({
      month: r.month,
      new_tenants: parseInt(r.new_tenants, 10),
      churned: churnMap[r.month] ?? 0,
      net_new: parseInt(r.new_tenants, 10) - (churnMap[r.month] ?? 0),
    }))

    return NextResponse.json(
      {
        total_active: activeTenants.length,
        total_mrr_eur: totalMrr,
        avg_mrr_per_tenant_eur: Math.round(avgMrr),
        avg_tenure_months: Math.round(avgTenureMonths * 10) / 10,
        ltv_estimate_eur: Math.round(ltvEstimate),
        monthly_trend: trend,
        calculated_at: new Date().toISOString(),
      },
      { headers: { 'X-Data-As-Of': new Date().toISOString() } }
    )
  } catch (error) {
    console.error('[ops/analytics] error', error)
    return NextResponse.json({ error: 'Error en analytics', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
