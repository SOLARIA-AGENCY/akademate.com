import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getPublicCatalog } from '@/app/lib/server/public-catalog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const hostHeader = (await headers()).get('x-forwarded-host') || (await headers()).get('host') || 'cepformacion.akademate.com'
    const host = hostHeader.split(',')[0]?.trim().replace(/:\d+$/, '') || 'cepformacion.akademate.com'
    const catalog = await getPublicCatalog(host)
    const origin = host.includes('cepformacion.com') ? 'https://cepformacion.com' : `https://${host}`
    return catalog.data.sitemap.map((entry) => ({
      url: `${origin}${entry.path}`,
      lastModified: entry.lastmod ? new Date(entry.lastmod) : undefined,
      changeFrequency: entry.changefreq as MetadataRoute.Sitemap[number]['changeFrequency'],
    }))
  } catch {
    return [{ url: 'https://cepformacion.akademate.com/', changeFrequency: 'daily' }]
  }
}
