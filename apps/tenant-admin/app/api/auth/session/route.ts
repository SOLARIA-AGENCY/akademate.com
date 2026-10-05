import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  LEGACY_SESSION_COOKIES,
  SESSION_V2_COOKIE,
  SESSION_V2_MAX_AGE_SECONDS,
  extractLegacyPayloadToken,
  signSessionV2,
  verifyAvailableSession,
  verifyPayloadToken,
  type VerifiedPrincipal,
} from '@/lib/server/session'
import {
  createPayloadIdentityResolver,
  type PrincipalUser,
} from '@/lib/server/payload-principal'
import {
  AUTH_COOKIE_NAMES,
  clearCookieVariants,
  resolveAuthCookieOptions,
} from '@/lib/server/auth-cookies'

export const dynamic = 'force-dynamic'

async function findUser(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  return (await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })) as PrincipalUser | null
}

async function readBodyToken(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { token?: unknown }
    return typeof body.token === 'string' && body.token.trim() ? body.token.trim() : null
  } catch {
    return null
  }
}

/** Returns only data anchored to a cryptographically verified principal. */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const payload = await getPayload({ config })
    const userCache = new Map<string, PrincipalUser>()
    const verified = await verifyAvailableSession(
      {
        payloadToken: cookieStore.get('payload-token')?.value,
        sessionV2: cookieStore.get(SESSION_V2_COOKIE)?.value,
      },
      {
        resolveIdentity: createPayloadIdentityResolver(payload, userCache),
        requireResolvedIdentity: true,
      },
    )

    if (!verified) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    const principal = verified.principal
    const user = userCache.get(principal.userId) ?? (await findUser(payload, principal.userId))
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: principal.userId,
        email: user.email ?? '',
        name: user.name ?? '',
        role: principal.roles[0] ?? '',
        roles: principal.roles,
        tenantId: principal.tenantId,
      },
      socketToken: verified.source === 'payload-token' ? verified.token : '',
    })
  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json({ user: null, authenticated: false })
  }
}

/** Exchanges only a verified Payload token for the signed v2 session cookie. */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const bodyToken = await readBodyToken(request)
    const payloadCookieToken = cookieStore.get('payload-token')?.value ?? null
    const legacyValues = LEGACY_SESSION_COOKIES.map((name) => cookieStore.get(name)?.value ?? null)
    const hasLegacy = legacyValues.some(Boolean)
    const legacyToken = legacyValues.reduce<string | null>(
      (found, raw) => found ?? (raw ? extractLegacyPayloadToken(raw) : null),
      null,
    )
    const token = bodyToken ?? payloadCookieToken ?? legacyToken
    const migratedLegacy = !bodyToken && !payloadCookieToken && hasLegacy

    if (!token) {
      return NextResponse.json(
        {
          error: hasLegacy ? 'La sesión anterior ya no es válida' : 'Authentication required',
          code: hasLegacy ? 'SESSION_REAUTH_REQUIRED' : 'AUTH_REQUIRED',
        },
        { status: 401 },
      )
    }

    const payload = await getPayload({ config })
    const userCache = new Map<string, PrincipalUser>()
    let sourcePrincipal: VerifiedPrincipal
    try {
      sourcePrincipal = await verifyPayloadToken(token, {
        resolveIdentity: createPayloadIdentityResolver(payload, userCache),
        requireResolvedIdentity: true,
        allowMissingIdentityClaims: true,
      })
    } catch {
      return NextResponse.json(
        {
          error: migratedLegacy ? 'La sesión anterior ya no es válida' : 'Invalid Payload session',
          code: migratedLegacy ? 'SESSION_REAUTH_REQUIRED' : 'INVALID_PAYLOAD_SESSION',
        },
        { status: 401 },
      )
    }

    const now = Math.floor(Date.now() / 1000)
    const principal: VerifiedPrincipal = {
      userId: sourcePrincipal.userId,
      tenantId: sourcePrincipal.tenantId,
      roles: sourcePrincipal.roles,
      sessionVersion: sourcePrincipal.sessionVersion,
      sessionId: crypto.randomUUID(),
      issuedAt: now,
      expiresAt: now + SESSION_V2_MAX_AGE_SECONDS,
      ...(sourcePrincipal.impersonation ? { impersonation: sourcePrincipal.impersonation } : {}),
    }
    const sessionToken = await signSessionV2(principal, { now })
    const options = resolveAuthCookieOptions(request, SESSION_V2_MAX_AGE_SECONDS)
    clearCookieVariants(cookieStore, AUTH_COOKIE_NAMES, request)
    cookieStore.set(SESSION_V2_COOKIE, sessionToken, options)

    if (migratedLegacy) {
      cookieStore.set('payload-token', token, {
        ...options,
        maxAge: Math.max(1, Math.min(sourcePrincipal.expiresAt - now, SESSION_V2_MAX_AGE_SECONDS)),
      })
      console.info('[auth.session.legacy_exchange]', { migrated: true })
    }

    return NextResponse.json({ success: true, migratedLegacy })
  } catch (error) {
    console.error('[/api/auth/session][POST] Error:', error)
    return NextResponse.json({ error: 'Failed to persist session' }, { status: 500 })
  }
}

export async function DELETE(request?: Request) {
  try {
    const cookieStore = await cookies()
    clearCookieVariants(cookieStore, AUTH_COOKIE_NAMES, request)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/session][DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
