import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, createRateLimitHeaders, getClientIP, resetRateLimit } from '@/lib/rateLimit'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import {
  createCampusToken,
  findCampusEnrollments,
  findStudentByEmail,
  normalizedCampusEmail,
  setCampusSessionCookie,
  updateLastLogin,
  verifyStudentPassword,
} from '@/src/lib/campus/auth'

export async function POST(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(clientIP)
  const headers = createRateLimitHeaders(rateLimit)
  if (rateLimit.isLimited) {
    return NextResponse.json(
      { success: false, error: 'Demasiados intentos. Intentalo de nuevo mas tarde.' },
      { status: 429, headers },
    )
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string }
    const email = normalizedCampusEmail(body.email ?? '')
    const password = body.password ?? ''
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Correo y contrasena son obligatorios.' },
        { status: 400, headers },
      )
    }

    const result = await findStudentByEmail(email)
    if (!result || !(await verifyStudentPassword(result.document, password))) {
      return NextResponse.json(
        { success: false, error: 'Correo o contrasena no validos.' },
        { status: 401, headers },
      )
    }

    const token = await createCampusToken(result.student)
    await updateLastLogin(result.student.id)
    const response = NextResponse.json({
      success: true,
      student: result.student,
      enrollments: await findCampusEnrollments(result.student.id, result.student.tenantId),
    }, { headers })
    setCampusSessionCookie(response, token)
    resetRateLimit(clientIP)
    return response
  } catch (error) {
    console.error('[Campus Auth] Login error:', error)
    return NextResponse.json(
      { success: false, error: 'No se pudo iniciar la sesion en el entorno interno.' },
      { status: 500, headers },
    )
  }
}
