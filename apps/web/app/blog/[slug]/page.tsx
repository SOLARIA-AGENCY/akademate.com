import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { EditorialArticle } from '@/components/editorial/EditorialArticle'
import { getBlogPost, getEditorialPost, getInsightPosts, insightPosts } from '@/lib/blog-posts'
import { getEditorialMetadataAlternates } from '@/lib/editorial-i18n'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'

export function generateStaticParams() {
  return insightPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const post = getEditorialPost(slug, locale)
  if (!post) return {}
  const canonical = `${post.kind === 'news' ? '/news' : '/blog'}/${post.slug}`
  return {
    title: post.seoTitle,
    description: post.excerpt,
    keywords: [...post.keywords],
    authors: [{ name: post.author }],
    alternates: getEditorialMetadataAlternates(canonical, locale),
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

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const editorialPost = getEditorialPost(slug, locale)
  if (editorialPost?.kind === 'news') redirect(localizedHref(`/news/${editorialPost.slug}`, locale))
  const post = getBlogPost(slug, locale)
  if (!post) notFound()
  return (
    <EditorialArticle
      post={post}
      related={getInsightPosts(locale).filter((item) => item.slug !== post.slug)}
      locale={locale}
    />
  )
}
