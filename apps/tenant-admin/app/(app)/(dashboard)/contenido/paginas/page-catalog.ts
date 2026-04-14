export type WebsitePageKind =
  | 'home'
  | 'standard'
  | 'contact'
  | 'courses_index'
  | 'cycles_index'
  | 'convocations_index'

export type WebsitePageCatalogItem = {
  slug: string
  title: string
  path: string
  publicPath: string
  pageKind: WebsitePageKind
  sections: string[]
}

export const WEBSITE_PAGE_CATALOG: WebsitePageCatalogItem[] = [
  {
    slug: 'inicio',
    title: 'Inicio',
    path: '/',
    publicPath: '/',
    pageKind: 'home',
    sections: [
      'heroCarousel',
      'whyCep',
      'courseList',
      'convocationList',
      'campusList',
      'leadForm',
    ],
  },
  {
    slug: 'quienes-somos',
    title: 'Quiénes somos',
    path: '/quienes-somos',
    publicPath: '/quienes-somos',
    pageKind: 'standard',
    sections: ['hero', 'historia', 'sedeCards', 'certificaciones', 'cta'],
  },
  {
    slug: 'cursos',
    title: 'Cursos',
    path: '/cursos',
    publicPath: '/cursos',
    pageKind: 'courses_index',
    sections: ['header', 'courseList'],
  },
  {
    slug: 'ciclos',
    title: 'Ciclos',
    path: '/ciclos',
    publicPath: '/ciclos',
    pageKind: 'cycles_index',
    sections: ['header', 'cycleList'],
  },
  {
    slug: 'convocatorias',
    title: 'Convocatorias',
    path: '/convocatorias',
    publicPath: '/convocatorias',
    pageKind: 'convocations_index',
    sections: ['header', 'convocationList', 'leadForm'],
  },
  {
    slug: 'contacto',
    title: 'Contacto',
    path: '/contacto',
    publicPath: '/contacto',
    pageKind: 'contact',
    sections: ['contactChannels', 'contactForm'],
  },
]

export function getCatalogPageBySlug(slug: string): WebsitePageCatalogItem | null {
  return WEBSITE_PAGE_CATALOG.find((page) => page.slug === slug) ?? null
}

