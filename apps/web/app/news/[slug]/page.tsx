import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorialArticle } from '@/components/editorial/EditorialArticle'
import { getNewsPost, newsPosts } from '@/lib/blog-posts'

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getNewsPost(slug)
  if (!post) return {}
  return {
    title: post.seoTitle,
    description: post.excerpt,
    keywords: [...post.keywords],
    authors: [{ name: post.author }],
    alternates: { canonical: `/news/${post.slug}` },
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
  const post = getNewsPost(slug)
  if (!post) notFound()
  return (
    <EditorialArticle post={post} related={newsPosts.filter((item) => item.slug !== post.slug)} />
  )
}
