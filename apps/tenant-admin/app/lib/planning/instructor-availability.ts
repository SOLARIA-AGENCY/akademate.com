type RelationValue = string | number | { id?: string | number | null } | null | undefined

type InstructorLike = {
  id: string | number
  qualified_areas?: RelationValue[] | RelationValue
  qualifiedAreas?: RelationValue[] | RelationValue
}

export type InstructorTimeConflict = {
  instructorId: string | number
  conflictingRunId?: string | number
  conflictingRunCode?: string
  scheduleDays: string[]
  scheduleTimeStart?: string | null
  scheduleTimeEnd?: string | null
}

type InstructorAvailabilityInput = {
  instructor: InstructorLike
  requiredAreaId?: string | number | null
  requiredAreaName?: string | null
  timeConflicts: InstructorTimeConflict[]
}

const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
  sunday: 'domingo',
}

function relationId(value: RelationValue): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  return null
}

function relationIds(value: RelationValue[] | RelationValue | undefined): Array<string | number> {
  const values = Array.isArray(value) ? value : [value]
  return values.map(relationId).filter((id): id is string | number => id != null)
}

function formatTime(value?: string | null) {
  return typeof value === 'string' ? value.slice(0, 5) : ''
}

function formatConflict(conflict: InstructorTimeConflict) {
  const days = conflict.scheduleDays.map((day) => WEEKDAY_LABELS[day] ?? day).join(', ')
  const start = formatTime(conflict.scheduleTimeStart)
  const end = formatTime(conflict.scheduleTimeEnd)
  const schedule = [days, start && end ? `${start}-${end}` : start || end].filter(Boolean).join(', ')
  const run = conflict.conflictingRunCode ?? 'otra convocatoria'
  return `Ocupado por ${run}${schedule ? `: ${schedule}` : ''}.`
}

export function getInstructorAvailability({
  instructor,
  requiredAreaId,
  requiredAreaName,
  timeConflicts,
}: InstructorAvailabilityInput) {
  const reasons: string[] = []
  const qualifiedAreaIds = relationIds(instructor.qualified_areas ?? instructor.qualifiedAreas)

  if (requiredAreaId != null) {
    if (qualifiedAreaIds.length === 0) {
      reasons.push('Sin áreas habilitadas en su ficha docente.')
    } else if (!qualifiedAreaIds.some((areaId) => String(areaId) === String(requiredAreaId))) {
      reasons.push(`No habilitado para el área ${requiredAreaName ?? 'de esta convocatoria'}.`)
    }
  }

  for (const conflict of timeConflicts) {
    if (String(conflict.instructorId) === String(instructor.id)) reasons.push(formatConflict(conflict))
  }

  const uniqueReasons = [...new Set(reasons)]
  return {
    disabled: uniqueReasons.length > 0,
    reasons: uniqueReasons,
  }
}
