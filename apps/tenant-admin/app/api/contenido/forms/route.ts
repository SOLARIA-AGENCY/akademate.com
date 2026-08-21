import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

const WRITE_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

function toItem(doc: Record<string, unknown>) {
  return {
    id: String(doc.id ?? ''),
    title: String(doc.title ?? ''),
    subtitle: typeof doc.subtitle === 'string' ? doc.subtitle : '',
    source: String(doc.source ?? ''),
    pageSlug: typeof doc.page_slug === 'string' ? doc.page_slug : '',
    status: String(doc.status ?? 'draft'),
  }
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const result = await payload.find({
    collection: 'website_forms',
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
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
  const title = String(body.title ?? '').trim()
  const source = String(body.source ?? '').trim()
  if (!title || !source) {
    return NextResponse.json({ success: false, error: 'Título y origen son obligatorios' }, { status: 400 })
  }

  const created = await payload.create({
    collection: 'website_forms',
    overrideAccess: true,
    data: {
      title,
      subtitle: String(body.subtitle ?? '').trim(),
      source,
      page_slug: String(body.pageSlug ?? body.page_slug ?? '').trim(),
      status: body.status === 'published' ? 'published' : 'draft',
      ...(auth.tenantId ? { tenant: auth.tenantId } : {}),
    } as never,
  })

  return NextResponse.json({ success: true, data: toItem(created as Record<string, unknown>) }, { status: 201 })
}
