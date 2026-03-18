import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// ── Ensure table exists ─────────────────────────────────────────────────────

async function ensureTable() {
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(128) NOT NULL,
      key_hash VARCHAR(128) NOT NULL,
      key_prefix VARCHAR(12) NOT NULL,
      created_by VARCHAR(128) NOT NULL,
      created_by_name VARCHAR(256),
      scopes TEXT[] NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      last_used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      revoked_by VARCHAR(128),
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

// ── GET — List API keys ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  await ensureTable()
  const db = getDb()

  const statusFilter = request.nextUrl.searchParams.get('status')
  const validStatuses = ['active', 'revoked']

  let query = `
    SELECT id, name, key_prefix, created_by, created_by_name, scopes,
           status, last_used_at, revoked_at, revoked_by, expires_at, created_at
    FROM api_keys
  `
  const params: string[] = []

  if (statusFilter && validStatuses.includes(statusFilter)) {
    query += ' WHERE status = $1'
    params.push(statusFilter)
  }

  query += ' ORDER BY created_at DESC'

  const result = await db.query(query, params)

  return NextResponse.json(result.rows)
}

// ── POST — Create new API key ───────────────────────────────────────────────

const VALID_SCOPES = [
  'read:tenants',
  'write:tenants',
  'read:metrics',
  'read:health',
  'read:logs',
  'admin:*',
]

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: { name?: string; scopes?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { name, scopes } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Nombre requerido (mínimo 2 caracteres)' },
      { status: 400 }
    )
  }

  if (!Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json(
      { error: 'Debe seleccionar al menos un scope' },
      { status: 400 }
    )
  }

  const invalidScopes = scopes.filter((s) => !VALID_SCOPES.includes(s))
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { error: `Scopes inválidos: ${invalidScopes.join(', ')}` },
      { status: 400 }
    )
  }

  await ensureTable()
  const db = getDb()

  // Generate key: ak_live_ + 32 hex chars
  const rawKey = `ak_live_${randomBytes(16).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12)

  const result = await db.query(
    `INSERT INTO api_keys (name, key_hash, key_prefix, created_by, created_by_name, scopes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, key_prefix, created_by, created_by_name, scopes, status, created_at`,
    [
      name.trim(),
      keyHash,
      keyPrefix,
      session.user.email ?? session.user.id,
      session.user.name ?? null,
      scopes,
    ]
  )

  return NextResponse.json(
    {
      ...result.rows[0],
      key: rawKey, // Only returned ONCE at creation time
    },
    { status: 201 }
  )
}
