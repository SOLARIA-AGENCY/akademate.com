import { createHash } from 'node:crypto'

export type AccessSurfaceReference = `ref:sha256:${string}`
export type AccessSurfaceDigest = `sha256:${string}`
export type AccessSurfaceUserSource = 'payload_tenant_admin' | 'platform'
export type AccessSurfaceApiKeySource = 'payload_tenant_admin' | 'platform'
export type AccessSurfaceUserStatus = 'active' | 'inactive' | 'unset'
export type AccessSurfaceMembershipStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type AccessSurfaceApiKeyStatus = 'active' | 'inactive' | 'revoked'

export interface AccessSurfaceSourceDigests {
  readonly authorizationPolicy: AccessSurfaceDigest
  readonly payloadUsersSchema: AccessSurfaceDigest
  readonly platformMembershipsSchema: AccessSurfaceDigest
  readonly payloadApiKeysSchema: AccessSurfaceDigest
  readonly platformApiKeysSchema: AccessSurfaceDigest
}

export interface AccessSurfaceUserSnapshot {
  readonly ref: AccessSurfaceReference
  readonly source: AccessSurfaceUserSource
  readonly tenantRef: AccessSurfaceReference | null
  readonly roles: readonly string[]
  readonly status: AccessSurfaceUserStatus
}

export interface AccessSurfaceMembershipSnapshot {
  readonly ref: AccessSurfaceReference
  readonly userRef: AccessSurfaceReference
  readonly tenantRef: AccessSurfaceReference
  readonly roles: readonly string[]
  readonly status: AccessSurfaceMembershipStatus
}

export interface AccessSurfaceApiKeySnapshot {
  /**
   * Domain-separated keyed pseudonym of the database record ID. Never pass a
   * key, key hash, token or an unkeyed digest derived from credential material.
   */
  readonly ref: AccessSurfaceReference
  readonly source: AccessSurfaceApiKeySource
  readonly tenantRef: AccessSurfaceReference
  readonly scopes: readonly string[]
  readonly status: AccessSurfaceApiKeyStatus
}

export interface MultiEntityAccessSurfaceBaselineInput {
  readonly targetTenantRef: AccessSurfaceReference
  readonly sourceDigests: AccessSurfaceSourceDigests
  readonly users: readonly AccessSurfaceUserSnapshot[]
  readonly memberships: readonly AccessSurfaceMembershipSnapshot[]
  readonly apiKeys: readonly AccessSurfaceApiKeySnapshot[]
  readonly maxRecordsPerSurface?: number
}

export interface MultiEntityAccessSurfaceBaselineManifest {
  readonly schemaVersion: 2
  readonly kind: 'cep_current_access_surface_baseline'
  readonly mode: 'offline_read_only_source_snapshot'
  readonly canReadRuntime: false
  readonly canWrite: false
  readonly canApply: false
  readonly canChangePermissions: false
  readonly containsSecrets: false
  readonly identifiersPseudonymized: true
  readonly targetTenantRef: AccessSurfaceReference
  readonly sourceDigests: AccessSurfaceSourceDigests
  readonly users: readonly AccessSurfaceUserSnapshot[]
  readonly memberships: readonly AccessSurfaceMembershipSnapshot[]
  readonly apiKeys: readonly AccessSurfaceApiKeySnapshot[]
  readonly metrics: {
    readonly users: number
    readonly memberships: number
    readonly apiKeys: number
    readonly activeMemberships: number
    readonly activeApiKeys: number
    readonly grantedRoles: number
    readonly grantedScopes: number
  }
  readonly digest: AccessSurfaceDigest
}

