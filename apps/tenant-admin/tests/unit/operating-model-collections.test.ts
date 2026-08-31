import { describe, expect, it } from 'vitest'
import { Locations } from '../../src/collections/Locations/Locations'
import { LegalEntities } from '../../src/collections/LegalEntities/LegalEntities'
import { Campuses } from '../../src/collections/Campuses/Campuses'
import { CourseRuns } from '../../src/collections/CourseRuns/CourseRuns'
import { Enrollments } from '../../src/collections/Enrollments/Enrollments'
import {
  assertCourseRunLocationAllowed,
  assertServiceLocationsContainPrimary,
  assertUniqueInTenant,
  ensurePrimaryInServiceLocations,
  inferCourseRunLocationId,
  resolveCampusOperatingFork,
} from '../../src/domain/campus-operating-model'
import { hasMinimumRole } from '../../src/access/roles'
import { allowTenantFieldUpdate } from '../../src/access/tenantAccess'
import { canManageStaff } from '../../src/collections/Staff/access'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function field(collection: { fields: Array<{ name?: string; relationTo?: string; hasMany?: boolean }> }, name: string) {
  return collection.fields.find((item) => item.name === name)
}

describe('operating model collections', () => {
  it('registers Location, LegalEntity and Campus join fields', () => {
    expect(Locations.slug).toBe('locations')
    expect(LegalEntities.slug).toBe('legal-entities')
    expect(field(Campuses, 'legal_entity')?.relationTo).toBe('legal-entities')
    expect(field(Campuses, 'primary_location')?.relationTo).toBe('locations')
    expect(field(Campuses, 'service_locations')?.relationTo).toBe('locations')
    expect(field(Campuses, 'service_locations')?.hasMany).toBe(true)
    expect(field(CourseRuns, 'location')?.relationTo).toBe('locations')
    expect(field(Enrollments, 'campus')?.relationTo).toBe('campuses')
    expect(field(Enrollments, 'location')?.relationTo).toBe('locations')
  })
})

describe('operating model invariants', () => {
  it('keeps primary inside service locations', () => {
    expect(ensurePrimaryInServiceLocations(2, [1, 3])).toEqual([2, 1, 3])
    expect(() => assertServiceLocationsContainPrimary(2, [1, 3])).toThrow(/primary_location/)
    expect(() => assertServiceLocationsContainPrimary(2, [2, 1])).not.toThrow()
  })

  it('rejects a course-run location outside the campus matrix', () => {
    expect(() => assertCourseRunLocationAllowed([10, 11], 99)).toThrow(/service_locations/)
    expect(() => assertCourseRunLocationAllowed([10, 11], 11)).not.toThrow()
    expect(inferCourseRunLocationId([7])).toBe(7)
    expect(inferCourseRunLocationId([7, 8])).toBeNull()
  })

  it('keeps tax_id and location code unique per tenant', () => {
    expect(() => assertUniqueInTenant(['B00000001', 'B00000002'], 'tax_id')).not.toThrow()
    expect(() => assertUniqueInTenant(['B00000001', 'B00000001'], 'tax_id')).toThrow(/unique/)
    expect(() => assertUniqueInTenant(['LOC-A', 'LOC-A'], 'Location.code')).toThrow(/unique/)
  })

  it('forks same legal entity without a new postgres cluster', () => {
    expect(resolveCampusOperatingFork(true).createsPostgres).toBe(false)
    expect(resolveCampusOperatingFork(false)).toMatchObject({
      kind: 'new_legal_entity',
      createsLegalEntity: true,
      createsPostgres: false,
    })
  })
})

describe('campus write permissions', () => {
  it('treats an unknown role as below gestor', () => {
    expect(hasMinimumRole('unknown', 'gestor')).toBe(false)
    expect(hasMinimumRole('superadmin', 'gestor')).toBe(true)
    expect(hasMinimumRole('admin', 'gestor')).toBe(true)
    expect(hasMinimumRole('gestor', 'gestor')).toBe(true)
  })

  it('lets gestor patch without rewriting tenant', () => {
    expect(
      allowTenantFieldUpdate({
        role: 'gestor',
        incomingHasTenantKey: false,
        existingTenant: 1,
      }),
    ).toBe(true)
  })

  it('includes superadmin in canManageStaff', () => {
    expect(canManageStaff({ req: { user: { id: 1, role: 'superadmin' } } } as never)).toBe(true)
  })
})

describe('saas template has no CEP seed dataset', () => {
  it('does not embed CEP CIF, El Trompo or APROEM in tenant-admin defaults', () => {
    const root = join(process.cwd())
    const haystack = [
      'src/domain/campus-operating-model.ts',
      'src/collections/Locations/Locations.ts',
      'src/collections/LegalEntities/LegalEntities.ts',
      'src/collections/Campuses/Campuses.ts',
      'app/(app)/(dashboard)/sedes/nueva/page.tsx',
    ]
      .map((relative) => readFileSync(join(root, relative), 'utf8'))
      .join('\n')
    expect(haystack).not.toMatch(/B70729272/)
    expect(haystack).not.toMatch(/El Trompo/)
    expect(haystack).not.toMatch(/APROEM/)
    expect(haystack).toMatch(/Misma entidad jurídica/)
    expect(haystack).not.toMatch(/cycles_offered/)
  })
})
