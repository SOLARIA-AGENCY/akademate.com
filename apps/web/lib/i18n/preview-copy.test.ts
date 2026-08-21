// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { integrationBrands, type ConnectorStatus } from '@/lib/integration-brands'
import type { Locale } from '@/lib/i18n/routing'
import { getPreviewCopy, previewCopy } from './preview-copy'

function stringLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(stringLeaves)
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringLeaves)
  return []
}

describe('marketing preview copy registry', () => {
  it('is complete and non-empty for every supported locale', () => {
    for (const locale of ['en', 'es'] as const) {
      const leaves = stringLeaves(getPreviewCopy(locale))
      expect(leaves.length).toBeGreaterThan(0)
      expect(leaves.every((value) => value.trim().length > 0)).toBe(true)
    }
  })

  it('fails closed for a locale that is not registered at runtime', () => {
    expect(() => getPreviewCopy('fr' as Locale)).toThrow('Missing preview copy for locale: fr')
  })

  it('localises all non-brand preview chrome and connector statuses for Spanish', () => {
    const english = getPreviewCopy('en')
    const spanish = getPreviewCopy('es')

    expect(spanish.website).not.toEqual(english.website)
    expect(spanish.course).not.toEqual(english.course)
    expect(spanish.connectors).not.toEqual(english.connectors)
    expect(spanish.connectors.status).toEqual({
      Available: 'Disponible',
      'Connector-ready': 'Listo para conector',
      Roadmap: 'Hoja de ruta',
      'Payment method': 'Método de pago',
    })
  })

  it('covers every connector status without translating brands themselves', () => {
    const statuses = new Set(Object.values(integrationBrands).map((brand) => brand.status))
    const spanishStatuses = previewCopy.es.connectors.status

    for (const status of statuses) {
      expect(spanishStatuses[status as ConnectorStatus]).toMatch(/\S/)
    }
    expect(integrationBrands.stripe.label).toBe('Stripe')
    expect(integrationBrands.googleads.label).toBe('Google Ads')
  })

  it('keeps transactional invariants and stable identifiers out of the locale registry', () => {
    const distribution = readFileSync(
      new URL('../../components/marketing/WebsiteDistributionPreview.tsx', import.meta.url),
      'utf8'
    )
    const course = readFileSync(
      new URL('../../components/marketing/CourseRegistrationPreview.tsx', import.meta.url),
      'utf8'
    )

    expect(distribution).toContain('academy.akademate.com/creative-leadership')
    expect(course).toContain("const courseUrl = 'academy.akademate.com/creative-leadership'")
    expect(course).toContain("price: '€249'")
    expect(course).toContain("price: '€60'")
    expect(course).toContain('title={copy.course.dateTitle}')
    expect(course).toContain('title="10:00–17:00"')
  })
})
