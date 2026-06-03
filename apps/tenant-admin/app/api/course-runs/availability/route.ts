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
  sameId,
  type CourseRunPlanningDoc,
} from '@/app/lib/server/course-run-planning'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function cleanSearchParam(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function searchParamList(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .map(cleanSearchParam)
    .filter((value): value is string => Boolean(value))
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const authContext = await getAuthenticatedUserContext(request, payload as any)
    if (!authContext?.tenantId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const searchParams = new URL(request.url).searchParams
    const instructorParam = cleanSearchParam(searchParams.get('instructor'))
    const instructorsParams = searchParamList(searchParams, 'instructors')

    const candidate: CourseRunPlanningDoc = {
      id: cleanSearchParam(searchParams.get('id')) ?? '__new_course_run__',
      tenant: authContext.tenantId,
      course: cleanSearchParam(searchParams.get('course')),
      cycle: cleanSearchParam(searchParams.get('cycle')),
      campus: cleanSearchParam(searchParams.get('campus')),
      classroom: cleanSearchParam(searchParams.get('classroom')),
      start_date: cleanSearchParam(searchParams.get('start_date')) ?? undefined,
      end_date: cleanSearchParam(searchParams.get('end_date')) ?? undefined,
      schedule_days: searchParamList(searchParams, 'schedule_days'),
      schedule_time_start: normalizeTime(cleanSearchParam(searchParams.get('schedule_time_start'))) ?? null,
      schedule_time_end: normalizeTime(cleanSearchParam(searchParams.get('schedule_time_end'))) ?? null,
      shift: cleanSearchParam(searchParams.get('shift')),
      instructor: instructorParam,
      instructors: instructorsParams,
      training_type: cleanSearchParam(searchParams.get('training_type')) ?? undefined,
      max_students: Number(searchParams.get('max_students') ?? 0) || undefined,
    }

    if (candidate.campus) {
      const campus = await findTenantDoc(payload, 'campuses', candidate.campus, authContext.tenantId)
      if (!campus) {
        return NextResponse.json({
          availability: {
            blockers: [{
              type: 'missing_publication_data',
              severity: 'blocker',
              message: 'La sede seleccionada no existe o no pertenece a este tenant.',
            }],
            warnings: [],
          },
        })
      }
    }

    if (candidate.classroom) {
      const classroom = await findTenantDoc(payload, 'classrooms', candidate.classroom, authContext.tenantId)
      if (!classroom) {
        return NextResponse.json({
          availability: {
            blockers: [{
              type: 'missing_publication_data',
              severity: 'blocker',
              message: 'El aula seleccionada no existe o no pertenece a este tenant.',
            }],
            warnings: [],
          },
        })
      }
      if (candidate.campus && !sameId(classroom.campus, candidate.campus)) {
        return NextResponse.json({
          availability: {
            blockers: [{
              type: 'missing_publication_data',
              severity: 'blocker',
              message: 'El aula seleccionada no pertenece a la sede indicada.',
            }],
            warnings: [],
          },
        })
      }
    }

    const availability = await evaluateCourseRunAvailability(payload, candidate, authContext.tenantId, {
      includeWeekMap: searchParams.get('occupancy') === 'week',
    })

    const instructorIds = [
      relationId(candidate.instructor),
      ...(Array.isArray(candidate.instructors) ? candidate.instructors.map((item) => relationId(item)) : []),
    ]
      .filter((value): value is string | number => value != null && value !== '')
      .filter((value, index, values) => values.indexOf(value) === index)

    if (instructorIds.length > 0) {
      const requiredAreaId = await getCourseRunRequiredAreaId(payload, candidate, authContext.tenantId)
      const instructors = await Promise.all(
        instructorIds.map((instructorId) => findTenantDoc(payload, 'staff', instructorId, authContext.tenantId)),
      )
      for (let index = 0; index < instructors.length; index += 1) {
        const instructorId = instructorIds[index]
        const instructor = instructors[index]
        if (!instructor) {
          availability.blockers.push({
            type: 'instructor_not_found',
            severity: 'blocker',
            message: `El docente seleccionado (${instructorId}) no existe o no pertenece a este tenant.`,
          })
          continue
        }
        if (instructor.is_active === false || instructor.employment_status === 'inactive') {
          availability.blockers.push({
            type: 'instructor_inactive',
            severity: 'blocker',
            message: `${instructor.full_name ?? 'El docente seleccionado'} no está activo y no puede asignarse.`,
          })
          continue
        }
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
            message: 'El docente no tiene áreas habilitadas cargadas. Revisa su ficha antes de confirmar.',
          })
        }
      }
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('[course-runs/availability] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo calcular disponibilidad' },
      { status: 500 },
    )
  }
}
