export const FINANCE_READ_AUTHORIZATION_MODE_ENV =
  'AKADEMATE_CEP_FINANCE_AUTHORIZATION_MODE' as const

export type FinanceReadAuthorizationMode = 'disabled' | 'shadow'

export type FinanceReadAuthorizationReason =
  | 'membership_allows'
  | 'membership_missing'
  | 'membership_suspended'
  | 'capability_missing'
  | 'tenant_mismatch'
  | 'connection_not_reviewed'
  | 'connection_not_read_only'
  | 'connection_inactive'
  | 'input_invalid'
  | 'platform_superadmin_not_business_authority'

export type FinanceReadCapability = 'finance.read' | 'finance.manage'

export interface FinanceReadAuthorizationScope {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly connectionId: string
}

export interface FinanceReadAuthorizationPrincipal {
  readonly userId: string
  readonly tenantId: string | null
  /** A platform superadmin is not a business membership. */
  readonly isPlatformSuperadmin: boolean
}

export interface FinanceReadAuthorizationMembership {
  readonly userId: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly status: 'active' | 'suspended'
  readonly capabilities: readonly FinanceReadCapability[]
}

export interface ReviewedFinanceReadConnection {
  readonly scope: FinanceReadAuthorizationScope
  readonly integrationMode: 'read_only' | 'write'
  readonly connectionStatus: 'active' | 'inactive' | 'suspended'
  readonly reviewReference: string
}

export interface FinanceReadAuthorizationInput {
  readonly configuredMode?: string | null
  /** The current production decision. It is never replaced by this module. */
  readonly currentEffectiveAllowed: boolean
  readonly principal: FinanceReadAuthorizationPrincipal
  readonly scope: FinanceReadAuthorizationScope
  readonly memberships: readonly FinanceReadAuthorizationMembership[]
  readonly reviewedConnections: readonly ReviewedFinanceReadConnection[]
}

export interface FinanceReadAuthorizationDecision {
  readonly allowed: boolean
  readonly reason: FinanceReadAuthorizationReason
}

export interface FinanceReadAuthorizationShadowEvaluation {
  readonly mode: FinanceReadAuthorizationMode
  readonly decisionSource: 'legacy'
  readonly effectiveAllowed: boolean
  readonly proposedDecision: FinanceReadAuthorizationDecision | null
  readonly divergence: boolean | null
  readonly canApply: false
  readonly canChangePermissions: false
}

export class FinanceReadAuthorizationError extends Error {
  readonly code: string

