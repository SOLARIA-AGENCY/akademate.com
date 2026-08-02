import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialArticle } from '@/components/editorial/EditorialArticle'
import { getNewsPost, getNewsPosts, newsPosts } from '@/lib/blog-posts'
import { getEditorialMetadataAlternates } from '@/lib/editorial-i18n'
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
  return {
    title: post.seoTitle,
    description: post.excerpt,
    keywords: [...post.keywords],
    authors: [{ name: post.author }],
    alternates: getEditorialMetadataAlternates(`/news/${post.slug}`, locale),
    openGraph: {
      type: 'article',
      title: post.seoTitle,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      images: [{ url: post.image, alt: post.imageAlt }],
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
