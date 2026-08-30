import { detectSessionConflicts } from './conflicts'
import { minutesBetween, normalizeClock, toDayKey } from './time'
import {
  isPhaseType,
  isSessionStatus,
  type AcademicConflict,
  type AcademicId,
  type AcademicSession,
  type SessionType,
} from './types'

export type CronogramaImportRow = {
  date?: string
  start?: string
  end?: string
  instructorId?: AcademicId | null
  instructorName?: string | null
  roomId?: AcademicId | null
  roomName?: string | null
  venueId?: AcademicId | null
  sessionType?: string | null
  notes?: string | null
}

export type CronogramaCatalog = {
  instructors: Array<{ id: AcademicId; name?: string | null }>
  rooms: Array<{ id: AcademicId; name?: string | null }>
  venues: Array<{ id: AcademicId; name?: string | null }>
}

export type CronogramaImportIssue = {
  row: number
  code:
    | 'instructor_missing'
    | 'room_missing'
    | 'venue_missing'
    | 'invalid_time'
    | 'negative_duration'
    | 'duplicate_session'
    | 'date_outside_run'
    | 'session_overlap'
  message: string
}

export type CronogramaImportPreview = {
  rows: number
  sessions: AcademicSession[]
  issues: CronogramaImportIssue[]
  conflicts: AcademicConflict[]
  canCommit: boolean
}

function lookupId(
  catalog: Array<{ id: AcademicId; name?: string | null }>,
  id?: AcademicId | null,
  name?: string | null,
): AcademicId | null {
  if (id != null && catalog.some((item) => String(item.id) === String(id))) return id
  if (name) {
    const match = catalog.find((item) => (item.name ?? '').trim().toLowerCase() === name.trim().toLowerCase())
    return match?.id ?? null
  }
  return null
}

export function previewCronogramaImport(input: {
  courseRunId: AcademicId
  startDate?: string | null
  endDate?: string | null
  rows: CronogramaImportRow[]
  catalog: CronogramaCatalog
  existing?: AcademicSession[]
}): CronogramaImportPreview {
  const issues: CronogramaImportIssue[] = []
  const sessions: AcademicSession[] = []
  const seen = new Set<string>()
  const runStart = input.startDate ? toDayKey(input.startDate) : null
  const runEnd = input.endDate ? toDayKey(input.endDate) : null

  input.rows.forEach((row, index) => {
    const date = row.date ? toDayKey(row.date) : null
    const start = normalizeClock(row.start)
    const end = normalizeClock(row.end)
    if (!date || !start || !end) {
      issues.push({ row: index + 1, code: 'invalid_time', message: 'Fecha u hora inválida.' })
      return
    }
    const duration = minutesBetween(start, end)
    if (duration == null) {
      issues.push({ row: index + 1, code: 'negative_duration', message: 'La duración de la sesión no puede ser negativa.' })
      return
    }
    if (runStart && runEnd && (date < runStart || date > runEnd)) {
      issues.push({
        row: index + 1,
        code: 'date_outside_run',
        message: `La fecha ${date} queda fuera de la convocatoria.`,
      })
    }

    const instructorId = lookupId(input.catalog.instructors, row.instructorId, row.instructorName)
    if ((row.instructorId || row.instructorName) && instructorId == null) {
      issues.push({ row: index + 1, code: 'instructor_missing', message: 'Docente inexistente.' })
    }
    const roomId = lookupId(input.catalog.rooms, row.roomId, row.roomName)
    if ((row.roomId || row.roomName) && roomId == null) {
      issues.push({ row: index + 1, code: 'room_missing', message: 'Aula inexistente.' })
    }
    const venueId = lookupId(input.catalog.venues, row.venueId, null)
    if (row.venueId && venueId == null) {
      issues.push({ row: index + 1, code: 'venue_missing', message: 'Ubicación inexistente.' })
    }

    const key = `${date}|${start}|${end}|${instructorId ?? ''}|${roomId ?? ''}`
    if (seen.has(key)) {
      issues.push({ row: index + 1, code: 'duplicate_session', message: 'Sesión duplicada en el archivo.' })
    }
    seen.add(key)

    const sessionType = row.sessionType && isPhaseType(row.sessionType) ? (row.sessionType as SessionType) : 'THEORY'
    sessions.push({
      courseRunId: input.courseRunId,
      date,
      plannedStart: start,
      plannedEnd: end,
      plannedMinutes: duration,
      instructorIds: instructorId != null ? [instructorId] : [],
      roomId,
      venueId,
      sessionType,
      status: isSessionStatus('planned') ? 'planned' : 'planned',
      origin: 'import',
      notes: row.notes ?? null,
    })
  })

  const existing = input.existing ?? []
  const conflicts = sessions.flatMap((session, index) =>
    detectSessionConflicts({
      candidate: session,
      existing: [...existing, ...sessions.filter((_, other) => other !== index)],
    }),
  ).map((conflict) => {
    issues.push({
      row: 0,
      code: 'session_overlap',
      message: conflict.message,
    })
    return conflict
  })

  return {
    rows: input.rows.length,
    sessions,
    issues,
    conflicts,
    canCommit: issues.length === 0,
  }
}

export function parseCsvCronograma(text: string): CronogramaImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase())
  const indexOf = (name: string) => header.indexOf(name)

  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim())
    const read = (name: string) => {
      const index = indexOf(name)
      return index >= 0 ? cells[index] || undefined : undefined
    }
    return {
      date: read('date') ?? read('fecha'),
      start: read('start') ?? read('inicio'),
      end: read('end') ?? read('fin'),
      instructorName: read('instructor') ?? read('docente'),
      instructorId: read('instructor_id') ?? read('docente_id'),
      roomName: read('room') ?? read('aula'),
      roomId: read('room_id') ?? read('aula_id'),
      venueId: read('venue_id'),
      sessionType: read('type') ?? read('tipo'),
      notes: read('notes') ?? read('notas'),
    }
  })
}
