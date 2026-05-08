import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'
import { generateApiKey, hashApiKey } from '@/lib/apiKeyAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/keys
// Lists API keys for the authenticated tenant.
// Requires: keys:manage
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'keys:manage')
  if (!auth.ok) return auth.response

  try {
    const payload = await getPayload({ config: configPromise })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'api-keys',
      where: {
        tenant: { equals: Number(auth.auth.tenantId) },
        is_active: { equals: true },
      },
      sort: '-createdAt',
      depth: 0,
    })

    const keys = result.docs.map((k: any) => ({
      id: String(k.id),
      name: k.name,
      scopes: Array.isArray(k.scopes)
        ? k.scopes.map((s: { scope: string }) => s.scope).filter(Boolean)
        : [],
      is_active: k.is_active,
      rate_limit_per_day: k.rate_limit_per_day,
      last_used_at: k.last_used_at,
      created_at: k.createdAt,
    }))

    return NextResponse.json(
      { data: keys, total: result.totalDocs },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/keys] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// POST /api/v1/keys
// Creates a new API key for the authenticated tenant.
// Requires: keys:manage
// Returns the plaintext key ONCE — it is never stored.
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'keys:manage')
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Field "name" is required', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
      return NextResponse.json(
        { error: 'Field "scopes" must be a non-empty array of scope strings', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)

    const payload = await getPayload({ config: configPromise })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (payload as any).create({
      collection: 'api-keys',
      data: {
        name: body.name,
        key_hash: keyHash,
        scopes: body.scopes.map((s: string) => ({ scope: s })),
        tenant: Number(auth.auth.tenantId),
        is_active: true,
        rate_limit_per_day: body.rate_limit_per_day ?? 1000,
      },
    })

    return NextResponse.json(
      {
        data: {
          id: String(created.id),
          name: created.name,
          key: plainKey,
          scopes: body.scopes,
          rate_limit_per_day: created.rate_limit_per_day,
          created_at: created.createdAt,
        },
        message: 'Save this key now — it will not be shown again.',
      },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/keys] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
