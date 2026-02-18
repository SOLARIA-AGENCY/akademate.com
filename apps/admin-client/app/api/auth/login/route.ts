import { NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 *
 * Sets the admin session as an httpOnly cookie.
 * When real auth is implemented, this should validate credentials against
 * an identity provider and issue a signed JWT stored in the httpOnly cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, role, name, tenantId } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // TODO: Replace with real authentication (Payload CMS / IdP)
    const sessionData = {
      id: 'dev-superadmin',
      email,
      role: role || 'superadmin',
      name: name || 'Demo Ops',
      tenantId: tenantId || 'global-ops',
      token: `dev-token-${Date.now()}`,
    }

    const isSecure = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: sessionData.id,
        email: sessionData.email,
        role: sessionData.role,
        name: sessionData.name,
        tenantId: sessionData.tenantId,
      },
    })

    // Store session in httpOnly cookie (not accessible to JavaScript)
    response.cookies.set('akademate_admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('[/api/auth/login] Error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
