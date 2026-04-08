import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/enrollments
// Lists enrollments for the authenticated tenant (paginated).
// Requires: enrollments:read
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'enrollments:read')
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100)
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0)
    const page = Math.floor(offset / limit) + 1

    const payload = (await getPayloadHMR({ config: configPromise })) as any

    const result = await payload.find({
      collection: 'enrollments',
      limit,
      page,
      sort: '-createdAt',
      depth: 1,
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
    console.error('[v1/enrollments] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

// ============================================================================
// POST /api/v1/enrollments
// Creates an enrollment.
// Body: { studentId: string, courseRunId: string }
// Requires: enrollments:write
// ============================================================================

export async function POST(request: Request) {
  const auth = await requireV1Auth(request, 'enrollments:write')
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { studentId, courseRunId } = body as {
      studentId?: string
      courseRunId?: string
    }

    if (!studentId || !courseRunId) {
      return NextResponse.json(
        {
          error: 'Fields "studentId" and "courseRunId" are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const payload = (await getPayloadHMR({ config: configPromise })) as any

    const created = await payload.create({
      collection: 'enrollments',
      data: {
        student: studentId as any,
        course_run: courseRunId as any,
        status: 'confirmed',
        enrollment_date: new Date().toISOString(),
      } as any,
    })

    return NextResponse.json(
      { data: created },
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/enrollments] POST error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
