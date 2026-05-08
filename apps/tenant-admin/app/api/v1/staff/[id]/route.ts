import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'staff:read')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayload({ config: configPromise })

    const doc = await payload.findByID({ collection: 'staff', id, depth: 1 })

    if (!doc) {
      return NextResponse.json({ error: 'Staff member not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ data: doc })
  } catch (err) {
    console.error('[v1/staff/:id] GET error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'staff:write')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object', code: 'INVALID_BODY' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const updated = await payload.update({ collection: 'staff', id, data: body })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[v1/staff/:id] PATCH error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireV1Auth(request, 'staff:write')
  if (!auth.ok) return auth.response

  try {
    const { id } = await context.params
    const payload = await getPayload({ config: configPromise })
    await payload.delete({ collection: 'staff', id })
    return NextResponse.json({ data: { id, deleted: true } })
  } catch (err) {
    console.error('[v1/staff/:id] DELETE error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
