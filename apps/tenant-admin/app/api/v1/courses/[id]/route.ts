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
// GET /api/v1/courses/:id
// Returns course detail.
// Requires: courses:read
// ============================================================================

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'courses:read')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const course = await payload.findByID({
      collection: 'courses',
      id,
      depth: 1,
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Enforce multi-tenant isolation: reject if course belongs to another tenant
    const courseTenantId =
      typeof course.tenant === 'object' && course.tenant !== null
        ? String((course.tenant as { id: string | number }).id)
        : String(course.tenant)

    if (courseTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Course not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return NextResponse.json(
      { data: course },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/courses/:id] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// PATCH /api/v1/courses/:id
// Partial update of a course.
// Requires: courses:write
// ============================================================================

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'courses:write')
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

    // First fetch to verify tenant ownership before mutating
    const existing = await payload.findByID({
      collection: 'courses',
      id,
      depth: 0,
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Course not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const existingTenantId =
      typeof existing.tenant === 'object' && existing.tenant !== null
        ? String((existing.tenant as { id: string | number }).id)
        : String(existing.tenant)

    if (existingTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Course not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Prevent callers from overriding tenant during a PATCH
    const { tenant: _tenant, ...safeBody } = body

    const updated = await payload.update({
      collection: 'courses',
      id,
      data: safeBody,
    })

    return NextResponse.json(
      { data: updated },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/courses/:id] PATCH error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
