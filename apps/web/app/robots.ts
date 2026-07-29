import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/accesos', '/login', '/portal', '/registro', '/design-system', '/api/'],
      },
    ],
    sitemap: 'https://akademate.com/sitemap.xml',
  }
}
