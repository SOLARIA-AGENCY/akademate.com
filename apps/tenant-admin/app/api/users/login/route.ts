import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Custom Login API Route
 * Workaround for Payload CMS 3.x body parsing issue in Next.js 15 App Router
 *
 * POST /api/users/login
 * Body: { email: string, password: string }
 * Returns: { user, token, exp } on success
 */
export async function POST(request: Request) {
  try {
    // Manually parse JSON body
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

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
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      message: 'Auth Passed',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      token: result.token,
      exp: result.exp,
    })

    // Set auth cookie (same as Payload's default)
    // NOTE: secure: false because we're using HTTP (not HTTPS yet)
    // TODO: Change to secure: true when SSL is configured
    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: false, // HTTP mode - change to true when HTTPS is ready
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)

    // Handle specific Payload errors
    if (error.message?.includes('Invalid login')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://46.62.222.138',
    'https://cepcomunicacion.com',
    'https://www.cepcomunicacion.com'
  ]

  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.join(', '),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  })
}
