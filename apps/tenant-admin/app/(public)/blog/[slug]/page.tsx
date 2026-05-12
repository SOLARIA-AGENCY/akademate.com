import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { findStaticBlogPost } from '../staticPosts'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/api/media/file/${image.filename}`
  return null
}

function extractPlainText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractPlainText).join(' ')
  if (typeof node === 'object') {
    return [node.text, extractPlainText(node.children)].filter(Boolean).join(' ')
  }
  return ''
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'blog_posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const post = result.docs[0] as any
  const staticPost = post ? null : findStaticBlogPost(slug)
  if (!post && !staticPost) notFound()

  const title = post?.title ?? staticPost!.title
  const excerpt = post?.excerpt ?? staticPost!.excerpt
  const category = post?.category ?? staticPost!.category
  const date = post?.published_at ?? staticPost!.date
  const body = post ? extractPlainText(post.content).trim() : ''
  const paragraphs = staticPost?.body ?? (body ? [body] : [excerpt])
  const imageUrl = post ? resolveImageUrl(post.featured_image) : staticPost!.image

  return (
    <article className="bg-white">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
            {category} · {new Date(date).toLocaleDateString('es-ES')}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{title}</h1>
          {excerpt ? <p className="mt-5 text-lg leading-8 text-white/75">{excerpt}</p> : null}
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {imageUrl ? <img src={imageUrl} alt={title} className="h-[28rem] w-full rounded-2xl object-cover shadow-lg" /> : null}
        <div className="prose prose-slate mt-10 max-w-none prose-p:text-base prose-p:leading-8">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  )
}
