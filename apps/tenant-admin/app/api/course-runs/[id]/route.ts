import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  evaluateInstructorAreaQualification,
  evaluateCourseRunAvailability,
  findTenantDoc,
  getCourseRunRequiredAreaId,
  normalizeTime,
  relationId,
  sameId,
  validatePublicationReadiness,
  type CourseRunPlanningDoc,
  type RelationValue,
} from '@/app/lib/server/course-run-planning'
import { withTenantScope } from '@/app/lib/server/tenant-scope'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type CourseRunDoc = CourseRunPlanningDoc & {
  id: string | number
  tenant?: RelationValue
  campus?: RelationValue
  classroom?: RelationValue
  course?: RelationValue
  cycle?: RelationValue
  codigo?: string
  start_date?: string
  end_date?: string
  enrollment_deadline?: string
  schedule_days?: string[]
  schedule_time_start?: string
  schedule_time_end?: string
  status?: string
  enrollment_status?: string
  planning_status?: string
  max_students?: number
}

const COURSE_RUN_STATUSES = new Set([
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
])

const COURSE_RUN_PLANNING_STATUSES = new Set([
  'draft',
  'pending_validation',
  'validated',
  'published',
  'cancelled',
  'completed',
])

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const authContext = await getAuthenticatedUserContext(request, payload as any)
  if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
    limit: 1,
    depth: Number(new URL(request.url).searchParams.get('depth') ?? 2),
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
  return NextResponse.json({ doc })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload as any)
    if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const existing = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const current = existing.docs[0] as CourseRunDoc | undefined
    if (!current) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })

    const body = (await request.json()) as Record<string, unknown>
    const data: Record<string, unknown> = {}

    if ('start_date' in body) data.start_date = body.start_date
    if ('end_date' in body) data.end_date = body.end_date
    if ('enrollment_deadline' in body) data.enrollment_deadline = body.enrollment_deadline || null
    if ('enrollment_status' in body) data.enrollment_status = body.enrollment_status || 'open'
    if ('status' in body) data.status = body.status || current.status || 'draft'
    if ('planning_status' in body) data.planning_status = body.planning_status || current.planning_status || 'draft'
    if ('price_override' in body) data.price_override = body.price_override === '' ? null : body.price_override
    if ('price_snapshot' in body) data.price_snapshot = body.price_snapshot === '' ? null : body.price_snapshot
    if ('enrollment_fee_snapshot' in body) data.enrollment_fee_snapshot = body.enrollment_fee_snapshot === '' ? null : body.enrollment_fee_snapshot
    if ('campus' in body) data.campus = body.campus || null
    if ('classroom' in body) data.classroom = body.classroom || null
    if ('schedule_days' in body) data.schedule_days = Array.isArray(body.schedule_days) ? body.schedule_days : []
    if ('schedule_time_start' in body) data.schedule_time_start = normalizeTime(body.schedule_time_start) ?? null
    if ('schedule_time_end' in body) data.schedule_time_end = normalizeTime(body.schedule_time_end) ?? null
    if ('shift' in body) data.shift = body.shift || null
    if ('instructor' in body) data.instructor = body.instructor || null
    if ('instructors' in body) data.instructors = Array.isArray(body.instructors) ? body.instructors : []

    const startDate = String(data.start_date ?? current.start_date ?? '')
    const endDate = String(data.end_date ?? current.end_date ?? '')
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' }, { status: 400 })
    }

    const allowedEnrollmentStatuses = new Set(['open', 'closed', 'scheduled', 'always_open'])
    if (data.enrollment_status && !allowedEnrollmentStatuses.has(String(data.enrollment_status))) {
      return NextResponse.json({ error: 'Estado de matrícula no válido.' }, { status: 400 })
    }

    if (data.status && !COURSE_RUN_STATUSES.has(String(data.status))) {
      return NextResponse.json({ error: 'Estado de convocatoria no válido.' }, { status: 400 })
    }

    if (data.planning_status && !COURSE_RUN_PLANNING_STATUSES.has(String(data.planning_status))) {
      return NextResponse.json({ error: 'Estado de planificación no válido.' }, { status: 400 })
    }

    if (data.status === 'published' && !data.planning_status) {
      data.planning_status = 'published'
    }

    if (data.status === 'draft' && !data.planning_status) {
      data.planning_status = 'draft'
    }

    const enrollmentDeadline = String(data.enrollment_deadline ?? current.enrollment_deadline ?? '')
    if (enrollmentDeadline && startDate && new Date(enrollmentDeadline) > new Date(startDate)) {
      return NextResponse.json({ error: 'La fecha límite de matrícula no puede ser posterior al inicio.' }, { status: 400 })
    }

    for (const field of ['price_override', 'price_snapshot', 'enrollment_fee_snapshot']) {
      if (data[field] != null && Number(data[field]) < 0) {
        return NextResponse.json({ error: 'Los importes no pueden ser negativos.' }, { status: 400 })
      }
    }

    if (data.campus) {
      const campus = await findTenantDoc(payload, 'campuses', data.campus, authContext.tenantId)
      if (!campus) return NextResponse.json({ error: 'La sede seleccionada no pertenece a este tenant.' }, { status: 403 })
    }

    if (data.classroom) {
      const classroom = await findTenantDoc(payload, 'classrooms', data.classroom, authContext.tenantId)
      if (!classroom) return NextResponse.json({ error: 'El aula seleccionada no pertenece a este tenant.' }, { status: 403 })
      const selectedCampus = (data.campus ?? current.campus) as RelationValue
      if (selectedCampus && !sameId(classroom.campus as RelationValue, selectedCampus)) {
        return NextResponse.json({ error: 'El aula seleccionada no pertenece a la sede indicada.' }, { status: 400 })
      }
    }

    const candidate = { ...current, ...data, id: current.id } as CourseRunDoc
    const requiredAreaId = await getCourseRunRequiredAreaId(payload, candidate, authContext.tenantId)
    const instructorIds = [
      data.instructor,
      ...(Array.isArray(data.instructors) ? data.instructors : []),
    ].filter((value) => value != null && value !== '')
    for (const instructorId of instructorIds) {
      const instructor = await findTenantDoc(payload, 'staff', instructorId, authContext.tenantId)
      if (!instructor) return NextResponse.json({ error: 'El docente seleccionado no pertenece a este tenant.' }, { status: 403 })
      if (instructor.is_active === false || (instructor.employment_status && instructor.employment_status !== 'active')) {
        return NextResponse.json({ error: 'El docente seleccionado no está activo.' }, { status: 400 })
      }
      const qualification = evaluateInstructorAreaQualification(instructor, requiredAreaId)
      if (!qualification.ok) {
        return NextResponse.json({ error: qualification.message ?? 'El docente no está habilitado para el área formativa de esta convocatoria.' }, { status: 400 })
      }
    }

    if (data.status === 'published') {
      const blockers = validatePublicationReadiness(candidate)
      if (blockers.length > 0) {
        return NextResponse.json({ error: 'La convocatoria no está lista para publicar.', blockers }, { status: 400 })
      }
    }

    const availability = await evaluateCourseRunAvailability(payload, candidate, authContext.tenantId)
    if (availability.blockers.length > 0) {
      const firstBlocker = availability.blockers[0]
      return NextResponse.json({
        error: firstBlocker.type === 'classroom_overlap' ? 'Aula ocupada en esa franja horaria.' : 'Hay conflictos de planificación.',
        detail: firstBlocker.message,
        blockers: availability.blockers,
      }, { status: 409 })
    }

    const updated = await payload.update({
      collection: 'course-runs',
      id,
      data,
      depth: 2,
      overrideAccess: true,
    })

    return NextResponse.json({ doc: updated, message: 'Cambios guardados' })
  } catch (error) {
    console.error('[course-runs/:id] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudieron guardar los cambios' },
      { status: 500 },
    )
  }
}
