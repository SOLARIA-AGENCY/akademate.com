import { describe, expect, it } from 'vitest'
import { CEP_DEFAULT_WEBSITE } from '../defaults'
import {
  buildThumbnailHash,
  findPageBySlug,
  normalizeWebsiteConfig,
  pathFromSlug,
  slugFromPath,
  upsertPageBySlug,
} from '../editor'

describe('website editor utils', () => {
  it('normalizes slug/path both ways', () => {
    expect(slugFromPath('/')).toBe('home')
    expect(slugFromPath('/cursos')).toBe('cursos')
    expect(slugFromPath('/site/sedes')).toBe('site--sedes')
    expect(pathFromSlug('home')).toBe('/')
    expect(pathFromSlug('site--sedes')).toBe('/site/sedes')
  })

  it('adds section metadata defaults when missing', () => {
    const normalized = normalizeWebsiteConfig(CEP_DEFAULT_WEBSITE)
    const home = normalized.pages.find((page) => page.path === '/')
    expect(home).toBeTruthy()
    expect(home?.slug).toBe('home')
    expect(home?.sections[0]?.id).toBeTruthy()
    expect(home?.sections[0]?.enabled).toBe(true)
  })

  it('upserts a single page without mutating other pages', () => {
    const normalized = normalizeWebsiteConfig(CEP_DEFAULT_WEBSITE)
    const originalLength = normalized.pages.length
    const updated = upsertPageBySlug(normalized, 'cursos', {
      ...normalized.pages.find((page) => page.path === '/cursos')!,
      title: 'Cursos Editados',
      path: '/cursos',
      sections: [],
      pageKind: 'courses_index',
    })
    expect(updated.pages.length).toBe(originalLength)
    expect(findPageBySlug(updated, 'cursos')?.title).toBe('Cursos Editados')
    expect(findPageBySlug(updated, 'home')?.title).toBe(
      findPageBySlug(normalized, 'home')?.title
    )
  })

  it('generates deterministic thumbnail hash', () => {
    const normalized = normalizeWebsiteConfig(CEP_DEFAULT_WEBSITE)
    const page = findPageBySlug(normalized, 'home')!
    const hashA = buildThumbnailHash(page, normalized.visualIdentity.colorPrimary)
    const hashB = buildThumbnailHash(page, normalized.visualIdentity.colorPrimary)
    expect(hashA).toBe(hashB)
    expect(hashA.length).toBe(12)
  })
})
