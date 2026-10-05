import 'server-only'

import { createPayloadIdentityResolver } from './payload-principal'
import {
  SESSION_V2_COOKIE,
  verifyAvailableSession,
  type VerifiedPrincipal,
} from './session'

type PayloadPrincipalReader = Parameters<typeof createPayloadIdentityResolver>[0]

export class TenantAccessError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message)
    this.name = 'TenantAccessError'
  }
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie')
  if (!cookie) return undefined
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() === name) {
      const value = part.slice(separator + 1).trim()
      return value || undefined
    }
  }
  return undefined
}

export async function resolvePayloadPrincipal(
  request: Request,
  payload: PayloadPrincipalReader,
): Promise<VerifiedPrincipal | null> {
  const verified = await verifyAvailableSession(
    {
      payloadToken: cookieValue(request, 'payload-token'),
      sessionV2: cookieValue(request, SESSION_V2_COOKIE),
    },
    {
      resolveIdentity: createPayloadIdentityResolver(payload),
      requireResolvedIdentity: true,
    },
  )
  return verified?.principal ?? null
}

export async function requirePrincipal(
  request: Request,
  payload: PayloadPrincipalReader,
): Promise<VerifiedPrincipal> {
  const principal = await resolvePayloadPrincipal(request, payload)
  if (!principal) throw new TenantAccessError(401, 'Authentication required')
  return principal
}

export function requireTenantScope(
  principal: VerifiedPrincipal,
  resourceTenantId: string | number | null | undefined,
): string {
  if (resourceTenantId === null || resourceTenantId === undefined) {
    throw new TenantAccessError(404, 'Resource not found')
  }
  const tenantId = String(resourceTenantId)
  if (!tenantId || principal.tenantId !== tenantId) {
    // Cross-tenant existence must not be disclosed. Platform superadmins also fail
    // closed until an audited tenant-scope operation contract exists.
    throw new TenantAccessError(404, 'Resource not found')
  }
  return tenantId
}

export function requireAnyRole(principal: VerifiedPrincipal, roles: readonly string[]): void {
  if (!principal.roles.some((role) => roles.includes(role))) {
    throw new TenantAccessError(403, 'Insufficient role')
  }
}

