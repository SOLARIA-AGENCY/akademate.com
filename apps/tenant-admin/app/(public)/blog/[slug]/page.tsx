import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
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

function slugifyHeading(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
        <div>
        {imageUrl ? <img src={imageUrl} alt={title} className="h-[28rem] w-full rounded-2xl object-cover shadow-lg" /> : null}
        <div className="mt-8 rounded-2xl border border-red-100 bg-[#fff7fa] p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">CEP Formación · www.cursostenerife.es</p>
          <p className="mt-3 text-lg font-semibold leading-8 text-slate-800">
            {excerpt} Artículo publicado por CEP Formación para orientar a alumnos y candidatos desde la web oficial de www.cursostenerife.es.
          </p>
        </div>
        <div className="mt-10 max-w-none text-slate-800">
          {sections ? (
            sections.map((section, index) => (
              <section id={slugifyHeading(section.heading)} key={section.heading} className="scroll-mt-28 py-5 first:pt-0">
                <h2 className={index === 0 ? 'text-2xl font-black leading-tight text-slate-950 sm:text-3xl' : 'mt-5 text-2xl font-black leading-tight text-slate-950 sm:text-3xl'}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-5 text-lg leading-9 text-slate-700">{paragraph}</p>
                ))}
              </section>
            ))
          ) : (
            <p className="text-lg leading-9 text-slate-700">{body || excerpt || 'Artículo publicado.'}</p>
          )}
          {staticPost?.faqs?.length ? (
            <section className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-slate-950">Preguntas frecuentes</h2>
              {staticPost.faqs.map((faq) => (
                <div key={faq.question} className="mt-6 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
                  <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-base leading-8 text-slate-700">{faq.answer}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">Contenido</p>
            {sections?.length ? (
              <nav className="mt-4 grid gap-3 text-sm font-semibold text-slate-700">
                {sections.map((section) => (
                  <a key={section.heading} href={`#${slugifyHeading(section.heading)}`} className="transition hover:text-[#f2014b]">
                    {section.heading}
                  </a>
                ))}
              </nav>
            ) : null}
            <Link href="/contacto" className="mt-6 inline-flex w-full justify-center rounded-full bg-[#f2014b] px-5 py-3 text-sm font-black text-white transition hover:bg-[#d0013f]">
              Solicitar orientación
            </Link>
          </div>
        </aside>
      </div>
    </article>
  )
}
