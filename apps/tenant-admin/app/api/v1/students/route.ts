import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/students
// Lists students for the authenticated tenant (paginated).
// Requires: students:read
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'students:read')
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)
    const page = Math.floor(offset / limit) + 1

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'students',
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
    console.error('[v1/students] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// POST /api/v1/students
// Creates a student for the authenticated tenant.
// Requires: students:write
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'students:write')
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Require minimum fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Field "email" is required', code: 'VALIDATION_ERROR' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await getPayload({ config: configPromise })

    const created = await payload.create({
      collection: 'students',
      data: body,
    })

    return NextResponse.json(
      { data: created },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/students] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
