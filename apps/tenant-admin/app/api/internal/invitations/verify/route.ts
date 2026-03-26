import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

/**
 * GET /api/internal/invitations/verify?token=xxx
 * Verifies invitation token and returns invitation details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const db = (payload as any).db

    const result = await db.execute({
      raw: `SELECT id, email, name, role, status, expires_at
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

    return NextResponse.json({
      name: inv.name,
      email: inv.email,
      role: inv.role,
    })
  } catch (error) {
    console.error('[invitations/verify] error:', error)
    return NextResponse.json({ error: 'Error al verificar' }, { status: 500 })
  }
}
