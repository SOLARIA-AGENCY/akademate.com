import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialArticle } from '@/components/editorial/EditorialArticle'
import { getNewsPost, getNewsPosts, newsPosts } from '@/lib/blog-posts'
import { getEditorialMetadataAlternates } from '@/lib/editorial-i18n'
import { localizePathname } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const post = getNewsPost(slug, locale)
  if (!post) return {}
  const canonical = `/news/${post.slug}`
  return {
    title: post.seoTitle,
    description: post.excerpt,
    keywords: [...post.keywords],
    authors: [{ name: post.author }],
    alternates: getEditorialMetadataAlternates(canonical, locale),
    openGraph: {
      type: 'article',
      locale: locale === 'es' ? 'es_ES' : 'en_GB',
      url: localizePathname(canonical, locale),
      siteName: 'Akademate',
      title: post.seoTitle,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.image, alt: post.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.excerpt,
      images: [post.image],
    },
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const post = getNewsPost(slug, locale)
  if (!post) notFound()
  return (
    <EditorialArticle
      post={post}
      related={getNewsPosts(locale).filter((item) => item.slug !== post.slug)}
      locale={locale}
    />
  )
}
