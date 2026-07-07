import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'
import { validateStaffEmail, validateStaffNif } from '@/lib/staff-contact'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sanitizeStaffContactPayload(body: Record<string, unknown>) {
  const sanitized = { ...body }

  if ('email' in body) {
    const validation = validateStaffEmail(body.email)
    if (validation.valid === false) return { ok: false as const, error: validation.error }
    sanitized.email = validation.value ?? undefined
  }

  if ('nif' in body) {
    const validation = validateStaffNif(body.nif)
    if (validation.valid === false) return { ok: false as const, error: validation.error }
    sanitized.nif = validation.value ?? undefined
  }

  return { ok: true as const, data: sanitized }
}

// ============================================================================
// GET /api/v1/staff
// Lists staff for the authenticated tenant (paginated).
// Requires: staff:read
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'staff:read')
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)
    const page = Math.floor(offset / limit) + 1

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'staff',
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
    console.error('[v1/staff] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// POST /api/v1/staff
// Creates a staff member for the authenticated tenant.
// Requires: staff:write
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'staff:write')
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const sanitized = sanitizeStaffContactPayload(body as Record<string, unknown>)
    if (!sanitized.ok) {
      return NextResponse.json(
        { error: sanitized.error, code: 'INVALID_CONTACT' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = await getPayload({ config: configPromise })

    const createStaff = payload.create as unknown as (args: {
      collection: 'staff'
      data: Record<string, unknown>
    }) => Promise<unknown>
    const created = await createStaff({
      collection: 'staff',
      data: sanitized.data,
    })

    return NextResponse.json(
      { data: created },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/staff] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
