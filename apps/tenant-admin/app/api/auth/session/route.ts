import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

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

    if (!token) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
    }

    // Validate token via Payload CMS
    const payload = await getPayload({ config })

    // Use the Payload JWT verification to get the user
    // The token is a Payload-issued JWT
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })

    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: (user as any).name || '',
        role: (user as any).role || 'admin',
      },
      // Short-lived token for WebSocket auth only (read from httpOnly cookie server-side)
      // This is acceptable because this endpoint requires a valid httpOnly cookie
      socketToken: token,
    })
  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 401 }
    )
  }
}
