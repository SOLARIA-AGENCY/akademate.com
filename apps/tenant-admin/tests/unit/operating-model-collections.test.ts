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

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

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

describe('rels_location_sync migration coverage', () => {
  const migration = read('migrations/20260902_rels_location_sync.ts')

  it('adds locations_id to campuses_rels for service_locations hasMany', () => {
    expect(migration).toContain('"campuses_rels"')
    expect(migration).toContain('"locations_id"')
    expect(migration).toContain('campuses_rels_locations_fk')
    expect(migration).toContain('campuses_rels_locations_id_idx')
  })

  it('adds FK and index for course_runs.location_id', () => {
    expect(migration).toContain('course_runs_location_id_locations_id_fk')
    expect(migration).toContain('course_runs_location_idx')
  })

  it('adds course_runs.cycle_id with FK and index', () => {
    expect(migration).toContain('"cycle_id"')
    expect(migration).toContain('course_runs_cycle_id_cycles_id_fk')
    expect(migration).toContain('course_runs_cycle_idx')
  })

  it('registers locations and legal_entities in payload_locked_documents_rels', () => {
    expect(migration).toContain('"payload_locked_documents_rels"')
    expect(migration).toContain('payload_locked_documents_rels_locations_fk')
    expect(migration).toContain('payload_locked_documents_rels_legal_entities_fk')
  })

  it('uses idempotent guards throughout', () => {
    expect(migration).toContain('IF NOT EXISTS')
    expect(migration).toContain('EXCEPTION WHEN duplicate_object THEN null')
  })

  it('is registered in migrations index', () => {
    const index = read('migrations/index.ts')
    expect(index).toContain('20260902_rels_location_sync')
    expect(index).toContain("name: '20260902_rels_location_sync'")
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
