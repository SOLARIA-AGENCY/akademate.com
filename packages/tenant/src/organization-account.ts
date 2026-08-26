/**
 * Organization account: N tenants per Akademate account.
 * A tenant is one legal entity. A location (physical or virtual) is not a tenant.
 * OrganizationGroup is not an academic tenant and never owns journals or enrollments.
 */

export const LOCATION_KINDS = ['physical', 'virtual'] as const
export type LocationKind = (typeof LOCATION_KINDS)[number]

export const MEMBERSHIP_STATUSES = ['active', 'suspended'] as const
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number]

export const CROSS_TENANT_STUDENT_ACCESS = [
  'NONE',
  'SAME_GROUP_DISCOVERY',
  'SAME_GROUP_ENROLLMENT',
  'SAME_GROUP_SHARED_CAMPUS',
  'CUSTOM',
] as const
export type CrossTenantStudentAccess = (typeof CROSS_TENANT_STUDENT_ACCESS)[number]

export const PLAN_TIERS = ['starter', 'pro', 'enterprise'] as const
export type OrganizationPlanTier = (typeof PLAN_TIERS)[number]

export const DEPLOYMENT_MODES = ['managed_cloud', 'dedicated_cloud', 'on_premise'] as const
export type OrganizationDeploymentMode = (typeof DEPLOYMENT_MODES)[number]

/** Commercial name for a paid extra tenant. Never "seat de sede". */
export const ADDITIONAL_ENTITY_PRODUCT_NAME = 'Entidad adicional'

export type OrganizationGroup = {
  id: string
  name: string
  planTier: OrganizationPlanTier
  deploymentMode: OrganizationDeploymentMode
  /** Contracted maximum of legal-entity tenants. Not a location cap. */
  tenantSeats: number
  crossTenantStudentAccess: CrossTenantStudentAccess
}

export type TenantEntity = {
  id: string
  groupId: string
  legalName: string
  taxId: string
}

export type TenantLocation = {
  id: string
  tenantId: string
  kind: LocationKind
  name: string
}

export type TenantMembership = {
  userId: string
  tenantId: string
  roleId: string
  status: MembershipStatus
  validFrom?: string
  validUntil?: string | null
}

export type StudentMembership = {
  personId: string
  tenantId: string
  status: MembershipStatus
}

export type InstructorEngagement = {
  personId: string
  tenantId: string
  hourlyRateCents: number
  currency: 'EUR'
}

export type ResourceGrant = {
  resourceId: string
  ownerTenantId: string
  granteeTenantId: string
}

export type JournalEntry = {
  id: string
  tenantId: string
  amountCents: number
}

export type EnrollmentRecord = {
  id: string
  tenantId: string
  personId: string
  offeringId: string
}

export type NewSiteDecision =
  | { kind: 'add_location'; tenantId: string; locationKind: LocationKind; consumesSeat: false }
  | { kind: 'add_tenant'; consumesSeat: true }

export type AdditionalEntityQuote = {
  productName: string
  includedSeats: number
  currentTenantCount: number
  requestedExtra: number
  afterTenantCount: number
  remainingSeats: number
  allowed: boolean
  monthlyDeltaCents: number
  reason: 'ok' | 'seat_exhausted' | 'invalid_request'
}

export function includedTenantSeats(planTier: OrganizationPlanTier): number {
  switch (planTier) {
    case 'starter':
    case 'pro':
    case 'enterprise':
      return 1
    default: {
      const _exhaustive: never = planTier
      return _exhaustive
    }
  }
}

