import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  editorValuesFromUnknown,
  faqCategoryLabel,
  isFaqCategory,
  mergeSeoKeywords,
  textFromSlate,
  toFaqPayload,
  type FaqEditorValues,
} from '@/src/domain/faq-content'
import { getWebsiteConfig } from '@/app/api/config/website/pages/_lib'

const WRITE_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

function canWrite(role: string | null): boolean {
  return Boolean(role && WRITE_ROLES.has(role))
}

function toListItem(doc: Record<string, unknown>) {
  const values = editorValuesFromUnknown(doc)
  return {
    id: String(doc.id ?? ''),
    question: values.question,
    answerPreview: values.answer.slice(0, 160),
    category: values.category,
    categoryLabel: faqCategoryLabel(values.category),
    language: values.language,
    status: values.status,
    featured: values.featured,
    order: values.order,
    keywords: values.keywords,
    slug: typeof doc.slug === 'string' ? doc.slug : '',
  }
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }

  const result = await payload.find({
    collection: 'faqs',
    sort: 'order',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    data: {
      docs: (result.docs as Array<Record<string, unknown>>).map(toListItem),
    },
  })
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
  }
  if (!canWrite(auth.role)) {
    return NextResponse.json({ success: false, error: 'Sin permiso para crear FAQs' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const values: FaqEditorValues = {
    ...editorValuesFromUnknown(body),
    question: String(body.question ?? '').trim(),
    answer: typeof body.answer === 'string' ? body.answer : textFromSlate(body.answer),
    category: isFaqCategory(body.category) ? body.category : 'general',
  }

  if (values.question.length < 10) {
    return NextResponse.json({ success: false, error: 'La pregunta debe tener al menos 10 caracteres' }, { status: 400 })
  }
  if (values.answer.trim().length < 20) {
    return NextResponse.json({ success: false, error: 'La respuesta debe tener al menos 20 caracteres' }, { status: 400 })
  }

  const website = await getWebsiteConfig()
  const data = toFaqPayload({
    ...values,
    keywords: mergeSeoKeywords(values.keywords, website.website.seo?.keywords ?? []),
  })

  try {
    const created = await payload.create({
      collection: 'faqs',
      data,
      overrideAccess: true,
      user: { id: auth.userId, role: auth.role },
    })
    return NextResponse.json({ success: true, data: toListItem(created as Record<string, unknown>) }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la FAQ'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
