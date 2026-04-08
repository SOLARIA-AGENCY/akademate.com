import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

async function getAuthenticatedUser(request: NextRequest, payload: any): Promise<{
  userId: number
  tenantId: number | null
} | null> {
  const token = request.cookies.get('payload-token')?.value
  if (!token) return null

  try {
    const authResult = await payload.auth({
      collection: 'users',
      headers: new Headers({ cookie: `payload-token=${token}` }),
    }) as {
      user?: {
        id?: string | number
        tenantId?: string | number
        tenant?: string | number | { id?: string | number }
      }
    } | null

    const userId = toPositiveInt(authResult?.user?.id)
    if (!userId) return null

    const tenantCandidate =
      authResult?.user?.tenantId ??
      (typeof authResult?.user?.tenant === 'object' && authResult?.user?.tenant !== null
        ? authResult.user.tenant.id
        : authResult?.user?.tenant)

    return {
      userId,
      tenantId: toPositiveInt(tenantCandidate),
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const authUser = await getAuthenticatedUser(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const leadId = toPositiveInt(id)
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID invalido' }, { status: 400 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant)
    if (leadTenantId && authUser.tenantId && leadTenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const allowedStatuses = ['interested', 'following_up', 'enrolling']
    if (!allowedStatuses.includes(lead.status)) {
      return NextResponse.json(
        { error: `Status "${lead.status}" no permite matriculacion. Debe ser: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    if (lead.enrollment_id) {
      return NextResponse.json(
        { error: 'Lead ya tiene ficha de matricula', enrollmentId: lead.enrollment_id },
        { status: 409 },
      )
    }

    const tenantId =
      toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant) ??
      authUser.tenantId ??
      1
    const userId = authUser.userId

    let courseRunId =
      toPositiveInt(lead.course_run_id ?? lead.course_id ?? lead.course_run?.id ?? lead.course_run)

    if (!courseRunId) {
      const runs = await payload.find({
        collection: 'course-runs',
        depth: 0,
        limit: 1,
        sort: '-createdAt',
        overrideAccess: true,
      })
      courseRunId = toPositiveInt(runs.docs?.[0]?.id)
    }

    if (!courseRunId) {
      return NextResponse.json(
        { error: 'No hay convocatoria disponible para iniciar matriculacion en este lead' },
        { status: 422 },
      )
    }

    // Create enrollment via Payload, then update lead + log via raw SQL
    const enrollment = await payload.create({
      collection: 'enrollments',
      overrideAccess: true,
      data: {
        student: lead.id,
        course_run: courseRunId,
        status: 'pending',
        payment_status: 'pending',
        total_amount: 0,
        amount_paid: 0,
        enrolled_at: new Date().toISOString(),
      } as any,
    })

    if (drizzle?.execute) {
      await drizzle.execute(`UPDATE leads SET status = 'enrolling', enrollment_id = ${enrollment.id}, updated_at = NOW() WHERE id = ${leadId}`)
      await drizzle.execute(`INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, 'system', 'enrollment_started', 'Ficha de matricula creada', ${tenantId})`)
    } else {
      await payload.update({
        collection: 'leads',
        id,
        data: {
          status: 'enrolling',
        } as any,
      })
    }

    return NextResponse.json({ success: true, enrollmentId: enrollment.id })
  } catch (error) {
    console.error('[API][LeadEnroll] error:', error)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