export function locationKindLabel(kind: LocationKind): string {
  switch (kind) {
    case 'physical':
      return 'Sede física'
    case 'virtual':
      return 'Campus virtual'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function isOrganizationGroupAcademicTenant(_group: Pick<OrganizationGroup, 'id'>): false {
  return false
}

export function requireTenantId(tenantId: string | null | undefined): string {
  const value = typeof tenantId === 'string' ? tenantId.trim() : ''
  if (!value) {
    throw new Error('tenantId is required')
  }
  return value
}

export function assertJournalBelongsToTenant(entry: {
  tenantId?: string | null
}): asserts entry is { tenantId: string } {
  requireTenantId(entry.tenantId)
}

export function assertEnrollmentBelongsToTenant(record: {
  tenantId?: string | null
}): asserts record is { tenantId: string } {
  requireTenantId(record.tenantId)
}

export function resolveNewSiteDecision(input: {
  sameLegalEntity: boolean
  activeTenantId: string
  locationKind: LocationKind
}): NewSiteDecision {
  if (input.sameLegalEntity) {
    return {
      kind: 'add_location',
      tenantId: requireTenantId(input.activeTenantId),
      locationKind: input.locationKind,
      consumesSeat: false,
    }
  }
  return { kind: 'add_tenant', consumesSeat: true }
}

export function quoteAdditionalEntity(input: {
  tenantSeats: number
  currentTenantCount: number
  extraTenants?: number
  unitPriceMonthlyCents: number
}): AdditionalEntityQuote {
  const extra = input.extraTenants ?? 1
  const included = Math.max(0, Math.floor(input.tenantSeats))
  const current = Math.max(0, Math.floor(input.currentTenantCount))
  if (!Number.isInteger(extra) || extra < 1 || !Number.isInteger(input.unitPriceMonthlyCents) || input.unitPriceMonthlyCents < 0) {
    return {
      productName: ADDITIONAL_ENTITY_PRODUCT_NAME,
      includedSeats: included,
      currentTenantCount: current,
      requestedExtra: extra,
      afterTenantCount: current,
      remainingSeats: Math.max(0, included - current),
      allowed: false,
      monthlyDeltaCents: 0,
      reason: 'invalid_request',
    }
  }
  const after = current + extra
  const remaining = included - current
  const allowed = after <= included
  return {
    productName: ADDITIONAL_ENTITY_PRODUCT_NAME,
    includedSeats: included,
    currentTenantCount: current,
    requestedExtra: extra,
    afterTenantCount: after,
    remainingSeats: Math.max(0, remaining),
    allowed,
    monthlyDeltaCents: allowed ? extra * input.unitPriceMonthlyCents : 0,
    reason: allowed ? 'ok' : 'seat_exhausted',
  }
}

export function consolidateTenantAmounts(
  rows: ReadonlyArray<{ tenantId: string; amountCents: number }>,
): {
  byTenant: Record<string, number>
  groupTotalCents: number
} {
  const byTenant: Record<string, number> = {}
  for (const row of rows) {
    const tenantId = requireTenantId(row.tenantId)
    byTenant[tenantId] = (byTenant[tenantId] ?? 0) + row.amountCents
  }
  const groupTotalCents = Object.values(byTenant).reduce((sum, value) => sum + value, 0)
  return { byTenant, groupTotalCents }
}

export function countTenants(tenants: ReadonlyArray<Pick<TenantEntity, 'id'>>): number {
  return new Set(tenants.map((tenant) => tenant.id)).size
}

export function countLocations(locations: ReadonlyArray<Pick<TenantLocation, 'id'>>): number {
  return new Set(locations.map((location) => location.id)).size
}

/**
 * Example account. N is an argument; 5 is only one possible CEP contract.
 */
export function exampleOrganizationAccount(input: {
  groupId?: string
  name?: string
  planTier?: OrganizationPlanTier
  deploymentMode?: OrganizationDeploymentMode
  tenantCount: number
  tenantSeats?: number
}): {
  group: OrganizationGroup
  tenants: TenantEntity[]
} {
  const tenantCount = Math.max(1, Math.floor(input.tenantCount))
  const groupId = input.groupId ?? 'org-group'
  const group: OrganizationGroup = {
    id: groupId,
    name: input.name ?? 'Academy group',
    planTier: input.planTier ?? 'enterprise',
    deploymentMode: input.deploymentMode ?? 'on_premise',
    tenantSeats: input.tenantSeats ?? tenantCount,
    crossTenantStudentAccess: 'SAME_GROUP_ENROLLMENT',
  }
  const tenants = Array.from({ length: tenantCount }, (_, index) => ({
    id: `${groupId}-tenant-${index + 1}`,
    groupId,
    legalName: `Entidad ${index + 1}`,
    taxId: `B${String(index + 1).padStart(8, '0')}`,
  }))
  return { group, tenants }
}
