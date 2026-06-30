import { describe, expect, it } from 'vitest'
import { WEBSITE_PAGE_CATALOG, getCatalogPageBySlug } from '@/app/(app)/(dashboard)/contenido/paginas/page-catalog'

describe('website page catalog', () => {
  it('contains home page first', () => {
    expect(WEBSITE_PAGE_CATALOG[0]?.slug).toBe('inicio')
    expect(WEBSITE_PAGE_CATALOG[0]?.path).toBe('/')
  })

  it('contains quienes-somos page for top navigation', () => {
    const page = getCatalogPageBySlug('quienes-somos')
    expect(page).not.toBeNull()
    expect(page?.publicPath).toBe('/quienes-somos')
  })

  it('contains APROEM page for public navigation', () => {
    const page = getCatalogPageBySlug('aproem')
    expect(page).not.toBeNull()
    expect(page?.publicPath).toBe('/aproem')
  })

  it('returns null for unknown slug', () => {
    expect(getCatalogPageBySlug('unknown-page')).toBeNull()
  })
})
