/**
 * Internal API Keys Management — Single Key Endpoint
 *
 * Authentication: Cookie (payload-token) — NOT Bearer token.
 *
 * PATCH  /api/internal/api-keys/[id]  — Update name, scopes, is_active, rate_limit_per_day
 * DELETE /api/internal/api-keys/[id]  — Revoke (set is_active: false) or delete
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
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

interface PatchApiKeyBody {
  name?: string
  scopes?: ApiScope[]
  is_active?: boolean
  rate_limit_per_day?: number
}

// ============================================================================
// Auth Helper — validate cookie session and extract tenantId
// ============================================================================

async function getAuthenticatedTenantId(): Promise<{
  tenantId: string
  userId: string
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) return null

    const payload = await getPayloadHMR({ config: configPromise })

    const result = await payload.auth({
      collection: 'users',
      headers: new Headers({ cookie: `payload-token=${token}` }),
    }) as { user?: PayloadUser } | null

    if (!result?.user) return null

    const user = result.user

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
    console.error('[internal/api-keys/[id]] getAuthenticatedTenantId error:', err)
    return null
  }
}

// ============================================================================
// Ownership check — verify the key belongs to the authenticated tenant
// ============================================================================

async function getKeyForTenant(keyId: string, tenantId: string): Promise<ApiKeyDoc | null> {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    const doc = await payload.findByID({
      collection: 'api-keys',
      id: keyId,
      depth: 0,
    }) as unknown as ApiKeyDoc | null

    if (!doc) return null

    const keyTenantId =
      typeof doc.tenant === 'object' && doc.tenant !== null
        ? String((doc.tenant as { id: string | number }).id)
        : String(doc.tenant)

    if (keyTenantId !== tenantId) return null

    return doc
  } catch {
    return null
  }
}

// ============================================================================
// PATCH /api/internal/api-keys/[id]
// Body: { name?, scopes?, is_active?, rate_limit_per_day? }
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthenticatedTenantId()
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  const { id } = await params

  const existingKey = await getKeyForTenant(id, session.tenantId)
  if (!existingKey) {
    return NextResponse.json(
      { error: 'API key no encontrada', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  let body: PatchApiKeyBody
  try {
    body = (await request.json()) as PatchApiKeyBody
  } catch {
    return NextResponse.json(
      { error: 'JSON inválido', code: 'BAD_REQUEST' },
      { status: 400 },
    )
  }

  // Build update data — only include provided fields
  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El campo "name" no puede estar vacío', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    updateData.name = body.name.trim()
  }

  if (body.scopes !== undefined) {
    if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un scope', code: 'VALIDATION_ERROR' },
        { status: 400 },
      )
    }
    updateData.scopes = body.scopes.map((s) => ({ scope: s }))
  }

  if (body.is_active !== undefined) {
    updateData.is_active = Boolean(body.is_active)
  }

  if (body.rate_limit_per_day !== undefined) {
    updateData.rate_limit_per_day = Number(body.rate_limit_per_day)
  }

  try {
    const payload = await getPayloadHMR({ config: configPromise })

    const updated = await payload.update({
      collection: 'api-keys',
      id,
      data: updateData,
    }) as unknown as ApiKeyDoc

    return NextResponse.json({
      data: {
        id: String(updated.id),
        name: updated.name,
        scopes: Array.isArray(updated.scopes)
          ? updated.scopes.map((s) => s.scope).filter(Boolean)
          : [],
        is_active: updated.is_active ?? true,
        rate_limit_per_day: updated.rate_limit_per_day ?? 1000,
        last_used_at: updated.last_used_at ?? null,
        created_at: updated.createdAt,
      },
    })
  } catch (err) {
    console.error('[internal/api-keys/[id]] PATCH error:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}

// ============================================================================
// DELETE /api/internal/api-keys/[id]
// Sets is_active: false (soft revoke). Use ?hard=true to delete permanently.
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthenticatedTenantId()
  if (!session) {
    return NextResponse.json(
      { error: 'No autenticado', code: 'UNAUTHENTICATED' },
      { status: 401 },
    )
  }

  const { id } = await params

  const existingKey = await getKeyForTenant(id, session.tenantId)
  if (!existingKey) {
    return NextResponse.json(
      { error: 'API key no encontrada', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const { searchParams } = new URL(request.url)
  const hardDelete = searchParams.get('hard') === 'true'

  try {
    const payload = await getPayloadHMR({ config: configPromise })

    if (hardDelete) {
      await payload.delete({
        collection: 'api-keys',
        id,
      })
      return NextResponse.json({ data: { id, deleted: true } })
    }

    // Default: soft revoke (is_active = false)
    await payload.update({
      collection: 'api-keys',
      id,
      data: { is_active: false },
    })

    return NextResponse.json({ data: { id, revoked: true, is_active: false } })
  } catch (err) {
    console.error('[internal/api-keys/[id]] DELETE error:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
