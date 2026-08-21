import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'
import type { WebsitePageCatalogItem, WebsitePageKind } from '@/app/(app)/(dashboard)/contenido/paginas/page-catalog'

export type WebsitePageEditorSection = {
  id: string
  title: string
  enabled: boolean
  body: string
  kind: WebsiteSection['kind']
  image?: string
  alt?: string
  limit?: number
  source?: string
  formId?: string
  featuredOnly?: boolean
}

const CATALOG_ID_TO_KIND: Record<string, WebsiteSection['kind']> = {
  heroCarousel: 'heroCarousel',
  statsStrip: 'statsStrip',
  featureStrip: 'featureStrip',
  ctaBanner: 'ctaBanner',
  cta: 'ctaBanner',
  jobPlacement: 'jobPlacement',
  courseList: 'courseList',
  cycleList: 'cycleList',
  convocationList: 'convocationList',
  campusList: 'campusList',
  categoryGrid: 'categoryGrid',
  teamGrid: 'teamGrid',
  leadForm: 'leadForm',
  faqList: 'faqList',
  testimonialList: 'testimonialList',
  formEmbed: 'formEmbed',
  contactForm: 'formEmbed',
  blogList: 'blogList',
  postList: 'blogList',
  richText: 'richText',
}

export function catalogSectionKind(section: { id?: string; kind?: WebsiteSection['kind'] } | string): WebsiteSection['kind'] {
  if (typeof section === 'string') return CATALOG_ID_TO_KIND[section] ?? 'richText'
  if (section.kind) return section.kind
  return CATALOG_ID_TO_KIND[section.id ?? ''] ?? 'richText'
}

