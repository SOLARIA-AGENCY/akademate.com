import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { STATIC_BLOG_POSTS } from './staticPosts'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/api/media/file/${image.filename}`
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

  const posts = result.docs.length > 0 ? result.docs : STATIC_BLOG_POSTS

  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full bg-[#f2014b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
            Blog CEP
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Orientación, formación y empleo para decidir con criterio
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
            Artículos prácticos sobre cursos, teleformación, empleabilidad y próximos pasos profesionales.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post: any) => {
            const imageUrl = resolveImageUrl(post.featured_image) ?? post.image
            return (
              <Link
                key={post.id ?? post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={post.title} className="h-56 w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : null}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[#f2014b]">
                    <span>{post.category ?? 'CEP Formación'}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('es-ES') : new Date(post.date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <h2 className="mt-4 text-xl font-black leading-tight text-slate-950">{post.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                    {post.excerpt || 'Contenido editorial de CEP Formación.'}
                  </p>
                  <span className="mt-5 inline-flex text-sm font-black text-slate-950 transition group-hover:text-[#f2014b]">
                    Leer artículo
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
