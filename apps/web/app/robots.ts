import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/accesos', '/login', '/portal/', '/registro/', '/design-system/'] }],
    sitemap: 'https://akademate.com/sitemap.xml',
  }
}
