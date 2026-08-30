import { createHash } from 'node:crypto'

export type LegacyAccessRole =
  | 'superadmin'
  | 'admin'
  | 'gestor'
  | 'marketing'
  | 'asesor'
  | 'lectura'

export interface LegacyAccessUserSnapshot {
  readonly id: string
  readonly role: LegacyAccessRole
  readonly tenantId: string | null
  readonly isActive: boolean | null
}

export interface MultiEntityAccessBaselineInput {
  readonly targetTenantId: string
  readonly policyDigest: string
  readonly users: readonly LegacyAccessUserSnapshot[]
  readonly maxUsers?: number
}

export interface MultiEntityAccessBaselineManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_current_access_baseline'
  readonly mode: 'capture_only'
  readonly canChangePermissions: false
  readonly canActivateAuthorization: false
  readonly digest: string
  readonly policyDigest: string
  readonly metrics: {
    readonly users: number
    readonly activeUsers: number
    readonly inactiveUsers: number
    readonly unsetActiveStateUsers: number
    readonly tenantUsers: number
    readonly platformSuperadmins: number
    readonly roles: Readonly<Record<LegacyAccessRole, number>>
  }
}

export interface MultiEntityAccessBaselineComparison {
  readonly schemaVersion: 1
  readonly kind: 'cep_current_access_baseline_comparison'
  readonly verdict: 'unchanged' | 'changed'
  readonly canChangePermissions: false
  readonly capturedDigest: string
  readonly currentDigest: string
  readonly metrics: {
    readonly capturedUsers: number
    readonly currentUsers: number
    readonly userCountDelta: number
    readonly policyUnchanged: boolean
  }
}

const ROLES: readonly LegacyAccessRole[] = [
  'superadmin',
  'admin',
  'gestor',
  'marketing',
  'asesor',
  'lectura',
]
const ROLE_SET = new Set<LegacyAccessRole>(ROLES)
const INPUT_KEYS = new Set(['targetTenantId', 'policyDigest', 'users', 'maxUsers'])
const USER_KEYS = new Set(['id', 'role', 'tenantId', 'isActive'])
const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'canChangePermissions',
  'canActivateAuthorization',
  'digest',
  'policyDigest',
  'metrics',
])
const METRICS_KEYS = new Set([
  'users',
  'activeUsers',
  'inactiveUsers',
  'unsetActiveStateUsers',
  'tenantUsers',
  'platformSuperadmins',
  'roles',
])
const ROLE_KEYS = new Set(ROLES)
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const DEFAULT_MAX_USERS = 10_000
const HARD_MAX_USERS = 100_000

/**
 * Captures the existing single-tenant RBAC assignments without names, emails,
 * credentials or session data. The policy digest must come from the reviewed
 * authorization artifact, so record stability alone cannot hide policy drift.
 */
export function createMultiEntityAccessBaseline(
  input: MultiEntityAccessBaselineInput
): MultiEntityAccessBaselineManifest {
  validateInput(input)
  const users = [...input.users].sort((left, right) => left.id.localeCompare(right.id))
  const roles = Object.fromEntries(ROLES.map((role) => [role, 0])) as Record<
    LegacyAccessRole,
    number
  >
  let activeUsers = 0
  let inactiveUsers = 0
  let unsetActiveStateUsers = 0
  let tenantUsers = 0
  let platformSuperadmins = 0

  for (const user of users) {
    roles[user.role] += 1
    if (user.isActive === true) activeUsers += 1
    if (user.isActive === false) inactiveUsers += 1
    if (user.isActive === null) unsetActiveStateUsers += 1
    if (user.role === 'superadmin') platformSuperadmins += 1
    else tenantUsers += 1
  }

  const canonical = JSON.stringify({
    schemaVersion: 1,
    targetTenantId: input.targetTenantId,
    policyDigest: input.policyDigest,
    users: users.map((user) => [user.id, user.role, user.tenantId, user.isActive]),
  })
  const digest = `sha256:${createHash('sha256').update(canonical).digest('hex')}`

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_current_access_baseline',
    mode: 'capture_only',
    canChangePermissions: false,
    canActivateAuthorization: false,
    digest,
    policyDigest: input.policyDigest,
    metrics: Object.freeze({
      users: users.length,
      activeUsers,
      inactiveUsers,
      unsetActiveStateUsers,
      tenantUsers,
      platformSuperadmins,
      roles: Object.freeze(roles),
    }),
  })
}

