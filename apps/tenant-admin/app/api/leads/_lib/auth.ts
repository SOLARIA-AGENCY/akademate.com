import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE_NAMES = ['akademate_session', 'cep_session'] as const

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
        const parsed = JSON.parse(candidate) as { token?: unknown }
        if (typeof parsed.token === 'string' && parsed.token.trim().length > 0) {
          return parsed.token
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

async function findTenantIdByUserId(payload: any, userId: string | number): Promise<number | null> {
  const numericUserId = toPositiveInt(userId)
  if (!numericUserId) return null

  const drizzle = payload?.db?.drizzle || payload?.db?.pool
  if (!drizzle?.execute) return null

  try {
    const res = await drizzle.execute(
      `SELECT tenant_id FROM users WHERE id = ${numericUserId} LIMIT 1`,
    )
    const rows = Array.isArray(res) ? res : (res?.rows ?? [])
    return toPositiveInt(rows[0]?.tenant_id)
  } catch {
    return null
  }
}

async function authViaPayload(payload: any, token: string): Promise<{
  userId: string | number
  tenantId: number | null
} | null> {
  const attempts = [
    new Headers({ cookie: `payload-token=${token}` }),
    new Headers({
      cookie: `payload-token=${token}`,
      authorization: `JWT ${token}`,
    }),
    new Headers({
      cookie: `payload-token=${token}`,
      authorization: `Bearer ${token}`,
    }),
  ]

  for (const headers of attempts) {
    try {
      const authResult = await payload.auth({
        collection: 'users',
        headers,
      }) as {
        user?: {
          id?: string | number
          tenantId?: string | number
          tenant?: string | number | { id?: string | number }
        }
      } | null

      const userId = toUserId(authResult?.user?.id)
      if (!userId) continue

      return {
        userId,
        tenantId: resolveTenantId(authResult?.user),
      }
    } catch {
      // Continue with next strategy
    }
  }

  return null
}

async function authViaJWT(payload: any, token: string): Promise<{
  userId: string | number
  tenantId: number | null
} | null> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret))
    const userId = toUserId(verified.payload?.id ?? verified.payload?.sub)
    if (!userId) return null

    const tenantFromDb = await findTenantIdByUserId(payload, userId)
    if (tenantFromDb !== null) {
      return { userId, tenantId: tenantFromDb }
    }

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    }) as {
      tenantId?: string | number
      tenant?: string | number | { id?: string | number }
    } | null

    return {
      userId,
      tenantId: resolveTenantId(user),
    }
  } catch {
    return null
  }
}

export async function getAuthenticatedUserContext(
  request: NextRequest,
  payload: any,
): Promise<{ userId: string | number; tenantId: number | null } | null> {
  const token = request.cookies.get('payload-token')?.value ?? parseSessionToken(request)
  if (!token) return null

  const payloadAuth = await authViaPayload(payload, token)
  if (payloadAuth) return payloadAuth

  return authViaJWT(payload, token)
}
