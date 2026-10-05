import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { queryRows } from '@/@payload-config/lib/db'
import { createTenantRepository } from '@/lib/server/tenant-repository'
import {
  requireAnyRole,
  requirePrincipal,
  TenantAccessError,
} from '@/lib/server/tenant-access'

/**
 * GET /api/internal/users — List users for the admin panel
 * POST /api/internal/users — Create user directly (admin only)
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const principal = await requirePrincipal(request, payload)
    requireAnyRole(principal, ['admin', 'gestor'])
    const usersRepository = createTenantRepository(payload, principal, { collection: 'users' })

    const users = await usersRepository.find({
      limit: 100,
      sort: '-createdAt',
      depth: 0,
    })

    // Also fetch pending invitations
    let invitations: any[] = []
    try {
      invitations = await queryRows(
        `SELECT id, email, name, role, status, created_at, expires_at
         FROM user_invitations
         WHERE tenant_id = $1 AND status = 'pending' AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [principal.tenantId],
      )
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
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[internal/users] GET error:', error)
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 })
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
    const principal = await requirePrincipal(request, payload)
    requireAnyRole(principal, ['admin'])
    const usersRepository = createTenantRepository(payload, principal, { collection: 'users' })

    const user = await usersRepository.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role || 'lectura',
        phone: phone || undefined,
        is_active: true,
    }) as { id: string | number; email?: string }

    return NextResponse.json({ success: true, id: user.id, email: user.email })
  } catch (error: any) {
    if (error instanceof TenantAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[internal/users] POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al crear usuario' },
      { status: 500 },
    )
  }
}
