import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  LEGACY_SESSION_COOKIES,
  SESSION_V2_COOKIE,
  verifyAvailableSession,
} from '@/lib/server/session'

const DEV_AUTH_ROUTES = [
  '/api/auth/dev-login',
  '/api/dev/auto-login',
  '/dev/auto-login',
] as const

// ============================================================================
// CORS Configuration
// ============================================================================

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://46.62.222.138',
]

// Routes that don't require authentication
const publicRoutes = [
  '/api/health',
  '/auth/login',
  '/auth/session-exchange',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/signup',
  '/auth/accept-invite',
  '/api/users/login',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/me', // Allow preflight for auth check
  '/api/users/first-register', // Payload create-first-user (no auth yet)
  '/api/auth/session', // Session write after login (token may not be in cookie yet)
  '/api/email/', // Email endpoints (called from authenticated frontend)
  '/api/internal/invitations/verify', // Invitation token verification (public)
  '/api/internal/invitations/accept', // Accept invitation (public — token-based auth)
  '/api/v1/openapi', // OpenAPI spec is public (no auth needed)
  '/api/leads', // Lead capture from public landing pages
  '/api/track', // Public tracking endpoint for page views/forms
  '/api/media/file', // Serve uploaded media files publicly (images, PDFs)
  // Public web pages (landing pages, catalogs) — no auth required
  '/p/',  // All public web pages under /p/ are accessible without auth
  '/landing/',
  '/site/',
  '/blog',
  '/empleo',
  '/colabora',
  '/aproem',
  '/agencia-colocacion',
  '/faq',
  '/presentacion',
  '/convocatorias',
  // Legal pages must be publicly accessible (GDPR requirement)
  '/legal',
  // DEV-ONLY: design-system accessible without auth for Onlook visual editing
  ...(process.env.NODE_ENV !== 'production' ? ['/design-system', '/shadcn-preview'] : []),
]

// Static asset paths to ignore
const staticPaths = [
  '/_next',
  '/logos',
  '/favicon',
  '/api/config',
  '/api/media/file', // Serve uploaded media files without auth
  '/placeholder-course.svg',
  '/media',
  '/images',
  '/website',
  '/og-image',
]

// Payload native admin - let Payload handle its own auth
const payloadAdminPaths = [
  '/admin',  // Native Payload CMS admin panel
]

function isCepHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase().replace(/:\d+$/, '')
  return /(^|\.)cepformacion(\.|$)/i.test(normalizedHost) || normalizedHost.includes('cep-formacion')
}

const CEP_PUBLIC_REWRITES: Record<string, string> = {
  '/quienes-somos': '/p/quienes-somos',
}

const CEP_PUBLIC_PREFIX_REWRITES: Array<{ source: string; target: string }> = [
  { source: '/cursos', target: '/p/cursos' },
  { source: '/ciclos', target: '/p/ciclos' },
  { source: '/contacto', target: '/p/contacto' },
]

const INTERNAL_CATALOG_ROUTES = ['/cursos', '/ciclos', '/programacion', '/convocatorias', '/personal', '/sedes'] as const

const DASHBOARD_ALIAS_REWRITES: Record<string, string> = {
  '/dashboard/convocatorias': '/programacion',
}

function resolveCepPublicRewrite(pathname: string): string | null {
  if (CEP_PUBLIC_REWRITES[pathname]) {
    return CEP_PUBLIC_REWRITES[pathname]
  }

  for (const rule of CEP_PUBLIC_PREFIX_REWRITES) {
    if (pathname === rule.source || pathname.startsWith(`${rule.source}/`)) {
      return pathname.replace(rule.source, rule.target)
    }
  }

  return null
}

function resolveDashboardRouteRewrite(pathname: string): string | null {
  if (!pathname.startsWith('/dashboard/')) {
    return null
  }

  const alias = DASHBOARD_ALIAS_REWRITES[pathname]
  if (alias) {
    return alias
  }

  const strippedPath = pathname.replace(/^\/dashboard/, '')
  return strippedPath.length > 0 ? strippedPath : null
}

// FIX-16: DEV_AUTH_BYPASS removed. Authentication is always enforced.
// Use /dev/auto-login (development-only) for convenient local login.

// ============================================================================
// Security Headers (OWASP Recommended)
// ============================================================================

function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // Content Security Policy (relaxed for admin panel)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https://api.stripe.com ws: wss:",
      "frame-ancestors 'none'",
    ].join('; '),
    // Strict Transport Security (HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  } else if (!origin) {
    // No origin header (e.g., curl, server-to-server) — do not set
    // Access-Control-Allow-Origin so browsers will block cross-origin use.
  }

  return headers
}

