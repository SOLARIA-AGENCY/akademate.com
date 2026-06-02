export type RelationValue =
  | string
  | number
  | { id?: string | number; name?: string; title?: string; codigo?: string; code?: string; full_name?: string }
  | null
  | undefined

export type CourseRunPlanningDoc = {
  id: string | number
  tenant?: RelationValue
  campus?: RelationValue
  classroom?: RelationValue
  course?: RelationValue
  cycle?: RelationValue
  codigo?: string
  start_date?: string
  end_date?: string
  enrollment_deadline?: string | null
  schedule_days?: string[]
  schedule_time_start?: string | null
  schedule_time_end?: string | null
  status?: string
  enrollment_status?: string
  planning_status?: string
  max_students?: number
  min_students?: number
  current_enrollments?: number
  training_type?: string
  instructor?: RelationValue
  instructors?: RelationValue[]
  shift?: string | null
}

export type InstructorQualificationResult = {
  ok: boolean
  reason?: 'no_required_area' | 'no_qualified_areas' | 'area_mismatch'
  requiredAreaId?: string | number
  qualifiedAreaIds: Array<string | number>
  message?: string
}

export type PlanningConflict = {
  type:
    | 'classroom_overlap'
    | 'instructor_overlap'
    | 'instructor_area_mismatch'
    | 'instructor_area_missing'
    | 'room_capacity_exceeded'
    | 'missing_publication_data'
  severity: 'blocker' | 'warning'
  message: string
  conflictingRunId?: string | number
  conflictingRunCode?: string
}

export type PlanningAvailability = {
  blockers: PlanningConflict[]
  warnings: PlanningConflict[]
}

export function relationId(value: RelationValue): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  return null
}

export function sameId(a: RelationValue, b: RelationValue) {
  const left = relationId(a)
  const right = relationId(b)
  return left != null && right != null && String(left) === String(right)
}

export function relationIds(values: RelationValue[] | RelationValue | undefined): Array<string | number> {
  const list = Array.isArray(values) ? values : [values]
  return list.map(relationId).filter((id): id is string | number => id != null)
}

export function normalizeTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const raw = value.trim()
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw
  return undefined
}

export function toSeconds(value?: string | null): number | null {
  if (!value) return null
  const parts = value.split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return null
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0)
}

export function dateRangesOverlap(startA?: string, endA?: string, startB?: string, endB?: string) {
  if (!startA || !endA || !startB || !endB) return false
  return new Date(startA) <= new Date(endB) && new Date(startB) <= new Date(endA)
}

export function timeRangesOverlap(startA?: string | null, endA?: string | null, startB?: string | null, endB?: string | null) {
  const aStart = toSeconds(startA)
  const aEnd = toSeconds(endA)
  const bStart = toSeconds(startB)
  const bEnd = toSeconds(endB)
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false
  return aStart < bEnd && bStart < aEnd
}

export function daysOverlap(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return false
  const set = new Set(b)
  return a.some((day) => set.has(day))
}

function displayRelation(value: RelationValue, fallback: string) {
  if (value && typeof value === 'object') return value.name ?? value.title ?? value.codigo ?? value.code ?? value.full_name ?? fallback
  return fallback
}

export function validatePublicationReadiness(candidate: CourseRunPlanningDoc) {
  const blockers: string[] = []
  if (!candidate.codigo) blockers.push('La convocatoria necesita un código público.')
  if (!candidate.course && !candidate.cycle) blockers.push('La convocatoria necesita un curso o ciclo asociado.')
  if (!candidate.start_date) blockers.push('La convocatoria necesita fecha de inicio.')
  if (!candidate.end_date) blockers.push('La convocatoria necesita fecha de fin.')
  if (!Number(candidate.max_students ?? 0)) blockers.push('La convocatoria necesita plazas configuradas.')
  if (!candidate.enrollment_status) blockers.push('La convocatoria necesita estado de matrícula.')

  const isOnline = String(candidate.training_type ?? '').toLowerCase() === 'online'
  if (!isOnline) {
    if (!candidate.campus) blockers.push('La convocatoria presencial necesita sede.')
    if (!candidate.classroom) blockers.push('La convocatoria presencial necesita aula.')
    if (!candidate.schedule_days?.length) blockers.push('La convocatoria necesita días de clase.')
    if (!candidate.schedule_time_start || !candidate.schedule_time_end) blockers.push('La convocatoria necesita horario de inicio y fin.')
  }

  return blockers
}

