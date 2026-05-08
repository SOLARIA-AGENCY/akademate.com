import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * GET /api/internal/users — List users for the admin panel
 * POST /api/internal/users — Create user directly (admin only)
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    const users = await payload.find({
      collection: 'users',
      limit: 100,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    })

    // Also fetch pending invitations
    const db = (payload as any).db
    let invitations: any[] = []
    try {
      const result = await db.execute({
        raw: `SELECT id, email, name, role, status, created_at, expires_at
              FROM user_invitations
              WHERE status = 'pending' AND expires_at > NOW()
              ORDER BY created_at DESC`,
      })
      invitations = result?.rows || []
    } catch { /* table may not exist yet */ }

    return NextResponse.json({
      users: users.docs.map((u: any) => ({
        id: String(u.id),
        name: u.name || u.email?.split('@')[0] || 'Sin nombre',
        email: u.email,
        role: u.role || 'lectura',
        is_active: u.is_active !== false,
        last_login_at: u.last_login_at || null,
        login_count: u.login_count || 0,
        phone: u.phone || '',
        createdAt: u.createdAt,
        status: 'active',
      })),
      invitations: invitations.map((inv: any) => ({
        id: `inv_${inv.id}`,
        invitationId: inv.id,
        name: inv.name,
        email: inv.email,
        role: inv.role,
        is_active: false,
        last_login_at: null,
        login_count: 0,
        phone: '',
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        status: 'pending',
      })),
    })
  } catch (error) {
    console.error('[internal/users] GET error:', error)
    return NextResponse.json({ users: [], invitations: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone } = body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nombre, email y contrasena son obligatorios' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const user = await (payload as any).create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || 'lectura',
        phone: phone || undefined,
        is_active: true,
        tenant: 1,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ success: true, id: user.id, email: user.email })
  } catch (error: any) {
    console.error('[internal/users] POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear usuario' },
      { status: 500 },
    )
  }
}
