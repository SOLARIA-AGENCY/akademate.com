/**
 * Admin Client Middleware (Edge Runtime compatible)
 *
 * Edge-compatible: only checks presence of Better Auth session cookie.
 * Full session verification is done in dashboard/layout.tsx (Node.js server component)
 * via auth.api.getSession().
 *
 * Two-layer auth pattern required because better-auth uses dynamic code internally
 * which is not allowed in the Edge Runtime.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// In production better-auth adds __Secure- prefix when useSecureCookies=true
// Check both variants to handle dev and prod
const SESSION_COOKIE = 'akademate_ops.session_token'
const SESSION_COOKIE_SECURE = '__Secure-akademate_ops.session_token'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/health']

const defaultTenantId = process.env.DEFAULT_TENANT_ID?.trim() || '1'

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isStaticPath(pathname: string): boolean {
  return pathname.startsWith('/_next/') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/.test(pathname)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticPath(pathname)) return NextResponse.next()

  const response = NextResponse.next()
  response.headers.set('x-tenant-id', defaultTenantId)

  if (isPublicPath(pathname)) return response

  // Soft gate: check session cookie presence (real verification in dashboard layout)
  const sessionCookie = request.cookies.get(SESSION_COOKIE) ?? request.cookies.get(SESSION_COOKIE_SECURE)
  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
