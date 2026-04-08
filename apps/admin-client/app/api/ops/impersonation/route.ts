import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { logRequest } from '@/lib/api-logger'
import { createImpersonationAudit } from '@/lib/ops/impersonation'

export const dynamic = 'force-dynamic'

const RequestSchema = z.object({
  tenantId: z.string().min(1),
  accessType: z.enum(['dashboard', 'payload']),
  reason: z.string().trim().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const start = Date.now()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      logRequest({ method: 'POST', path: '/api/ops/impersonation', status: 401, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      logRequest({ method: 'POST', path: '/api/ops/impersonation', status: 400, latencyMs: Date.now() - start, ip })
      return NextResponse.json(
        { error: 'Payload invalido', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await createImpersonationAudit({
      tenantId: parsed.data.tenantId,
      accessType: parsed.data.accessType,
      actorUserId: String(session.user.id),
      actorEmail: session.user.email ?? 'unknown@akademate.com',
      actorName: session.user.name ?? null,
      reason: parsed.data.reason,
    })

    if (!result) {
      logRequest({
        method: 'POST',
        path: '/api/ops/impersonation',
        status: 404,
        latencyMs: Date.now() - start,
        ip,
        tenantId: parsed.data.tenantId,
      })
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    logRequest({
      method: 'POST',
      path: '/api/ops/impersonation',
      status: 200,
      latencyMs: Date.now() - start,
      ip,
      tenantId: result.tenant.id,
    })

    return NextResponse.json({
      success: true,
      audit: {
        id: result.auditId,
        checkedAt: result.destination.checkedAt,
      },
      tenant: result.tenant,
      accessType: result.accessType,
      targetUrl: result.targetUrl,
      environment: result.environment,
      destination: result.destination,
    })
  } catch (error) {
    console.error('[ops/impersonation] error', error)
    logRequest({ method: 'POST', path: '/api/ops/impersonation', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
