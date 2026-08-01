import type { MetadataRoute } from 'next'
import { legalLinks } from '@/lib/legal-config'
import { insightPosts, newsPosts } from '@/lib/blog-posts'
import { verticals } from '@/lib/marketing-content'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'
  return [
    '/',
    '/features',
    '/solutions',
    ...verticals.map((vertical) => `/solutions/${vertical.slug}`),
    '/pricing',
    '/sobre-nosotros',
    '/blog',
    ...insightPosts.map((post) => `/blog/${post.slug}`),
    '/news',
    ...newsPosts.map((post) => `/news/${post.slug}`),
    '/contacto',
    ...legalLinks.map((link) => link.href),
  ].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: new Date('2026-08-01T00:00:00.000Z'),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/features' || path === '/pricing' ? 0.9 : 0.6,
  }))
}
