import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { queryRows } from '@/@payload-config/lib/db'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

/**
 * GET /api/internal/users — List users for the admin panel
 * POST /api/internal/users — Create user directly (admin only)
 */

export const dynamic = 'force-dynamic'

const USER_MANAGER_ROLES = new Set(['superadmin', 'admin', 'gestor'])
const ASSIGNABLE_ROLES = new Set(['admin', 'gestor', 'marketing', 'asesor', 'lectura'])

function canAssignRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'superadmin') return ASSIGNABLE_ROLES.has(targetRole)
  if (actorRole === 'admin') return targetRole !== 'superadmin' && ASSIGNABLE_ROLES.has(targetRole)
  return actorRole === 'gestor' && !['superadmin', 'admin'].includes(targetRole) && ASSIGNABLE_ROLES.has(targetRole)
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload)
    if (!authContext) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!authContext.role || !USER_MANAGER_ROLES.has(authContext.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (authContext.role !== 'superadmin' && !authContext.tenantId) {
      return NextResponse.json({ error: 'Tenant scope required' }, { status: 403 })
    }

    const users = await payload.find({
      collection: 'users',
      ...(authContext.role === 'superadmin'
        ? {}
        : { where: { tenant: { equals: authContext.tenantId } } }),
      limit: 100,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    })

    // Also fetch pending invitations
    let invitations: any[] = []
    try {
      const invitationParams = authContext.role === 'superadmin' ? [] : [authContext.tenantId]
      invitations = await queryRows(
        `SELECT id, email, name, role, status, created_at, expires_at
         FROM user_invitations
         WHERE status = 'pending' AND expires_at > NOW()
           ${authContext.role === 'superadmin' ? '' : 'AND tenant_id = $1'}
         ORDER BY created_at DESC`,
        invitationParams,
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
    const authContext = await getAuthenticatedUserContext(request, payload)
    if (!authContext) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!authContext.role || !USER_MANAGER_ROLES.has(authContext.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!authContext.tenantId) {
      return NextResponse.json({ error: 'Tenant scope required' }, { status: 403 })
    }

    const requestedRole = typeof role === 'string' && role.trim() ? role.trim() : 'gestor'
    if (!canAssignRole(authContext.role, requestedRole)) {
      return NextResponse.json({ error: 'No puedes asignar ese rol' }, { status: 403 })
    }

    const user = await (payload as any).create({
      collection: 'users',
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        // This is CEP's internal administrative-user flow, not public signup.
        // A new collaborator needs the same academic management surface as the
        // rest of the CEP operations team unless an administrator selects a role.
        role: requestedRole,
        phone: phone || undefined,
        is_active: true,
        tenant: authContext.tenantId,
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
