import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { queryFirst } from '@/@payload-config/lib/db'
import { sendMail } from '@/src/lib/email/transporter'
import { campusEnvironmentError } from '@/src/lib/campus/environment'
import {
  findStudentByEmail,
  generateCampusAuthToken,
  hashCampusAuthToken,
  normalizedCampusEmail,
} from '@/src/lib/campus/auth'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

/**
 * Creates a one-time password recovery token without disclosing whether the
 * submitted email belongs to an active campus student.
 */
export async function POST(request: NextRequest) {
  const environmentError = campusEnvironmentError()
  if (environmentError) return environmentError

  try {
    const body = await request.json() as { email?: string }
    const email = normalizedCampusEmail(body.email ?? '')
    if (!email) return NextResponse.json({ success: false, error: 'Email es obligatorio' }, { status: 400 })

    const result = await findStudentByEmail(email)
    if (result) {
      const token = generateCampusAuthToken()
      const tenantId = result.student.tenantId
      if (tenantId !== null) {
        await queryFirst(
          `UPDATE campus_auth_tokens SET consumed_at = NOW(), updated_at = NOW()
           WHERE student_id = $1 AND purpose = 'recovery' AND consumed_at IS NULL AND expires_at > NOW()`,
          [result.student.id],
        )
        await queryFirst(
          `INSERT INTO campus_auth_tokens (token_hash, student_id, purpose, expires_at, tenant_id)
           VALUES ($1, $2, 'recovery', NOW() + INTERVAL '1 hour', $3)`,
          [hashCampusAuthToken(token), result.student.id, tenantId],
        )

        const baseUrl = process.env.CAMPUS_PUBLIC_URL?.trim() || request.nextUrl.origin
        const resetUrl = `${baseUrl}/campus/restablecer?token=${encodeURIComponent(token)}`
        await sendMail({
          to: result.student.email,
          subject: 'CEP Formación — Recupera tu acceso al Campus Virtual',
          replyTo: process.env.SMTP_REPLY_TO || 'info@cursostenerife.es',
          html: `<p>Hola ${escapeHtml(result.student.fullName || 'alumno')},</p><p>Hemos recibido una solicitud para restablecer tu contraseña del Campus Virtual de CEP Formación.</p><p><a href="${escapeHtml(resetUrl)}">Crear una nueva contraseña</a></p><p>El enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Si existe una cuenta activa con ese email, recibiras instrucciones para recuperar el acceso.',
    })
  } catch (error) {
    console.error('[Campus Recovery] Error:', error)
    return NextResponse.json({ success: false, error: 'No se pudo iniciar la recuperacion' }, { status: 500 })
  }
}