export async function middleware(request: NextRequest) {
  const { pathname, protocol, host: _host } = request.nextUrl
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') ?? request.nextUrl.host

  const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname
  if (DEV_AUTH_ROUTES.some((route) => normalizedPathname === route)) {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEV_AUTO_LOGIN !== 'true') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.next()
  }

  // =========================================================================
  // HTTPS Enforcement (production only)
  // =========================================================================
  const isProduction = process.env.NODE_ENV === 'production'
  const enforceHttps = process.env.ENFORCE_HTTPS === 'true'
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const isHttps = forwardedProto === 'https' || protocol === 'https:'

  // Redirect HTTP to HTTPS in production (except for health checks)
  if (isProduction && enforceHttps && !isHttps && !pathname.startsWith('/api/health')) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // Canonical public routes for CEP host
  if (!pathname.startsWith('/api/') && ['GET', 'HEAD'].includes(request.method) && isCepHost(host)) {
    if (pathname === '/' || pathname === '/convocatorias' || pathname.startsWith('/convocatorias/')) {
      return NextResponse.next()
    }

    if (pathname === '/p/formacion') {
      const canonicalUrl = request.nextUrl.clone()
      canonicalUrl.pathname = '/'
      return NextResponse.redirect(canonicalUrl, 301)
    }

    const rewriteTarget = resolveCepPublicRewrite(pathname)
    if (rewriteTarget) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = rewriteTarget
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  // Handle CORS preflight requests for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(origin)
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Skip middleware for static assets
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip middleware for Payload native admin - let Payload handle auth
  if (payloadAdminPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // For API routes, add CORS headers to all responses
  if (pathname.startsWith('/api/')) {
    // Skip auth check for public API routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      const response = NextResponse.next()
      const corsHeaders = getCorsHeaders(origin)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }
  }

  // Skip middleware for public routes (non-API)
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // =========================================================================
  // API Key (Bearer token) detection — Edge-safe pass-through
  // =========================================================================
  // NOTE: We intentionally do NOT validate the Bearer token here.
  // Edge middleware cannot import Node.js crypto or query the DB.
  // Actual validation happens inside each /api/v1/* route handler.
  // We forward the presence of a Bearer token via custom headers so
  // route handlers know to attempt API key auth instead of cookie auth.
  const authorizationHeader = request.headers.get('authorization')
  if (
    pathname.startsWith('/api/v1/') &&
    authorizationHeader &&
    authorizationHeader.startsWith('Bearer ')
  ) {
    const bearerToken = authorizationHeader.slice(7).trim()
    if (bearerToken) {
      // Pass-through: let the route handler do the actual DB validation.
      // We propagate the raw token via a header so downstream handlers
      // can pick it up without re-parsing the Authorization header.
      const response = NextResponse.next()
      response.headers.set('x-api-bearer-token', bearerToken)
      // Add CORS and security headers so Bearer-authenticated API calls work correctly
      if (pathname.startsWith('/api/')) {
        const corsHeaders = getCorsHeaders(origin)
        Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v))
      }
      const securityHeaders = getSecurityHeaders()
      Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }
  }

  const verifiedSession = await verifyAvailableSession({
    payloadToken: request.cookies.get('payload-token')?.value,
    sessionV2: request.cookies.get(SESSION_V2_COOKIE)?.value,
  })
  const isAuthenticatedByCookie = Boolean(verifiedSession)
  const hasLegacyCookie = LEGACY_SESSION_COOKIES.some(
    (cookieName) => Boolean(request.cookies.get(cookieName)?.value),
  )

  if (
    !isAuthenticatedByCookie &&
    hasLegacyCookie &&
    !pathname.startsWith('/api/') &&
    request.method === 'GET'
  ) {
    const exchangeUrl = new URL('/auth/session-exchange', request.url)
    exchangeUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(exchangeUrl)
  }

  if (
    !pathname.startsWith('/api/') &&
    request.method === 'GET' &&
    !isCepHost(host) &&
    isAuthenticatedByCookie &&
    INTERNAL_CATALOG_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  ) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = `/dashboard${pathname}`
    return NextResponse.redirect(dashboardUrl)
  }

  // FIX-16: x-dev-bypass header removed. Auth is always enforced.
  if (!isAuthenticatedByCookie) {
    // For API routes, return 401 with CORS headers
    if (pathname.startsWith('/api/')) {
      const corsHeaders = getCorsHeaders(origin)
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Dashboard canonical namespace compatibility:
  // `/dashboard/*` rewrites to current internal dashboard pages (`/*`),
  // while preserving `/dashboard` as the dashboard landing route.
  if (!pathname.startsWith('/api/') && request.method === 'GET') {
    const dashboardRewriteTarget = resolveDashboardRouteRewrite(pathname)
    if (dashboardRewriteTarget) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = dashboardRewriteTarget
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  // For all other requests, add CORS and security headers.
  // Shared rate limiting is enforced in Node route handlers, not Edge middleware.
  const response = NextResponse.next()

  // Always add security headers
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }
  return response
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
    '/((?!_next/static|_next/image|favicon.ico|logos|public).*)',
  ],
}