export async function findTenantDoc(payload: any, collection: string, id: unknown, tenantId: number) {
  const resolvedId = relationId(id as RelationValue)
  if (resolvedId == null) return null
  const result = await payload.find({
    collection,
    where: { and: [{ tenant: { equals: tenantId } }, { id: { equals: resolvedId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

export async function getCourseRunRequiredAreaId(
  payload: any,
  candidate: CourseRunPlanningDoc,
  tenantId: number,
): Promise<string | number | null> {
  const courseId = relationId(candidate.course)
  if (!courseId) return null

  const course = await findTenantDoc(payload, 'courses', courseId, tenantId)
  return relationId(course?.area_formativa as RelationValue)
}

export function evaluateInstructorAreaQualification(
  instructor: { qualified_areas?: RelationValue[] | RelationValue; full_name?: string } | null | undefined,
  requiredAreaId: string | number | null,
): InstructorQualificationResult {
  const qualifiedAreaIds = relationIds(instructor?.qualified_areas as RelationValue[] | RelationValue | undefined)

  if (requiredAreaId == null) {
    return { ok: true, reason: 'no_required_area', qualifiedAreaIds }
  }

  if (qualifiedAreaIds.length === 0) {
    return { ok: true, reason: 'no_qualified_areas', requiredAreaId, qualifiedAreaIds }
  }

  const ok = qualifiedAreaIds.some((areaId) => String(areaId) === String(requiredAreaId))
  return {
    ok,
    reason: ok ? undefined : 'area_mismatch',
    requiredAreaId,
    qualifiedAreaIds,
    message: ok
      ? undefined
      : `${instructor?.full_name ?? 'El docente'} no está habilitado para el área formativa de esta convocatoria.`,
  }
}

export async function evaluateCourseRunAvailability(
  payload: any,
  candidate: CourseRunPlanningDoc,
  tenantId: number,
): Promise<PlanningAvailability> {
  const blockers: PlanningConflict[] = []
  const warnings: PlanningConflict[] = []
  const classroomId = relationId(candidate.classroom)
  const instructorIds = [
    relationId(candidate.instructor),
    ...relationIds(candidate.instructors),
  ].filter((id): id is string | number => id != null)

  if (!candidate.start_date || !candidate.end_date || !candidate.schedule_days?.length || !candidate.schedule_time_start || !candidate.schedule_time_end) {
    return { blockers, warnings }
  }

  const existing = await payload.find({
    collection: 'course-runs',
    where: {
      and: [
        { tenant: { equals: tenantId } },
        { id: { not_equals: candidate.id } },
        { status: { not_in: ['cancelled', 'completed'] } },
      ],
    },
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  for (const run of existing.docs as CourseRunPlanningDoc[]) {
    if (!dateRangesOverlap(candidate.start_date, candidate.end_date, run.start_date, run.end_date)) continue
    if (!daysOverlap(candidate.schedule_days, run.schedule_days)) continue
    if (!timeRangesOverlap(candidate.schedule_time_start, candidate.schedule_time_end, run.schedule_time_start, run.schedule_time_end)) continue

    if (classroomId && String(relationId(run.classroom)) === String(classroomId)) {
      blockers.push({
        type: 'classroom_overlap',
        severity: 'blocker',
        message: `${displayRelation(run.classroom, 'El aula')} ya está asignada a ${run.codigo ?? `convocatoria ${run.id}`}.`,
        conflictingRunId: run.id,
        conflictingRunCode: run.codigo,
      })
    }

    const runInstructorIds = [relationId(run.instructor), ...relationIds(run.instructors)].filter((id): id is string | number => id != null)
    if (instructorIds.length > 0 && instructorIds.some((id) => runInstructorIds.some((other) => String(other) === String(id)))) {
      blockers.push({
        type: 'instructor_overlap',
        severity: 'blocker',
        message: `Un docente ya está asignado a ${run.codigo ?? `convocatoria ${run.id}`} en la misma franja horaria.`,
        conflictingRunId: run.id,
        conflictingRunCode: run.codigo,
      })
    }
  }

  return { blockers, warnings }
}
