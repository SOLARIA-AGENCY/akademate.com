export const MULTI_ENTITY_AUTHORIZATION_MODE_ENV =
  'AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE' as const

export type MultiEntityAuthorizationMode = 'disabled' | 'shadow'

export const GROUP_CAPABILITIES = [
  'catalog.read',
  'catalog.manage',
  'teachers.read',
  'teachers.manage',
  'public-projection.manage',
] as const

export type GroupCapability = (typeof GROUP_CAPABILITIES)[number]

export const LEGAL_ENTITY_CAPABILITIES = [
  'operations.read',
  'operations.manage',
  'enrollments.read',
  'enrollments.manage',
  'marketing.read',
  'marketing.manage',
  'finance.read',
  'finance.manage',
] as const

export type LegalEntityCapability = (typeof LEGAL_ENTITY_CAPABILITIES)[number]

export type MembershipStatus = 'active' | 'suspended'

export type CampusScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'selected'; readonly campusIds: readonly string[] }

export interface GroupMembership {
  readonly userId: string
  readonly groupId: string
  readonly status: MembershipStatus
  readonly capabilities: readonly GroupCapability[]
}

export interface LegalEntityMembership {
  readonly userId: string
  readonly legalEntityId: string
  readonly status: MembershipStatus
  readonly capabilities: readonly LegalEntityCapability[]
  readonly campusScope: CampusScope
}

export interface GroupAccessRequest {
  readonly scope: 'group'
  readonly userId: string
  readonly groupId: string
  readonly capability: GroupCapability
}

export interface LegalEntityAccessRequest {
  readonly scope: 'legal-entity'
  readonly userId: string
  readonly legalEntityId: string
  readonly capability: LegalEntityCapability
  readonly campusId?: string
}

export type MultiEntityAccessRequest = GroupAccessRequest | LegalEntityAccessRequest

export interface AuthorizationSnapshot {
  readonly groupMemberships: readonly GroupMembership[]
  readonly legalEntityMemberships: readonly LegalEntityMembership[]
}

export type ProposedDecisionReason =
  | 'membership_allows'
  | 'no_active_membership'
  | 'capability_missing'
  | 'campus_required'
  | 'campus_out_of_scope'

export interface ProposedAuthorizationDecision {
  readonly allowed: boolean
  readonly reason: ProposedDecisionReason
}

export interface MultiEntityShadowEvaluation {
  readonly mode: MultiEntityAuthorizationMode
  readonly decisionSource: 'legacy'
  readonly effectiveAllowed: boolean
  readonly proposedDecision: ProposedAuthorizationDecision | null
  readonly divergence: boolean | null
}

export interface MultiEntityShadowInput {
  readonly configuredMode?: string | null
  readonly legacyAllowed: boolean
  readonly request: MultiEntityAccessRequest
  readonly snapshot: AuthorizationSnapshot
}

const CAMPUS_BOUND_CAPABILITIES: ReadonlySet<LegalEntityCapability> = new Set([
  'operations.read',
  'operations.manage',
  'enrollments.read',
  'enrollments.manage',
])

/**
 * Fail closed for unknown values. There is intentionally no enforcement mode in
 * this transition module.
 */
export function resolveMultiEntityAuthorizationMode(
  value: string | null | undefined = process.env[MULTI_ENTITY_AUTHORIZATION_MODE_ENV]
): MultiEntityAuthorizationMode {
  return value === 'shadow' ? 'shadow' : 'disabled'
}

export function evaluateProposedAuthorization(
  request: MultiEntityAccessRequest,
  snapshot: AuthorizationSnapshot
): ProposedAuthorizationDecision {
  return request.scope === 'group'
    ? evaluateGroupAuthorization(request, snapshot.groupMemberships)
    : evaluateLegalEntityAuthorization(request, snapshot.legalEntityMemberships)
}

/**
 * Computes the future decision only for observation. The effective result is
 * always the legacy decision, so this module cannot grant or revoke access.
 */
export function evaluateMultiEntityAuthorizationShadow(
  input: MultiEntityShadowInput
): MultiEntityShadowEvaluation {
  const mode = resolveMultiEntityAuthorizationMode(input.configuredMode)

  if (mode === 'disabled') {
    return {
      mode,
      decisionSource: 'legacy',
      effectiveAllowed: input.legacyAllowed,
      proposedDecision: null,
      divergence: null,
    }
  }

  const proposedDecision = evaluateProposedAuthorization(input.request, input.snapshot)

  return {
    mode,
    decisionSource: 'legacy',
    effectiveAllowed: input.legacyAllowed,
    proposedDecision,
    divergence: input.legacyAllowed !== proposedDecision.allowed,
  }
}

function evaluateGroupAuthorization(
  request: GroupAccessRequest,
  memberships: readonly GroupMembership[]
): ProposedAuthorizationDecision {
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.userId === request.userId &&
      membership.groupId === request.groupId &&
      membership.status === 'active'
  )

  if (activeMemberships.length === 0) {
    return deny('no_active_membership')
  }

  return activeMemberships.some((membership) =>
    membership.capabilities.includes(request.capability)
  )
    ? allow()
    : deny('capability_missing')
}

function evaluateLegalEntityAuthorization(
  request: LegalEntityAccessRequest,
  memberships: readonly LegalEntityMembership[]
): ProposedAuthorizationDecision {
  const activeMemberships = memberships.filter(
    (membership) =>
      membership.userId === request.userId &&
      membership.legalEntityId === request.legalEntityId &&
      membership.status === 'active'
  )

  if (activeMemberships.length === 0) {
    return deny('no_active_membership')
  }

  const capableMemberships = activeMemberships.filter((membership) =>
    membership.capabilities.includes(request.capability)
  )

  if (capableMemberships.length === 0) {
    return deny('capability_missing')
  }

  if (!CAMPUS_BOUND_CAPABILITIES.has(request.capability)) {
    return allow()
  }

  if (request.campusId === undefined || request.campusId.length === 0) {
    return deny('campus_required')
  }

  const campusId = request.campusId

  return capableMemberships.some(
    (membership) =>
      membership.campusScope.kind === 'all' || membership.campusScope.campusIds.includes(campusId)
  )
    ? allow()
    : deny('campus_out_of_scope')
}

function allow(): ProposedAuthorizationDecision {
  return { allowed: true, reason: 'membership_allows' }
}

function deny(
  reason: Exclude<ProposedDecisionReason, 'membership_allows'>
): ProposedAuthorizationDecision {
  return { allowed: false, reason }
}
