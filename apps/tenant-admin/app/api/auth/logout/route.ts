import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { resolveSharedCookieDomain } from '@/app/api/_lib/cookie-domain'

export const dynamic = 'force-dynamic'

export async function POST(request?: Request) {
  try {
    // Clear any server-side cookies if present
    const cookieStore = await cookies()
    const cookieDomain = resolveSharedCookieDomain(
      request?.headers.get('x-forwarded-host') || request?.headers.get('host') || null
    )
    const clearOptions = { path: '/', ...(cookieDomain ? { domain: cookieDomain } : {}) }

    // Clear payload-token cookie if it exists
    if (cookieDomain) {
      cookieStore.delete({ name: 'payload-token', ...clearOptions })
    } else {
      cookieStore.delete('payload-token')
    }

    // Clear any session cookies
    if (cookieDomain) {
      cookieStore.delete({ name: 'akademate_session', ...clearOptions })
      cookieStore.delete({ name: 'cep_session', ...clearOptions })
    } else {
      cookieStore.delete('akademate_session')
      cookieStore.delete('cep_session')
    }

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
