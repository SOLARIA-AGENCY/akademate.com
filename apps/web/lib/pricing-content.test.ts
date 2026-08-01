// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  separatelyBilledItems,
} from '@/lib/pricing-content'

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

  it('renders the centralized catalogue and explicit paid-extension language', () => {
    const pricingPage = readFileSync(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
    expect(pricingPage).toContain('planComparisonSections.map')
    expect(pricingPage).toContain('paidExtensions.map')
    expect(pricingPage).toContain('separatelyBilledItems.map')
    expect(pricingPage).toContain('Paid extension')
    expect(pricingPage).toContain('Are QR, NFC and Digital Signage included?')
    expect(pricingPage).not.toContain("type PlanValue = boolean | 'optional' | 'custom'")
  })
})
