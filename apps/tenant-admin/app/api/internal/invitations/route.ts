import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'
import { sendMail } from '../../../../src/lib/email/transporter'
import { queryFirst } from '@/@payload-config/lib/db'

/**
 * POST /api/internal/invitations — Create invitation + send email
 * DELETE /api/internal/invitations?id=X — Revoke invitation
 * POST /api/internal/invitations/resend — Resend invitation email
 */

export const dynamic = 'force-dynamic'

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function invitationEmailHtml(params: {
  name: string
  email: string
  role: string
  acceptUrl: string
  academyName: string
  logoUrl: string
  primaryColor: string
}): string {
  const roleLabels: Record<string, string> = {
    admin: 'Administrador', gestor: 'Gestor', marketing: 'Marketing',
    asesor: 'Asesor', lectura: 'Lectura',
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" style="background:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:${params.primaryColor};padding:24px 32px;text-align:center;">
    <img src="${params.logoUrl}" alt="${params.academyName}" width="48" height="48" style="border-radius:8px;background:#fff;padding:4px;">
    <p style="color:#fff;font-size:18px;font-weight:700;margin:8px 0 0;">${params.academyName}</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Has sido invitado/a</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Hola <strong>${params.name}</strong>, te han invitado a unirte al panel de administracion de <strong>${params.academyName}</strong>.
    </p>
    <table role="presentation" width="100%" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px;">
      <tr><td style="padding:20px;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Email de acceso</p>
        <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;">${params.email}</p>
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Rol asignado</p>
        <p style="font-size:15px;color:#111827;font-weight:600;margin:0;">${roleLabels[params.role] || params.role}</p>
      </td></tr>
    </table>
    <table role="presentation" width="100%">
      <tr><td align="center">
        <a href="${params.acceptUrl}" style="display:inline-block;background:${params.primaryColor};color:#fff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;">
          Aceptar invitacion y crear contrasena
        </a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#6b7280;margin:20px 0 0;text-align:center;">
      Este enlace expira en 7 dias. Si no solicitaste esta invitacion, ignora este email.
    </p>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">${params.academyName} — Panel de Administracion</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return `${baseUrl}${trimmed}`
  return `${baseUrl}/${trimmed}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const tenantQuery = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenantQuery.docs[0] as unknown as Record<string, unknown> | undefined
    const tenantIdRaw = tenant?.id
    const tenantId =
      typeof tenantIdRaw === 'number'
        ? tenantIdRaw
        : typeof tenantIdRaw === 'string' && /^\d+$/.test(tenantIdRaw)
        ? parseInt(tenantIdRaw, 10)
        : 1

    const domainFromTenant =
      (typeof tenant?.domain === 'string' && tenant.domain.trim()) || null
    const academyName =
      (typeof tenant?.name === 'string' && tenant.name.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_NAME ||
      'CEP FORMACION'
    const isCepTenant =
      /cep\s*formaci[oó]n/i.test(academyName) ||
      /cepformacion|cursostenerife|cepcomunicacion/i.test(domainFromTenant || request.nextUrl.hostname)
    // CEP operates its dashboard collaboratively: internal invitations must
    // start with academic-management access unless an explicit role is chosen.
    // Public registration remains read-only in its separate endpoint.
    const invitationRole = role || (isCepTenant ? 'gestor' : 'lectura')
    const configuredPrimaryColor =
      (typeof tenant?.branding_primary_color === 'string' && tenant.branding_primary_color.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
      '#E3003A'
    const primaryColor = isCepTenant && /^#?0066cc$/i.test(configuredPrimaryColor)
      ? '#E3003A'
      : configuredPrimaryColor
    const requestOrigin = request.nextUrl.origin
    const configuredBaseUrl = process.env.NEXT_PUBLIC_TENANT_URL?.trim()
    const baseUrl = configuredBaseUrl || (domainFromTenant ? `https://${domainFromTenant}` : requestOrigin)
    const configuredLogoUrl =
      (typeof tenant?.branding_logo_url === 'string' && tenant.branding_logo_url.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_LOGO_URL ||
      ''
    const tenantLogoUrl =
      isCepTenant && /akademate/i.test(configuredLogoUrl)
        ? '/logos/cep-formacion-logo.png'
        : configuredLogoUrl || '/logos/cep-formacion-logo.png'
    const logoUrl = toAbsoluteUrl(
      tenantLogoUrl,
      baseUrl,
    )

    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email.trim().toLowerCase() } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }

    // Check if invitation already pending
    const invitationEmail = email.trim().toLowerCase()
    const existingInv = await queryFirst<{ id: number }>(
      `SELECT id
       FROM user_invitations
       WHERE email = $1 AND status = 'pending' AND expires_at > NOW()
       LIMIT 1`,
      [invitationEmail],
    )
    if (existingInv) {
      return NextResponse.json({ error: 'Ya hay una invitacion pendiente para ese email' }, { status: 409 })
    }

    // Create invitation
    const token = generateToken()
    await queryFirst(
      `INSERT INTO user_invitations (email, name, role, token, status, tenant_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [invitationEmail, name.trim(), invitationRole, token, tenantId],
    )

    // Send invitation email
    const acceptUrl = `${baseUrl}/auth/accept-invite?token=${token}`

    const html = invitationEmailHtml({
      name: name.trim(),
      email: invitationEmail,
      role: invitationRole,
      acceptUrl,
      academyName,
      logoUrl,
      primaryColor,
    })

    const emailResult = await sendMail({
      to: invitationEmail,
      subject: `${academyName} — Has sido invitado al panel de administración`,
      html,
      from: process.env.SMTP_FROM || `${academyName} <noreply@cepcomunicacion.com>`,
      replyTo: process.env.SMTP_REPLY_TO || 'info@cursostenerife.es',
    })

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
    })
  } catch (error: any) {
    console.error('[invitations] POST error:', error)
    return NextResponse.json({ error: error?.message || 'Error al crear invitacion' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const payload = await getPayload({ config: configPromise })
    await queryFirst(
      `UPDATE user_invitations SET status = 'revoked' WHERE id = $1`,
      [parseInt(id, 10)],
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[invitations] DELETE error:', error)
    return NextResponse.json({ error: 'Error al revocar' }, { status: 500 })
  }
}
