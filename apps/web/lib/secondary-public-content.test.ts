// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getSecondaryPublicContent, secondaryPublicContent } from '@/lib/secondary-public-content'

const legalRoutes = ['cookies', 'ia', 'privacidad', 'subencargados', 'terminos'] as const

describe('secondary public i18n contract', () => {
  it('keeps company, courses and download metadata/content present in English and Spanish', () => {
    for (const locale of ['en', 'es'] as const) {
      const content = getSecondaryPublicContent(locale)
      expect(content.company.metadata.title).not.toHaveLength(0)
      expect(content.company.title).not.toHaveLength(0)
      expect(content.courses.metadata.description).not.toHaveLength(0)
      expect(content.courses.detail).not.toHaveLength(0)
      expect(content.download.metadata.title).not.toHaveLength(0)
      expect(content.download.comingSoon).not.toHaveLength(0)
      expect(content.apps.previewOnly).not.toHaveLength(0)
    }

    expect(secondaryPublicContent.es.company.title).not.toBe(
      secondaryPublicContent.en.company.title
    )
    expect(secondaryPublicContent.es.courses.title).not.toBe(
      secondaryPublicContent.en.courses.title
    )
  })

  it('keeps every app as a forthcoming preview across locales without changing asset identity', () => {
    const english = getSecondaryPublicContent('en').apps.options
    const spanish = getSecondaryPublicContent('es').apps.options

    expect(spanish.map((option) => option.id)).toEqual(english.map((option) => option.id))
    expect(spanish.map((option) => option.image)).toEqual(english.map((option) => option.image))
    expect(english.every((option) => /coming soon/i.test(option.status))).toBe(true)
    expect(spanish.every((option) => /próximamente/i.test(option.status))).toBe(true)
  })

  it('requires every legal route to select locale-aware content and localized alternates', () => {
    for (const route of legalRoutes) {
      const source = readFileSync(
        new URL(`../app/legal/${route}/page.tsx`, import.meta.url),
        'utf8'
      )
      expect(source, route).toContain('getRequestLocale')
      expect(source, route).toMatch(/localizedAlternates|publicPageMetadata/)
      expect(source, route).toMatch(/\ben:\s*{/)
      expect(source, route).toMatch(/\bes:\s*{/)
    }
  })

  it('does not introduce unverified identity, certification or customer-traction claims', () => {
    const localizedCopy = JSON.stringify(secondaryPublicContent)
    expect(localizedCopy).not.toMatch(
      /certified|certification|official seal|approved by|50\+\s+academias|\+34 912345678|Calle Principal 123/i
    )
  })
})
