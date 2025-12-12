/**
 * Admin Client Middleware
 *
 * Resolves tenant from domain and authenticates admin users
 */

import { createTenantMiddleware } from '@akademate/tenant/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Development mode - allow localhost without tenant
const isDev = process.env.NODE_ENV === 'development'

// Tenant middleware configuration
const tenantMiddleware = createTenantMiddleware({
  // Paths that don't require tenant resolution
  excludePaths: [
    '/_next',
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
    ...(isDev ? ['/', '/dashboard'] : []),
  ],
  // Redirect to login if tenant not found (disabled in dev)
  tenantNotFoundRedirect: isDev ? undefined : '/login?error=tenant_not_found',
  // Debug mode in development
  debug: isDev,
  // Lookup tenant ID from slug (implement with your API)
  lookupTenantId: async (slug: string) => {
    // In production, this would call your API to lookup the tenant
    // For now, we'll use a simple placeholder that works in dev
    // TODO: Implement actual API lookup
    console.log('[middleware] Looking up tenant:', slug)

    // Placeholder: In development, accept any tenant slug
    // In production, this should call: GET /api/tenants?slug={slug}
    if (isDev) {
      // For development, return a mock ID based on slug
      return `dev-tenant-${slug}`
    }

    return null
  },
})

export async function middleware(request: NextRequest) {
  // In development, bypass tenant check completely for localhost
  if (isDev) {
    const host = request.headers.get('host') || ''
    if (host.startsWith('localhost')) {
      return NextResponse.next()
    }
  }

  // Run tenant middleware
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
