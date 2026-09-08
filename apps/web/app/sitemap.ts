import type { MetadataRoute } from 'next'
import { legalLinks } from '@/lib/legal-config'
import { insightPosts, newsPosts } from '@/lib/blog-posts'
import { verticals } from '@/lib/marketing-content'
import { localizePathname, supportedLocales } from '@/lib/i18n/routing'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'
  const publicPaths = [
    '/',
    '/features',
    '/solutions',
    ...verticals.map((vertical) => `/solutions/${vertical.slug}`),
    '/pricing',
    '/download',
    '/sobre-nosotros',
    '/blog',
    ...insightPosts.map((post) => `/blog/${post.slug}`),
    '/news',
    ...newsPosts.map((post) => `/news/${post.slug}`),
    '/contacto',
    '/registro',
    ...legalLinks.map((link) => link.href),
  ]

  const lastModified = new Date('2026-09-08T00:00:00.000Z')

  return supportedLocales.flatMap((locale) =>
    publicPaths.map((path) => {
      const languages = Object.fromEntries(
        supportedLocales.map((alternateLocale) => [
          alternateLocale,
          new URL(localizePathname(path, alternateLocale), base).toString(),
        ])
      )

      return {
        url: new URL(localizePathname(path, locale), base).toString(),
        lastModified,
        changeFrequency: path === '/' ? 'weekly' : 'monthly',
        priority: path === '/' ? 1 : path === '/features' || path === '/pricing' ? 0.9 : 0.6,
        alternates: {
          languages: {
            ...languages,
            'x-default': new URL(localizePathname(path, 'en'), base).toString(),
          },
        },
      }
    })
  )
}
