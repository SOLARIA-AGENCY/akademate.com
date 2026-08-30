import { occupiesCepClassroom, occupiesResource, sameAcademicId, type AcademicId, type AcademicSession } from './types'

export const OCCUPANCY_STATES = ['free', 'occupied', 'conflict', 'blocked', 'external'] as const
export type OccupancyState = (typeof OCCUPANCY_STATES)[number]

export type OccupancySlot = {
  roomId: AcademicId
  date: string
  start: string
  end: string
  state: OccupancyState
  courseRunId?: AcademicId
  phaseId?: AcademicId | null
  instructorIds?: AcademicId[]
  sessionType?: string | null
}

export function occupancyStateForRoom(
  sessions: AcademicSession[],
  roomId: AcademicId,
  date: string,
  start: string,
  end: string,
): OccupancyState {
  const occupying = sessions.filter((session) => {
    if (!occupiesCepClassroom(session)) return false
    if (!sameAcademicId(session.roomId, roomId)) return false
    if (session.date !== date) return false
    return session.plannedStart < end && start < session.plannedEnd
  })
  if (occupying.length === 0) return 'free'
  if (occupying.length > 1) return 'conflict'
  return 'occupied'
}

export function buildDayOccupancy(
  rooms: Array<{ id: AcademicId }>,
  sessions: AcademicSession[],
  date: string,
  slots: Array<{ start: string; end: string }>,
): OccupancySlot[] {
  return rooms.flatMap((room) =>
    slots.map((slot) => {
      const occupying = sessions.filter((session) => {
        if (!sameAcademicId(session.roomId, room.id) || session.date !== date) return false
        return occupiesResource(session.status) && session.plannedStart < slot.end && slot.start < session.plannedEnd
      })
      const classroomHits = occupying.filter(occupiesCepClassroom)
      const externalHits = occupying.filter((session) => !occupiesCepClassroom(session))
      let state: OccupancyState = 'free'
      if (classroomHits.length > 1) state = 'conflict'
      else if (classroomHits.length === 1) state = 'occupied'
      else if (externalHits.length > 0) state = 'external'

      const hit = classroomHits[0] ?? externalHits[0]
      return {
        roomId: room.id,
        date,
        start: slot.start,
        end: slot.end,
        state,
        courseRunId: hit?.courseRunId,
        phaseId: hit?.phaseId,
        instructorIds: hit?.instructorIds,
        sessionType: hit?.sessionType,
      }
    }),
  )
}

export function roomOccupiedDates(sessions: AcademicSession[], roomId: AcademicId): string[] {
  return Array.from(
    new Set(
      sessions
        .filter((session) => occupiesCepClassroom(session) && sameAcademicId(session.roomId, roomId))
        .map((session) => session.date),
    ),
  ).sort()
}