export function catalogKindToApiKind(kind: WebsitePageKind): WebsitePage['pageKind'] {
  switch (kind) {
    case 'faq':
      return 'faq_index'
    case 'home':
    case 'standard':
    case 'contact':
    case 'legal':
    case 'courses_index':
    case 'cycles_index':
    case 'convocations_index':
    case 'campuses_index':
    case 'blog_index':
    case 'login':
      return kind
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function persistSlugForCatalog(page: WebsitePageCatalogItem): string {
  return page.path === '/' ? 'home' : page.slug
}

export function sectionEditorCopy(section: WebsiteSection): string {
  switch (section.kind) {
    case 'ctaBanner':
      return section.body
    case 'heroCarousel':
    case 'featureStrip':
    case 'jobPlacement':
    case 'courseList':
    case 'cycleList':
    case 'convocationList':
    case 'campusList':
    case 'categoryGrid':
    case 'teamGrid':
    case 'leadForm':
    case 'faqList':
    case 'testimonialList':
    case 'formEmbed':
    case 'blogList':
      return section.subtitle ?? ''
    case 'richText':
      return section.body
    case 'statsStrip':
      return section.items.map((item) => `${item.value} ${item.label}`).join(' · ')
    default: {
      const exhaustive: never = section
      return exhaustive
    }
  }
}

export function applyEditorCopy(
  section: WebsiteSection,
  body: string,
  enabled: boolean,
  label: string,
  image?: string,
  alt?: string,
): WebsiteSection {
  switch (section.kind) {
    case 'ctaBanner':
      return { ...section, body, enabled, label, title: label || section.title }
    case 'heroCarousel': {
      const slides = section.slides.length
        ? section.slides.map((slide, index) =>
            index === 0
              ? { ...slide, image: image || slide.image, alt: alt || slide.alt }
              : slide,
          )
        : image
          ? [{ image, alt: alt || label, title: label, subtitle: body }]
          : section.slides
      return { ...section, subtitle: body, enabled, label, title: label || section.title, slides }
    }
    case 'featureStrip':
    case 'jobPlacement':
    case 'courseList':
    case 'cycleList':
    case 'convocationList':
    case 'campusList':
    case 'categoryGrid':
    case 'teamGrid':
    case 'leadForm':
      return { ...section, subtitle: body, enabled, label, title: label || section.title }
    case 'faqList':
    case 'testimonialList':
    case 'blogList':
      return { ...section, subtitle: body, enabled, label, title: label || section.title }
    case 'formEmbed':
      return { ...section, subtitle: body, enabled, label, title: label || section.title }
    case 'richText':
      return { ...section, body, enabled, label, title: label || section.title }
    case 'statsStrip':
      return { ...section, enabled, label }
    default: {
      const exhaustive: never = section
      return exhaustive
    }
  }
}

export function createSectionFromEditor(editor: WebsitePageEditorSection): WebsiteSection {
  const enabled = editor.enabled
  const label = editor.title
  const title = editor.title
  const body = editor.body
  switch (editor.kind) {
    case 'heroCarousel':
      return {
        id: editor.id,
        kind: 'heroCarousel',
        enabled,
        label,
        title,
        subtitle: body,
        slides: editor.image ? [{ image: editor.image, alt: editor.alt || title, title, subtitle: body }] : [],
      }
    case 'statsStrip':
      return { id: editor.id, kind: 'statsStrip', enabled, label, items: [] }
    case 'featureStrip':
      return { id: editor.id, kind: 'featureStrip', enabled, label, title, subtitle: body, items: [] }
    case 'ctaBanner':
      return { id: editor.id, kind: 'ctaBanner', enabled, label, title, body, theme: 'light' }
    case 'jobPlacement':
      return {
        id: editor.id,
        kind: 'jobPlacement',
        enabled,
        label,
        title,
        subtitle: body,
        image: editor.image || '',
        cta: { label: title, href: '/contacto' },
        externalRegistrationUrl: '',
      }
    case 'courseList':
      return { id: editor.id, kind: 'courseList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'cycleList':
      return { id: editor.id, kind: 'cycleList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'convocationList':
      return { id: editor.id, kind: 'convocationList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'campusList':
      return { id: editor.id, kind: 'campusList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'categoryGrid':
      return { id: editor.id, kind: 'categoryGrid', enabled, label, title, subtitle: body, items: [] }
    case 'teamGrid':
      return { id: editor.id, kind: 'teamGrid', enabled, label, title, subtitle: body, members: [] }
    case 'leadForm':
      return { id: editor.id, kind: 'leadForm', enabled, label, title, subtitle: body, source: editor.source || 'website' }
    case 'faqList':
      return { id: editor.id, kind: 'faqList', enabled, label, title, subtitle: body, limit: editor.limit, featuredOnly: editor.featuredOnly }
    case 'testimonialList':
      return { id: editor.id, kind: 'testimonialList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'formEmbed':
      return { id: editor.id, kind: 'formEmbed', enabled, label, title, subtitle: body, source: editor.source, formId: editor.formId }
    case 'blogList':
      return { id: editor.id, kind: 'blogList', enabled, label, title, subtitle: body, limit: editor.limit }
    case 'richText':
      return { id: editor.id, kind: 'richText', enabled, label, title, body }
    default: {
      const exhaustive: never = editor.kind
      return exhaustive
    }
  }
}

export function catalogSectionsToEditor(page: WebsitePageCatalogItem): WebsitePageEditorSection[] {
  return page.sections.map((section) => {
    const id = String(section)
    return {
      id,
      title: id,
      enabled: true,
      body: '',
      kind: catalogSectionKind(id),
    }
  })
}

export function storedPageToEditor(page: WebsitePage, catalog: WebsitePageCatalogItem): WebsitePageEditorSection[] {
  const byId = new Map((page.sections ?? []).map((section) => [section.id ?? section.kind, section]))
  if (page.sections.length === 0) return catalogSectionsToEditor(catalog)

  const fromStored = page.sections.map((section, index) => {
    const heroImage = section.kind === 'heroCarousel' ? section.slides[0] : undefined
    return {
      id: section.id ?? `${section.kind}-${index + 1}`,
      title: section.label || catalog.sections.find((item) => String(item) === section.id) || section.kind,
      enabled: section.enabled !== false,
      body: sectionEditorCopy(section),
      kind: section.kind,
      image: heroImage?.image,
      alt: heroImage?.alt,
    }
  })

  const extras = catalog.sections
    .filter((section) => !byId.has(String(section)))
    .map((section) => ({
      id: String(section),
      title: String(section),
      enabled: true,
      body: '',
      kind: catalogSectionKind(String(section)),
    }))

  return [...fromStored, ...extras]
}

export function editorToWebsitePage(
  catalog: WebsitePageCatalogItem,
  existing: WebsitePage | null,
  sections: WebsitePageEditorSection[],
  seo?: WebsitePage['seo'],
): WebsitePage {
  const existingById = new Map((existing?.sections ?? []).map((section) => [section.id ?? section.kind, section]))

  const nextSections: WebsiteSection[] = sections.map((editor) => {
    const current = existingById.get(editor.id)
    if (current && current.kind === editor.kind) {
      return applyEditorCopy(current, editor.body, editor.enabled, editor.title, editor.image, editor.alt)
    }
    return createSectionFromEditor(editor)
  })

  return {
    title: existing?.title ?? catalog.title,
    path: existing?.path ?? catalog.path,
    slug: persistSlugForCatalog(catalog),
    thumbnailUrl: existing?.thumbnailUrl,
    pageKind: existing?.pageKind ?? catalogKindToApiKind(catalog.pageKind),
    seo: seo ?? existing?.seo ?? { title: catalog.title, description: catalog.title, keywords: [] },
    sections: nextSections.length > 0 ? nextSections : existing?.sections ?? [],
  }
}
