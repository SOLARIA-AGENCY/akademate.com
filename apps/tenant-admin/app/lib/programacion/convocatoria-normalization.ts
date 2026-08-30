import { mergeTeacherRefs, normalizeTeacherNames } from './teacher-normalization'

export interface NormalizedConvocatoria {
  id: string
  codigo: string
  curso: string
  cursoId: string
  tipo: string
  sede: string
  sedeId: string
  aula: string
  aulaId: string
  fechaInicio: string
  fechaFin: string
  horaInicio: string
  horaFin: string
  dias: string[]
  plazas: number
  inscritos: number
  precio: number
  matricula?: number
  horasPracticas?: string | null
  certificacion?: string | null
  profesor: string
  profesores: string[]
  profesorRefs: Array<{ id: string; name: string }>
  estado: string
  planningStatus?: string
  color: string
}

type UnknownRecord = Record<string, unknown>

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function nonNegativeNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) && number >= 0 ? number : 0
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function relationId(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return ''
}

function scheduleTimes(value: unknown): [string, string] | null {
  if (typeof value !== 'string') return null
  const match = value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
  const start = match?.[1] ? clockValue(match[1]) : ''
  const end = match?.[2] ? clockValue(match[2]) : ''
  return start && end ? [start, end] : null
}

function clockValue(value: unknown): string {
  if (typeof value !== 'string') return ''
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return ''

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = match[3] === undefined ? 0 : Number(match[3])
  if (hours > 23 || minutes > 59 || seconds > 59) return ''
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeValue(value: unknown, schedule: unknown, index: 0 | 1, fallback: string): string {
  const direct = clockValue(value)
  if (direct) return direct.slice(0, 5)
  return scheduleTimes(schedule)?.[index]?.slice(0, 5) ?? fallback
}

export function normalizeConvocatoriaRecord(
  value: unknown,
  statusColors: Readonly<Record<string, string>>,
  fallbackColor = 'bg-primary'
): NormalizedConvocatoria {
  const record: UnknownRecord = value && typeof value === 'object' ? (value as UnknownRecord) : {}
  const estado = text(record.estado, 'draft')
  const teachers = normalizeTeacherNames([record.profesor, record.profesores])

  return {
    id: relationId(record.id),
    codigo: text(record.codigo),
    curso: text(record.cursoNombre, 'Curso'),
    cursoId: relationId(record.cursoId ?? record.courseId),
    tipo: text(record.cursoTipo),
    sede: text(record.campusNombre, 'Sin sede'),
    sedeId: relationId(record.campusId ?? record.sedeId),
    aula: text(record.aulaNombre, 'Sin aula'),
    aulaId: relationId(record.aulaId),
    fechaInicio: text(record.fechaInicio),
    fechaFin: text(record.fechaFin),
    horaInicio: timeValue(record.horaInicio, record.horario, 0, '09:00'),
    horaFin: timeValue(record.horaFin, record.horario, 1, '14:00'),
    dias: Array.isArray(record.dias)
      ? record.dias.filter((day): day is string => typeof day === 'string')
      : [],
    plazas: nonNegativeNumber(record.plazasTotales),
    inscritos: nonNegativeNumber(record.plazasOcupadas),
    precio: nonNegativeNumber(record.precio),
    matricula:
      typeof record.matricula === 'number' && Number.isFinite(record.matricula)
        ? record.matricula
        : undefined,
    horasPracticas: optionalText(record.horasPracticas),
    certificacion: optionalText(record.certificacion),
    profesor: teachers[0] ?? 'Sin docente',
    profesores: teachers,
    profesorRefs: mergeTeacherRefs(record.profesorRefs, record.profesores, record.profesor),
    estado,
    planningStatus: text(record.planningStatus),
    color: statusColors[estado] || fallbackColor,
  }
}
