import type { MetadataRoute } from 'next'
import { indexableRoutes, SITE_URL } from '@/lib/public-site'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL.replace(/\/$/, '')
  return indexableRoutes.map((route) => ({
    url: `${baseUrl}${route === '/' ? '' : route}`,
    changeFrequency: route.startsWith('/legal/') ? 'yearly' : 'weekly',
    priority: route === '/' ? 1 : route.startsWith('/legal/') ? 0.3 : 0.7,
  }))
}