export interface MultiEntityAccessSurfaceBaselineComparison {
  readonly schemaVersion: 1
  readonly kind: 'cep_current_access_surface_baseline_comparison'
  readonly verdict: 'unchanged' | 'changed'
  readonly canWrite: false
  readonly canApply: false
  readonly capturedDigest: AccessSurfaceDigest
  readonly currentDigest: AccessSurfaceDigest
  readonly metrics: {
    readonly userDelta: number
    readonly membershipDelta: number
    readonly apiKeyDelta: number
    readonly sourceAuthoritiesUnchanged: boolean
  }
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REFERENCE_PATTERN = /^ref:sha256:[a-f0-9]{64}$/
const ROLE_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/
const SCOPE_PATTERN = /^[a-z][a-z0-9_-]{0,63}:[a-z][a-z0-9_-]{0,63}$/
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000

const INPUT_KEYS = new Set([
  'targetTenantRef',
  'sourceDigests',
  'users',
  'memberships',
  'apiKeys',
  'maxRecordsPerSurface',
])
const SOURCE_DIGEST_KEYS = new Set([
  'authorizationPolicy',
  'payloadUsersSchema',
  'platformMembershipsSchema',
  'payloadApiKeysSchema',
  'platformApiKeysSchema',
])
const USER_KEYS = new Set(['ref', 'source', 'tenantRef', 'roles', 'status'])
const MEMBERSHIP_KEYS = new Set(['ref', 'userRef', 'tenantRef', 'roles', 'status'])
const API_KEY_KEYS = new Set(['ref', 'source', 'tenantRef', 'scopes', 'status'])
const USER_SOURCES = new Set<AccessSurfaceUserSource>(['payload_tenant_admin', 'platform'])
const API_KEY_SOURCES = new Set<AccessSurfaceApiKeySource>(['payload_tenant_admin', 'platform'])
const USER_STATUSES = new Set<AccessSurfaceUserStatus>(['active', 'inactive', 'unset'])
const MEMBERSHIP_STATUSES = new Set<AccessSurfaceMembershipStatus>([
  'active',
  'inactive',
  'pending',
  'suspended',
])
const API_KEY_STATUSES = new Set<AccessSurfaceApiKeyStatus>(['active', 'inactive', 'revoked'])

/**
 * Seals a redacted access snapshot supplied by an offline export. This module
 * intentionally has no database adapter: source acquisition, consistency and
 * environment attestation remain separate reviewed evidence boundaries.
 */
export function createMultiEntityAccessSurfaceBaseline(
  input: MultiEntityAccessSurfaceBaselineInput
): MultiEntityAccessSurfaceBaselineManifest {
  const maxRecords = validateInput(input)
  const users = input.users.map(copyUser).sort(byRef)
  const memberships = input.memberships.map(copyMembership).sort(byRef)
  const apiKeys = input.apiKeys.map(copyApiKey).sort(byRef)

  enforceRecordLimit(users.length, maxRecords)
  enforceRecordLimit(memberships.length, maxRecords)
  enforceRecordLimit(apiKeys.length, maxRecords)
  validateReferences(input.targetTenantRef, users, memberships, apiKeys)

  const sourceDigests = copySourceDigests(input.sourceDigests)
  const metrics = Object.freeze({
    users: users.length,
    memberships: memberships.length,
    apiKeys: apiKeys.length,
    activeMemberships: memberships.filter(({ status }) => status === 'active').length,
    activeApiKeys: apiKeys.filter(({ status }) => status === 'active').length,
    grantedRoles:
      users.reduce((total, user) => total + user.roles.length, 0) +
      memberships.reduce((total, membership) => total + membership.roles.length, 0),
    grantedScopes: apiKeys.reduce((total, apiKey) => total + apiKey.scopes.length, 0),
  })
  const canonical = {
    schemaVersion: 2 as const,
    targetTenantRef: input.targetTenantRef,
    sourceDigests,
    users,
    memberships,
    apiKeys,
    metrics,
  }

  return Object.freeze({
    schemaVersion: 2,
    kind: 'cep_current_access_surface_baseline',
    mode: 'offline_read_only_source_snapshot',
    canReadRuntime: false,
    canWrite: false,
    canApply: false,
    canChangePermissions: false,
    containsSecrets: false,
    identifiersPseudonymized: true,
    targetTenantRef: input.targetTenantRef,
    sourceDigests,
    users: Object.freeze(users),
    memberships: Object.freeze(memberships),
    apiKeys: Object.freeze(apiKeys),
    metrics,
    digest: digest(JSON.stringify(canonical)),
  })
}

export function compareMultiEntityAccessSurfaceBaselines(
  captured: MultiEntityAccessSurfaceBaselineManifest,
  current: MultiEntityAccessSurfaceBaselineManifest
): MultiEntityAccessSurfaceBaselineComparison {
  assertMultiEntityAccessSurfaceBaseline(captured)
  assertMultiEntityAccessSurfaceBaseline(current)
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_current_access_surface_baseline_comparison',
    verdict: captured.digest === current.digest ? 'unchanged' : 'changed',
    canWrite: false,
    canApply: false,
    capturedDigest: captured.digest,
    currentDigest: current.digest,
    metrics: Object.freeze({
      userDelta: current.metrics.users - captured.metrics.users,
      membershipDelta: current.metrics.memberships - captured.metrics.memberships,
      apiKeyDelta: current.metrics.apiKeys - captured.metrics.apiKeys,
      sourceAuthoritiesUnchanged:
        JSON.stringify(captured.sourceDigests) === JSON.stringify(current.sourceDigests),
    }),
  })
}

