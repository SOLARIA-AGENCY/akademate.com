import { roomOccupiedOnInterval } from './overlap'
import { intervalsOverlap, weekdayFromDayKey } from './time'
import { eachDayInclusive } from './recurrence'
import {
  occupiesResource,
  sameAcademicId,
  type AcademicId,
  type AcademicRoom,
  type AcademicSession,
} from './types'

export type RoomAvailabilityQuery = {
  date: string
  start: string
  end: string
  campusId?: AcademicId | null
  capacity?: number | null
  resourceType?: string | null
}

export type RoomRecommendation = AcademicRoom & {
  excessCapacity: number
  sameCampus: boolean
}

export function recommendRooms(
  rooms: AcademicRoom[],
  sessions: AcademicSession[],
  query: RoomAvailabilityQuery,
): RoomRecommendation[] {
  return rooms
    .filter((room) => room.isActive !== false)
    .filter((room) => !query.resourceType || room.resourceType === query.resourceType)
    .filter((room) => query.capacity == null || (room.capacity ?? 0) >= query.capacity)
    .filter((room) => !roomOccupiedOnInterval(sessions, room.id, query.date, query.start, query.end))
    .map((room) => ({
      ...room,
      excessCapacity: Math.max(0, (room.capacity ?? 0) - (query.capacity ?? 0)),
      sameCampus: query.campusId != null && sameAcademicId(room.campusId, query.campusId),
    }))
    .sort((a, b) => {
      if (a.sameCampus !== b.sameCampus) return a.sameCampus ? -1 : 1
      if (a.excessCapacity !== b.excessCapacity) return a.excessCapacity - b.excessCapacity
      return String(a.name ?? a.id).localeCompare(String(b.name ?? b.id))
    })
}

export type RecurringSlotQuery = {
  weekday: string
  start: string
  end: string
  from: string
  to: string
}

export function roomsFreeOnRecurringSlot(
  rooms: AcademicRoom[],
  sessions: AcademicSession[],
  query: RecurringSlotQuery,
): AcademicRoom[] {
  const days = eachDayInclusive(query.from, query.to).filter((day) => weekdayFromDayKey(day) === query.weekday)
  return rooms.filter((room) => {
    if (room.isActive === false) return false
    return days.every((date) => !roomOccupiedOnInterval(sessions, room.id, date, query.start, query.end))
  })
}

export function instructorBusyOnInterval(
  sessions: AcademicSession[],
  instructorId: AcademicId,
  date: string,
  start: string,
  end: string,
): boolean {
  const probe: AcademicSession = {
    id: 'probe',
    courseRunId: 'probe',
    date,
    plannedStart: start,
    plannedEnd: end,
    instructorIds: [instructorId],
    status: 'planned',
  }
  return sessions.some((session) => {
    if (!occupiesResource(session.status)) return false
    if (!session.instructorIds?.some((id) => sameAcademicId(id, instructorId))) return false
    return session.date === probe.date && intervalsOverlap(session.plannedStart, session.plannedEnd, probe.plannedStart, probe.plannedEnd)
  })
}
