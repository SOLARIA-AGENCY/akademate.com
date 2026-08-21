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

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const result = await payload.find({
    collection: 'testimonials',
    sort: 'order',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    data: { docs: (result.docs as Array<Record<string, unknown>>).map(toItem) },
  })
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }
  if (!auth.role || !WRITE_ROLES.has(auth.role)) {
    return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const quote = String(body.quote ?? '').trim()
  const name = String(body.name ?? '').trim()
  if (quote.length < 8 || name.length < 2) {
    return NextResponse.json({ success: false, error: 'Cita y nombre son obligatorios' }, { status: 400 })
  }

  const created = await payload.create({
    collection: 'testimonials',
    overrideAccess: true,
    data: {
      quote,
      name,
      role: String(body.role ?? '').trim(),
      status: body.status === 'published' ? 'published' : 'draft',
      order: typeof body.order === 'number' ? body.order : 0,
      ...(auth.tenantId ? { tenant: auth.tenantId } : {}),
    } as never,
  })

  return NextResponse.json({ success: true, data: toItem(created as Record<string, unknown>) }, { status: 201 })
}
