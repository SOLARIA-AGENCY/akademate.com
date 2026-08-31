import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { isSuperadminRole } from '@/app/lib/server/tenant-scope'

const SESSION_COOKIE_NAMES = ['akademate_session', 'cep_session'] as const

export type AuthenticatedUserContext = {
  userId: string | number
  tenantId: number | null
  role: string | null
}

export function isSuperadmin(
  ctx: { role?: string | null } | null | undefined,
): boolean {
  return isSuperadminRole(ctx?.role)
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function toUserId(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) return value
  return null
}

function toRole(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  return null
}

function parseSessionToken(request: NextRequest): string | null {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const rawSession = request.cookies.get(cookieName)?.value
    if (!rawSession) continue

    const candidates: string[] = [rawSession]
    try {
      const decoded = decodeURIComponent(rawSession)
      if (decoded !== rawSession) candidates.push(decoded)
    } catch {
      // Ignore invalid encoding
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as {
          token?: unknown
          socketToken?: unknown
          payloadToken?: unknown
          jwt?: unknown
        }
        const tokenCandidate = [parsed.token, parsed.socketToken, parsed.payloadToken, parsed.jwt].find(
          (value) => typeof value === 'string' && value.trim().length > 0,
        )
        if (typeof tokenCandidate === 'string' && tokenCandidate.trim().length > 0) {
          return tokenCandidate
        }
      } catch {
        // Keep trying
      }
    }
  }
  return null
}

function resolveTenantId(user: {
  tenantId?: string | number
  tenant?: string | number | { id?: string | number }
} | null | undefined): number | null {
  if (!user) return null
  const tenantCandidate =
    user.tenantId ??
    (typeof user.tenant === 'object' && user.tenant !== null ? user.tenant.id : user.tenant)
  return toPositiveInt(tenantCandidate)
}

async function findUserAuthRow(
  payload: any,
  userId: string | number,
): Promise<{ tenantId: number | null; role: string | null } | null> {
  const numericUserId = toPositiveInt(userId)
  if (!numericUserId) return null

  const drizzle = payload?.db?.drizzle || payload?.db?.pool
  if (!drizzle?.execute) return null

  try {
    const res = await drizzle.execute(
      `SELECT tenant_id, role FROM users WHERE id = ${numericUserId} LIMIT 1`,
    )
    const rows = Array.isArray(res) ? res : (res?.rows ?? [])
    const row = rows[0] as { tenant_id?: unknown; role?: unknown } | undefined
    if (!row) return null
    return {
      tenantId: toPositiveInt(row.tenant_id),
      role: toRole(row.role),
    }
  } catch {
    return null
  }
}

async function authViaPayload(
  payload: any,
  token: string,
  originalHeaders?: Headers,
): Promise<AuthenticatedUserContext | null> {
  const attempts = [
    originalHeaders,
    new Headers({ cookie: `payload-token=${token}` }),
    new Headers({
      cookie: `payload-token=${token}`,
      authorization: `JWT ${token}`,
    }),
    new Headers({
      cookie: `payload-token=${token}`,
      authorization: `Bearer ${token}`,
    }),
  ].filter((headers): headers is Headers => Boolean(headers))

  for (const headers of attempts) {
    try {
      const authResult = await payload.auth({
        collection: 'users',
        headers,
      }) as {
        user?: {
          id?: string | number
          role?: string
          tenantId?: string | number
          tenant?: string | number | { id?: string | number }
        }
      } | null

      const userId = toUserId(authResult?.user?.id)
      if (!userId) continue

      const fromDb = await findUserAuthRow(payload, userId)
      let tenantId = resolveTenantId(authResult?.user)
      if (tenantId === null && fromDb?.tenantId != null) {
        tenantId = fromDb.tenantId
      }

      return {
        userId,
        tenantId,
        role: toRole(authResult?.user?.role) ?? fromDb?.role ?? null,
      }
    } catch {
      // Continue with next strategy
    }
  }

  return null
}

async function authViaJWT(payload: any, token: string): Promise<AuthenticatedUserContext | null> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret))
    const userId = toUserId(verified.payload?.id ?? verified.payload?.sub)
    if (!userId) return null

    const fromDb = await findUserAuthRow(payload, userId)
    if (fromDb) {
      return { userId, tenantId: fromDb.tenantId, role: fromDb.role }
    }

    try {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      }) as {
        role?: string
        tenantId?: string | number
        tenant?: string | number | { id?: string | number }
      } | null

      return {
        userId,
        tenantId: resolveTenantId(user),
        role: toRole(user?.role),
      }
    } catch {
      return {
        userId,
        tenantId: null,
        role: null,
      }
    }
  } catch {
    return null
  }
}

export async function getAuthenticatedUserContext(
  request: NextRequest,
  payload: any,
): Promise<AuthenticatedUserContext | null> {
  const token = request.cookies.get('payload-token')?.value ?? parseSessionToken(request)
  if (!token) return null

  const payloadAuth = await authViaPayload(payload, token, request.headers)
  if (payloadAuth && (payloadAuth.tenantId !== null || isSuperadmin(payloadAuth))) {
    return payloadAuth
  }

  const jwtAuth = await authViaJWT(payload, token)
  if (jwtAuth) return jwtAuth
  return payloadAuth
}
