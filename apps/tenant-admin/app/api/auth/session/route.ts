import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resolveSharedCookieDomain } from '@/app/api/_lib/cookie-domain'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

export const dynamic = 'force-dynamic'
const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'

interface SessionUser {
  id: string | number
  email: string
  name?: string
  role?: string
  tenantId?: string | number
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match?.[1] ?? null
}

/**
 * GET /api/auth/session
 *
 * Returns the current user session from the httpOnly payload-token cookie.
 * Used by client components (e.g. RealtimeProvider) that need auth data
 * without exposing the raw token in JS-accessible storage.
 */
export async function GET(request?: NextRequest) {
  try {
    const cookieStore = await cookies()
    const serializedSession =
      cookieStore.get(SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value
    const parsedSession = serializedSession
      ? (JSON.parse(serializedSession) as { user?: SessionUser; token?: string })
      : null

    // Route handlers receive NextRequest in production. Keep the no-request
    // branch for direct unit calls, but never trust client session metadata in
    // a real browser request: the JWT is the source of truth for access.
    if (!request) {
      if (parsedSession?.user) {
        return NextResponse.json({
          authenticated: true,
          user: parsedSession.user,
          socketToken: parsedSession.token ?? '',
        })
      }
      return NextResponse.json({ user: null, authenticated: false })
    }

    const payload = await getPayload({ config: configPromise })
    const authenticated = await getAuthenticatedUserContext(request, payload)
    if (!authenticated) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    const user = await payload.findByID({
      collection: 'users',
      id: authenticated.userId,
      depth: 0,
      overrideAccess: true,
    }) as SessionUser | null

    if (!user?.email) {
      return NextResponse.json({ user: null, authenticated: false })
    }

    const token =
      cookieStore.get('payload-token')?.value ??
      parsedSession?.token ??
      ''

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      socketToken: token,
    })

  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json({ user: null, authenticated: false, error: 'session_unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: unknown }
    const cookieToken = getCookieValue(request, 'payload-token')
    const bodyToken = typeof body.token === 'string' ? body.token.trim() : ''
    const token = cookieToken || bodyToken

    if (!token || token.length > 4096) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })
    const authRequest = new NextRequest(request.url, {
      headers: { cookie: `payload-token=${token}` },
    })
    const authenticated = await getAuthenticatedUserContext(authRequest, payload)
    if (!authenticated) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
    }

    const verifiedUser = await payload.findByID({
      collection: 'users',
      id: authenticated.userId,
      depth: 0,
      overrideAccess: true,
    }) as SessionUser | null

    if (!verifiedUser?.email) {
      return NextResponse.json({ error: 'Invalid session user' }, { status: 401 })
    }

    const sessionUser: SessionUser = {
      id: verifiedUser.id,
      email: verifiedUser.email,
      name: verifiedUser.name,
      role: verifiedUser.role,
      tenantId: verifiedUser.tenantId ?? authenticated.tenantId ?? undefined,
    }

    const cookieStore = await cookies()
    const cookieDomain = resolveSharedCookieDomain(
      request.headers.get('x-forwarded-host') || request.headers.get('host')
    )
    const sessionValue = JSON.stringify({ user: sessionUser, token })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.ENFORCE_HTTPS === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    } as const

    cookieStore.set(SESSION_COOKIE, sessionValue, cookieOptions)
    // Temporary backward compatibility for legacy clients.
    cookieStore.set(LEGACY_SESSION_COOKIE, sessionValue, cookieOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/session][POST] Error:', error)
    return NextResponse.json({ error: 'Failed to persist session' }, { status: 500 })
  }
}

export async function DELETE(request?: Request) {
  try {
    const cookieStore = await cookies()
    const cookieDomain = resolveSharedCookieDomain(
      request?.headers.get('x-forwarded-host') || request?.headers.get('host') || null
    )
    const clearOptions = { path: '/', ...(cookieDomain ? { domain: cookieDomain } : {}) }
    if (cookieDomain) {
      cookieStore.delete({ name: SESSION_COOKIE, ...clearOptions })
      cookieStore.delete({ name: LEGACY_SESSION_COOKIE, ...clearOptions })
    } else {
      cookieStore.delete(SESSION_COOKIE)
      cookieStore.delete(LEGACY_SESSION_COOKIE)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/session][DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
