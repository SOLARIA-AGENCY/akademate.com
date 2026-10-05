import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAMES, clearCookieVariants } from '@/lib/server/auth-cookies'

export const dynamic = 'force-dynamic'

export async function POST(request?: Request) {
  try {
    // Clear any server-side cookies if present
    const cookieStore = await cookies()
    clearCookieVariants(cookieStore, AUTH_COOKIE_NAMES, request)

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Error during logout' },
      { status: 500 }
    )
  }
}
