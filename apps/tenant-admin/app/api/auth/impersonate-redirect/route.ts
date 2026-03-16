import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/impersonate-redirect?token=XXX
 *
 * Sets the Payload auth cookie httpOnly and redirects to /admin.
 * Called from the impersonation page after confirming impersonation.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login?error=token_missing', request.url))
    }

    // Verify the token is valid before setting the cookie
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      return NextResponse.redirect(new URL('/admin/login?error=config', request.url))
    }

    jwt.verify(token, secret) // throws if invalid/expired

    // Set Payload's auth cookie (httpOnly)
    const cookieStore = await cookies()
    cookieStore.set('payload-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2h matching token expiry
    })

    return NextResponse.redirect(new URL('/admin', request.url))
  } catch {
    return NextResponse.redirect(new URL('/admin/login?error=invalid_token', request.url))
  }
}
