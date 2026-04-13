import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../../_lib/auth'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ACTIVE_COURSE_RUN_STATUSES = ['enrollment_open', 'published', 'in_progress'] as const
const BLOCKED_LEAD_STATUSES = new Set(['not_interested', 'unreachable', 'discarded', 'spam', 'rejected'])

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const authUser = await getAuthenticatedUserContext(request, payload)
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

    const leadStatus = String(lead.status ?? '')
    if (BLOCKED_LEAD_STATUSES.has(leadStatus)) {
      return NextResponse.json(
        { error: `Status "${lead.status}" no permite matriculacion.` },
        { status: 400 },
      )
    }

    if (lead.enrollment_id) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        enrollmentId: lead.enrollment_id,
      })
    }

    const tenantId =
      toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant) ??
      authUser.tenantId ??
      1
    const userId = toPositiveInt(authUser.userId)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario autenticado invalido' }, { status: 401 })
    }

    let courseRunId = toPositiveInt(lead.course_run_id ?? lead.course_run?.id ?? lead.course_run)
    const leadCourseId = toPositiveInt(lead.course_id ?? lead.course?.id ?? lead.course)

    if (courseRunId) {
      const selectedRun = await payload.findByID({
        collection: 'course-runs',
        id: courseRunId,
        depth: 0,
        overrideAccess: true,
      }) as any

      if (!selectedRun) {
        return NextResponse.json(
          { error: 'La convocatoria seleccionada en el lead no existe o no es accesible' },
          { status: 422 },
        )
      }

      const selectedStatus = String(selectedRun.status ?? '')
      if (!ACTIVE_COURSE_RUN_STATUSES.includes(selectedStatus as (typeof ACTIVE_COURSE_RUN_STATUSES)[number])) {
        return NextResponse.json(
          { error: 'La convocatoria asociada al lead no está activa para matriculación' },
          { status: 422 },
        )
      }
    } else {
      if (!leadCourseId) {
        return NextResponse.json(
          { error: 'Este lead no tiene una convocatoria activa seleccionada para iniciar la matrícula' },
          { status: 422 },
        )
      }

      const runWhere: any = {
        and: [
          { course: { equals: leadCourseId } },
          { status: { in: [...ACTIVE_COURSE_RUN_STATUSES] } },
        ],
      }
      if (leadTenantId) {
        runWhere.and.push({ tenant: { equals: leadTenantId } })
      }

      const runs = await payload.find({
        collection: 'course-runs',
        depth: 0,
        limit: 1,
        sort: 'start_date',
        overrideAccess: true,
        where: runWhere,
      })
      courseRunId = toPositiveInt(runs.docs?.[0]?.id)

      if (!courseRunId) {
        return NextResponse.json(
          { error: 'No hay convocatoria activa disponible para este lead. Selecciona una convocatoria antes de matricular.' },
          { status: 422 },
        )
      }
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
