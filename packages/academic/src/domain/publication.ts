import { occupiesCepClassroom } from './types'
import type { AcademicSession } from './types'

export type PublicationCandidate = {
  codigo?: string | null
  course?: unknown
  cycle?: unknown
  start_date?: string | null
  end_date?: string | null
  max_students?: number | null
  enrollment_status?: string | null
  delivery_mode?: string | null
  campus?: unknown
  classroom?: unknown
  instructor?: unknown
  instructors?: unknown[]
  schedule_days?: string[] | null
  schedule_time_start?: string | null
  schedule_time_end?: string | null
  planning_model?: string | null
}

export function isTeleformacion(deliveryMode?: string | null): boolean {
  return ['online', 'teleformacion', 'teleformación'].includes(String(deliveryMode ?? '').toLowerCase())
}

export function usesSessionFirstPlanning(
  candidate: PublicationCandidate,
  sessions: AcademicSession[] = [],
): boolean {
  if (candidate.planning_model === 'session_first') return true
  return sessions.some((session) => session.status !== 'draft')
}

export function validateSessionFirstPublication(
  candidate: PublicationCandidate,
  sessions: AcademicSession[],
): string[] {
  const blockers: string[] = []
  if (!candidate.codigo) blockers.push('La convocatoria necesita un código público.')
  if (!candidate.course && !candidate.cycle) blockers.push('La convocatoria necesita un curso o ciclo asociado.')
  if (!candidate.start_date) blockers.push('La convocatoria necesita fecha de inicio.')
  if (!candidate.end_date) blockers.push('La convocatoria necesita fecha de fin.')
  if (!Number(candidate.max_students ?? 0)) blockers.push('La convocatoria necesita plazas configuradas.')
  if (!candidate.enrollment_status) blockers.push('La convocatoria necesita estado de matrícula.')

  if (isTeleformacion(candidate.delivery_mode)) return blockers

  const occupying = sessions.filter((session) => session.status !== 'cancelled' && session.status !== 'draft')
  if (occupying.length === 0) {
    blockers.push('La convocatoria presencial session-first necesita al menos una sesión planificada.')
    return blockers
  }

  const missingRoom = occupying.some((session) => occupiesCepClassroom({ ...session, status: 'planned' }) && session.roomId == null)
  if (missingRoom) {
    blockers.push('Las sesiones presenciales en centro propio necesitan aula confirmada.')
  }

  return blockers
}
