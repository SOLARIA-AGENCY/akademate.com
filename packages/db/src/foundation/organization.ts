import type { OrganizationModel } from '@akademate/types'

export interface FiscalTenantDraft {
  legalName: string
  taxId?: string
  jurisdiction?: string
}

export interface LocationDraft {
  name: string
  kind?: 'physical' | 'virtual' | 'mobile'
}

/**
 * Spec 2.2. A new fiscal identity creates a Tenant.
 * A new physical location of the same company does not.
 */
export function requiresNewTenant(change: {
  newLegalEntity?: FiscalTenantDraft
  newLocation?: LocationDraft
}): boolean {
  return Boolean(change.newLegalEntity)
}

export function organizationModelFor(tenantsInGroup: number, locationsInTenant: number): OrganizationModel {
  if (tenantsInGroup > 1) return 'multi_tenant_group'
  if (locationsInTenant > 1) return 'multi_location'
  return 'single_tenant'
}

export function groupMembershipGrantsTenantAccess(): boolean {
  return false
}
