import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../../_lib/auth'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const BLOCKED_LEAD_STATUSES = new Set(['not_interested', 'unreachable', 'discarded', 'spam', 'rejected'])

const NON_ENROLLABLE_COURSE_RUN_STATUSES = new Set([
  'enrollment_closed',
  'closed',
  'cancelled',
  'inactive',
  'archived',
  'draft',
  'published',
])
function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function matchesEnrollmentCandidate(existing: any, studentId: number, courseRunId: number): boolean {
  if (!existing || !toPositiveInt(existing.id)) return false
  const existingStudentId = toPositiveInt(existing.student?.id ?? existing.student ?? existing.student_id)
  const existingCourseRunId = toPositiveInt(
    existing.course_run?.id ?? existing.course_run ?? existing.course_run_id,
  )
  if (!existingStudentId || !existingCourseRunId) return false
  return existingStudentId === studentId && existingCourseRunId === courseRunId
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

    const body = await request.json().catch(() => ({} as Record<string, unknown>))

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

    const tenantId =
      toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant) ??
      authUser.tenantId ??
      1
    const userId = toPositiveInt(authUser.userId)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario autenticado invalido' }, { status: 401 })
    }

    const explicitCourseRunId = toPositiveInt((body as any).courseRunId ?? (body as any).course_run_id)

    const leadEnrollmentId = toPositiveInt(lead.enrollment_id)
    if (!explicitCourseRunId && leadEnrollmentId) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        enrollmentId: leadEnrollmentId,
      })
    }

    let courseRunId =
      explicitCourseRunId ??
      toPositiveInt(lead.course_run_id ?? lead.course_id ?? lead.course_run?.id ?? lead.course_run)

    if (!courseRunId) {
      const runs =
        typeof (payload as any).find === 'function'
          ? await payload.find({
              collection: 'course-runs',
              depth: 0,
              limit: 1,
              sort: '-createdAt',
              overrideAccess: true,
            })
          : { docs: [] as any[] }
      courseRunId = toPositiveInt((runs as any).docs?.[0]?.id)
    }

    if (!courseRunId) {
      return NextResponse.json(
        { error: 'No hay convocatoria disponible para iniciar matriculacion en este lead' },
        { status: 422 },
      )
    }

    const courseRun = await payload.findByID({
      collection: 'course-runs',
      id: courseRunId,
      depth: 0,
      overrideAccess: true,
    }) as any

    if (!courseRun) {
      return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
    }

    const courseRunTenantId = toPositiveInt(courseRun?.tenant?.id ?? courseRun?.tenant)
    if (courseRunTenantId && tenantId && courseRunTenantId !== tenantId) {
      return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
    }

    const courseRunStatus = String(courseRun.status ?? '')
      .trim()
      .toLowerCase()

    if (courseRunStatus && NON_ENROLLABLE_COURSE_RUN_STATUSES.has(courseRunStatus)) {
      return NextResponse.json(
        { error: 'La convocatoria no está abierta para matrícula' },
        { status: 422 },
      )
    }

    const existingEnrollment =
      typeof (payload as any).find === 'function'
        ? await payload.find({
            collection: 'enrollments',
            where: {
              and: [{ student: { equals: lead.id } }, { course_run: { equals: courseRunId } }],
            } as any,
            depth: 0,
            limit: 1,
            overrideAccess: true,
          })
        : { docs: [] as any[] }
    const existing = (existingEnrollment as any).docs?.[0] as any
    const leadStudentId = toPositiveInt(lead.id)
    if (leadStudentId && matchesEnrollmentCandidate(existing, leadStudentId, courseRunId)) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        enrollmentId: existing.id,
      })
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
