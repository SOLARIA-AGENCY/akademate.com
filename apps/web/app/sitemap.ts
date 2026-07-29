import type { MetadataRoute } from 'next'
import { legalLinks } from '@/lib/legal-config'
import { blogPosts } from '@/lib/blog-posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'
  return ['/', '/features', '/pricing', '/sobre-nosotros', '/blog', ...blogPosts.map((post) => `/blog/${post.slug}`), '/contacto', ...legalLinks.map((link) => link.href)].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: new Date('2026-07-29T00:00:00.000Z'),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/features' || path === '/pricing' ? 0.9 : 0.6,
  }))
}
