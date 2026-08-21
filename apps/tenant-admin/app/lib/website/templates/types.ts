import type { WebsitePage, WebsiteSection } from '../types'
import type { WebsiteVertical } from './verticals'

export type WebsiteSectionKind = WebsiteSection['kind']

export type WebsiteModuleKind = WebsiteSectionKind

export type WebsiteModuleBindCollection = 'faqs' | 'forms' | 'testimonials' | 'blog'

export type WebsiteTemplateModuleBind = {
  collection: WebsiteModuleBindCollection
  /** Optional source or published filter; apply comes in a later phase. */
  filter?: string
}

type SectionDefaultProps<K extends WebsiteSectionKind> = Omit<
  Extract<WebsiteSection, { kind: K }>,
  'kind' | 'id' | 'enabled' | 'label'
>

export type WebsiteTemplateModule = {
  [K in WebsiteSectionKind]: {
    kind: K
    defaultProps: SectionDefaultProps<K>
    bind?: WebsiteTemplateModuleBind
  }
}[WebsiteSectionKind]

export type WebsiteTemplatePage = {
  slug: string
  title: string
  path: string
  pageKind: WebsitePage['pageKind']
  modules: WebsiteTemplateModule[]
}

export type WebsiteTemplate = {
  vertical: WebsiteVertical
  label: string
  description: string
  pages: WebsiteTemplatePage[]
}

/** Drop persist-only fields so a stored section can seed a template module. */
export function toTemplateModule(section: WebsiteSection): WebsiteTemplateModule {
  switch (section.kind) {
    case 'heroCarousel': {
      const { eyebrow, title, subtitle, slides, primaryCta, secondaryCta } = section
      return { kind: 'heroCarousel', defaultProps: { eyebrow, title, subtitle, slides, primaryCta, secondaryCta } }
    }
    case 'statsStrip':
      return { kind: 'statsStrip', defaultProps: { items: section.items } }
    case 'featureStrip':
      return {
        kind: 'featureStrip',
        defaultProps: { title: section.title, subtitle: section.subtitle, items: section.items },
      }
    case 'ctaBanner':
      return {
        kind: 'ctaBanner',
        defaultProps: { title: section.title, body: section.body, cta: section.cta, theme: section.theme },
      }
    case 'jobPlacement':
      return {
        kind: 'jobPlacement',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          image: section.image,
          badge: section.badge,
          cta: section.cta,
          secondaryCta: section.secondaryCta,
          externalRegistrationUrl: section.externalRegistrationUrl,
        },
      }
    case 'courseList':
      return {
        kind: 'courseList',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          limit: section.limit,
          courseTypes: section.courseTypes,
          featuredOnly: section.featuredOnly,
        },
      }
    case 'cycleList':
      return {
        kind: 'cycleList',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          limit: section.limit,
          featuredOnly: section.featuredOnly,
        },
      }
    case 'convocationList':
      return {
        kind: 'convocationList',
        defaultProps: { title: section.title, subtitle: section.subtitle, limit: section.limit },
      }
    case 'campusList':
      return {
        kind: 'campusList',
        defaultProps: { title: section.title, subtitle: section.subtitle, limit: section.limit },
      }
    case 'categoryGrid':
      return {
        kind: 'categoryGrid',
        defaultProps: { title: section.title, subtitle: section.subtitle, items: section.items },
      }
    case 'teamGrid':
      return {
        kind: 'teamGrid',
        defaultProps: { title: section.title, subtitle: section.subtitle, members: section.members },
      }
    case 'leadForm':
      return {
        kind: 'leadForm',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          source: section.source,
          dark: section.dark,
        },
      }
    case 'faqList':
      return {
        kind: 'faqList',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          limit: section.limit,
          featuredOnly: section.featuredOnly,
        },
        bind: { collection: 'faqs' },
      }
    case 'testimonialList':
      return {
        kind: 'testimonialList',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          limit: section.limit,
        },
        bind: { collection: 'testimonials' },
      }
    case 'formEmbed':
      return {
        kind: 'formEmbed',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          source: section.source,
          formId: section.formId,
        },
        bind: { collection: 'forms' },
      }
    case 'blogList':
      return {
        kind: 'blogList',
        defaultProps: {
          title: section.title,
          subtitle: section.subtitle,
          limit: section.limit,
        },
        bind: { collection: 'blog' },
      }
    case 'richText':
      return {
        kind: 'richText',
        defaultProps: { title: section.title, body: section.body },
      }
    default: {
      const exhaustive: never = section
      return exhaustive
    }
  }
}
