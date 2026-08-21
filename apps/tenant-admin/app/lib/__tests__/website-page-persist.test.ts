import { describe, expect, it } from 'vitest'
import { catalogSectionKind, createSectionFromEditor, editorToWebsitePage } from '../website-page-persist'
import type { WebsitePageCatalogItem } from '@/app/(app)/(dashboard)/contenido/paginas/page-catalog'

describe('website page persist', () => {
  it('does not collapse unknown catalog ids to ctaBanner', () => {
    expect(catalogSectionKind('faqList')).toBe('faqList')
    expect(catalogSectionKind('unknown-module')).toBe('richText')
    expect(catalogSectionKind({ id: 'mystery' })).toBe('richText')
    expect(createSectionFromEditor({
      id: 'mystery',
      title: 'Extra',
      enabled: true,
      body: 'Copy',
      kind: catalogSectionKind('unknown-module'),
    }).kind).toBe('richText')
  })

  it('round-trips faqList and formEmbed without rewriting them as ctaBanner', () => {
    const catalog = {
      slug: 'faq',
      title: 'FAQ',
      path: '/faq',
      publicPath: '/faq',
      pageKind: 'faq',
      sections: ['faqList', 'formEmbed'],
    } as WebsitePageCatalogItem

    const next = editorToWebsitePage(catalog, null, [
      { id: 'faqList', title: 'Preguntas', enabled: true, body: '', kind: 'faqList' },
      { id: 'formEmbed', title: 'Formulario', enabled: true, body: '', kind: 'formEmbed', formId: 'form-1' },
    ])

    expect(next.sections.map((section) => section.kind)).toEqual(['faqList', 'formEmbed'])
    expect(next.sections.some((section) => section.kind === 'ctaBanner')).toBe(false)
  })
})
