import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/preview', '/internal', '/dashboard', '/admin', '/api/', '/p/mock-home'],
      },
    ],
    sitemap: 'https://cepformacion.com/sitemap.xml',
  }
}
