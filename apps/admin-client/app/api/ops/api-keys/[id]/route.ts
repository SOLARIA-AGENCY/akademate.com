import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// ── DELETE — Revoke (soft delete) an API key ────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  const db = getDb()

  // Check key exists and is active
  const existing = await db.query(
    'SELECT id, status FROM api_keys WHERE id = $1',
    [id]
  )

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'API key no encontrada' }, { status: 404 })
  }

  if (existing.rows[0].status === 'revoked') {
    return NextResponse.json({ error: 'La API key ya está revocada' }, { status: 400 })
  }

  const revokedBy = session.user.email ?? session.user.id

  await db.query(
    `UPDATE api_keys
     SET status = 'revoked', revoked_at = NOW(), revoked_by = $1
     WHERE id = $2`,
    [revokedBy, id]
  )

  return NextResponse.json({ ok: true, message: 'API key revocada' })
}

// ── PATCH — Update name or scopes ───────────────────────────────────────────

const VALID_SCOPES = [
  'read:tenants',
  'write:tenants',
  'read:metrics',
  'read:health',
  'read:logs',
  'admin:*',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  let body: { name?: string; scopes?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const db = getDb()

  // Check key exists
  const existing = await db.query(
    'SELECT id, status FROM api_keys WHERE id = $1',
    [id]
  )

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'API key no encontrada' }, { status: 404 })
  }

  if (existing.rows[0].status === 'revoked') {
    return NextResponse.json({ error: 'No se puede editar una key revocada' }, { status: 400 })
  }

  const updates: string[] = []
  const values: (string | string[])[] = []
  let paramIndex = 1

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nombre inválido (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }
    updates.push(`name = $${paramIndex++}`)
    values.push(body.name.trim())
  }

  if (body.scopes !== undefined) {
    if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un scope' },
        { status: 400 }
      )
    }
    const invalidScopes = body.scopes.filter((s) => !VALID_SCOPES.includes(s))
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Scopes inválidos: ${invalidScopes.join(', ')}` },
        { status: 400 }
      )
    }
    updates.push(`scopes = $${paramIndex++}`)
    values.push(body.scopes)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  values.push(id)
  const result = await db.query(
    `UPDATE api_keys SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, key_prefix, scopes, status, created_at`,
    values
  )

  return NextResponse.json(result.rows[0])
}
