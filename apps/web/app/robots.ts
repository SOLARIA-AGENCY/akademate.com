import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/design-system/', '/registro/completar/'] }],
    sitemap: new URL('/sitemap.xml', base).toString(),
  }
}
