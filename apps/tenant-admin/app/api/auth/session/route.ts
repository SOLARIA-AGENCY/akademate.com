import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

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
    const token = cookieStore.get('payload-token')?.value

    if (token) {
      const payload = await getPayload({ config })
      const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
      if (user) {
        const typedUser = user as SessionUser
        return NextResponse.json({
          authenticated: true,
          user: {
            id: typedUser.id,
            email: typedUser.email,
            name: typedUser.name ?? '',
            role: typedUser.role ?? 'admin',
          },
          socketToken: token,
        })
      }
    }

    const serializedSession = cookieStore.get('cep_session')?.value
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

    return NextResponse.json({ user: null, authenticated: false }, { status: 401 })
  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 401 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { user?: SessionUser; token?: string }
    if (!body.user?.email) {
      return NextResponse.json({ error: 'Invalid session payload' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set('cep_session', JSON.stringify({
      user: body.user,
      token: body.token ?? '',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/session][POST] Error:', error)
    return NextResponse.json({ error: 'Failed to persist session' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('cep_session')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/auth/session][DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
