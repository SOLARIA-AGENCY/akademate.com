import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()

  try {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // New signups this month
    const { rows: newThisMonth } = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants WHERE created_at >= $1`,
      [firstOfMonth.toISOString()]
    )

    // New signups last month
    const { rows: newLastMonth } = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants WHERE created_at >= $1 AND created_at < $2`,
      [firstOfLastMonth.toISOString(), firstOfMonth.toISOString()]
    )

    const signupsThisMonth = parseInt(newThisMonth[0]?.count ?? '0', 10)
    const signupsLastMonth = parseInt(newLastMonth[0]?.count ?? '0', 10)

    const signupGrowthPct =
      signupsLastMonth > 0
        ? Math.round(((signupsThisMonth - signupsLastMonth) / signupsLastMonth) * 100)
        : null

    // Trial → Paid conversion: active tenants created > 14 days ago
    // (proxy: tenants that signed up more than 14 days ago and are still active)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { rows: eligibleTrials } = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants WHERE created_at <= $1`,
      [fourteenDaysAgo.toISOString()]
    )
    const { rows: convertedTrials } = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM tenants WHERE created_at <= $1 AND active = true`,
      [fourteenDaysAgo.toISOString()]
    )

    const eligible = parseInt(eligibleTrials[0]?.count ?? '0', 10)
    const converted = parseInt(convertedTrials[0]?.count ?? '0', 10)
    const trialToPaidPct = eligible > 0 ? Math.round((converted / eligible) * 100) : null

    // Recent signups list
    const { rows: recentSignups } = await db.query<{
      id: string
      name: string
      slug: string
      created_at: string
    }>(
      `SELECT id, name, slug, created_at
       FROM tenants
       ORDER BY created_at DESC
       LIMIT 5`
    )

    return NextResponse.json(
      {
        new_this_month: signupsThisMonth,
        new_last_month: signupsLastMonth,
        signup_growth_pct: signupGrowthPct,
        trial_to_paid_pct: trialToPaidPct,
        recent_signups: recentSignups,
        period_start: firstOfMonth.toISOString(),
        calculated_at: new Date().toISOString(),
      },
      {
        headers: { 'X-Data-As-Of': new Date().toISOString() },
      }
    )
  } catch (error) {
    console.error('[ops/growth] error', error)
    return NextResponse.json({ error: 'Error calculando growth', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
