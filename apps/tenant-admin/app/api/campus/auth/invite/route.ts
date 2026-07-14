import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { queryFirst } from '@/@payload-config/lib/db'
import { sendMail } from '@/src/lib/email/transporter'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import {
  findStudentByIdForAdmin,
  generateCampusAuthToken,
  hashCampusAuthToken,
  readCampusAdminSession,
} from '@/src/lib/campus/auth'

interface StudentForInvite {
  id: string | number
  email?: string
  first_name?: string
  last_name?: string
  status?: string
  tenant?: string | number | { id?: string | number }
}

function tenantIdOf(value: StudentForInvite['tenant']): string | number | null {
  if (typeof value === 'object' && value !== null) return value.id ?? null
  return typeof value === 'string' || typeof value === 'number' ? value : null
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

export async function POST(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  const admin = await readCampusAdminSession(request)
  if (!admin) return NextResponse.json({ success: false, error: 'Se requiere una sesion de gestion' }, { status: 403 })

  try {
    const body = await request.json() as { studentId?: string }
    if (!body.studentId) return NextResponse.json({ success: false, error: 'studentId es obligatorio' }, { status: 400 })

    const student = await findStudentByIdForAdmin(body.studentId) as StudentForInvite | null
    if (!student || student.status !== 'active' || !student.email) {
      return NextResponse.json({ success: false, error: 'Alumno activo con email no encontrado' }, { status: 404 })
    }

    const studentTenant = tenantIdOf(student.tenant)
    if (admin.role !== 'superadmin' && String(studentTenant) !== String(admin.tenantId)) {
      return NextResponse.json({ success: false, error: 'El alumno no pertenece al tenant autenticado' }, { status: 403 })
    }

    const token = generateCampusAuthToken()
    const tokenHash = hashCampusAuthToken(token)
    const tenantId = admin.role === 'superadmin' ? studentTenant : admin.tenantId
    if (tenantId === null) return NextResponse.json({ success: false, error: 'El alumno no tiene tenant' }, { status: 422 })

    await queryFirst(
      `UPDATE campus_auth_tokens SET consumed_at = NOW(), updated_at = NOW()
       WHERE student_id = $1 AND purpose = 'setup' AND consumed_at IS NULL AND expires_at > NOW()` ,
      [student.id],
    )
    await queryFirst(
      `INSERT INTO campus_auth_tokens (token_hash, student_id, purpose, expires_at, tenant_id)
       VALUES ($1, $2, 'setup', NOW() + INTERVAL '7 days', $3)`,
      [tokenHash, student.id, tenantId],
    )

    const name = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'alumno'
    const baseUrl = process.env.CAMPUS_PUBLIC_URL?.trim() || request.nextUrl.origin
    const acceptUrl = `${baseUrl}/campus/activar?token=${encodeURIComponent(token)}`
    const emailResult = await sendMail({
      to: student.email,
      subject: 'CEP Formación — Activa tu acceso al Campus Virtual',
      replyTo: process.env.SMTP_REPLY_TO || 'info@cursostenerife.es',
      html: `<p>Hola ${escapeHtml(name)},</p><p>Ya puedes activar tu acceso al Campus Virtual de CEP Formación.</p><p><a href="${escapeHtml(acceptUrl)}">Crear contraseña y activar acceso</a></p><p>El enlace expira en 7 días.</p>`,
    })

    return NextResponse.json({ success: true, emailSent: emailResult.success })
  } catch (error) {
    console.error('[Campus Invite] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo crear la invitacion' }, { status: 500 })
  }
}
