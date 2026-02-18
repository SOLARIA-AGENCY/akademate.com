import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly admin session cookie.
 */
export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear the httpOnly session cookie
    response.cookies.set('akademate_admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error) {
    console.error('[/api/auth/logout] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    )
  }
}
