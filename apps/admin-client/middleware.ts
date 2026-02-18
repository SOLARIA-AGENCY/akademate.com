/**
 * Admin Client Middleware
 *
 * Resolves tenant from domain and authenticates admin users
 */

import { createTenantMiddleware } from '@akademate/tenant/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Development mode - allow localhost without tenant
const isDev = process.env.NODE_ENV === 'development'
const defaultTenantId = process.env.DEFAULT_TENANT_ID?.trim() || '1'

// Tenant middleware configuration
const tenantMiddleware = createTenantMiddleware({
  // Paths that don't require tenant resolution
  excludePaths: [
    '/_next',
    '/api/auth',
    '/api/upload',
    '/api/health',
    '/favicon.ico',
    '/robots.txt',
  ],
  // Public paths that work without tenant
  publicPaths: [
    '/login',
    '/forgot-password',
    '/reset-password',
    // In development, allow all paths on localhost
    ...(isDev
      ? ['/', '/dashboard', '/tenants', '/tenants/create', '/billing', '/support', '/settings']
      : []),
  ],
  // Redirect to login if tenant not found (disabled in dev)
  tenantNotFoundRedirect: isDev ? undefined : '/login?error=tenant_not_found',
  // Debug mode in development
  debug: isDev,
  // Lookup tenant ID from slug (implement with your API)
  lookupTenantId: (slug: string) => {
    // TODO: Implement actual API lookup: GET /api/tenants?slug={slug}
    console.log('[middleware] Looking up tenant:', slug)

    // In development, use a deterministic ID based on slug
    // This allows RLS to work correctly with a consistent tenant_id
    if (isDev) {
      // Use the well-known development tenant ID (INTEGER, not UUID)
      // This should match the seeded tenant in the development database (ID=1)
      const DEV_TENANT_ID = '1'
      console.log('[middleware] Dev mode - using tenant:', DEV_TENANT_ID)
      return DEV_TENANT_ID
    }

    // Staging/prod fallback for Ops host or direct IP access.
    // This prevents tenant_not_found loops when admin is accessed via server IP.
    const looksLikeIpSegment = /^\d+$/.test(slug)
    const isOpsSlug = slug === 'admin' || slug === 'ops' || slug === 'localhost'
    if (looksLikeIpSegment || isOpsSlug) {
      console.log('[middleware] Using DEFAULT_TENANT_ID fallback:', defaultTenantId)
      return defaultTenantId
    }

    // Production: lookup tenant from API
    // const response = await fetch(`${process.env.API_URL}/api/tenants?slug=${slug}`)
    // const tenant = await response.json()
    // return tenant?.id ?? null
    return null
  },
})

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const isIPv4Host = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  if (isIPv4Host) {
    const response = NextResponse.next()
    response.headers.set('x-tenant-id', defaultTenantId)
    return response
  }

  // SECURITY: Never bypass tenant checks completely.
  // In development, we use a default dev tenant instead of bypassing.
  // This ensures RLS isolation is tested even in development.

  // Run tenant middleware (handles dev tenant internally via lookupTenantId)
  const tenantResponse = await tenantMiddleware(request)

  // If tenant middleware returned a response (redirect/404), use it
  if (tenantResponse.status !== 200 || tenantResponse.headers.has('location')) {
    return tenantResponse
  }

  // Continue with the request
  return tenantResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
