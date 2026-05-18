import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export const dynamic = 'force-dynamic'

type FaqRow = {
  id: string | number
  question?: string | null
  slug?: string | null
  category?: string | null
  order?: number | null
  featured?: boolean | null
}

const categoryLabels: Record<string, string> = {
  general: 'General',
  courses: 'Cursos',
  enrollment: 'Inscripción',
  payments: 'Pagos',
  technical: 'Técnico',
}

function resolveCategoryLabel(category?: string | null): string {
  if (!category) return 'Sin categoría'
  return categoryLabels[category] ?? category
}

export default async function FaqsPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'faqs',
    where: { status: { equals: 'published' } },
    sort: 'order',
    limit: 20,
    depth: 0,
  })

  const faqs = (result.docs ?? []) as FaqRow[]
  const totalPublished = result.totalDocs ?? faqs.length

  return (
    <div className="space-y-4">
      <PageHeader
        title="FAQs"
        description="Gestión de preguntas frecuentes publicadas en la web."
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/faq" target="_blank" rel="noreferrer">
            Ver FAQs públicas
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/blog" target="_blank" rel="noreferrer">
            Ver blog público
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQs publicadas ({totalPublished})</CardTitle>
          <CardDescription>Se muestran las primeras {Math.min(faqs.length, 20)} por orden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay FAQs publicadas todavía.</p>
          ) : (
            faqs.map((faq) => (
              <div
                key={String(faq.id)}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{faq.question ?? 'Sin pregunta'}</p>
                  <span className="text-xs text-slate-500">Orden {faq.order ?? 0}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {resolveCategoryLabel(faq.category)} · /{faq.slug ?? 'sin-slug'}
                  {faq.featured ? ' · destacada' : ''}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
