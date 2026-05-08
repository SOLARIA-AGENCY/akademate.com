import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * POST /api/internal/invitations/accept
 * Body: { token, password }
 * Creates user account and marks invitation as accepted
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contrasena son obligatorios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contrasena debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const db = (payload as any).db

    // Verify token
    const result = await db.execute({
      raw: `SELECT id, email, name, role, status, expires_at, tenant_id
            FROM user_invitations
            WHERE token = '${token.replace(/'/g, "''")}'
            LIMIT 1`,
    })

    const inv = result?.rows?.[0]
    if (!inv) {
      return NextResponse.json({ error: 'Invitacion no encontrada' }, { status: 404 })
    }

    if (inv.status !== 'pending') {
      return NextResponse.json({ error: 'Esta invitacion ya fue utilizada' }, { status: 410 })
    }

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Esta invitacion ha expirado' }, { status: 410 })
    }

    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: inv.email } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      // Mark invitation as accepted anyway
      await db.execute({
        raw: `UPDATE user_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = ${inv.id}`,
      })
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email. Usa el login normal.' }, { status: 409 })
    }

    // Create user in Payload
    await (payload as any).create({
      collection: 'users',
      data: {
        name: inv.name,
        email: inv.email,
        password,
        role: inv.role,
        is_active: true,
        tenant: inv.tenant_id || 1,
      },
      overrideAccess: true,
    })

    // Mark invitation as accepted
    await db.execute({
      raw: `UPDATE user_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = ${inv.id}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[invitations/accept] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al aceptar invitacion' },
      { status: 500 },
    )
  }
}
