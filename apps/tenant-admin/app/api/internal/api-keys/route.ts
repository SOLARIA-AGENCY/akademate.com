/**
 * Internal API Keys Management — Collection Endpoint
 *
 * Authentication: Cookie (payload-token) — NOT Bearer token.
 * These routes are for the dashboard UI, not for external API consumers.
 *
 * GET  /api/internal/api-keys  — List all API keys for the authenticated tenant
 * POST /api/internal/api-keys  — Create a new API key (returns plain_key ONCE)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { generateApiKey, hashApiKey } from '@/lib/apiKeyAuth'
import type { ApiScope } from '@/lib/apiKeyAuth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// Types
// ============================================================================

interface PayloadUser {
  id: string | number
  email: string
  role?: string
  tenantId?: string
  tenant?: string | number | { id: string | number }
}

interface ApiKeyDoc {
  id: string | number
  name: string
  scopes?: Array<{ scope: ApiScope }>
  is_active?: boolean
  rate_limit_per_day?: number | null
  last_used_at?: string | null
  createdAt: string
  tenant?: string | number | { id: string | number }
}

interface CreateApiKeyBody {
  name?: string
  scopes?: ApiScope[]
  rate_limit_per_day?: number
}

// ============================================================================
// Auth Helper — validate cookie session and extract tenantId
// ============================================================================

async function getAuthenticatedTenantId(request: Request): Promise<{
  tenantId: string
  userId: string
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) return null

    const payload = await getPayloadHMR({ config: configPromise })

    // Use Payload's built-in token verification
    const result = await payload.auth({
      collection: 'users',
      headers: new Headers({ cookie: `payload-token=${token}` }),
    }) as { user?: PayloadUser } | null

    if (!result?.user) return null

    const user = result.user

    // Resolve tenantId from user document
    let tenantId: string | null = null

    if (user.tenantId) {
      tenantId = String(user.tenantId)
    } else if (user.tenant) {
      tenantId =
        typeof user.tenant === 'object' && user.tenant !== null
          ? String((user.tenant as { id: string | number }).id)
          : String(user.tenant)
    }

    if (!tenantId) return null

    return { tenantId, userId: String(user.id) }
  } catch (err) {
    console.error('[internal/api-keys] getAuthenticatedTenantId error:', err)
    return null
  }
}

// ============================================================================
// GET /api/internal/api-keys
// Returns: [{ id, name, scopes, is_active, rate_limit_per_day, last_used_at, created_at }]
// NEVER includes key_hash
// ============================================================================

export async function GET(request: Request) {
  const session = await getAuthenticatedTenantId(request)
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  try {
    const payload = await getPayloadHMR({ config: configPromise })

    const result = await payload.find({
      collection: 'api-keys',
      where: {
        tenant: {
          equals: session.tenantId,
        },
      },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
    })

    const keys = (result.docs as unknown as ApiKeyDoc[]).map((doc) => ({
      id: String(doc.id),
      name: doc.name,
      scopes: Array.isArray(doc.scopes)
        ? doc.scopes.map((s) => s.scope).filter(Boolean)
        : [],
      is_active: doc.is_active ?? true,
      rate_limit_per_day: doc.rate_limit_per_day ?? 1000,
      last_used_at: doc.last_used_at ?? null,
      created_at: doc.createdAt,
    }))

    return NextResponse.json({ data: keys })
  } catch (err) {
    console.error('[internal/api-keys] GET error:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

// ============================================================================
// POST /api/internal/api-keys
// Body: { name, scopes[], rate_limit_per_day? }
// Returns: { id, name, scopes, plain_key } — plain_key ONLY in this response
// ============================================================================

export async function POST(request: Request) {
  const session = await getAuthenticatedTenantId(request)
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  let body: CreateApiKeyBody
  try {
    body = (await request.json()) as CreateApiKeyBody
  } catch {
    return NextResponse.json(
      { error: 'JSON inválido', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  const { name, scopes = [], rate_limit_per_day = 1000 } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'El campo "name" es obligatorio', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  if (!Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json(
      { error: 'Se requiere al menos un scope', code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  const validScopes: ApiScope[] = [
    'courses:read',
    'courses:write',
    'students:read',
    'students:write',
    'enrollments:read',
    'enrollments:write',
    'analytics:read',
    'keys:manage',
  ]

  const invalidScopes = scopes.filter((s) => !validScopes.includes(s))
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { error: `Scopes inválidos: ${invalidScopes.join(', ')}`, code: 'VALIDATION_ERROR' },
      { status: 400 },
    )
  }

  try {
    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)

    const payload = await getPayloadHMR({ config: configPromise })

    const created = await payload.create({
      collection: 'api-keys',
      data: {
        name: name.trim(),
        key_hash: keyHash,
        scopes: scopes.map((s) => ({ scope: s })),
        tenant: session.tenantId,
        is_active: true,
        rate_limit_per_day,
      },
    }) as unknown as ApiKeyDoc

    return NextResponse.json(
      {
        data: {
          id: String(created.id),
          name: created.name,
          scopes,
          rate_limit_per_day: created.rate_limit_per_day ?? rate_limit_per_day,
          is_active: true,
          created_at: created.createdAt,
          // plain_key is returned ONLY here, never stored
          plain_key: plainKey,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[internal/api-keys] POST error:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
