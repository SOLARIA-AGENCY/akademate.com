import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET /api/v1/campuses/:id
// Returns campus detail.
// Requires: campuses:read
// ============================================================================

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'campuses:read')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const campus = await payload.findByID({
      collection: 'campuses',
      id,
      depth: 1,
    })

    if (!campus) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const campusTenantId =
      typeof campus.tenant === 'object' && campus.tenant !== null
        ? String((campus.tenant as { id: string | number }).id)
        : String(campus.tenant)

    if (campusTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return NextResponse.json(
      { data: campus },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/campuses/:id] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// PATCH /api/v1/campuses/:id
// Partial update of a campus.
// Requires: campuses:write
// ============================================================================

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'campuses:write')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })

    const existing = await payload.findByID({
      collection: 'campuses',
      id,
      depth: 0,
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const existingTenantId =
      typeof existing.tenant === 'object' && existing.tenant !== null
        ? String((existing.tenant as { id: string | number }).id)
        : String(existing.tenant)

    if (existingTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { tenant: _tenant, ...safeBody } = body

    const updated = await payload.update({
      collection: 'campuses',
      id,
      data: safeBody,
    })

    return NextResponse.json(
      { data: updated },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/campuses/:id] PATCH error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// DELETE /api/v1/campuses/:id
// Deletes a campus.
// Requires: campuses:write
// ============================================================================

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'campuses:write')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const existing = await payload.findByID({
      collection: 'campuses',
      id,
      depth: 0,
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const existingTenantId =
      typeof existing.tenant === 'object' && existing.tenant !== null
        ? String((existing.tenant as { id: string | number }).id)
        : String(existing.tenant)

    if (existingTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Campus not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    await payload.delete({
      collection: 'campuses',
      id,
    })

    return NextResponse.json(
      { data: { id, deleted: true } },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/campuses/:id] DELETE error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
