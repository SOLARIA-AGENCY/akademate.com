import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Verify caller is admin via session cookie (new + legacy compatible)
    const cookieStore = await cookies()
    const sessionRaw =
      cookieStore.get('akademate_session')?.value || cookieStore.get('cep_session')?.value
    if (!sessionRaw) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const session = JSON.parse(sessionRaw) as { user?: { role?: string; id?: string } }
    if (!session.user || !['superadmin', 'admin'].includes(session.user.role ?? '')) {
      return NextResponse.json({ error: 'Acceso denegado — solo administradores' }, { status: 403 })
    }

    // 2. Parse target user ID from body
    const { userId, motivo } = (await request.json()) as { userId?: string; motivo?: string }
    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    // 3. Fetch target user from Payload
    const payload = await getPayload({ config })
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 4. Generate Payload JWT for the target user (2h expiry)
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Configuración de servidor incorrecta' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        collection: 'users',
      },
      secret,
      { expiresIn: '2h' }
    )

    // 5. Log impersonation in audit (best-effort)
    try {
      await (payload as any).create({
        collection: 'audit-logs',
        overrideAccess: true,
        data: {
          action: 'update',
          actor: session.user.id ?? 'unknown',
          target: String(user.id),
          targetEmail: user.email,
          motivo: motivo ?? 'Sin motivo indicado',
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // Non-fatal — proceed even if audit log fails
    }

    // 6. Return token (frontend sets cookie and redirects)
    return NextResponse.json({ token, userId: user.id, email: user.email })
  } catch (error) {
    console.error('[/api/auth/impersonate] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
