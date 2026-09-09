import type { Metadata } from 'next'
import { localizedAlternates, localizePathname, type Locale } from '@/lib/i18n/routing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'

export const PUBLIC_OG_IMAGE = {
  url: '/images/marketing/akademate-og-share-v1.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
} as const

type LocalizedMetadataCopy = {
  en: { title: string; description: string }
  es: { title: string; description: string }
}

export function publicPageMetadata({
  locale,
  pathname,
  copy,
  image = PUBLIC_OG_IMAGE.url,
}: {
  locale: Locale
  pathname: string
  copy: LocalizedMetadataCopy
  image?: string
}): Metadata {
  const current = copy[locale]
  const localizedPathname = localizePathname(pathname, locale)
  const ogImage = {
    url: image,
    alt: current.title,
    width: PUBLIC_OG_IMAGE.width,
    height: PUBLIC_OG_IMAGE.height,
    type: image.endsWith('.jpg') || image.endsWith('.jpeg') ? 'image/jpeg' : undefined,
  }

  return {
    title: current.title,
    description: current.description,
    alternates: localizedAlternates(pathname, locale),
    openGraph: {
      title: current.title,
      description: current.description,
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_GB',
      alternateLocale: locale === 'es' ? ['en_GB'] : ['es_ES'],
      url: localizedPathname,
      siteName: 'Akademate',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: current.title,
      description: current.description,
      images: [image],
    },
  }
}

export function publicRootMetadata(locale: Locale): Metadata {
  const metadata = publicPageMetadata({
    locale,
    pathname: '/',
    copy: {
      en: {
        title: 'Academy management software',
        description:
          'Academy management software for enrolment, timetables, virtual campus, payments and operations. In-person, online and hybrid academies in one platform.',
      },
      es: {
        title: 'Software de gestión de academias',
        description:
          'Software de gestión de academias para matrículas, horarios, campus virtual, pagos y operaciones. Presencial, online e híbrido en una sola plataforma.',
      },
    },
  })

  return {
    ...metadata,
    metadataBase: new URL(siteUrl),
    title: {
      default:
        locale === 'es'
          ? 'Software de gestión de academias | Akademate'
          : 'Academy management software | Akademate',
      template: '%s | Akademate',
    },
    keywords:
      locale === 'es'
        ? [
            'software de gestión de academias',
            'software para academias',
            'plataforma para academias',
            'software centros de formación',
            'gestión de matrículas academias',
            'campus virtual para academias',
            'software academias de idiomas',
          ]
        : [
            'academy management software',
            'academy operating system',
            'course booking software',
            'enrolment software for academies',
            'LMS for academies',
            'academy payments software',
          ],
    authors: [{ name: 'Brik64 LLC' }],
    icons: {
      icon: '/favicon.png',
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.png',
    },
    robots: { index: true, follow: true },
  }
}
