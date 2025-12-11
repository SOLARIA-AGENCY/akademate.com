import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
const DEV_AUTH_BYPASS = true

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
    // Allow requests without origin (e.g., curl, server-to-server)
    headers['Access-Control-Allow-Origin'] = '*'
  }

  return headers
}

export function middleware(request: NextRequest) {
  // Bypass all auth when DEV_AUTH_BYPASS is enabled
  if (DEV_AUTH_BYPASS) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

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
        { error: 'Authentication required' },
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

  // For all other requests, add CORS headers
  const response = NextResponse.next()
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
