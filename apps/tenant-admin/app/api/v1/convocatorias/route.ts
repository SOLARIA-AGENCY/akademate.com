import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/convocatorias
// Lists course-runs for the authenticated tenant (paginated).
// Requires: convocatorias:read
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'convocatorias:read')
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)
    const page = Math.floor(offset / limit) + 1

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'course-runs',
      where: {
        tenant: { equals: Number(auth.auth.tenantId) },
      },
      limit,
      page,
      sort: '-createdAt',
      depth: 0,
    })

    return NextResponse.json(
      {
        data: result.docs,
        total: result.totalDocs,
        limit,
        offset,
      },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/convocatorias] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// POST /api/v1/convocatorias
// Creates a course-run for the authenticated tenant.
// Requires: convocatorias:write
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'convocatorias:write')
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await getPayload({ config: configPromise })

    const created = await payload.create({
      collection: 'course-runs',
      data: {
        ...body,
        tenant: Number(auth.auth.tenantId),
      },
    })

    return NextResponse.json(
      { data: created },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/convocatorias] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
