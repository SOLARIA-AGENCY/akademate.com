import type { BlogPost } from '@/lib/blog-posts'
import { localizedAlternates, localizedHref, type Locale } from '@/lib/i18n/routing'

type EditorialUiCopy = {
  index: Record<
    'insight' | 'news',
    { kicker: string; title: string; description: string; readMore: string }
  >
  article: {
    allInsights: string
    allNews: string
    productUpdate: string
    inThisGuide: string
    inThisUpdate: string
    ctaTitle: string
    ctaDescription: string
    ctaLabel: string
    relatedTitle: string
  }
}

const copy: Record<Locale, EditorialUiCopy> = {
  en: {
    index: {
      insight: {
        kicker: 'Akademate insights',
        title: 'Ideas for better academy operations.',
        description: 'Practical guides for growing, teaching and operating with clarity.',
        readMore: 'Read the guide',
      },
      news: {
        kicker: 'Akademate newsroom',
        title: 'Product news and company updates.',
        description: 'New capabilities, operating profiles and platform direction.',
        readMore: 'Read the update',
      },
    },
    article: {
      allInsights: 'All insights',
      allNews: 'All news',
      productUpdate: 'Product update',
      inThisGuide: 'IN THIS GUIDE',
      inThisUpdate: 'IN THIS UPDATE',
      ctaTitle: 'Connect the idea to your academy.',
      ctaDescription:
        'Explore how Akademate can connect your public experience, daily operation and learning journey.',
      ctaLabel: 'See Akademate in action',
      relatedTitle: 'Continue reading',
    },
  },
  es: {
    index: {
      insight: {
        kicker: 'Ideas de Akademate',
        title: 'Ideas para mejorar las operaciones de tu academia.',
        description: 'Guías prácticas para crecer, enseñar y operar con claridad.',
        readMore: 'Leer la guía',
      },
      news: {
        kicker: 'Actualidad de Akademate',
        title: 'Novedades de producto y de empresa.',
        description: 'Nuevas capacidades, perfiles operativos y dirección de la plataforma.',
        readMore: 'Leer la novedad',
      },
    },
    article: {
      allInsights: 'Todas las ideas',
      allNews: 'Todas las novedades',
      productUpdate: 'Novedad de producto',
      inThisGuide: 'EN ESTA GUÍA',
      inThisUpdate: 'EN ESTA NOVEDAD',
      ctaTitle: 'Conecta la idea con tu academia.',
      ctaDescription:
        'Descubre cómo Akademate puede conectar tu experiencia pública, operación diaria y recorrido de aprendizaje.',
      ctaLabel: 'Ve Akademate en acción',
      relatedTitle: 'Sigue leyendo',
    },
  },
}

export function getEditorialUi(locale: Locale): EditorialUiCopy {
  return copy[locale]
}

export function getEditorialPath(post: Pick<BlogPost, 'kind' | 'slug'>): string {
  return `${post.kind === 'news' ? '/news' : '/blog'}/${post.slug}`
}

export function getLocalizedEditorialPath(
  post: Pick<BlogPost, 'kind' | 'slug'>,
  locale: Locale
): string {
  return localizedHref(getEditorialPath(post), locale)
}

export function getEditorialMetadataAlternates(pathname: string, locale: Locale) {
  return {
    canonical: localizedHref(pathname, locale),
    languages: localizedAlternates(pathname, locale).languages,
  }
}

export function getEditorialArticleSchema(post: BlogPost, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': post.kind === 'news' ? 'NewsArticle' : 'Article',
    inLanguage: locale,
    headline: post.title,
    description: post.excerpt,
    image: `https://akademate.com${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'Akademate', url: 'https://akademate.com' },
    mainEntityOfPage: `https://akademate.com${getLocalizedEditorialPath(post, locale)}`,
    keywords: post.keywords.join(', '),
  }
}
