import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

const WRITE_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }
  if (!auth.role || !WRITE_ROLES.has(auth.role)) {
    return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 })
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const data: Record<string, unknown> = {}
  if (typeof body.quote === 'string') data.quote = body.quote.trim()
  if (typeof body.name === 'string') data.name = body.name.trim()
  if (typeof body.role === 'string') data.role = body.role.trim()
  if (body.status === 'published' || body.status === 'draft') data.status = body.status
  if (typeof body.order === 'number') data.order = body.order

  const updated = await payload.update({
    collection: 'testimonials',
    id,
    data: data as never,
    overrideAccess: true,
  })

  return NextResponse.json({ success: true, data: { id: String(updated.id) } })
}
