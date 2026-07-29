import type { MetadataRoute } from 'next'
import { legalLinks } from '@/lib/legal-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'
  return ['/', '/sobre-nosotros', '/blog', '/contacto', '/cursos', ...legalLinks.map((link) => link.href)].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: new Date('2026-07-29T00:00:00.000Z'),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
