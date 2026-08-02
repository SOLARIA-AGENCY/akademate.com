import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { verticals } from '@/lib/marketing-content'
import { getLocalizedVertical } from '@/lib/vertical-i18n'
import {
  getVerticalExperienceContent,
  verticalExperienceSlugs,
} from '@/lib/vertical-experience-content'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const webRoot = process.cwd().endsWith('/apps/web')
  ? process.cwd()
  : resolve(process.cwd(), 'apps/web')

describe('Spanish public vertical surfaces', () => {
  it('routes the directory and both navigation variants through localized authority', () => {
    const directory = read('../app/solutions/page.tsx')
    const header = read('../components/layout/header.tsx')
    expect(directory).toContain('getLocalizedVertical(vertical.slug, locale)')
    expect(directory).toContain('getLocalizedSolutionDetail(vertical.slug, locale)')
    expect(directory).not.toContain('Explore this solution{')
    expect(header.match(/getLocalizedVertical\(vertical\.slug, locale\)/g)).toHaveLength(2)
  })

  it('provides Spanish titles and capabilities for every header entry', () => {
    for (const source of verticals) {
      const localized = getLocalizedVertical(source.slug, 'es')!
      expect(localized.title).not.toBe(source.title)
      expect(localized.capabilities).not.toEqual(source.capabilities)
      expect(localized.capabilities).toHaveLength(source.capabilities.length)
    }
  })

  it('labels product data as illustrative and keeps connector status visible', () => {
    const experience = read('../components/marketing/VerticalProductExperience.tsx')
    const connectors = read('../components/marketing/ConnectorLogos.tsx')
    expect(experience).toContain('chrome.illustrativeExample')
    expect(experience).toContain('chrome.operatingContext')
    expect(experience).toContain('onMouseEnter={() => setActiveId(item.id)}')
    expect(experience).toContain('onFocus={() => setActiveId(item.id)}')
    expect(connectors).toContain('copy.connectors.status[brand.status]')
    expect(connectors).not.toContain('{!compact && (')
  })

  it('discovers courses and app downloads in the localized sitemap', () => {
    const sitemap = read('../app/sitemap.ts')
    expect(sitemap).toContain("'/cursos'")
    expect(sitemap).toContain("'/download'")
  })

  it('gives every vertical a bilingual role story and its own secondary photograph', () => {
    expect(verticalExperienceSlugs.sort()).toEqual(verticals.map(({ slug }) => slug).sort())
    const images = new Set<string>()
    for (const { slug } of verticals) {
      const english = getVerticalExperienceContent(slug, 'en')!
      const spanish = getVerticalExperienceContent(slug, 'es')!
      expect(english.roles).toHaveLength(3)
      expect(spanish.roles).toHaveLength(3)
      expect(spanish.title).not.toBe(english.title)
      expect(spanish.description).not.toBe(english.description)
      expect(spanish.cta).not.toBe(english.cta)
      expect(spanish.image).toBe(english.image)
      expect(spanish.imageAlt).not.toBe(english.imageAlt)
      expect(existsSync(resolve(webRoot, 'public', spanish.image.replace(/^\//, '')))).toBe(true)
      images.add(spanish.image)
    }
    expect(images.size).toBe(verticals.length)
  })
})
