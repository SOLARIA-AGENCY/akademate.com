import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

export default async function BlogIndexPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'blog_posts',
    where: { status: { equals: 'published' } },
    sort: '-published_at',
    limit: 24,
    depth: 1,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold text-slate-950">Blog</h1>
        <p className="mt-4 text-slate-600">Noticias, orientación formativa y contenido editorial conectado al catálogo.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {result.docs.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {resolveImageUrl(post.featured_image) ? (
              <img src={resolveImageUrl(post.featured_image) ?? ''} alt={post.title} className="h-56 w-full object-cover" />
            ) : null}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">{post.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt || 'Contenido editorial de CEP Formación.'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
