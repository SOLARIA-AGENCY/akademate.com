import {
  evaluateMultiEntityAuthorizationShadow,
  type AuthorizationSnapshot,
  type LegalEntityCapability,
  type MultiEntityShadowEvaluation,
} from './multi-entity-shadow'

/**
 * Pure observation contract for the future entity/campus boundary of
 * operational Payload resources. It deliberately has no Payload adapter and
 * never changes the current ACL decision.
 */
export const MULTI_ENTITY_OPERATIONAL_ACCESS_MODE_ENV =
  'AKADEMATE_MULTI_ENTITY_OPERATIONAL_ACCESS_MODE' as const

export type MultiEntityOperationalAccessMode = 'disabled' | 'shadow'

export type MultiEntityOperationalResourceType =
  | 'lead'
  | 'enrollment'
  | 'campaign'
  | 'course_run'
  | 'campus'
  | 'classroom'

export interface MultiEntityOperationalResourceOwner {
  readonly resourceType: MultiEntityOperationalResourceType
  readonly resourceId: string
  readonly tenantId: string
  readonly legalEntityId?: string | null
  readonly campusId?: string | null
}

export interface MultiEntityOperationalAccessInput {
  readonly configuredMode?: string | null
  /** The current Payload/legacy ACL result. It is always preserved. */
  readonly legacyAllowed: boolean
  readonly userId: string
  /** Tenant claim resolved by the authenticated request, never by the resource. */
  readonly tenantId: string
  readonly resourceType: MultiEntityOperationalResourceType
  readonly resourceId: string
  readonly resource: MultiEntityOperationalResourceOwner | null
  readonly snapshot: AuthorizationSnapshot
}

export type MultiEntityOperationalAccessDecisionReason =
  | 'membership_allows'
  | 'no_active_membership'
  | 'capability_missing'
  | 'campus_required'
  | 'campus_out_of_scope'
  | 'request_scope_unresolved'
  | 'resource_missing'
  | 'resource_scope_unresolved'
  | 'resource_type_mismatch'
  | 'resource_id_mismatch'
  | 'tenant_mismatch'

export interface MultiEntityOperationalAccessDecision {
  readonly allowed: boolean
  readonly reason: MultiEntityOperationalAccessDecisionReason
  readonly capability: LegalEntityCapability | null
  readonly resourceType: MultiEntityOperationalResourceType | null
  readonly resourceId: string | null
}

export interface MultiEntityOperationalAccessShadowEvaluation {
  readonly mode: MultiEntityOperationalAccessMode
  readonly decisionSource: 'legacy'
  readonly effectiveAllowed: boolean
  readonly proposedDecision: MultiEntityOperationalAccessDecision | null
  readonly divergence: boolean | null
  readonly canApply: false
  readonly changePermissions: false
}

const RESOURCE_CAPABILITIES: Readonly<
  Record<MultiEntityOperationalResourceType, LegalEntityCapability>
> = {
  lead: 'marketing.read',
  campaign: 'marketing.read',
  enrollment: 'enrollments.read',
  course_run: 'operations.read',
  campus: 'operations.read',
  classroom: 'operations.read',
}

const CAMPUS_BOUND_RESOURCES: ReadonlySet<MultiEntityOperationalResourceType> = new Set([
  'enrollment',
  'course_run',
  'campus',
  'classroom',
])

/** Unknown values fail closed to disabled; enforcement is intentionally absent. */
export function resolveMultiEntityOperationalAccessMode(
  value: string | null | undefined = process.env[MULTI_ENTITY_OPERATIONAL_ACCESS_MODE_ENV]
): MultiEntityOperationalAccessMode {
  return value === 'shadow' ? 'shadow' : 'disabled'
}

/**
 * Computes the future entity/campus decision only for observation. The
 * effective result remains the legacy ACL result, so this function cannot
 * grant, revoke or persist permissions.
 */
