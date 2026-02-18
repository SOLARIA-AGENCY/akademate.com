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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const payloadBaseUrl =
      process.env.PAYLOAD_CMS_URL?.trim() ||
      process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
      'http://payload:3003'

    const payloadLogin = await fetch(`${payloadBaseUrl.replace(/\/$/, '')}/api/payload/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })

    if (!payloadLogin.ok) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const payloadData = await payloadLogin.json()
    const payloadUser = payloadData?.user
    const rawRoles = Array.isArray(payloadUser?.roles) ? payloadUser.roles : []
    const normalizedRoles = rawRoles.map((entry: unknown) => {
      if (typeof entry === 'string') return entry
      if (entry && typeof entry === 'object' && 'role' in entry) {
        return String((entry as { role?: string }).role || '')
      }
      return ''
    }).filter(Boolean)

    if (!normalizedRoles.includes('superadmin')) {
      return NextResponse.json(
        { error: 'Acceso denegado: solo superadmin puede acceder a Ops' },
        { status: 403 }
      )
    }

    const sessionData = {
      id: payloadUser?.id || 'unknown',
      email,
      role: 'superadmin',
      name: payloadUser?.name || 'Ops Superadmin',
      tenantId: 'global-ops',
      token: payloadData?.token || `session-${Date.now()}`,
    }

    const forwardedProto = request.headers.get('x-forwarded-proto')
    const isHttpsRequest = request.url.startsWith('https://') || forwardedProto === 'https'
    const isSecure = process.env.NODE_ENV === 'production' && isHttpsRequest
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
      { error: 'Error interno de autenticación' },
      { status: 500 }
    )
  }
}
