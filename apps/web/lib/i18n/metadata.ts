import type { Metadata } from 'next'
import { localizedAlternates, localizePathname, type Locale } from '@/lib/i18n/routing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'

type LocalizedMetadataCopy = {
  en: { title: string; description: string }
  es: { title: string; description: string }
}

export function publicPageMetadata({
  locale,
  pathname,
  copy,
  image = '/images/marketing/akademate-product-ecosystem-v2.png',
}: {
  locale: Locale
  pathname: string
  copy: LocalizedMetadataCopy
  image?: string
}): Metadata {
  const current = copy[locale]
  const localizedPathname = localizePathname(pathname, locale)

  return {
    title: current.title,
    description: current.description,
    alternates: localizedAlternates(pathname, locale),
    openGraph: {
      title: current.title,
      description: current.description,
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_GB',
      url: localizedPathname,
      siteName: 'Akademate',
      images: [{ url: image, alt: current.title }],
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
        title: 'Akademate | Run your academy and grow',
        description:
          'Connect enrolment, operations, learning, payments and performance in one academy platform.',
      },
      es: {
        title: 'Akademate | Gestiona y haz crecer tu academia',
        description:
          'Conecta matrículas, operaciones, aprendizaje, pagos y rendimiento en una plataforma para academias.',
      },
    },
  })

  return {
    ...metadata,
    metadataBase: new URL(siteUrl),
    title: {
      default: String(metadata.title),
      template: '%s | Akademate',
    },
    keywords:
      locale === 'es'
        ? [
            'software de gestión de academias',
            'operaciones educativas',
            'reservas de cursos',
            'campus virtual',
            'pagos para academias',
          ]
        : [
            'academy management',
            'education operations',
            'booking software',
            'learning management',
            'academy payments',
          ],
    authors: [{ name: 'SOLARIA Agency' }],
    icons: {
      icon: '/favicon.png',
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.png',
    },
    robots: { index: true, follow: true },
  }
}
