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
  if (typeof body.title === 'string') data.title = body.title.trim()
  if (typeof body.subtitle === 'string') data.subtitle = body.subtitle.trim()
  if (typeof body.source === 'string') data.source = body.source.trim()
  if (typeof body.pageSlug === 'string' || typeof body.page_slug === 'string') {
    data.page_slug = String(body.pageSlug ?? body.page_slug).trim()
  }
  if (body.status === 'published' || body.status === 'draft') data.status = body.status

  const updated = await payload.update({
    collection: 'website_forms',
    id,
    data: data as never,
    overrideAccess: true,
  })

  return NextResponse.json({ success: true, data: { id: String(updated.id) } })
}
