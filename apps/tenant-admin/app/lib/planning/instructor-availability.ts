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

export type InstructorOption<T extends InstructorLike> = {
  instructor: T
  disabled: boolean
  reasons: string[]
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

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es')
}

export function prepareInstructorOptions<T extends InstructorLike>(args: {
  instructors: T[]
  requiredAreaId?: string | number | null
  requiredAreaName?: string | null
  timeConflicts: InstructorTimeConflict[]
  getName: (instructor: T) => string
}): InstructorOption<T>[] {
  return args.instructors
    .map((instructor) => ({
      instructor,
      ...getInstructorAvailability({
        instructor,
        requiredAreaId: args.requiredAreaId,
        requiredAreaName: args.requiredAreaName,
        timeConflicts: args.timeConflicts,
      }),
    }))
    .sort((left, right) => {
      if (left.disabled !== right.disabled) return left.disabled ? 1 : -1
      return args.getName(left.instructor).localeCompare(args.getName(right.instructor), 'es', {
        sensitivity: 'base',
      })
    })
}

export function filterInstructorOptions<T extends InstructorLike>(args: {
  options: InstructorOption<T>[]
  query: string
  getName: (instructor: T) => string
  preserveInstructorIds?: Array<string | number>
}): InstructorOption<T>[] {
  const query = normalizeSearchText(args.query)
  if (!query) return args.options

  const preserved = new Set((args.preserveInstructorIds ?? []).map(String))
  return args.options.filter((option) => {
    if (preserved.has(String(option.instructor.id))) return true
    const searchable = normalizeSearchText([
      args.getName(option.instructor),
      ...option.reasons,
    ].join(' '))
    return searchable.includes(query)
  })
}
