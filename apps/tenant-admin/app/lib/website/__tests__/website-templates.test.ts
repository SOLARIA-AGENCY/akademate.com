import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PROFESSIONAL_HOME_MODULE_KINDS,
  WEBSITE_VERTICALS,
  getTemplate,
  listTemplates,
} from '../templates'
import type { WebsiteVertical } from '../templates'

const FORBIDDEN_TOKENS = ['cep', 'tenerife', '#f2014b', '/website/cep/']

function readTemplatesIndex(): string {
  return readFileSync(path.resolve(__dirname, '../templates/index.ts'), 'utf8')
}

describe('website templates catalog', () => {
  it('exposes the four v1 verticals', () => {
    expect(WEBSITE_VERTICALS).toEqual([
      'professional_studies',
      'wellness',
      'sports_academy',
      'coaching',
    ])

    const listed = listTemplates()
    expect(listed).toHaveLength(4)
    expect(listed.map((template) => template.vertical)).toEqual([...WEBSITE_VERTICALS])

    for (const vertical of WEBSITE_VERTICALS) {
      const template = getTemplate(vertical)
      expect(template.vertical).toBe(vertical)
      expect(template.pages.length).toBeGreaterThan(0)
      expect(template.pages.every((page) => page.modules.length > 0 || page.pageKind !== 'home')).toBe(
        true,
      )
    }
  })

  it('matches the intended professional_studies home composition', () => {
    const home = getTemplate('professional_studies').pages.find((page) => page.path === '/')
    expect(home).toBeDefined()
    expect(home?.modules.map((module) => module.kind)).toEqual([...PROFESSIONAL_HOME_MODULE_KINDS])
    expect(home?.modules.map((module) => module.kind)).toEqual([
      'heroCarousel',
      'featureStrip',
      'courseList',
      'convocationList',
      'campusList',
      'leadForm',
    ])
  })

  it('keeps template seeds free of CEP tokens and photography', () => {
    const serialized = JSON.stringify(listTemplates()).toLowerCase()
    expect(FORBIDDEN_TOKENS.filter((token) => serialized.includes(token))).toEqual([])
  })

  it('does not put APROEM in any v1 page pack', () => {
    for (const template of listTemplates()) {
      const pack = template.pages
        .flatMap((page) => [page.slug, page.title, page.path])
        .join(' ')
        .toLowerCase()
      expect(pack, template.vertical).not.toMatch(/aproem/)
    }
  })

  it('includes legal cookies and privacy pages without CEP tokens', () => {
    for (const template of listTemplates()) {
      const paths = template.pages.map((page) => page.path)
      expect(paths, template.vertical).toEqual(expect.arrayContaining(['/legal/privacidad', '/legal/cookies']))
      const legal = template.pages.filter((page) => page.pageKind === 'legal')
      expect(legal.length).toBeGreaterThan(0)
      expect(legal.every((page) => page.modules.some((module) => module.kind === 'richText'))).toBe(true)
    }
  })

  it('resolves getTemplate exhaustively without a default seed', () => {
    const source = readTemplatesIndex()
    expect(source).toMatch(/default:\s*\{\s*const exhaustive: never = vertical/)
    expect(source).not.toMatch(/return WEBSITE_TEMPLATE_CATALOG\[/)
    expect(source).not.toMatch(/fallback/i)

    const allVerticals: WebsiteVertical[] = [
      'professional_studies',
      'wellness',
      'sports_academy',
      'coaching',
    ]
    for (const vertical of allVerticals) {
      expect(getTemplate(vertical).vertical).toBe(vertical)
    }
  })
})
