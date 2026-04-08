import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import crypto from 'crypto'
import { sendMail } from '../../../../src/lib/email/transporter'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const db = (payload as any).db
    const tenantQuery = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenantQuery.docs[0] as unknown as Record<string, unknown> | undefined
    const tenantIdRaw = tenant?.id
    const tenantId =
      typeof tenantIdRaw === 'number'
        ? tenantIdRaw
        : typeof tenantIdRaw === 'string' && /^\d+$/.test(tenantIdRaw)
        ? parseInt(tenantIdRaw, 10)
        : 1

    const academyName =
      (typeof tenant?.name === 'string' && tenant.name.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_NAME ||
      'Akademate'
    const primaryColor =
      (typeof tenant?.branding_primary_color === 'string' && tenant.branding_primary_color.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
      '#0066CC'
    const requestOrigin = request.nextUrl.origin
    const configuredBaseUrl = process.env.NEXT_PUBLIC_TENANT_URL?.trim()
    const domainFromTenant =
      (typeof tenant?.domain === 'string' && tenant.domain.trim()) || null
    const baseUrl = configuredBaseUrl || (domainFromTenant ? `https://${domainFromTenant}` : requestOrigin)
    const logoUrl =
      (typeof tenant?.branding_logo_url === 'string' && tenant.branding_logo_url.trim()) ||
      `${baseUrl}/logos/akademate-logo-official.png`

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
    const existingInv = await db.execute({
      raw: `SELECT id FROM user_invitations WHERE email = '${email.trim().toLowerCase().replace(/'/g, "''")}' AND status = 'pending' AND expires_at > NOW() LIMIT 1`,
    })
    if (existingInv?.rows?.length > 0) {
      return NextResponse.json({ error: 'Ya hay una invitacion pendiente para ese email' }, { status: 409 })
    }

    // Create invitation
    const token = generateToken()
    await db.execute({
      raw: `INSERT INTO user_invitations (email, name, role, token, status, tenant_id)
            VALUES ('${email.trim().toLowerCase().replace(/'/g, "''")}', '${name.trim().replace(/'/g, "''")}', '${role || 'lectura'}', '${token}', 'pending', ${tenantId})`,
    })

    // Send invitation email
    const acceptUrl = `${baseUrl}/auth/accept-invite?token=${token}`

    const html = invitationEmailHtml({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'lectura',
      acceptUrl,
      academyName,
      logoUrl,
      primaryColor,
    })

    const emailResult = await sendMail({
      to: email.trim().toLowerCase(),
      subject: `${academyName} — Has sido invitado al panel de administracion`,
      html,
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

    const payload = await getPayloadHMR({ config: configPromise })
    const db = (payload as any).db
    await db.execute({ raw: `UPDATE user_invitations SET status = 'revoked' WHERE id = ${parseInt(id, 10)}` })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[invitations] DELETE error:', error)
    return NextResponse.json({ error: 'Error al revocar' }, { status: 500 })
  }
}
