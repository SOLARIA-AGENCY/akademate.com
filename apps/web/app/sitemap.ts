import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://akademate.com'
  return [
    '',
    '/sobre-nosotros',
    '/contacto',
    '/privacidad',
    '/terminos',
    '/cookies',
    '/subencargados',
    '/transparencia-ia',
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'monthly',
    priority: path === '' ? 1 : 0.6,
  }))
}