export function compareMultiEntityAccessBaselines(
  captured: MultiEntityAccessBaselineManifest,
  current: MultiEntityAccessBaselineManifest
): MultiEntityAccessBaselineComparison {
  validateManifest(captured)
  validateManifest(current)
  const unchanged = captured.digest === current.digest
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_current_access_baseline_comparison',
    verdict: unchanged ? 'unchanged' : 'changed',
    canChangePermissions: false,
    capturedDigest: captured.digest,
    currentDigest: current.digest,
    metrics: Object.freeze({
      capturedUsers: captured.metrics.users,
      currentUsers: current.metrics.users,
      userCountDelta: current.metrics.users - captured.metrics.users,
      policyUnchanged: captured.policyDigest === current.policyDigest,
    }),
  })
}

export function serializeMultiEntityAccessBaseline(input: MultiEntityAccessBaselineInput): string {
  return JSON.stringify(createMultiEntityAccessBaseline(input))
}

export function assertMultiEntityAccessBaselineManifest(
  value: unknown
): asserts value is MultiEntityAccessBaselineManifest {
  validateManifest(value as MultiEntityAccessBaselineManifest)
}

function validateInput(input: MultiEntityAccessBaselineInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS, 'maxUsers') ||
    !validIdentifier(input.targetTenantId) ||
    !DIGEST_PATTERN.test(input.policyDigest) ||
    !Array.isArray(input.users)
  ) {
    invalidBaseline()
  }
  const maxUsers = input.maxUsers ?? DEFAULT_MAX_USERS
  if (!Number.isSafeInteger(maxUsers) || maxUsers < 1 || maxUsers > HARD_MAX_USERS) {
    invalidBaseline()
  }
  if (input.users.length > maxUsers) {
    throw new Error('MULTI_ENTITY_ACCESS_BASELINE_USER_LIMIT_EXCEEDED')
  }

  const ids = new Set<string>()
  for (const user of input.users) {
    if (
      !user ||
      typeof user !== 'object' ||
      !exactKeys(user, USER_KEYS) ||
      !validIdentifier(user.id) ||
      !ROLE_SET.has(user.role) ||
      (typeof user.isActive !== 'boolean' && user.isActive !== null) ||
      ids.has(user.id) ||
      (user.role === 'superadmin' ? user.tenantId !== null : user.tenantId !== input.targetTenantId)
    ) {
      invalidBaseline()
    }
    ids.add(user.id)
  }
}

function validateManifest(manifest: MultiEntityAccessBaselineManifest): void {
  const roleTotal = ROLES.reduce((total, role) => total + manifest?.metrics?.roles?.[role], 0)
  if (
    !manifest ||
    !exactKeys(manifest, MANIFEST_KEYS) ||
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'cep_current_access_baseline' ||
    manifest.mode !== 'capture_only' ||
    manifest.canChangePermissions !== false ||
    manifest.canActivateAuthorization !== false ||
    !DIGEST_PATTERN.test(manifest.digest) ||
    !DIGEST_PATTERN.test(manifest.policyDigest) ||
    !manifest.metrics ||
    !exactKeys(manifest.metrics, METRICS_KEYS) ||
    !exactKeys(manifest.metrics.roles, ROLE_KEYS) ||
    ![
      manifest.metrics.users,
      manifest.metrics.activeUsers,
      manifest.metrics.inactiveUsers,
      manifest.metrics.unsetActiveStateUsers,
      manifest.metrics.tenantUsers,
      manifest.metrics.platformSuperadmins,
    ].every(nonNegativeInteger) ||
    !ROLES.every((role) => nonNegativeInteger(manifest.metrics.roles?.[role])) ||
    manifest.metrics.activeUsers +
      manifest.metrics.inactiveUsers +
      manifest.metrics.unsetActiveStateUsers !==
      manifest.metrics.users ||
    manifest.metrics.tenantUsers + manifest.metrics.platformSuperadmins !==
      manifest.metrics.users ||
    roleTotal !== manifest.metrics.users
  ) {
    invalidBaseline()
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

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function invalidBaseline(): never {
  throw new Error('MULTI_ENTITY_ACCESS_BASELINE_INVALID')
}