  constructor(code: string, message = 'Finance read authorization input is invalid.') {
    super(message)
    this.name = 'FinanceReadAuthorizationError'
    this.code = code
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const MAX_MEMBERSHIPS = 10_000
const MAX_CONNECTIONS = 100
const CAPABILITIES = new Set<FinanceReadCapability>(['finance.read', 'finance.manage'])

/** Unsupported values fail closed to the legacy-only path. */
export function resolveFinanceReadAuthorizationMode(
  value: string | null | undefined = process.env[FINANCE_READ_AUTHORIZATION_MODE_ENV]
): FinanceReadAuthorizationMode {
  return value === 'shadow' ? 'shadow' : 'disabled'
}

/**
 * Computes a future finance decision without changing the current decision.
 * There is deliberately no enforced mode, write capability, or permission
 * mutation in this contract.
 */
export function evaluateFinanceReadAuthorizationShadow(
  input: FinanceReadAuthorizationInput
): FinanceReadAuthorizationShadowEvaluation {
  assertCurrentDecision(input)
  const mode = resolveFinanceReadAuthorizationMode(input.configuredMode)

  if (mode === 'disabled') {
    return Object.freeze({
      mode,
      decisionSource: 'legacy',
      effectiveAllowed: input.currentEffectiveAllowed,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      canChangePermissions: false,
    })
  }

  const proposedDecision = evaluateProposedFinanceReadAuthorization(input)
  return Object.freeze({
    mode,
    decisionSource: 'legacy',
    effectiveAllowed: input.currentEffectiveAllowed,
    proposedDecision,
    divergence: input.currentEffectiveAllowed !== proposedDecision.allowed,
    canApply: false,
    canChangePermissions: false,
  })
}

/**
 * Evaluates one entity and one reviewed accounting connection. A matching
 * `finance.read` membership is required; `finance.manage` is intentionally not
 * treated as an implicit read grant so the future policy stays granular.
 */
export function evaluateProposedFinanceReadAuthorization(
  input: FinanceReadAuthorizationInput
): FinanceReadAuthorizationDecision {
  try {
    return evaluateValidatedFinanceReadAuthorization(input)
  } catch (error) {
    if (error instanceof FinanceReadAuthorizationError) return deny('input_invalid')
    throw error
  }
}

function evaluateValidatedFinanceReadAuthorization(
  input: FinanceReadAuthorizationInput
): FinanceReadAuthorizationDecision {
  validateShadowInput(input)

  if (input.principal.tenantId !== input.scope.tenantId) {
    return deny('tenant_mismatch')
  }

  const reviewedConnection = input.reviewedConnections.find(
    ({ scope }) =>
      scope.tenantId === input.scope.tenantId &&
      scope.legalEntityId === input.scope.legalEntityId &&
      scope.connectionId === input.scope.connectionId
  )
  if (!reviewedConnection) return deny('connection_not_reviewed')
  if (reviewedConnection.integrationMode !== 'read_only') {
    return deny('connection_not_read_only')
  }
  if (reviewedConnection.connectionStatus !== 'active') return deny('connection_inactive')

  const memberships = input.memberships.filter(
    (membership) =>
      membership.userId === input.principal.userId &&
      membership.tenantId === input.scope.tenantId &&
      membership.legalEntityId === input.scope.legalEntityId
  )
  if (memberships.length === 0) {
    return input.principal.isPlatformSuperadmin
      ? deny('platform_superadmin_not_business_authority')
      : deny('membership_missing')
  }
  if (memberships.every(({ status }) => status === 'suspended')) {
    return deny('membership_suspended')
  }
  if (
    memberships.some(
      ({ status, capabilities }) => status === 'active' && capabilities.includes('finance.read')
    )
  ) {
    return allow()
  }
  return deny('capability_missing')
}

function assertCurrentDecision(input: FinanceReadAuthorizationInput): void {
  if (!input || typeof input !== 'object' || typeof input.currentEffectiveAllowed !== 'boolean') {
    throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_INPUT_INVALID')
  }
}

function validateShadowInput(input: FinanceReadAuthorizationInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !input.principal ||
    !input.scope ||
    !Array.isArray(input.memberships) ||
    input.memberships.length > MAX_MEMBERSHIPS ||
    !Array.isArray(input.reviewedConnections) ||
    input.reviewedConnections.length > MAX_CONNECTIONS
  ) {
    throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_INPUT_INVALID')
  }

  validatePrincipal(input.principal)
  validateScope(input.scope)
  validateMemberships(input.memberships)
  validateReviewedConnections(input.reviewedConnections)
}

function validatePrincipal(principal: FinanceReadAuthorizationPrincipal): void {
  if (
    !principal ||
    typeof principal !== 'object' ||
    !validIdentifier(principal.userId) ||
    (principal.tenantId !== null && !validIdentifier(principal.tenantId)) ||
    typeof principal.isPlatformSuperadmin !== 'boolean'
  ) {
    throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_PRINCIPAL_INVALID')
  }
}

function validateScope(scope: FinanceReadAuthorizationScope): void {
  if (
    !scope ||
    typeof scope !== 'object' ||
    !validIdentifier(scope.tenantId) ||
    !validIdentifier(scope.legalEntityId) ||
    !validIdentifier(scope.connectionId)
  ) {
    throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_SCOPE_INVALID')
  }
}

function validateMemberships(memberships: readonly FinanceReadAuthorizationMembership[]): void {
  const keys = new Set<string>()
  for (const membership of memberships) {
    if (
      !membership ||
      typeof membership !== 'object' ||
      !validIdentifier(membership.userId) ||
      !validIdentifier(membership.tenantId) ||
      !validIdentifier(membership.legalEntityId) ||
      !['active', 'suspended'].includes(membership.status) ||
      !Array.isArray(membership.capabilities) ||
      membership.capabilities.length === 0 ||
      membership.capabilities.some((capability) => !CAPABILITIES.has(capability))
    ) {
      throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_MEMBERSHIP_INVALID')
    }
    const key = `${membership.userId}\u0000${membership.tenantId}\u0000${membership.legalEntityId}`
    if (keys.has(key)) {
      throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_MEMBERSHIP_AMBIGUOUS')
    }
    keys.add(key)
  }
}

function validateReviewedConnections(connections: readonly ReviewedFinanceReadConnection[]): void {
  const scopeKeys = new Set<string>()
  const entityKeys = new Set<string>()
  const connectionIds = new Set<string>()
  for (const connection of connections) {
    if (
      !connection ||
      typeof connection !== 'object' ||
      !connection.scope ||
      !['read_only', 'write'].includes(connection.integrationMode) ||
      !['active', 'inactive', 'suspended'].includes(connection.connectionStatus) ||
      typeof connection.reviewReference !== 'string' ||
      !REVIEW_REFERENCE_PATTERN.test(connection.reviewReference)
    ) {
      throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_CONNECTION_INVALID')
    }
    validateScope(connection.scope)

    const scopeKey = `${connection.scope.tenantId}\u0000${connection.scope.legalEntityId}\u0000${connection.scope.connectionId}`
    const entityKey = `${connection.scope.tenantId}\u0000${connection.scope.legalEntityId}`
    if (scopeKeys.has(scopeKey) || entityKeys.has(entityKey)) {
      throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_CONNECTION_AMBIGUOUS')
    }
    if (connectionIds.has(connection.scope.connectionId)) {
      throw new FinanceReadAuthorizationError('FINANCE_AUTHORIZATION_CONNECTION_SHARED')
    }
    scopeKeys.add(scopeKey)
    entityKeys.add(entityKey)
    connectionIds.add(connection.scope.connectionId)
  }
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    value.trim() === value &&
    !/\s/.test(value)
  )
}

function allow(): FinanceReadAuthorizationDecision {
  return { allowed: true, reason: 'membership_allows' }
}

function deny(reason: Exclude<FinanceReadAuthorizationReason, 'membership_allows'>) {
  return { allowed: false, reason } as const
}
