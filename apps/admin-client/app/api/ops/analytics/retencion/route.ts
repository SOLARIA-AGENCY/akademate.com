import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()

  try {
    // Build a simple cohort table: cohort month × months retained
    // We approximate retention using created_at vs active status
    const { rows: cohortData } = await db.query<{
      cohort_month: string
      is_active: boolean
      count: string
    }>(`
      SELECT DATE_TRUNC('month', created_at) AS cohort_month,
             active AS is_active,
             COUNT(*) AS count
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at), active
      ORDER BY cohort_month DESC
    `)

    // Group by cohort month
    const cohortMap: Record<string, { total: number; active: number }> = {}
    for (const row of cohortData) {
      if (!cohortMap[row.cohort_month]) cohortMap[row.cohort_month] = { total: 0, active: 0 }
      const entry = cohortMap[row.cohort_month]!
      const n = parseInt(row.count, 10)
      entry.total += n
      if (row.is_active) entry.active += n
    }

    const cohorts = Object.entries(cohortMap)
      .map(([month, data]) => ({
        cohort_month: month,
        initial_count: data.total,
        retained_count: data.active,
        retention_rate_pct: data.total > 0 ? Math.round((data.active / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.cohort_month.localeCompare(a.cohort_month))

    // Monthly churn rate
    const { rows: churnStats } = await db.query<{
      month: string
      churned: string
      active_at_start: string
    }>(`
      WITH monthly AS (
        SELECT DATE_TRUNC('month', created_at) AS month,
               COUNT(*) FILTER (WHERE active = false) AS churned,
               COUNT(*) AS total
        FROM tenants
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT month, churned, total AS active_at_start FROM monthly ORDER BY month DESC
    `)

    const churnHistory = churnStats.map((r) => {
      const churned = parseInt(r.churned, 10)
      const total = parseInt(r.active_at_start, 10)
      return {
        month: r.month,
        churned,
        churn_rate_pct: total > 0 ? Math.round((churned / total) * 100 * 10) / 10 : 0,
      }
    })

    return NextResponse.json(
      {
        cohorts,
        churn_history: churnHistory,
        target_churn_pct: 3,
        calculated_at: new Date().toISOString(),
      },
      { headers: { 'X-Data-As-Of': new Date().toISOString() } }
    )
  } catch (error) {
    console.error('[ops/analytics/retencion] error', error)
    return NextResponse.json({ error: 'Error en retención', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