export function assertMultiEntityAccessSurfaceBaseline(
  value: unknown
): asserts value is MultiEntityAccessSurfaceBaselineManifest {
  if (!isRecord(value)) invalidBaseline()
  const manifest = value as unknown as MultiEntityAccessSurfaceBaselineManifest
  if (
    manifest.schemaVersion !== 2 ||
    manifest.kind !== 'cep_current_access_surface_baseline' ||
    manifest.mode !== 'offline_read_only_source_snapshot' ||
    manifest.canReadRuntime !== false ||
    manifest.canWrite !== false ||
    manifest.canApply !== false ||
    manifest.canChangePermissions !== false ||
    manifest.containsSecrets !== false ||
    manifest.identifiersPseudonymized !== true ||
    !DIGEST_PATTERN.test(manifest.digest)
  ) {
    invalidBaseline()
  }
  const rebuilt = createMultiEntityAccessSurfaceBaseline({
    targetTenantRef: manifest.targetTenantRef,
    sourceDigests: manifest.sourceDigests,
    users: manifest.users,
    memberships: manifest.memberships,
    apiKeys: manifest.apiKeys,
    maxRecordsPerSurface: HARD_MAX_RECORDS,
  })
  if (JSON.stringify(rebuilt) !== JSON.stringify(manifest)) invalidBaseline()
}

export function serializeMultiEntityAccessSurfaceBaseline(
  input: MultiEntityAccessSurfaceBaselineInput
): string {
  return JSON.stringify(createMultiEntityAccessSurfaceBaseline(input))
}

function validateInput(input: MultiEntityAccessSurfaceBaselineInput): number {
  if (
    !isRecord(input) ||
    !exactKeys(input, INPUT_KEYS, 'maxRecordsPerSurface') ||
    !REFERENCE_PATTERN.test(input.targetTenantRef) ||
    !isRecord(input.sourceDigests) ||
    !exactKeys(input.sourceDigests, SOURCE_DIGEST_KEYS) ||
    ![...SOURCE_DIGEST_KEYS].every((key) =>
      DIGEST_PATTERN.test(input.sourceDigests[key as keyof AccessSurfaceSourceDigests])
    ) ||
    !Array.isArray(input.users) ||
    !Array.isArray(input.memberships) ||
    !Array.isArray(input.apiKeys)
  ) {
    invalidBaseline()
  }
  const maxRecords = input.maxRecordsPerSurface ?? DEFAULT_MAX_RECORDS
  if (!Number.isSafeInteger(maxRecords) || maxRecords < 1 || maxRecords > HARD_MAX_RECORDS) {
    invalidBaseline()
  }
  return maxRecords
}

function copyUser(user: AccessSurfaceUserSnapshot): AccessSurfaceUserSnapshot {
  if (
    !isRecord(user) ||
    !exactKeys(user, USER_KEYS) ||
    !REFERENCE_PATTERN.test(user.ref) ||
    !USER_SOURCES.has(user.source) ||
    (user.tenantRef !== null && !REFERENCE_PATTERN.test(user.tenantRef)) ||
    !USER_STATUSES.has(user.status)
  ) {
    invalidBaseline()
  }
  const roles = validateGrants(user.roles, ROLE_PATTERN)
  const validPayloadUser =
    user.source === 'payload_tenant_admin' &&
    roles.length === 1 &&
    (roles[0] === 'superadmin' ? user.tenantRef === null : user.tenantRef !== null)
  const validPlatformUser =
    user.source === 'platform' && roles.length === 0 && user.tenantRef === null
  if (!validPayloadUser && !validPlatformUser) invalidBaseline()
  return Object.freeze({ ...user, roles })
}

