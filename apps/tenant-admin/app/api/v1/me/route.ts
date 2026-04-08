import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/me
// Returns metadata about the authenticated API key.
// Requires: any valid scope
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, null)
  if (!auth.ok) return auth.response

  try {
    const payload = (await getPayloadHMR({ config: configPromise })) as any

    const keyDoc = await payload.findByID({
      collection: 'api-keys',
      id: auth.auth.keyId,
      depth: 0,
    })

    if (!keyDoc) {
      return NextResponse.json(
        { error: 'API key not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const scopes = Array.isArray(keyDoc.scopes)
      ? (keyDoc.scopes as Array<{ scope: string }>).map((s) => s.scope).filter(Boolean)
      : []

    return NextResponse.json(
      {
        data: {
          id: String(keyDoc.id),
          name: keyDoc.name,
          scopes,
          tenant_id: auth.auth.tenantId,
          rate_limit_per_day: keyDoc.rate_limit_per_day ?? null,
          created_at: keyDoc.createdAt,
          last_used_at: keyDoc.last_used_at ?? null,
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/me] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
