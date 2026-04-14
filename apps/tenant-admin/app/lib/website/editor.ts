import { createHash } from 'crypto'
import type { WebsiteConfig, WebsitePage, WebsiteSection } from './types'

function sanitizeSlug(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
  return cleaned
}

export function slugFromPath(path: string): string {
  const normalized = sanitizeSlug(path || '/')
  if (!normalized || normalized === '') return 'home'
  return normalized.replace(/\//g, '--')
}

export function pathFromSlug(slug: string): string {
  if (!slug || slug === 'home') return '/'
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, '-')
    .replace(/--/g, '/')
    .replace(/-+/g, '-')
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function normalizeSection(section: WebsiteSection, index: number): WebsiteSection {
  const id = section.id && section.id.trim() !== '' ? section.id : `${section.kind}-${index + 1}`
  return {
    ...section,
    id,
    enabled: section.enabled ?? true,
  }
}

export function getDefaultSectionsForPageKind(pageKind: WebsitePage['pageKind']): WebsiteSection[] {
  switch (pageKind) {
    case 'courses_index':
      return [
        {
          id: 'courses-list',
          enabled: true,
          kind: 'courseList',
          title: 'Cursos',
          subtitle: 'Catálogo dinámico de cursos',
          limit: 12,
        },
      ]
    case 'cycles_index':
      return [
        {
          id: 'cycles-list',
          enabled: true,
          kind: 'cycleList',
          title: 'Ciclos',
          subtitle: 'Oferta de ciclos formativos',
          limit: 12,
        },
      ]
    case 'convocations_index':
      return [
        {
          id: 'convocations-list',
          enabled: true,
          kind: 'convocationList',
          title: 'Convocatorias',
          subtitle: 'Convocatorias abiertas',
          limit: 8,
        },
      ]
    case 'campuses_index':
      return [
        {
          id: 'campuses-list',
          enabled: true,
          kind: 'campusList',
          title: 'Sedes',
          subtitle: 'Nuestras sedes activas',
          limit: 8,
        },
      ]
    case 'contact':
      return [
        {
          id: 'contact-lead-form',
          enabled: true,
          kind: 'leadForm',
          title: 'Solicita información',
          subtitle: 'Te ayudamos a elegir tu formación',
          source: 'website-contact',
        },
      ]
    case 'blog_index':
      return [
        {
          id: 'blog-cta',
          enabled: true,
          kind: 'ctaBanner',
          title: 'Blog de CEP Formación',
          body: 'Noticias y recursos sobre formación y empleabilidad.',
          theme: 'light',
        },
      ]
    case 'faq_index':
      return [
        {
          id: 'faq-cta',
          enabled: true,
          kind: 'ctaBanner',
          title: 'Preguntas frecuentes',
          body: 'Resuelve tus dudas sobre matrícula, sedes y convocatorias.',
          theme: 'light',
        },
      ]
    default:
      return []
  }
}

export function normalizeWebsitePage(page: WebsitePage): WebsitePage {
  const slug = page.slug && page.slug.trim() !== '' ? sanitizeSlug(page.slug) : slugFromPath(page.path)
  const baseSections = page.sections.length ? page.sections : getDefaultSectionsForPageKind(page.pageKind)
  return {
    ...page,
    slug,
    sections: baseSections.map((section, index) => normalizeSection(section, index)),
  }
}

export function normalizeWebsiteConfig(config: WebsiteConfig): WebsiteConfig {
  return {
    ...config,
    pages: config.pages.map((page) => normalizeWebsitePage(page)),
  }
}

export function findPageBySlug(config: WebsiteConfig, slug: string): WebsitePage | null {
  const normalized = sanitizeSlug(slug || 'home')
  return config.pages.find((page) => page.slug === normalized || slugFromPath(page.path) === normalized) ?? null
}

export function upsertPageBySlug(config: WebsiteConfig, slug: string, nextPage: WebsitePage): WebsiteConfig {
  const normalized = sanitizeSlug(slug || 'home')
  const normalizedPage = normalizeWebsitePage(nextPage)
  let replaced = false
  const pages = config.pages.map((page) => {
    const pageSlug = page.slug || slugFromPath(page.path)
    if (pageSlug === normalized) {
      replaced = true
      return normalizedPage
    }
    return page
  })
  if (!replaced) {
    pages.push(normalizedPage)
  }
  return {
    ...config,
    pages,
  }
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildThumbnailHash(page: WebsitePage, colorPrimary: string): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        page: {
          title: page.title,
          path: page.path,
          pageKind: page.pageKind,
          sections: page.sections.map((section) => ({
            id: section.id,
            kind: section.kind,
            enabled: section.enabled,
            label: section.label,
          })),
        },
        colorPrimary,
      })
    )
    .digest('hex')
    .slice(0, 12)
}

export function buildThumbnailSvg(page: WebsitePage, colorPrimary: string, colorText: string): string {
  const subtitle =
    page.sections.find((section) => section.enabled !== false)?.label ||
    page.sections.find((section) => section.enabled !== false)?.kind ||
    page.pageKind
  const safeTitle = escapeSvgText(page.title)
  const safePath = escapeSvgText(page.path)
  const safeSubtitle = escapeSvgText(subtitle)
  const safeColorText = colorText || '#111827'
  const primary = colorPrimary || '#f2014b'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#111827" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1280" height="720" fill="url(#g1)"/>
  <rect x="48" y="48" width="1184" height="624" rx="24" fill="#ffffff" fill-opacity="0.95"/>
  <text x="96" y="176" font-family="Poppins, sans-serif" font-size="64" font-weight="700" fill="${safeColorText}">${safeTitle}</text>
  <text x="96" y="240" font-family="Poppins, sans-serif" font-size="28" font-weight="500" fill="#334155">${safePath}</text>
  <rect x="96" y="296" width="420" height="56" rx="28" fill="${primary}" fill-opacity="0.16"/>
  <text x="126" y="334" font-family="Poppins, sans-serif" font-size="26" font-weight="600" fill="${primary}">${safeSubtitle}</text>
  <text x="96" y="612" font-family="Poppins, sans-serif" font-size="24" fill="#64748b">Akademate Website Builder · Vista previa de página</text>
</svg>`
}
