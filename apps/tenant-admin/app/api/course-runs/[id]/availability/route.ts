import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import {
  evaluateCourseRunAvailability,
  evaluateInstructorAreaQualification,
  findTenantDoc,
  getCourseRunRequiredAreaId,
  normalizeTime,
  relationId,
  type CourseRunPlanningDoc,
} from '@/app/lib/server/course-run-planning'
import { withTenantScope } from '@/app/lib/server/tenant-scope'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload as any)
    if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const result = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: id } }, authContext.tenantId) as any,
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    const current = result.docs[0] as CourseRunPlanningDoc | undefined
    if (!current) return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })

    const searchParams = new URL(request.url).searchParams
    const candidate: CourseRunPlanningDoc = {
      ...current,
      campus: searchParams.get('campus') ?? current.campus,
      classroom: searchParams.get('classroom') ?? current.classroom,
      start_date: searchParams.get('start_date') ?? current.start_date,
      end_date: searchParams.get('end_date') ?? current.end_date,
      schedule_days: searchParams.getAll('schedule_days').length > 0
        ? searchParams.getAll('schedule_days')
        : current.schedule_days,
      schedule_time_start: normalizeTime(searchParams.get('schedule_time_start')) ?? current.schedule_time_start,
      schedule_time_end: normalizeTime(searchParams.get('schedule_time_end')) ?? current.schedule_time_end,
      shift: searchParams.get('shift') ?? current.shift,
      instructor: searchParams.get('instructor') ?? current.instructor,
    }

    const availability = await evaluateCourseRunAvailability(payload, candidate, authContext.tenantId)
    const instructorId = relationId(candidate.instructor)
    if (instructorId != null) {
      const [requiredAreaId, instructor] = await Promise.all([
        getCourseRunRequiredAreaId(payload, candidate, authContext.tenantId),
        findTenantDoc(payload, 'staff', instructorId, authContext.tenantId),
      ])
      const qualification = evaluateInstructorAreaQualification(instructor, requiredAreaId)
      if (!qualification.ok) {
        availability.blockers.push({
          type: 'instructor_area_mismatch',
          severity: 'blocker',
          message: qualification.message ?? 'El docente no está habilitado para el área formativa de esta convocatoria.',
        })
      } else if (qualification.reason === 'no_qualified_areas' && requiredAreaId != null) {
        availability.warnings.push({
          type: 'instructor_area_missing',
          severity: 'warning',
          message: 'El docente no tiene áreas habilitadas cargadas. Revisa su ficha antes de confirmar la asignación.',
        })
      }
    }
    return NextResponse.json({ availability })
  } catch (error) {
    console.error('[course-runs/:id/availability] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo calcular disponibilidad' },
      { status: 500 },
    )
  }
}
