import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
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

type PageProps = { params: Promise<{ slug: string }> }

async function getBlogPost(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'blog_posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const post = result.docs[0] as any
  return { post, staticPost: post ? null : findStaticBlogPost(slug) }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { post, staticPost } = await getBlogPost(slug)
  if (!post && !staticPost) return {}

  const title = post?.seo_title || post?.title || staticPost!.seoTitle
  const description = post?.meta_description || post?.excerpt || staticPost!.metaDescription
  const imageUrl = post ? resolveImageUrl(post.featured_image) : staticPost!.image

  return {
    title,
    description,
    keywords: staticPost?.keywords,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/blog/${slug}`,
      images: imageUrl ? [{ url: imageUrl, alt: post?.title ?? staticPost!.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { post, staticPost } = await getBlogPost(slug)
  if (!post && !staticPost) notFound()

  const title = post?.title ?? staticPost!.title
  const excerpt = post?.excerpt ?? staticPost!.excerpt
  const category = post?.category ?? staticPost!.category
  const date = post?.published_at ?? staticPost!.date
  const updatedAt = post?.updatedAt ?? staticPost!.updatedAt
  const author = staticPost?.author ?? 'CEP Formación'
  const readingTime = staticPost?.readingTime
  const body = post ? extractPlainText(post.content).trim() : ''
  const sections = staticPost?.sections
  const imageUrl = post ? resolveImageUrl(post.featured_image) : staticPost!.image
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    image: imageUrl,
    datePublished: date,
    dateModified: updatedAt,
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CEP Formación',
      logo: {
        '@type': 'ImageObject',
        url: '/logos/cep-formacion-logo-rectangular.png',
      },
    },
    mainEntityOfPage: `/blog/${slug}`,
    keywords: staticPost?.keywords?.join(', '),
    mainEntity: staticPost?.faqs?.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <article className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">
            {category} · {readingTime ? `${readingTime} · ` : ''}{new Date(date).toLocaleDateString('es-ES')}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{title}</h1>
          {excerpt ? <p className="mt-5 text-lg leading-8 text-white/75">{excerpt}</p> : null}
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {imageUrl ? <img src={imageUrl} alt={title} className="h-[28rem] w-full rounded-2xl object-cover shadow-lg" /> : null}
        <div className="prose prose-slate mt-10 max-w-none prose-h2:mt-10 prose-h2:text-2xl prose-h2:font-black prose-p:text-base prose-p:leading-8">
          {sections ? (
            sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))
          ) : (
            <p>{body || excerpt || 'Artículo publicado.'}</p>
          )}
          {staticPost?.faqs?.length ? (
            <section>
              <h2>Preguntas frecuentes</h2>
              {staticPost.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </article>
  )
}
