import bcrypt from 'bcryptjs'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { queryFirst } from '@/@payload-config/lib/db'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import { findStudentByIdForAdmin, hashCampusAuthToken } from '@/src/lib/campus/auth'

interface CampusRecoveryToken {
  id: string | number
  student_id: string | number
  purpose: string
  expires_at: string
  consumed_at?: string | null
}

/** Consumes a single-use recovery token and replaces the student password. */
export async function POST(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  try {
    const body = await request.json() as { token?: string; password?: string }
    const token = body.token?.trim()
    const password = body.password ?? ''
    if (!token || !password) return NextResponse.json({ success: false, error: 'Token y contrasena son obligatorios' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ success: false, error: 'La contrasena debe tener al menos 8 caracteres' }, { status: 422 })

    const authToken = await queryFirst<CampusRecoveryToken>(
      `SELECT id, student_id, purpose, expires_at, consumed_at
       FROM campus_auth_tokens WHERE token_hash = $1 LIMIT 1`,
      [hashCampusAuthToken(token)],
    )
    if (!authToken || authToken.purpose !== 'recovery') return NextResponse.json({ success: false, error: 'Enlace no valido' }, { status: 404 })
    if (authToken.consumed_at) return NextResponse.json({ success: false, error: 'Este enlace ya fue utilizado' }, { status: 410 })
    if (new Date(authToken.expires_at).getTime() <= Date.now()) return NextResponse.json({ success: false, error: 'Este enlace ha expirado' }, { status: 410 })

    const student = await findStudentByIdForAdmin(String(authToken.student_id))
    if (!student || student.status !== 'active') return NextResponse.json({ success: false, error: 'Alumno no disponible' }, { status: 404 })

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'students',
      id: String(authToken.student_id),
      data: { password_hash: await bcrypt.hash(password, 12) } as unknown as Record<string, unknown>,
      overrideAccess: true,
    })
    await queryFirst(
      `UPDATE campus_auth_tokens SET consumed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [authToken.id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Campus Reset] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo restablecer el acceso' }, { status: 500 })
  }
}
