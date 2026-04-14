import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
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
  if (!post) notFound()

  const body = extractPlainText(post.content).trim()
  const imageUrl = resolveImageUrl(post.featured_image)

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-slate-950">{post.title}</h1>
      {post.excerpt ? <p className="mt-5 text-lg text-slate-600">{post.excerpt}</p> : null}
      {imageUrl ? <img src={imageUrl} alt={post.title} className="mt-10 h-[28rem] w-full rounded-3xl object-cover" /> : null}
      <div className="prose prose-slate mt-10 max-w-none">
        <p>{body || post.excerpt || 'Artículo publicado.'}</p>
      </div>
    </article>
  )
}
