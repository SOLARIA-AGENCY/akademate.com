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

function cleanSearchParam(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

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
    const instructorParam = cleanSearchParam(searchParams.get('instructor'))
    const instructorsParams = searchParams.getAll('instructors').map(cleanSearchParam).filter((value): value is string => Boolean(value))
    const candidate: CourseRunPlanningDoc = {
      ...current,
      campus: cleanSearchParam(searchParams.get('campus')) ?? current.campus,
      classroom: cleanSearchParam(searchParams.get('classroom')) ?? current.classroom,
      start_date: cleanSearchParam(searchParams.get('start_date')) ?? current.start_date,
      end_date: cleanSearchParam(searchParams.get('end_date')) ?? current.end_date,
      schedule_days: searchParams.getAll('schedule_days').length > 0
        ? searchParams.getAll('schedule_days').map(cleanSearchParam).filter((value): value is string => Boolean(value))
        : current.schedule_days,
      schedule_time_start: normalizeTime(cleanSearchParam(searchParams.get('schedule_time_start'))) ?? current.schedule_time_start,
      schedule_time_end: normalizeTime(cleanSearchParam(searchParams.get('schedule_time_end'))) ?? current.schedule_time_end,
      shift: cleanSearchParam(searchParams.get('shift')) ?? current.shift,
      instructor: instructorParam ?? current.instructor,
      instructors: instructorsParams.length > 0 ? instructorsParams : current.instructors,
    }

    const availability = await evaluateCourseRunAvailability(payload, candidate, authContext.tenantId)
    const instructorIds = [
      relationId(candidate.instructor),
      ...(Array.isArray(candidate.instructors) ? candidate.instructors.map((item) => relationId(item)) : []),
    ]
      .filter((value): value is string | number => value != null)
      .filter((value, index, values) => values.indexOf(value) === index)

    if (instructorIds.length > 0) {
      const requiredAreaId = await getCourseRunRequiredAreaId(payload, candidate, authContext.tenantId)
      const instructors = await Promise.all(
        instructorIds.map((instructorId) => findTenantDoc(payload, 'staff', instructorId, authContext.tenantId)),
      )
      for (const instructor of instructors) {
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
