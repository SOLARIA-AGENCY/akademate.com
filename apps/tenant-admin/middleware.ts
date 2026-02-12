import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================================
// Rate Limiting Configuration (Edge-compatible)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (single instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit presets (requests per minute)
const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 10 },      // Login, password reset
  standard: { windowMs: 60_000, maxRequests: 100 }, // Normal API
  bulk: { windowMs: 60_000, maxRequests: 10 },      // Import/export
} as const

// Auth endpoints that need stricter rate limiting
const authEndpoints = [
  '/api/users/login',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/auth/',
]

// Bulk operation endpoints
const bulkEndpoints = [
  '/api/import/',
  '/api/export/',
  '/api/bulk/',
]

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  )
}

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Cleanup expired entries (1% chance per request)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime <= now) rateLimitStore.delete(k)
    }
  }

  // New window or expired entry
  if (!entry || entry.resetTime <= now) {
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  // Within window
  if (entry.count < maxRequests) {
    entry.count++
    return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter: Math.ceil((entry.resetTime - now) / 1000),
  }
}

function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number,
  retryAfter?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
  }
  if (retryAfter) headers['Retry-After'] = String(retryAfter)
  return headers
}

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
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/dev/auto-login',
  '/api/users/login',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/me', // Allow preflight for auth check
]

// Static asset paths to ignore
const staticPaths = [
  '/_next',
  '/logos',
  '/favicon',
  '/api/config',
]

// Payload native admin - let Payload handle its own auth
const payloadAdminPaths = [
  '/admin',  // Native Payload CMS admin panel
]

// DEV_AUTH_BYPASS: Skip all authentication in development
// SECURITY: Set to false in production builds
const DEV_AUTH_BYPASS = process.env.NODE_ENV === 'development'

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
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com wss:",
      "frame-ancestors 'none'",
    ].join('; '),
    // Strict Transport Security (HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-Dev-Bypass',
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

export function middleware(request: NextRequest) {
  const { pathname, protocol, host } = request.nextUrl
  const origin = request.headers.get('origin')

  // =========================================================================
  // HTTPS Enforcement (production only)
  // =========================================================================
  const isProduction = process.env.NODE_ENV === 'production'
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const isHttps = forwardedProto === 'https' || protocol === 'https:'

  // Redirect HTTP to HTTPS in production (except for health checks)
  if (isProduction && !isHttps && !pathname.startsWith('/api/health')) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // =========================================================================
  // Rate Limiting (always active, even in dev)
  // =========================================================================
  let rateLimitHeaders: Record<string, string> = {}

  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)

    // Determine rate limit tier
    let rateLimit = RATE_LIMITS.standard
    if (authEndpoints.some(ep => pathname.startsWith(ep))) {
      rateLimit = RATE_LIMITS.auth
    } else if (bulkEndpoints.some(ep => pathname.startsWith(ep))) {
      rateLimit = RATE_LIMITS.bulk
    }

    const key = `${clientIP}:${pathname.split('/').slice(0, 4).join('/')}`
    const result = checkRateLimit(key, rateLimit.windowMs, rateLimit.maxRequests)
    rateLimitHeaders = getRateLimitHeaders(
      result.remaining,
      result.resetTime,
      rateLimit.maxRequests,
      result.retryAfter
    )

    // Block if rate limit exceeded
    if (!result.allowed) {
      const corsHeaders = getCorsHeaders(origin)
      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers: { ...corsHeaders, ...rateLimitHeaders }
        }
      )
    }
  }

  // =========================================================================
  // Auth Bypass (development only)
  // =========================================================================
  // Bypass all auth when DEV_AUTH_BYPASS is enabled
  if (DEV_AUTH_BYPASS) {
    const response = NextResponse.next()
    // Still add rate limit headers even in dev bypass
    Object.entries(rateLimitHeaders).forEach(([k, v]) => response.headers.set(k, v))
    return response
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
      // Add rate limit headers
      Object.entries(rateLimitHeaders).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }
  }

  // Skip middleware for public routes (non-API)
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for authentication cookie (Payload CMS sets 'payload-token')
  const token = request.cookies.get('payload-token')?.value

  // In development, also check for dev bypass in localStorage (via custom header)
  const isDev = process.env.NODE_ENV === 'development'
  const devBypass = request.headers.get('x-dev-bypass')

  // If no token and not dev bypass, redirect to login
  if (!token && !(isDev && devBypass)) {
    // For API routes, return 401 with CORS headers
    if (pathname.startsWith('/api/')) {
      const corsHeaders = getCorsHeaders(origin)
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        {
          status: 401,
          headers: { ...corsHeaders, ...rateLimitHeaders },
        }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For all other requests, add CORS, security, and rate limit headers
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
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([k, v]) => response.headers.set(k, v))
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
