/**
 * Runtime ownership scope for operational resources.
 *
 * This module is intentionally a pure observation contract. It does not read
 * Payload, users or memberships and it cannot enforce, grant, revoke or
 * change permissions. Until the schema authority and staging backfill gates
 * are approved, callers must use the shadow evaluator only.
 */

export const MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV =
  'AKADEMATE_MULTI_ENTITY_RUNTIME_SCOPE_MODE' as const

export type MultiEntityRuntimeScopeMode = 'disabled' | 'shadow'

export type MultiEntityRuntimeResourceType =
  | 'enrollment'
  | 'course_run'
  | 'campaign'
  | 'lead'
  | 'campus'
  | 'classroom'
  | 'media'

export interface MultiEntityRuntimeScopeContext {
  /** Must be derived from authenticated claims/membership, never client input. */
  readonly tenantId: string
  readonly legalEntityId?: string | null
  readonly campusId?: string | null
}

export interface MultiEntityRuntimeResourceOwner {
  readonly resourceType: MultiEntityRuntimeResourceType
  readonly resourceId: string
  readonly tenantId: string
  readonly legalEntityId?: string | null
  readonly campusId?: string | null
}

export interface MultiEntityRuntimeScopeInput {
  readonly configuredMode?: string | null
  readonly legacyAllowed: boolean
  readonly context: MultiEntityRuntimeScopeContext
  readonly resourceType: MultiEntityRuntimeResourceType
  readonly resourceId: string
  readonly resource: MultiEntityRuntimeResourceOwner | null
}

export type MultiEntityRuntimeScopeDecisionReason =
  | 'scope_match'
  | 'request_scope_unresolved'
  | 'resource_missing'
  | 'resource_scope_unresolved'
  | 'resource_type_mismatch'
  | 'resource_id_mismatch'
  | 'tenant_mismatch'
  | 'legal_entity_mismatch'
  | 'campus_mismatch'

export interface MultiEntityRuntimeScopeDecision {
  readonly allowed: boolean
  readonly reason: MultiEntityRuntimeScopeDecisionReason
  readonly resourceType: MultiEntityRuntimeResourceType | null
  readonly resourceId: string | null
}

export interface MultiEntityRuntimeScopeShadowEvaluation {
  readonly mode: MultiEntityRuntimeScopeMode
  readonly decisionSource: 'legacy'
  readonly effectiveAllowed: boolean
  readonly proposedDecision: MultiEntityRuntimeScopeDecision | null
  readonly divergence: boolean | null
  readonly canApply: false
  readonly changePermissions: false
}

/**
 * Unknown values fail closed to disabled. There is deliberately no
 * enforcement mode in this transition contract.
 */
export function resolveMultiEntityRuntimeScopeMode(
  value: string | null | undefined = process.env[MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV]
): MultiEntityRuntimeScopeMode {
  return value === 'shadow' ? 'shadow' : 'disabled'
}

/**
 * Compares explicit ownership scopes. Missing entity or campus data is not
 * treated as a match: legacy records must be resolved before enforcement can
 * ever be considered.
 */
function evaluateProposedMultiEntityRuntimeScope(
  context: MultiEntityRuntimeScopeContext,
  resourceType: MultiEntityRuntimeResourceType,
  resourceId: string,
  resource: MultiEntityRuntimeResourceOwner | null
): MultiEntityRuntimeScopeDecision {
  if (!validIdentifier(context.tenantId) || !validIdentifier(context.legalEntityId)) {
    return deny('request_scope_unresolved', resourceType, resourceId)
  }

  if (!validIdentifier(context.campusId)) {
    return deny('request_scope_unresolved', resourceType, resourceId)
  }

  if (resource === null) {
    return deny('resource_missing', resourceType, resourceId)
  }

  if (!isRuntimeResourceType(resource.resourceType) || resource.resourceType !== resourceType) {
    return deny('resource_type_mismatch', resourceType, resourceId)
  }

  if (resource.resourceId !== resourceId) {
    return deny('resource_id_mismatch', resourceType, resourceId)
  }

  if (
    !validIdentifier(resource.tenantId) ||
    !validIdentifier(resource.legalEntityId) ||
    !validIdentifier(resource.campusId)
  ) {
    return deny('resource_scope_unresolved', resourceType, resourceId)
  }

  if (resource.tenantId !== context.tenantId) {
    return deny('tenant_mismatch', resourceType, resourceId)
  }

  if (resource.legalEntityId !== context.legalEntityId) {
    return deny('legal_entity_mismatch', resourceType, resourceId)
  }

  if (resource.campusId !== context.campusId) {
    return deny('campus_mismatch', resourceType, resourceId)
  }

  return {
    allowed: true,
    reason: 'scope_match',
    resourceType,
    resourceId,
  }
}

/**
 * Computes the future resource-scope decision only for observation. The
 * effective result is always the current legacy decision.
 */
export function evaluateMultiEntityRuntimeScopeShadow(
  input: MultiEntityRuntimeScopeInput
): MultiEntityRuntimeScopeShadowEvaluation {
  const mode = resolveMultiEntityRuntimeScopeMode(input.configuredMode)
  const legacyAllowed = input.legacyAllowed === true

  if (mode === 'disabled') {
    return {
      mode,
      decisionSource: 'legacy',
      effectiveAllowed: legacyAllowed,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      changePermissions: false,
    }
  }

  const resourceType = isRuntimeResourceType(input.resourceType) ? input.resourceType : null
  const resourceId = validIdentifier(input.resourceId) ? input.resourceId : null
  const context = isObjectRecord(input.context) ? input.context : null
  const resource = isObjectRecord(input.resource) ? input.resource : null
  const proposedDecision =
    resourceType === null || resourceId === null || context === null
      ? deny('request_scope_unresolved', resourceType, resourceId)
      : evaluateProposedMultiEntityRuntimeScope(
          context as MultiEntityRuntimeScopeContext,
          resourceType,
          resourceId,
          resource as MultiEntityRuntimeResourceOwner | null
        )

  return {
    mode,
    decisionSource: 'legacy',
    effectiveAllowed: legacyAllowed,
    proposedDecision,
    divergence: legacyAllowed !== proposedDecision.allowed,
    canApply: false,
    changePermissions: false,
  }
}

function deny(
  reason: Exclude<MultiEntityRuntimeScopeDecisionReason, 'scope_match'>,
  resourceType: MultiEntityRuntimeResourceType | null,
  resourceId: string | null
): MultiEntityRuntimeScopeDecision {
  return { allowed: false, reason, resourceType, resourceId }
}

function isRuntimeResourceType(value: unknown): value is MultiEntityRuntimeResourceType {
  return (
    value === 'enrollment' ||
    value === 'course_run' ||
    value === 'campaign' ||
    value === 'lead' ||
    value === 'campus' ||
    value === 'classroom' ||
    value === 'media'
  )
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validIdentifier(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255
}
