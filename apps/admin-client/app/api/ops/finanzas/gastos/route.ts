import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['infrastructure', 'software', 'marketing', 'other'] as const
type Category = (typeof VALID_CATEGORIES)[number]

async function ensureTable() {
  const db = getDb()
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
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_saas_expenses_period ON saas_expenses(period_month DESC)
  `)
}

export async function GET(req: NextRequest) {
  const db = getDb()
  await ensureTable()

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const params: unknown[] = []

  if (category && VALID_CATEGORIES.includes(category as Category)) {
    params.push(category)
    conditions.push(`category = $${params.length}`)
  }
  if (from) {
    params.push(from)
    conditions.push(`period_month >= $${params.length}`)
  }
  if (to) {
    params.push(to)
    conditions.push(`period_month <= $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows: docs } = await db.query(
    `SELECT * FROM saas_expenses ${where} ORDER BY period_month DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS total FROM saas_expenses ${where}`,
    params
  )
  const total = parseInt(countRows[0]?.total ?? '0', 10)

  return NextResponse.json({
    docs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
  })
}

export async function POST(req: NextRequest) {
  const db = getDb()
  await ensureTable()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido', code: 'INVALID_JSON', retryable: false }, { status: 400 })
  }

  const { category, vendor, amount_eur, description, period_month } = body

  if (!vendor || typeof vendor !== 'string' || vendor.trim() === '') {
    return NextResponse.json({ error: 'vendor es obligatorio', code: 'VALIDATION', retryable: false }, { status: 400 })
  }
  if (!amount_eur || typeof amount_eur !== 'number' || amount_eur <= 0) {
    return NextResponse.json({ error: 'amount_eur debe ser un número positivo', code: 'VALIDATION', retryable: false }, { status: 400 })
  }
  if (!period_month || typeof period_month !== 'string') {
    return NextResponse.json({ error: 'period_month es obligatorio (YYYY-MM-01)', code: 'VALIDATION', retryable: false }, { status: 400 })
  }

  const cat = VALID_CATEGORIES.includes(category as Category) ? category : 'other'

  const { rows } = await db.query(
    `INSERT INTO saas_expenses (category, vendor, amount_eur, description, period_month)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [cat, vendor.trim(), amount_eur, description ?? null, period_month]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
