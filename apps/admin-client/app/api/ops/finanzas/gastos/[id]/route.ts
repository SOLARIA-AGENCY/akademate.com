import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb()
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido', code: 'INVALID_JSON', retryable: false }, { status: 400 })
  }

  const { category, vendor, amount_eur, description, period_month } = body

  const { rows } = await db.query(
    `UPDATE saas_expenses
     SET category = COALESCE($1, category),
         vendor = COALESCE($2, vendor),
         amount_eur = COALESCE($3, amount_eur),
         description = COALESCE($4, description),
         period_month = COALESCE($5, period_month),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [category ?? null, vendor ?? null, amount_eur ?? null, description ?? null, period_month ?? null, id]
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Gasto no encontrado', code: 'NOT_FOUND', retryable: false }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb()
  const { id } = await params

  const { rowCount } = await db.query('DELETE FROM saas_expenses WHERE id = $1', [id])

  if (!rowCount || rowCount === 0) {
    return NextResponse.json({ error: 'Gasto no encontrado', code: 'NOT_FOUND', retryable: false }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}
