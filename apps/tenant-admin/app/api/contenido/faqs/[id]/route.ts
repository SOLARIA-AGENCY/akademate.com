import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  editorValuesFromUnknown,
  faqCategoryLabel,
  mergeSeoKeywords,
  textFromSlate,
  toFaqPayload,
} from '@/src/domain/faq-content'
import { getWebsiteConfig } from '@/app/api/config/website/pages/_lib'

const WRITE_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

function toItem(doc: Record<string, unknown>) {
  const values = editorValuesFromUnknown(doc)
  return {
    id: String(doc.id ?? ''),
    ...values,
    categoryLabel: faqCategoryLabel(values.category),
    slug: typeof doc.slug === 'string' ? doc.slug : '',
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
      collection: 'faqs',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, data: toItem(doc as Record<string, unknown>) })
  } catch {
    return NextResponse.json({ success: false, error: 'FAQ no encontrada' }, { status: 404 })
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
    return NextResponse.json({ success: false, error: 'Sin permiso para editar FAQs' }, { status: 403 })
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const existing = await payload.findByID({
    collection: 'faqs',
    id,
    depth: 0,
    overrideAccess: true,
  })
  const current = editorValuesFromUnknown(existing as Record<string, unknown>)
  const next = editorValuesFromUnknown({
    ...current,
    ...body,
    answer: typeof body.answer === 'string' ? body.answer : body.answer ?? current.answer,
    question: body.question ?? current.question,
  })
  if (typeof body.answer === 'string') next.answer = body.answer
  else if (body.answer !== undefined) next.answer = textFromSlate(body.answer)

  const website = await getWebsiteConfig()
  const data = toFaqPayload({
    ...next,
    keywords: mergeSeoKeywords(next.keywords, website.website.seo?.keywords ?? []),
  })

  try {
    const updated = await payload.update({
      collection: 'faqs',
      id,
      data,
      overrideAccess: true,
      user: { id: auth.userId, role: auth.role },
    })
    return NextResponse.json({ success: true, data: toItem(updated as Record<string, unknown>) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la FAQ'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
