import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/session
 *
 * Returns the current admin session from the httpOnly cookie.
 * Used by client components (e.g. RealtimeProvider) that need auth data
 * without exposing tokens in JS-accessible storage (cookies/localStorage).
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('akademate_admin_session')?.value

    if (!sessionCookie) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 401 }
      )
    }

    // Parse session data from httpOnly cookie
    const sessionData = JSON.parse(sessionCookie)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.id || '0',
        email: sessionData.email || '',
        role: sessionData.role || 'superadmin',
        name: sessionData.name || '',
        tenantId: sessionData.tenantId || 'global-ops',
      },
      // Token for WebSocket auth — only available via this server endpoint
      // (not stored in JS-accessible cookies or localStorage)
      socketToken: sessionData.token || `session-${Date.now()}`,
    })
  } catch (error) {
    console.error('[/api/auth/session] Error:', error)
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 401 }
    )
  }
}
