import type { Locale } from '@/lib/i18n/routing'
import { stripLocalePrefix } from '@/lib/i18n/routing'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'

const productCopy = {
  en: {
    name: 'Akademate',
    description:
      'Academy management software for enrolment, timetables, virtual campus, payments and operations across in-person, online and hybrid academies.',
  },
  es: {
    name: 'Akademate',
    description:
      'Software de gestión de academias para matrículas, horarios, campus virtual, pagos y operaciones en academias presenciales, online e híbridas.',
  },
} as const

const homeFaq = {
  en: [
    {
      question: 'What is Akademate?',
      answer:
        'Akademate is academy management software for enrolment, timetables, virtual campus, payments and operations. It is a product of Brik64 LLC, doing business as Brik64 Inc.',
    },
    {
      question: 'Does Akademate work for in-person, online and hybrid academies?',
      answer:
        'Yes. Akademate is built for in-person centres, online cohorts and hybrid academies in one workspace.',
    },
    {
      question: 'How can I see Akademate in action?',
      answer: 'Book a demo or start a free trial from akademate.com. Public contact is info@akademate.com.',
    },
  ],
  es: [
    {
      question: '¿Qué es Akademate?',
      answer:
        'Akademate es software de gestión de academias para matrículas, horarios, campus virtual, pagos y operaciones. Es un producto de Brik64 LLC, que opera como Brik64 Inc.',
    },
    {
      question: '¿Akademate sirve para academias presenciales, online e híbridas?',
      answer:
        'Sí. Akademate está pensado para centros presenciales, cohortes online y academias híbridas en un mismo espacio de trabajo.',
    },
    {
      question: '¿Cómo puedo ver Akademate en acción?',
      answer:
        'Reserva una demo o empieza una prueba gratis en akademate.com. El contacto público es info@akademate.com.',
    },
  ],
} as const

const pricingFaq = {
  en: [
    {
      question: 'How do Akademate plans work?',
      answer:
        'Plans are organised around operating scope: Launch, Business and Enterprise. Compare included modules on the pricing page. Paid operational extensions such as attendance hardware and digital signage are listed separately.',
    },
    {
      question: 'Does the website show a public price list?',
      answer:
        'The public site explains plan scope and separately billed items. Contracted prices are confirmed during a demo or trial, not invented on this page.',
    },
    {
      question: 'Can I start with a trial?',
      answer: 'Yes. You can open a free trial for your academy model or book a walkthrough.',
    },
  ],
  es: [
    {
      question: '¿Cómo funcionan los planes de Akademate?',
      answer:
        'Los planes se organizan por alcance operativo: Launch, Business y Enterprise. Compara los módulos incluidos en la página de precios. Las extensiones de pago, como hardware de asistencia y digital signage, se listan aparte.',
    },
    {
      question: '¿El sitio publica una tarifa pública?',
      answer:
        'El sitio explica el alcance de cada plan y los conceptos facturados por separado. Los precios contractuales se confirman en una demo o prueba; no se inventan en esta página.',
    },
    {
      question: '¿Puedo empezar con una prueba?',
      answer: 'Sí. Puedes abrir una prueba gratis para tu modelo de academia o reservar una demo.',
    },
  ],
} as const

function absoluteUrl(pathname: string) {
  return new URL(pathname, siteUrl).toString()
}

function localizedPath(pathname: string, locale: Locale) {
  const normalized = pathname === '/' ? '' : pathname
  return `/${locale}${normalized}`
}

const crumbLabels: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    solutions: 'Solutions',
    blog: 'Blog',
    news: 'News',
    contacto: 'Contact',
    registro: 'Free trial',
    download: 'Download',
    'sobre-nosotros': 'Company',
    legal: 'Legal',
  },
  es: {
    home: 'Inicio',
    features: 'Funciones',
    pricing: 'Precios',
    solutions: 'Soluciones',
    blog: 'Blog',
    news: 'Novedades',
    contacto: 'Contacto',
    registro: 'Prueba gratis',
    download: 'Descargar',
    'sobre-nosotros': 'Empresa',
    legal: 'Legal',
  },
}

export function breadcrumbList(locale: Locale, pathname: string) {
  const clean = stripLocalePrefix(pathname).pathname
  const items: { name: string; item: string }[] = [
    { name: crumbLabels[locale].home ?? 'Home', item: absoluteUrl(localizedPath('/', locale)) },
  ]

  if (clean !== '/') {
    const segments = clean.split('/').filter(Boolean)
    let cursor = ''
    for (const segment of segments) {
      cursor += `/${segment}`
      const vertical = getLocalizedVertical(segment, locale)
      const name =
        vertical?.title ??
        crumbLabels[locale][segment] ??
        segment.replace(/-/g, ' ')
      items.push({
        name,
        item: absoluteUrl(localizedPath(cursor, locale)),
      })
    }
  }

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

function faqNode(entries: readonly { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  }
}

export function faqPage(locale: Locale, pathname: string) {
  const clean = stripLocalePrefix(pathname).pathname
  if (clean === '/') return faqNode(homeFaq[locale])
  if (clean === '/pricing') return faqNode(pricingFaq[locale])
  const verticalMatch = clean.match(/^\/solutions\/([^/]+)$/)
  if (verticalMatch?.[1]) {
    const vertical = getLocalizedVertical(verticalMatch[1], locale)
    if (!vertical) return null
    const questions =
      locale === 'es'
        ? [
            {
              question: `¿Akademate sirve para ${vertical.title.toLowerCase()}?`,
              answer: vertical.description,
            },
            {
              question: '¿Puedo ver el producto y pedir una demo?',
              answer:
                'Sí. Desde cada vertical puedes abrir una prueba gratis o ir a funciones y contacto para una demo.',
            },
          ]
        : [
            {
              question: `Is Akademate built for ${vertical.title.toLowerCase()}?`,
              answer: vertical.description,
            },
            {
              question: 'Can I see the product and book a demo?',
              answer:
                'Yes. Each vertical links to a free trial, plus features and contact if you want a walkthrough.',
            },
          ]
    return faqNode(questions)
  }
  return null
}

export function publicJsonLd(locale: Locale, pathname = '/') {
  const copy = productCopy[locale]
  const organizationId = `${siteUrl}/#organization`
  const websiteId = `${siteUrl}/#website`
  const softwareId = `${siteUrl}/#software`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Akademate',
      legalName: 'Brik64 LLC',
      alternateName: 'Brik64 Inc.',
      url: siteUrl,
      email: 'info@akademate.com',
      logo: new URL('/favicon.png', siteUrl).toString(),
      areaServed: ['ES', 'EU', 'GB', 'US'],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: 'Akademate',
      inLanguage: ['en', 'es'],
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name: copy.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: copy.description,
      url: siteUrl,
      inLanguage: locale,
      publisher: { '@id': organizationId },
    },
    breadcrumbList(locale, pathname),
  ]

  const faq = faqPage(locale, pathname)
  if (faq) graph.push(faq)

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
