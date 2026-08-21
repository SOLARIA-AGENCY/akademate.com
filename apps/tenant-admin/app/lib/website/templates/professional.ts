import { NEUTRAL_DEFAULT_WEBSITE } from '../neutral-defaults'
import type { WebsitePage } from '../types'
import { legalTemplatePages } from './legal'
import { toTemplateModule, type WebsiteTemplate, type WebsiteTemplateModule, type WebsiteTemplatePage } from './types'

/**
 * Intended home composition for professional studies.
 * Neutral home also has cycleList; that page lives at /ciclos, not on home.
 */
export const PROFESSIONAL_HOME_MODULE_KINDS = [
  'heroCarousel',
  'featureStrip',
  'courseList',
  'convocationList',
  'campusList',
  'leadForm',
] as const

function slugFromNeutralPage(page: WebsitePage): string {
  if (page.path === '/') return 'inicio'
  return page.path.replace(/^\//, '').replace(/\//g, '-')
}

function modulesForNeutralPage(page: WebsitePage): WebsiteTemplateModule[] {
  if (page.pageKind === 'home') {
    return PROFESSIONAL_HOME_MODULE_KINDS.map((kind) => {
      const section = page.sections.find((item) => item.kind === kind)
      if (!section) {
        throw new Error(`NEUTRAL_DEFAULT_WEBSITE home is missing ${kind}`)
      }
      return toTemplateModule(section)
    })
  }

  if (page.sections.length > 0) {
    return page.sections.map((section) => toTemplateModule(section))
  }

  switch (page.pageKind) {
    case 'courses_index':
      return [
        {
          kind: 'courseList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Catálogo de cursos por área formativa y modalidad.',
            limit: 12,
          },
        },
      ]
    case 'cycles_index':
      return [
        {
          kind: 'cycleList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Oferta de ciclos formativos con información actualizada.',
            limit: 12,
          },
        },
      ]
    case 'convocations_index':
      return [
        {
          kind: 'convocationList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Listado de convocatorias abiertas y plazas disponibles.',
            limit: 8,
          },
        },
      ]
    case 'campuses_index':
      return [
        {
          kind: 'campusList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Información de las sedes y campus activos.',
            limit: 8,
          },
        },
      ]
    case 'blog_index':
      return [
        {
          kind: 'blogList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Noticias y artículos publicados por el centro.',
            limit: 6,
          },
          bind: { collection: 'blog' },
        },
      ]
    case 'faq_index':
      return [
        {
          kind: 'faqList',
          defaultProps: {
            title: page.title,
            subtitle: page.seo?.description ?? 'Respuestas a las dudas más habituales sobre matrícula y convocatorias.',
          },
          bind: { collection: 'faqs' },
        },
      ]
    case 'contact':
      return [
        {
          kind: 'leadForm',
          defaultProps: {
            title: 'Solicita información',
            subtitle: page.seo?.description ?? 'Cuéntanos qué te interesa y te respondemos.',
            source: 'website-contact',
          },
        },
      ]
    case 'home':
    case 'standard':
    case 'legal':
      return [
        {
          kind: 'richText',
          defaultProps: {
            title: page.title,
            body: page.seo?.description ?? 'Información legal del centro. El texto público se personaliza por tenant.',
          },
        },
      ]
    case 'course_detail_template':
    case 'convocation_detail_template':
    case 'cycle_detail_template':
    case 'campus_detail_template':
    case 'login':
      return []
    default: {
      const exhaustive: never = page.pageKind
      return exhaustive
    }
  }
}

function pageFromNeutral(page: WebsitePage): WebsiteTemplatePage {
  return {
    slug: slugFromNeutralPage(page),
    title: page.title,
    path: page.path,
    pageKind: page.pageKind,
    modules: modulesForNeutralPage(page),
  }
}

export const PROFESSIONAL_STUDIES_TEMPLATE: WebsiteTemplate = {
  vertical: 'professional_studies',
  label: 'Estudios profesionales',
  description: 'Ciclos, cursos y convocatorias. Composición alineada con la plantilla neutra.',
  pages: [...NEUTRAL_DEFAULT_WEBSITE.pages.map(pageFromNeutral), ...legalTemplatePages()],
}
