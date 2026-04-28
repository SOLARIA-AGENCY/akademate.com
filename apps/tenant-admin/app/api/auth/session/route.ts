import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { resolveSharedCookieDomain } from '@/app/api/_lib/cookie-domain'

export const dynamic = 'force-dynamic'
const SESSION_COOKIE = 'akademate_session'
const LEGACY_SESSION_COOKIE = 'cep_session'

interface SessionUser {
  id: string | number
  email: string
  name?: string
  role?: string
}

/**
 * GET /api/auth/session
 *
 * Returns the current user session from the httpOnly payload-token cookie.
 * Used by client components (e.g. RealtimeProvider) that need auth data
 * without exposing the raw token in JS-accessible storage.
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const serializedSession =
      cookieStore.get(SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value
    if (serializedSession) {
      const parsedSession = JSON.parse(serializedSession) as { user?: SessionUser; token?: string }
      if (parsedSession.user) {
        return NextResponse.json({
          authenticated: true,
          user: parsedSession.user,
          socketToken: parsedSession.token ?? '',
        })
      }
    }

    return NextResponse.json({ user: null, authenticated: false })
  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json({ user: null, authenticated: false })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { user?: SessionUser; token?: string }
    if (!body.user?.email) {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const cookieDomain = resolveSharedCookieDomain(
      request.headers.get('x-forwarded-host') || request.headers.get('host')
    )
    const sessionValue = JSON.stringify({
      user: body.user,
      token: body.token ?? '',
    })
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
