/**
 * Campus ≠ location ≠ legal entity.
 *
 * Locations are reusable physical places. Legal entities own journals.
 * Campuses are logical units: one legal_entity, one primary location,
 * N service locations (must include primary).
 *
 * This module is product-generic. Do not put tenant-specific CIF, cities,
 * brands, or seed rows here.
 */

import { resolveNewSiteDecision } from './organization-account'

export const VERIFICATION_STATUSES = ['VERIFIED', 'INTERNAL_ASSUMPTION'] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const CAMPUS_TYPES = ['TRAINING_CENTER', 'TRAINING_PROVIDER', 'ASSOCIATION_TRAINING_CENTER'] as const
export type CampusType = (typeof CAMPUS_TYPES)[number]

export type CampusOperatingFork =
  | { kind: 'same_legal_entity'; createsJournal: false; createsLegalEntity: false; createsPostgres: false }
  | { kind: 'new_legal_entity'; createsJournal: true; createsLegalEntity: true; createsPostgres: false }

export function resolveCampusOperatingFork(sameLegalEntity: boolean): CampusOperatingFork {
  const decision = resolveNewSiteDecision({
    sameLegalEntity,
    activeTenantId: 'active',
    locationKind: 'physical',
  })
  if (decision.kind === 'add_location') {
    return {
      kind: 'same_legal_entity',
      createsJournal: false,
      createsLegalEntity: false,
      createsPostgres: false,
    }
  }
  return {
    kind: 'new_legal_entity',
    createsJournal: true,
    createsLegalEntity: true,
    createsPostgres: false,
  }
}

export function ensurePrimaryInServiceLocations<T extends string | number>(
  primary: T,
  serviceLocations: readonly T[],
): T[] {
  const unique = [...new Set(serviceLocations.filter(Boolean))]
  if (primary && !unique.includes(primary)) unique.unshift(primary)
  return unique
}

export function assertServiceLocationsContainPrimary(
  primaryId: string | number | null | undefined,
  serviceIds: ReadonlyArray<string | number | null | undefined>,
): void {
  if (primaryId == null || primaryId === '') return
  const normalized = serviceIds.map((id) => String(id)).filter((id) => id.length > 0)
  if (!normalized.includes(String(primaryId))) {
    throw new Error('service_locations must include primary_location')
  }
}

export function inferCourseRunLocationId(
  serviceLocationIds: ReadonlyArray<string | number>,
  explicit?: string | number | null,
): string | number | null {
  if (explicit != null && explicit !== '') return explicit
  if (serviceLocationIds.length === 1) return serviceLocationIds[0] ?? null
  return null
}

export function assertCourseRunLocationAllowed(
  serviceLocationIds: ReadonlyArray<string | number>,
  locationId: string | number | null | undefined,
): void {
  if (locationId == null || locationId === '') return
  if (!serviceLocationIds.map(String).includes(String(locationId))) {
    throw new Error('course_run.location_id must belong to campus.service_locations')
  }
}

export function assertUniqueInTenant(
  values: ReadonlyArray<string>,
  label: string,
): void {
  const normalized = values.map((value) => value.trim()).filter(Boolean)
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} must be unique per tenant`)
  }
}