function copyMembership(
  membership: AccessSurfaceMembershipSnapshot
): AccessSurfaceMembershipSnapshot {
  if (
    !isRecord(membership) ||
    !exactKeys(membership, MEMBERSHIP_KEYS) ||
    !REFERENCE_PATTERN.test(membership.ref) ||
    !REFERENCE_PATTERN.test(membership.userRef) ||
    !REFERENCE_PATTERN.test(membership.tenantRef) ||
    !MEMBERSHIP_STATUSES.has(membership.status)
  ) {
    invalidBaseline()
  }
  return Object.freeze({ ...membership, roles: validateGrants(membership.roles, ROLE_PATTERN) })
}

function copyApiKey(apiKey: AccessSurfaceApiKeySnapshot): AccessSurfaceApiKeySnapshot {
  if (
    !isRecord(apiKey) ||
    !exactKeys(apiKey, API_KEY_KEYS) ||
    !REFERENCE_PATTERN.test(apiKey.ref) ||
    !API_KEY_SOURCES.has(apiKey.source) ||
    !REFERENCE_PATTERN.test(apiKey.tenantRef) ||
    !API_KEY_STATUSES.has(apiKey.status)
  ) {
    invalidBaseline()
  }
  return Object.freeze({ ...apiKey, scopes: validateGrants(apiKey.scopes, SCOPE_PATTERN) })
}

function validateGrants(values: readonly string[], pattern: RegExp): readonly string[] {
  if (
    !Array.isArray(values) ||
    values.length > 100 ||
    values.some((value) => typeof value !== 'string' || !pattern.test(value)) ||
    new Set(values).size !== values.length
  ) {
    invalidBaseline()
  }
  return Object.freeze([...values].sort())
}

function validateReferences(
  targetTenantRef: AccessSurfaceReference,
  users: readonly AccessSurfaceUserSnapshot[],
  memberships: readonly AccessSurfaceMembershipSnapshot[],
  apiKeys: readonly AccessSurfaceApiKeySnapshot[]
): void {
  assertUnique([
    ...users.map(({ ref }) => ref),
    ...memberships.map(({ ref }) => ref),
    ...apiKeys.map(({ ref }) => ref),
  ])
  const userRefs = new Map(users.map((user) => [user.ref, user] as const))
  for (const user of users) {
    if (user.tenantRef !== null && user.tenantRef !== targetTenantRef) invalidBaseline()
  }
  for (const membership of memberships) {
    const user = userRefs.get(membership.userRef)
    if (
      user?.source !== 'platform' ||
      user.tenantRef !== null ||
      membership.tenantRef !== targetTenantRef
    ) {
      invalidBaseline()
    }
  }
  for (const apiKey of apiKeys) {
    if (apiKey.tenantRef !== targetTenantRef) invalidBaseline()
  }
}

function copySourceDigests(source: AccessSurfaceSourceDigests): AccessSurfaceSourceDigests {
  return Object.freeze({
    authorizationPolicy: source.authorizationPolicy,
    payloadUsersSchema: source.payloadUsersSchema,
    platformMembershipsSchema: source.platformMembershipsSchema,
    payloadApiKeysSchema: source.payloadApiKeysSchema,
    platformApiKeysSchema: source.platformApiKeysSchema,
  })
}

function assertUnique(values: readonly string[]): void {
  if (new Set(values).size !== values.length) invalidBaseline()
}

function enforceRecordLimit(records: number, maxRecords: number): void {
  if (records > maxRecords) {
    throw new Error('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_RECORD_LIMIT_EXCEEDED')
  }
}

function exactKeys(value: object, allowed: ReadonlySet<string>, optional?: string): boolean {
  const keys = Object.keys(value)
  return (
    keys.every((key) => allowed.has(key)) &&
    [...allowed].every(
      (key) => key === optional || Object.prototype.hasOwnProperty.call(value, key)
    )
  )
}

function byRef<T extends { readonly ref: string }>(left: T, right: T): number {
  return left.ref.localeCompare(right.ref)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function digest(value: string): AccessSurfaceDigest {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function invalidBaseline(): never {
  throw new Error('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID')
}
