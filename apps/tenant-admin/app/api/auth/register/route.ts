import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '../../../../lib/rateLimit'

/**
 * POST /api/auth/register
 * Registro de nuevo usuario (auto-provisión sin autenticación previa).
 * Usa overrideAccess para saltarse el canCreateUsers que requiere admin.
 * Tras crear, hace auto-login y devuelve user + token.
 */
export async function POST(request: Request) {
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP)
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Por favor espera unos minutos.' },
      { status: 429, headers: rateLimitHeaders }
    )
  }

  try {
    const text = await request.text()
    const body = JSON.parse(text) as { name?: string; email?: string; password?: string }
    const { name, email, password } = body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Nombre, correo y contraseña son obligatorios.' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres.' },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    const payload = await getPayload({ config })

    // Crear usuario sin requerir sesión admin (overrideAccess: true)
    await payload.create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'lectura',
        is_active: true,
      },
      overrideAccess: true,
    })

    // Auto-login tras registro exitoso
    const loginResult = await payload.login({
      collection: 'users',
      data: { email: email.trim().toLowerCase(), password },
    })

    if (!loginResult.user || !loginResult.token) {
      return NextResponse.json(
        { error: 'Usuario creado pero no se pudo iniciar sesión automáticamente.' },
        { status: 500 }
      )
    }

    const user = loginResult.user as { id: string | number; email: string; name?: string; role?: string }

    const response = NextResponse.json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name ?? name.trim(),
        role: user.role ?? 'lectura',
      },
      token: loginResult.token,
    })

    const isSecure = process.env.ENFORCE_HTTPS === 'true'
    response.cookies.set('payload-token', loginResult.token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch (error) {
    console.error('[/api/auth/register] Error:', error)

    const err = error as { name?: string; status?: number; message?: string; data?: { errors?: Array<{ message: string }> } }

    // Email duplicado
    if (err.message?.toLowerCase().includes('duplicate') || err.message?.toLowerCase().includes('unique')) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese correo electrónico.' },
        { status: 409, headers: rateLimitHeaders }
      )
    }

    // Errores de validación de Payload
    if (err.data?.errors?.length) {
      return NextResponse.json(
        { error: err.data.errors[0].message },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear la cuenta. Por favor intenta de nuevo.' },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
