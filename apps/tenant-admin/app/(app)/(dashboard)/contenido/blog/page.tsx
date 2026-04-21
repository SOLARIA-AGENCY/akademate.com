import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export const dynamic = 'force-dynamic'

type BlogPostRow = {
  id: string | number
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  published_at?: string | null
}

function formatPublishedDate(value?: string | null): string {
  if (!value) return 'Sin fecha de publicación'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha de publicación'

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'blog_posts',
    where: { status: { equals: 'published' } },
    sort: '-published_at',
    limit: 12,
    depth: 0,
  })

  const posts = (result.docs ?? []) as BlogPostRow[]
  const totalPublished = result.totalDocs ?? posts.length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog / Noticias"
        description="Gestión de artículos y noticias publicadas en la web."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/blog"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver blog público
        </Link>
        <Link
          href="/faq"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver FAQs públicas
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artículos publicados ({totalPublished})</CardTitle>
          <CardDescription>Se muestran los últimos {Math.min(posts.length, 12)} artículos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay contenido publicado todavía.</p>
          ) : (
            posts.map((post) => (
              <div
                key={String(post.id)}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{post.title ?? 'Sin título'}</p>
                  <span className="text-xs text-slate-500">{formatPublishedDate(post.published_at)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">/{post.slug ?? 'sin-slug'}</p>
                {post.excerpt ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">Sin extracto configurado.</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
