import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

const WRITE_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

function toItem(doc: Record<string, unknown>) {
  const image = doc.image
  const imageUrl =
    image && typeof image === 'object' && 'url' in image && typeof image.url === 'string'
      ? image.url
      : null
  return {
    id: String(doc.id ?? ''),
    quote: String(doc.quote ?? ''),
    name: String(doc.name ?? ''),
    role: typeof doc.role === 'string' ? doc.role : '',
    imageUrl,
    status: String(doc.status ?? 'draft'),
    order: typeof doc.order === 'number' ? doc.order : 0,
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const { id } = await context.params
  try {
    const doc = await payload.findByID({
      collection: 'testimonials',
      id,
      depth: 1,
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, data: toItem(doc as Record<string, unknown>) })
  } catch {
    return NextResponse.json({ success: false, error: 'Testimonio no encontrado' }, { status: 404 })
  }
}

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

  try {
    const updated = await payload.update({
      collection: 'testimonials',
      id,
      data: data as never,
      overrideAccess: true,
      depth: 1,
    })
    return NextResponse.json({ success: true, data: toItem(updated as Record<string, unknown>) })
  } catch {
    return NextResponse.json({ success: false, error: 'No se pudo guardar el testimonio' }, { status: 404 })
  }
}
