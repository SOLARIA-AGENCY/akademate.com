import { describe, expect, it } from 'vitest'
import { getHomeExperienceContent, homeExperienceContent } from '@/lib/home-experience-i18n'
import { supportedLocales } from '@/lib/i18n/routing'

const englishSentinels = [
  'Choose a product surface',
  'Academy overview',
  'Active learners',
  'Akademate experiences',
  'Private chat and feedback',
] as const

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(leaves)
  if (value && typeof value === 'object') return Object.values(value).flatMap(leaves)
  return []
}

describe('home experience i18n contract', () => {
  it('ships complete, non-empty, structurally equivalent content for every supported locale', () => {
    const english = getHomeExperienceContent('en')
    for (const locale of supportedLocales) {
      const content = getHomeExperienceContent(locale)
      expect(leaves(content).every((value) => value.trim().length > 0)).toBe(true)
      expect(content.productHero.slides.map(({ id, image }) => ({ id, image }))).toEqual(
        english.productHero.slides.map(({ id, image }) => ({ id, image }))
      )
      expect(content.operations.metrics.map(({ value }) => value)).toEqual(
        english.operations.metrics.map(({ value }) => value)
      )
      expect(content.operations.sessions.map(({ time }) => time)).toEqual(
        english.operations.sessions.map(({ time }) => time)
      )
      expect(
        content.experiences.items.map(({ id, image, capabilities }) => ({
          id,
          image,
          count: capabilities.length,
        }))
      ).toEqual(
        english.experiences.items.map(({ id, image, capabilities }) => ({
          id,
          image,
          count: capabilities.length,
        }))
      )
    }
  })

  it('keeps Spanish copy independent from known English UI sentinels', () => {
    const spanishLeaves = leaves(homeExperienceContent.es)
    for (const sentinel of englishSentinels) expect(spanishLeaves).not.toContain(sentinel)
    expect(homeExperienceContent.es.productHero.slides.map((slide) => slide.id)).toEqual(
      homeExperienceContent.en.productHero.slides.map((slide) => slide.id)
    )
  })

  it('fails closed to the requested locale instead of resolving another locale', () => {
    expect(getHomeExperienceContent('en')).toBe(homeExperienceContent.en)
    expect(getHomeExperienceContent('es')).toBe(homeExperienceContent.es)
    expect(getHomeExperienceContent('es')).not.toBe(homeExperienceContent.en)
  })
})
