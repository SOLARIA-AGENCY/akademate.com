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
      return section.subtitle ?? ''
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
    case 'statsStrip':
      return { ...section, enabled, label }
    default: {
      const exhaustive: never = section
      return exhaustive
    }
  }
}

export function catalogSectionsToEditor(page: WebsitePageCatalogItem): WebsitePageEditorSection[] {
  return page.sections.map((section) => ({
    id: section.id,
    title: section.label,
    enabled: true,
    body: '',
    kind: section.id === 'heroCarousel' ? 'heroCarousel' : 'ctaBanner',
  }))
}

export function storedPageToEditor(page: WebsitePage, catalog: WebsitePageCatalogItem): WebsitePageEditorSection[] {
  const byId = new Map((page.sections ?? []).map((section) => [section.id ?? section.kind, section]))
  if (page.sections.length === 0) return catalogSectionsToEditor(catalog)

  const fromStored = page.sections.map((section, index) => {
    const heroImage = section.kind === 'heroCarousel' ? section.slides[0] : undefined
    return {
      id: section.id ?? `${section.kind}-${index + 1}`,
      title: section.label || catalog.sections.find((item) => item.id === section.id)?.label || section.kind,
      enabled: section.enabled !== false,
      body: sectionEditorCopy(section),
      kind: section.kind,
      image: heroImage?.image,
      alt: heroImage?.alt,
    }
  })

  const extras = catalog.sections
    .filter((section) => !byId.has(section.id))
    .map((section) => ({
      id: section.id,
      title: section.label,
      enabled: true,
      body: '',
      kind: 'ctaBanner' as const,
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
    if (current) {
      return applyEditorCopy(current, editor.body, editor.enabled, editor.title, editor.image, editor.alt)
    }
    return {
      id: editor.id,
      kind: 'ctaBanner',
      enabled: editor.enabled,
      label: editor.title,
      title: editor.title,
      body: editor.body,
      theme: 'light',
    } satisfies WebsiteSection
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
