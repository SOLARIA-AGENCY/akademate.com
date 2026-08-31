import { describe, expect, it } from 'vitest'
import {
  ADDITIONAL_ENTITY_PRODUCT_NAME,
  assertEnrollmentBelongsToTenant,
  assertJournalBelongsToTenant,
  consolidateTenantAmounts,
  countLocations,
  countTenants,
  exampleOrganizationAccount,
  includedTenantSeats,
  isOrganizationGroupAcademicTenant,
  locationKindLabel,
  quoteAdditionalEntity,
  requireTenantId,
  resolveNewSiteDecision,
} from '../organization-account'

describe('organization account is N tenants, not N locations', () => {
  it.each([1, 2, 5, 12])('models %s legal-entity tenants under one group', (tenantCount) => {
    const { group, tenants } = exampleOrganizationAccount({
      groupId: 'academy-group',
      name: 'Academy group',
      tenantCount,
    })
    expect(group.tenantSeats).toBe(tenantCount)
    expect(countTenants(tenants)).toBe(tenantCount)
    expect(isOrganizationGroupAcademicTenant(group)).toBe(false)
    expect(tenants.every((tenant) => tenant.groupId === group.id)).toBe(true)
  })

  it('does not treat physical or virtual locations as tenant seats', () => {
    const { group, tenants } = exampleOrganizationAccount({ tenantCount: 2, tenantSeats: 2 })
    const locations = [
      { id: 'loc-1', tenantId: tenants[0].id, kind: 'physical' as const, name: 'North' },
      { id: 'loc-2', tenantId: tenants[0].id, kind: 'physical' as const, name: 'Center' },
      { id: 'loc-3', tenantId: tenants[0].id, kind: 'virtual' as const, name: 'Campus A' },
      { id: 'loc-4', tenantId: tenants[1].id, kind: 'virtual' as const, name: 'Campus B' },
    ]
    expect(countLocations(locations)).toBe(4)
    expect(countTenants(tenants)).toBe(2)
    expect(group.tenantSeats).toBe(2)
    expect(locationKindLabel('physical')).toBe('Sede física')
    expect(locationKindLabel('virtual')).toBe('Campus virtual')
  })

  it('adds a location without consuming a seat when the legal entity is the same', () => {
    const decision = resolveNewSiteDecision({
      sameLegalEntity: true,
      activeTenantId: 'tenant-a',
      locationKind: 'virtual',
    })
    expect(decision).toEqual({
      kind: 'add_location',
      tenantId: 'tenant-a',
      locationKind: 'virtual',
      consumesSeat: false,
    })
  })

  it('consumes one entity seat when the site belongs to another legal entity', () => {
    const decision = resolveNewSiteDecision({
      sameLegalEntity: false,
      activeTenantId: 'tenant-a',
      locationKind: 'physical',
    })
    expect(decision).toEqual({ kind: 'add_tenant', consumesSeat: true })
  })
})

describe('journals and enrollments never belong to the group', () => {
  it('rejects a journal without tenantId', () => {
    expect(() => assertJournalBelongsToTenant({ tenantId: null })).toThrow(/tenantId is required/)
    expect(() => requireTenantId('')).toThrow(/tenantId is required/)
  })

  it('rejects an enrollment without tenantId', () => {
    expect(() => assertEnrollmentBelongsToTenant({ tenantId: undefined })).toThrow(/tenantId is required/)
  })

  it('consolidates totals without emitting a null-tenant row', () => {
    const report = consolidateTenantAmounts([
      { tenantId: 'a', amountCents: 120_000_00 },
      { tenantId: 'b', amountCents: 85_000_00 },
      { tenantId: 'a', amountCents: 1_000_00 },
    ])
    expect(report.byTenant).toEqual({ a: 121_000_00, b: 85_000_00 })
    expect(report.groupTotalCents).toBe(206_000_00)
    expect(Object.keys(report.byTenant)).not.toContain('null')
    expect(Object.keys(report.byTenant).every((id) => id.length > 0)).toBe(true)
  })
})

describe('entity seats', () => {
  it('includes one tenant on every plan; extras are purchased', () => {
    expect(includedTenantSeats('starter')).toBe(1)
    expect(includedTenantSeats('pro')).toBe(1)
    expect(includedTenantSeats('enterprise')).toBe(1)
  })

  it('quotes an additional entity against contracted seats', () => {
    const quote = quoteAdditionalEntity({
      tenantSeats: 3,
      currentTenantCount: 1,
      extraTenants: 1,
      unitPriceMonthlyCents: 12_000,
    })
    expect(quote.productName).toBe(ADDITIONAL_ENTITY_PRODUCT_NAME)
    expect(quote.allowed).toBe(true)
    expect(quote.afterTenantCount).toBe(2)
    expect(quote.remainingSeats).toBe(2)
    expect(quote.monthlyDeltaCents).toBe(12_000)
  })

  it('blocks a new entity when seats are exhausted', () => {
    const quote = quoteAdditionalEntity({
      tenantSeats: 1,
      currentTenantCount: 1,
      unitPriceMonthlyCents: 12_000,
    })
    expect(quote.allowed).toBe(false)
    expect(quote.reason).toBe('seat_exhausted')
    expect(quote.monthlyDeltaCents).toBe(0)
  })
})
