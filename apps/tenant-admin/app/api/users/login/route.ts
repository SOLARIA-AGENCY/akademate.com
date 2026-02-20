import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  createRateLimitHeaders,
} from '../../../../lib/rateLimit'

/**
 * Custom Login API Route
 * Workaround for Payload CMS 3.x body parsing issue in Next.js 15 App Router
 *
 * POST /api/users/login
 * Body: { email: string, password: string }
 * Returns: { user, token, exp } on success
 *
 * Rate limiting: 5 attempts per 15 minutes per IP
 */
export async function POST(request: Request) {
  // Get client IP for rate limiting
  const clientIP = getClientIP(request)

  // Check rate limit
  const rateLimitResult = checkRateLimit(clientIP)
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    )
  }

  try {
    // Manually parse JSON body
    const body = await request.json() as { email?: string; password?: string }
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    // Get Payload instance
     
    const payload: Payload = await getPayload({ config })

    // Attempt login
    const result = await payload.login({
      collection: 'users',
      data: {
        email,
        password,
      },
    })

    if (!result.user || !result.token) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: rateLimitHeaders }
      )
    }

    // Reset rate limit on successful login
    resetRateLimit(clientIP)

    // Create response with user data
    const user = result.user as { id: string | number; email: string; name?: string; role?: string }
    const response = NextResponse.json({
      message: 'Auth Passed',
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      exp: result.exp,
    })

    // Set auth cookie (same as Payload's default)
    const isSecure = process.env.NODE_ENV === 'production'
    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)

    const err = error as { name?: string; status?: number; message?: string }

    // Handle specific Payload errors
    if (err.name === 'AuthenticationError' || err.status === 401) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: rateLimitHeaders }
      )
    }

    if (err.message?.includes('Invalid login')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: rateLimitHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Login failed', details: err.message },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}

// OPTIONS for CORS preflight
export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
  ]

  const isTenantOrigin = (value: string) => {
    try {
      const url = new URL(value)
      return (
        url.hostname.endsWith('.akademate.com') ||
        url.hostname.endsWith('.akademate.io') ||
        url.hostname.endsWith('.localhost')
      )
    } catch {
      return false
    }
  }

  const isAllowed =
    origin &&
    (allowedOrigins.includes(origin) || isTenantOrigin(origin) || origin === 'https://akademate.com')

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }

  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  })
}
