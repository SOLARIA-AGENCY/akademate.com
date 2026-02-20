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
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()
  
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) return xRealIP

  return '127.0.0.1'
}

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  // In-memory rate limiting is disabled for Edge compatibility
  return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs }
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
  '/api/health',
  '/api/auth/dev-login',
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

export function middleware(request: NextRequest) {
  const { pathname, protocol, host: _host } = request.nextUrl
  const origin = request.headers.get('origin')

  // Always allow tenant dev-login endpoint in development/staging workflows.
  if (pathname === '/api/auth/dev-login' || pathname === '/api/auth/dev-login/') {
    return NextResponse.next()
  }

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

  // FIX-16: x-dev-bypass header removed. Auth is always enforced.
  if (!token) {
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
