import type { ResolvedPrincipalIdentity } from './session'

export type PrincipalUser = {
  id: string | number
  email?: string | null
  name?: string | null
  role?: string | null
  roles?: string[] | null
  tenant?: string | number | { id?: string | number | null } | null
  tenantId?: string | number | null
  tenant_id?: string | number | null
  is_active?: boolean | null
  session_version?: number | string | null
}

type PayloadReader = {
  findByID(args: Record<string, unknown>): Promise<unknown>
}

export function resolveUserTenantId(user: PrincipalUser): string | null {
  const tenant = user.tenant
  const value = user.tenantId ?? user.tenant_id ??
    (tenant && typeof tenant === 'object' ? tenant.id : tenant)
  if (value !== undefined && value !== null && String(value).trim()) return String(value)
  return user.role === 'superadmin' ? 'platform' : null
}

export function resolveUserSessionVersion(user: PrincipalUser): number {
  const raw = user.session_version ?? 1
  const version = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw
  return typeof version === 'number' && Number.isInteger(version) && version >= 1 ? version : 1
}

export function nextSessionVersion(user: PrincipalUser): number {
  return resolveUserSessionVersion(user) + 1
}

export function identityFromPayloadUser(user: PrincipalUser | null): ResolvedPrincipalIdentity | null {
  if (!user) return null
  const tenantId = resolveUserTenantId(user)
  const roles = (Array.isArray(user.roles) ? user.roles : [user.role])
    .filter((role): role is string => typeof role === 'string' && Boolean(role.trim()))
  if (!tenantId || roles.length === 0) return null
  return {
    tenantId,
    roles,
    sessionVersion: resolveUserSessionVersion(user),
    isActive: user.is_active !== false,
  }
}

export function createPayloadIdentityResolver(
  payload: PayloadReader,
  cache?: Map<string, PrincipalUser>,
) {
  return async (userId: string): Promise<ResolvedPrincipalIdentity | null> => {
    const user = (await payload.findByID({
      collection: 'users', id: userId, depth: 0, overrideAccess: true,
    })) as PrincipalUser | null
    if (user) cache?.set(userId, user)
    return identityFromPayloadUser(user)
  }
}
