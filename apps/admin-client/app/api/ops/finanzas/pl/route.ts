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
    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS saas_expenses (
        id           BIGSERIAL PRIMARY KEY,
        category     VARCHAR(50)    NOT NULL DEFAULT 'other',
        vendor       VARCHAR(100)   NOT NULL,
        amount_eur   DECIMAL(10,2)  NOT NULL,
        description  TEXT,
        period_month DATE           NOT NULL,
        created_at   TIMESTAMPTZ    DEFAULT NOW(),
        updated_at   TIMESTAMPTZ    DEFAULT NOW()
      )
    `)

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Revenue: MRR from active tenants
    const { rows: tenants } = await db.query<{
      limits: { maxUsers?: number } | null
    }>(`SELECT limits FROM tenants WHERE active = true`)

    let mrrEur = 0
    for (const t of tenants) {
      const plan = derivePlan(t.limits)
      mrrEur += PLAN_PRICES[plan] ?? 199
    }

    // Expenses this month
    const { rows: expensesRows } = await db.query<{
      total: string
      category: string
    }>(
      `SELECT category, COALESCE(SUM(amount_eur), 0) AS total
       FROM saas_expenses
       WHERE period_month >= $1
       GROUP BY category`,
      [firstOfMonth.toISOString()]
    )

    const expensesByCategory: Record<string, number> = {}
    let totalExpenses = 0

    for (const row of expensesRows) {
      const amt = parseFloat(row.total)
      expensesByCategory[row.category] = amt
      totalExpenses += amt
    }

    const margin = mrrEur - totalExpenses
    const marginPct = mrrEur > 0 ? Math.round((margin / mrrEur) * 100) : null

    // Last 6 months P&L
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { rows: historyRows } = await db.query<{
      month: string
      total_expenses: string
    }>(
      `SELECT DATE_TRUNC('month', period_month) AS month,
              SUM(amount_eur) AS total_expenses
       FROM saas_expenses
       WHERE period_month >= $1
       GROUP BY DATE_TRUNC('month', period_month)
       ORDER BY month ASC`,
      [sixMonthsAgo.toISOString()]
    )

    return NextResponse.json(
      {
        current_month: {
          revenue_eur: mrrEur,
          expenses_eur: totalExpenses,
          margin_eur: margin,
          margin_pct: marginPct,
          expenses_by_category: expensesByCategory,
        },
        period_start: firstOfMonth.toISOString(),
        history: historyRows.map((r) => ({
          month: r.month,
          expenses_eur: parseFloat(r.total_expenses),
        })),
        calculated_at: new Date().toISOString(),
      },
      {
        headers: { 'X-Data-As-Of': new Date().toISOString() },
      }
    )
  } catch (error) {
    console.error('[ops/finanzas/pl] error', error)
    return NextResponse.json({ error: 'Error calculando P&L', code: 'DB_ERROR', retryable: true }, { status: 500 })
  }
}
