import { describe, expect, it } from 'vitest'

import {
  allPricingRows,
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  separatelyBilledItems,
  type PlanEntitlement,
} from './pricing-content'

const entitlementValues = new Set<PlanEntitlement>([
  'included',
  'paid-extension',
  'enterprise-scope',
  'not-included',
])

const criticalExtensionIds = [
  'qr-mobile-attendance',
  'nfc-rfid',
  'physical-access',
  'digital-signage',
] as const

describe('public pricing catalogue', () => {
  it('keeps the commercial vocabulary closed and unambiguous', () => {
    expect(Object.values(entitlementLabels)).toEqual([
      'Included',
      'Paid extension',
      'Enterprise scope',
      'Not included',
    ])

    for (const row of allPricingRows) {
      expect(entitlementValues.has(row.starter)).toBe(true)
      expect(entitlementValues.has(row.pro)).toBe(true)
      expect(entitlementValues.has(row.enterprise)).toBe(true)
      expect(JSON.stringify(row).toLowerCase()).not.toMatch(/optional|coming soon/)
    }
  })

  it('keeps connected-campus and Digital Signage outside every base plan', () => {
    for (const id of criticalExtensionIds) {
      const row = allPricingRows.find((candidate) => candidate.id === id)

      expect(row).toBeDefined()
      expect(row?.starter).toBe('paid-extension')
      expect(row?.pro).toBe('paid-extension')
      expect(row?.enterprise).toBe('paid-extension')
    }

    const connectedCampus = planComparisonSections.find(
      (section) => section.id === 'connected-campus-extensions'
    )
    expect(connectedCampus?.rows.map((row) => row.id)).toEqual(criticalExtensionIds)
  })

  it('lists software scope separately from equipment and provider costs', () => {
    expect(paidExtensions).toHaveLength(2)
    expect(paidExtensions.map((extension) => extension.id)).toEqual([
      'connected-campus',
      'digital-signage',
    ])
    expect(paidExtensions.every((extension) => extension.includes.length > 20)).toBe(true)
    expect(paidExtensions.every((extension) => extension.separateCosts.length > 20)).toBe(true)

    const connectedCampus = paidExtensions.find((extension) => extension.id === 'connected-campus')
    const digitalSignage = paidExtensions.find((extension) => extension.id === 'digital-signage')
    expect(connectedCampus?.separateCosts.toLowerCase()).toEqual(
      expect.stringMatching(/cards.*tags.*readers.*sensors.*installation.*connectivity.*provider/),
    )
    expect(digitalSignage?.separateCosts.toLowerCase()).toEqual(
      expect.stringMatching(/screens.*players.*mounts.*installation.*connectivity.*third-party/),
    )

    const separateCosts = separatelyBilledItems.join(' ').toLowerCase()
    expect(separateCosts).toContain('hardware')
    expect(separateCosts).toContain('readers')
    expect(separateCosts).toContain('sensors')
    expect(separateCosts).toContain('screens')
    expect(separateCosts).toContain('players')
    expect(separateCosts).toContain('installation')
    expect(separateCosts).toContain('provider')
  })

  it('keeps every section and capability uniquely addressable', () => {
    expect(planComparisonSections.length).toBeGreaterThanOrEqual(5)
    expect(allPricingRows.length).toBeGreaterThanOrEqual(20)

    const sectionIds = planComparisonSections.map((section) => section.id)
    const rowIds = allPricingRows.map((row) => row.id)
    expect(new Set(sectionIds).size).toBe(sectionIds.length)
    expect(new Set(rowIds).size).toBe(rowIds.length)
    expect(planComparisonSections.every((section) => section.rows.length > 0)).toBe(true)
    expect(planComparisonSections.every((section) => section.description.length > 0)).toBe(true)
  })
})