export function evaluateMultiEntityOperationalAccessShadow(
  input: MultiEntityOperationalAccessInput
): MultiEntityOperationalAccessShadowEvaluation {
  const mode = resolveMultiEntityOperationalAccessMode(input.configuredMode)
  const effectiveAllowed = input.legacyAllowed === true

  if (mode === 'disabled') {
    return {
      mode,
      decisionSource: 'legacy',
      effectiveAllowed,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      changePermissions: false,
    }
  }

  const resourceType = isResourceType(input.resourceType) ? input.resourceType : null
  const resourceId = validIdentifier(input.resourceId) ? input.resourceId : null
  const proposedDecision =
    resourceType === null || resourceId === null
      ? deny('request_scope_unresolved', null, resourceType, resourceId)
      : evaluateResourceAccess(input, resourceType, resourceId)

  return {
    mode,
    decisionSource: 'legacy',
    effectiveAllowed,
    proposedDecision,
    divergence: effectiveAllowed !== proposedDecision.allowed,
    canApply: false,
    changePermissions: false,
  }
}

function evaluateResourceAccess(
  input: MultiEntityOperationalAccessInput,
  resourceType: MultiEntityOperationalResourceType,
  resourceId: string
): MultiEntityOperationalAccessDecision {
  const capability = RESOURCE_CAPABILITIES[resourceType]
  const resource = input.resource

  if (!validIdentifier(input.userId) || !validIdentifier(input.tenantId)) {
    return deny('request_scope_unresolved', capability, resourceType, resourceId)
  }

  if (!resource) {
    return deny('resource_missing', capability, resourceType, resourceId)
  }

  if (resource.resourceType !== resourceType) {
    return deny('resource_type_mismatch', capability, resourceType, resourceId)
  }

  if (resource.resourceId !== resourceId) {
    return deny('resource_id_mismatch', capability, resourceType, resourceId)
  }

  if (!validIdentifier(resource.tenantId)) {
    return deny('resource_scope_unresolved', capability, resourceType, resourceId)
  }

  if (!validIdentifier(resource.legalEntityId)) {
    return deny('resource_scope_unresolved', capability, resourceType, resourceId)
  }

  if (CAMPUS_BOUND_RESOURCES.has(resourceType) && !validIdentifier(resource.campusId)) {
    return deny('resource_scope_unresolved', capability, resourceType, resourceId)
  }

  if (resource.tenantId !== input.tenantId) {
    return deny('tenant_mismatch', capability, resourceType, resourceId)
  }

  const authorization = evaluateMultiEntityAuthorizationShadow({
    configuredMode: 'shadow',
    legacyAllowed: input.legacyAllowed,
    request: {
      scope: 'legal-entity',
      userId: input.userId,
      legalEntityId: resource.legalEntityId,
      capability,
      ...(CAMPUS_BOUND_RESOURCES.has(resourceType)
        ? { campusId: resource.campusId as string }
        : {}),
    },
    snapshot: input.snapshot,
  })

  return mapAuthorizationDecision(authorization, capability, resourceType, resourceId)
}

function mapAuthorizationDecision(
  evaluation: MultiEntityShadowEvaluation,
  capability: LegalEntityCapability,
  resourceType: MultiEntityOperationalResourceType,
  resourceId: string
): MultiEntityOperationalAccessDecision {
  const decision = evaluation.proposedDecision
  if (!decision) {
    return deny('request_scope_unresolved', capability, resourceType, resourceId)
  }
  return {
    allowed: decision.allowed,
    reason: decision.reason,
    capability,
    resourceType,
    resourceId,
  }
}

function deny(
  reason: Exclude<MultiEntityOperationalAccessDecisionReason, 'membership_allows'>,
  capability: LegalEntityCapability | null,
  resourceType: MultiEntityOperationalResourceType | null,
  resourceId: string | null
): MultiEntityOperationalAccessDecision {
  return { allowed: false, reason, capability, resourceType, resourceId }
}

function isResourceType(value: unknown): value is MultiEntityOperationalResourceType {
  return (
    value === 'lead' ||
    value === 'enrollment' ||
    value === 'campaign' ||
    value === 'course_run' ||
    value === 'campus' ||
    value === 'classroom'
  )
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255
}
