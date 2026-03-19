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
// GET /api/v1/convocatorias/:id
// Returns course-run detail.
// Requires: convocatorias:read
// ============================================================================

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'convocatorias:read')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const courseRun = await payload.findByID({
      collection: 'course-runs',
      id,
      depth: 1,
    })

    if (!courseRun) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const courseRunTenantId =
      typeof courseRun.tenant === 'object' && courseRun.tenant !== null
        ? String((courseRun.tenant as { id: string | number }).id)
        : String(courseRun.tenant)

    if (courseRunTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return NextResponse.json(
      { data: courseRun },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/convocatorias/:id] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// PATCH /api/v1/convocatorias/:id
// Partial update of a course-run.
// Requires: convocatorias:write
// ============================================================================

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'convocatorias:write')
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
      collection: 'course-runs',
      id,
      depth: 0,
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const existingTenantId =
      typeof existing.tenant === 'object' && existing.tenant !== null
        ? String((existing.tenant as { id: string | number }).id)
        : String(existing.tenant)

    if (existingTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { tenant: _tenant, ...safeBody } = body

    const updated = await payload.update({
      collection: 'course-runs',
      id,
      data: safeBody,
    })

    return NextResponse.json(
      { data: updated },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/convocatorias/:id] PATCH error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// DELETE /api/v1/convocatorias/:id
// Deletes a course-run.
// Requires: convocatorias:write
// ============================================================================

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'convocatorias:write')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })

    const existing = await payload.findByID({
      collection: 'course-runs',
      id,
      depth: 0,
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const existingTenantId =
      typeof existing.tenant === 'object' && existing.tenant !== null
        ? String((existing.tenant as { id: string | number }).id)
        : String(existing.tenant)

    if (existingTenantId !== auth.auth.tenantId) {
      return NextResponse.json(
        { error: 'Convocatoria not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    await payload.delete({
      collection: 'course-runs',
      id,
    })

    return NextResponse.json(
      { data: { id, deleted: true } },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/convocatorias/:id] DELETE error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
