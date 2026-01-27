/**
 * Next.js Middleware for Tenant Resolution
 *
 * This middleware:
 * 1. Resolves tenant from domain/subdomain/header/cookie
 * 2. Sets tenant info in request headers for downstream use
 * 3. Optionally redirects to login if tenant not found
 * 4. Caches tenant lookups for performance
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  getFullTenantResolution,
  TENANT_HEADER,
  TENANT_COOKIE,
} from './resolver'

export interface TenantMiddlewareConfig {
  /**
   * Function to lookup tenant ID from slug
   * Returns tenant ID or null if not found
   */
  lookupTenantId?: (slug: string) => Promise<string | null>

  /**
   * Map of custom domains to tenant slugs
   * e.g., { 'custom.academy.com': 'custom-academy' }
   */
  customDomains?: Map<string, string>

  /**
   * Paths that don't require tenant resolution
   * e.g., ['/_next', '/api/health', '/favicon.ico']
   */
  excludePaths?: string[]

  /**
   * Path to redirect when tenant is not found
   * If not set, returns 404
   */
  tenantNotFoundRedirect?: string

  /**
   * Public paths that work without tenant
   * e.g., ['/', '/pricing', '/about']
   */
  publicPaths?: string[]

  /**
   * Debug mode - logs tenant resolution
   */
  debug?: boolean
}

const DEFAULT_EXCLUDE_PATHS = [
  '/_next',
  '/api/health',
  '/api/webhook',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

/**
 * Create tenant middleware with configuration
 */
export function createTenantMiddleware(config: TenantMiddlewareConfig = {}) {
  const {
    lookupTenantId,
    customDomains,
    excludePaths = DEFAULT_EXCLUDE_PATHS,
    tenantNotFoundRedirect,
    publicPaths = [],
    debug = false,
  } = config

  return async function tenantMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip excluded paths
    if (excludePaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // Skip public paths
    if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.next()
    }

    // Resolve tenant
    const resolution = getFullTenantResolution(request.headers, customDomains)

    if (debug) {
      console.log('[tenant-middleware]', {
        pathname,
        host: request.headers.get('host'),
        resolution,
      })
    }

    // If we have a valid resolution
    if (resolution.isValid) {
      let tenantId = resolution.tenantId

      // If we only have slug, lookup the ID
      if (!tenantId && resolution.tenantSlug && lookupTenantId) {
        tenantId = await lookupTenantId(resolution.tenantSlug)
      }

      if (tenantId) {
        // Clone the request and add tenant headers
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set(TENANT_HEADER, tenantId)
        if (resolution.tenantSlug) {
          requestHeaders.set('x-tenant-slug', resolution.tenantSlug)
        }

        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })

        // Set cookie for session persistence (if from subdomain/domain)
        if (resolution.source === 'subdomain' || resolution.source === 'domain') {
          response.cookies.set(TENANT_COOKIE, tenantId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
          })
        }

        return response
      }
    }

    // Tenant not found
    if (debug) {
      console.log('[tenant-middleware] Tenant not found for:', request.headers.get('host'))
    }

    // Redirect if configured
    if (tenantNotFoundRedirect) {
      return NextResponse.redirect(new URL(tenantNotFoundRedirect, request.url))
    }

    // Return 404 for tenant-required paths
    return new NextResponse('Tenant not found', { status: 404 })
  }
}

/**
 * Get tenant ID from request headers (for use in API routes/server components)
 */
export function getTenantFromHeaders(headers: Headers): string | null {
  return headers.get(TENANT_HEADER)
}

/**
 * Get tenant slug from request headers
 */
export function getTenantSlugFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant-slug')
}

/**
 * Helper to extract tenant info from Next.js request
 */
export function extractTenantFromRequest(request: NextRequest): {
  tenantId: string | null
  tenantSlug: string | null
} {
  return {
    tenantId: getTenantFromHeaders(request.headers),
    tenantSlug: getTenantSlugFromHeaders(request.headers),
  }
}
