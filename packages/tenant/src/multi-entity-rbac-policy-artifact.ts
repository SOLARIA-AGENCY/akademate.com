import { createHash } from 'node:crypto'

export const MULTI_ENTITY_RBAC_INVENTORY_VERSION = 'cep-legacy-rbac-inventory-v1' as const

export const MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES = Object.freeze([
  'apps/tenant-admin/middleware.ts',
  'apps/tenant-admin/lib/auth.ts',
  'apps/tenant-admin/src/payload.config.ts',
  'apps/tenant-admin/src/access/roles.ts',
  'apps/tenant-admin/src/access/tenantAccess.ts',
  'apps/tenant-admin/src/collections/Users/Users.ts',
  'apps/tenant-admin/src/collections/Users/access/canCreateUsers.ts',
  'apps/tenant-admin/src/collections/Users/access/canDeleteUsers.ts',
  'apps/tenant-admin/src/collections/Users/access/canReadUsers.ts',
  'apps/tenant-admin/src/collections/Users/access/canUpdateUsers.ts',
] as const)

export interface MultiEntityRbacPolicySource {
  readonly path: string
  readonly content: string
}

export interface MultiEntityRbacPolicyArtifact {
  readonly schemaVersion: 1
  readonly kind: 'cep_current_rbac_policy_artifact'
  readonly mode: 'source_inventory_hash_only'
  readonly inventoryVersion: typeof MULTI_ENTITY_RBAC_INVENTORY_VERSION
  readonly canChangePermissions: false
  readonly policyDigest: string
  readonly metrics: {
    readonly files: number
    readonly totalBytes: number
    readonly requiredAuthorities: number
  }
  readonly sources: readonly {
    readonly path: string
    readonly digest: string
    readonly bytes: number
  }[]
}

const MAX_POLICY_FILES = 1_000
const MAX_SOURCE_BYTES = 2_000_000
const MAX_TOTAL_BYTES = 50_000_000
const SOURCE_PATH_PATTERN = /^apps\/tenant-admin\/(?:app|src|lib)\/.+\.tsx?$/
const ROOT_FILE_PATTERN = /^apps\/tenant-admin\/(?:middleware|instrumentation)\.tsx?$/
const EXCLUDED_PATH_PATTERN =
  /(?:^|\/)(?:__tests__|tests?|fixtures?|mocks?|generated)(?:\/|$)|\.(?:test|spec)\.tsx?$|\/src\/payload-types\.ts$|\/src\/multi-entity\/|\/utils\/testHelpers\.ts$/
const AUTH_ROUTE_PATH_PATTERN =
  /\/app\/api\/(?:auth\/|campus\/auth\/|users\/(?:login|forgot-password|reset-password|me|first-register)\/)/
const AUTHORITY_SIGNAL_PATTERN =
  /\baccess\s*:|\bFieldAccess\b|\bAccess\b|\bpermissions?\b|\bauthori[sz](?:e|ation)\b|\bhasMinimumRole\b|\bisSuperAdmin\b|\bgetUserTenantId\b|\btenantFilteredAccess\b|(?:req|request)\.user|\b(?:user|session|actor)\??\.role\b|SESSION_COOKIE_NAMES|publicRoutes/

/** Returns whether a repository source belongs to the active legacy RBAC inventory. */
export function isMultiEntityRbacPolicyAuthoritySource(path: string, content: string): boolean {
  if (!validPath(path) || EXCLUDED_PATH_PATTERN.test(path)) return false
  if ((MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES as readonly string[]).includes(path)) return true
  if (path.includes('/access/') || AUTH_ROUTE_PATH_PATTERN.test(path)) return true
  return AUTHORITY_SIGNAL_PATTERN.test(content)
}

/**
 * Produces a reviewable content-addressed inventory. Source contents are hashed
 * and discarded; the artifact contains paths, byte counts and digests only.
 */
export function createMultiEntityRbacPolicyArtifact(
  sources: readonly MultiEntityRbacPolicySource[]
): MultiEntityRbacPolicyArtifact {
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_POLICY_FILES) {
    invalidArtifact()
  }

  const seen = new Set<string>()
  let totalBytes = 0
  const normalized = sources
    .map((source) => {
      if (
        !source ||
        typeof source !== 'object' ||
        Object.keys(source).length !== 2 ||
        !Object.prototype.hasOwnProperty.call(source, 'path') ||
        !Object.prototype.hasOwnProperty.call(source, 'content') ||
        !validPath(source.path) ||
        EXCLUDED_PATH_PATTERN.test(source.path) ||
        typeof source.content !== 'string' ||
        source.content.length === 0 ||
        seen.has(source.path) ||
        !isMultiEntityRbacPolicyAuthoritySource(source.path, source.content)
      ) {
        invalidArtifact()
      }
      seen.add(source.path)
      const bytes = Buffer.byteLength(source.content, 'utf8')
      if (bytes > MAX_SOURCE_BYTES) invalidArtifact()
      totalBytes += bytes
      if (totalBytes > MAX_TOTAL_BYTES) invalidArtifact()
      return Object.freeze({
        path: source.path,
        digest: digest(source.content),
        bytes,
      })
    })
    .sort((left, right) => left.path.localeCompare(right.path))

  for (const required of MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES) {
    if (!seen.has(required)) {
      throw new Error('MULTI_ENTITY_RBAC_POLICY_REQUIRED_AUTHORITY_MISSING')
    }
  }

  const canonical = JSON.stringify({
    inventoryVersion: MULTI_ENTITY_RBAC_INVENTORY_VERSION,
    sources: normalized,
  })
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_current_rbac_policy_artifact',
    mode: 'source_inventory_hash_only',
    inventoryVersion: MULTI_ENTITY_RBAC_INVENTORY_VERSION,
    canChangePermissions: false,
    policyDigest: digest(canonical),
    metrics: Object.freeze({
      files: normalized.length,
      totalBytes,
      requiredAuthorities: MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.length,
    }),
    sources: Object.freeze(normalized),
  })
}

export function serializeMultiEntityRbacPolicyArtifact(
  sources: readonly MultiEntityRbacPolicySource[]
): string {
  return JSON.stringify(createMultiEntityRbacPolicyArtifact(sources))
}

function validPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    path.length <= 500 &&
    path === path.trim() &&
    !path.includes('..') &&
    !path.includes('\\') &&
    (SOURCE_PATH_PATTERN.test(path) || ROOT_FILE_PATTERN.test(path))
  )
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function invalidArtifact(): never {
  throw new Error('MULTI_ENTITY_RBAC_POLICY_ARTIFACT_INVALID')
}
