// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  separatelyBilledItems,
} from '@/lib/pricing-content'
import { getPricingContent, pricingCatalogueSource } from '@/lib/pricing-i18n'

describe('public pricing entitlements', () => {
  const rows = planComparisonSections.flatMap((section) => section.rows)

  it('publishes a detailed, non-duplicated plan comparison', () => {
    expect(planComparisonSections.length).toBeGreaterThanOrEqual(7)
    expect(rows.length).toBeGreaterThanOrEqual(45)
    expect(new Set(rows.map((row) => row.capability)).size).toBe(rows.length)
    expect(Object.values(entitlementLabels)).toEqual([
      'Included',
      'Paid extension',
      'Enterprise scope',
      'Not included',
    ])
  })

  it('never presents access or Digital Signage as included in a base plan', () => {
    for (const capability of [
      'QR attendance and mobile check-in',
      'NFC and RFID identities',
      'Physical access readers and sensors',
      'Digital Signage',
    ]) {
      const row = rows.find((item) => item.capability === capability)
      expect(row).toBeDefined()
      expect([row?.launch, row?.business, row?.enterprise]).toEqual([
        'paid-extension',
        'paid-extension',
        'paid-extension',
      ])
    }
  })

  it('separates Akademate extensions from hardware and provider costs', () => {
    expect(paidExtensions).toHaveLength(8)
    expect(paidExtensions.every((extension) => extension.includes.length === 3)).toBe(true)
    expect(paidExtensions.every((extension) => extension.separateCosts.length > 20)).toBe(true)
    expect(JSON.stringify(separatelyBilledItems)).toMatch(/hardware|readers|sensors/i)
    expect(JSON.stringify(separatelyBilledItems)).toMatch(/screens|players|installation/i)
    expect(JSON.stringify(separatelyBilledItems)).toMatch(/transaction|advertising spend/i)
  })

  it('renders the localized centralized catalogue and explicit paid-extension language', () => {
    const pricingPage = readFileSync(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
    expect(pricingPage).toContain('getPricingContent(locale)')
    expect(pricingPage).toContain('pricing.sections.map')
    expect(pricingPage).toContain('pricing.extensions.map')
    expect(pricingPage).toContain('pricing.separatelyBilledItems.map')
    expect(pricingPage).toContain('page.faqs.map')
    expect(pricingPage).not.toContain("type PlanValue = boolean | 'optional' | 'custom'")
  })

  it('keeps EN and ES structurally identical with non-empty localized public copy', () => {
    const en = getPricingContent('en')
    const es = getPricingContent('es')

    expect(es.sections.map((section) => section.rows.length)).toEqual(
      en.sections.map((section) => section.rows.length)
    )
    expect(es.extensions.map((extension) => extension.id)).toEqual(
      en.extensions.map((extension) => extension.id)
    )
    expect(es.page.cards.map((card) => card.name)).toEqual(en.page.cards.map((card) => card.name))
    expect(es.page.faqs).toHaveLength(en.page.faqs.length)
    expect(JSON.stringify(es)).not.toMatch(/\"\"/)
    expect(es.entitlementLabels).toEqual({
      included: 'Incluido',
      'paid-extension': 'Extensión de pago',
      'enterprise-scope': 'Alcance Enterprise',
      'not-included': 'No incluido',
    })
  })

  it('fails closed when a Spanish capability key is absent', () => {
    const firstSection = pricingCatalogueSource.sections[0]!
    const source = {
      ...pricingCatalogueSource,
      sections: [
        {
          ...firstSection,
          rows: [
            ...firstSection.rows,
            {
              capability: 'Missing Spanish pricing capability',
              launch: 'paid-extension' as const,
              business: 'paid-extension' as const,
              enterprise: 'paid-extension' as const,
            },
          ],
        },
      ],
    }

    expect(() => getPricingContent('es', source)).toThrow('Missing Spanish pricing translation')
  })

  it('fails closed for a mutated entitlement enum', () => {
    const firstSection = pricingCatalogueSource.sections[0]!
    const firstRow = firstSection.rows[0]!
    const source = {
      ...pricingCatalogueSource,
      sections: [
        {
          ...firstSection,
          rows: [
            {
              ...firstRow,
              launch: 'optional' as never,
            },
          ],
        },
      ],
    }

    expect(() => getPricingContent('es', source)).toThrow('Invalid pricing entitlement')
  })

  it('fails closed when extra capacity is added without a Spanish translation', () => {
    const source = {
      ...pricingCatalogueSource,
      sections: [
        ...pricingCatalogueSource.sections,
        {
          title: 'New capacity section',
          description: 'An unapproved scope expansion.',
          rows: [
            {
              capability: 'Additional learner capacity',
              launch: 'not-included' as const,
              business: 'paid-extension' as const,
              enterprise: 'enterprise-scope' as const,
            },
          ],
        },
      ],
    }

    expect(() => getPricingContent('es', source)).toThrow('Missing Spanish pricing translation')
  })

  it('fails closed when a separately billed external cost has no Spanish translation', () => {
    const source = {
      ...pricingCatalogueSource,
      separatelyBilledItems: [
        ...pricingCatalogueSource.separatelyBilledItems,
        'Untranslated provider cost',
      ],
    }

    expect(() => getPricingContent('es', source)).toThrow('Missing Spanish pricing translation')
  })
})
