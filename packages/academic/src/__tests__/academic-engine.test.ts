import { describe, expect, it } from 'vitest'
import {
  buildDayOccupancy,
  collectAllConflicts,
  createLedgerEntries,
  detectSessionConflicts,
  generateSessionsFromRule,
  hoursMismatchWarning,
  occupancyStateForRoom,
  parseCsvCronograma,
  payableAmount,
  previewCronogramaImport,
  recommendRooms,
  regenerateSessionsPreservingExceptions,
  roomsFreeOnRecurringSlot,
  roomOccupiedDates,
  roomOccupiedOnInterval,
  sessionsOverlapOnResource,
  summarizeCourseHours,
  summarizeInstructorHours,
  usesSessionFirstPlanning,
  validateSessionFirstPublication,
  type AcademicSession,
} from '../domain'

function session(partial: Partial<AcademicSession> & Pick<AcademicSession, 'date' | 'plannedStart' | 'plannedEnd'>): AcademicSession {
  return {
    courseRunId: 1,
    status: 'planned',
    sessionType: 'THEORY',
    instructorIds: [10],
    roomId: 5,
    ...partial,
  }
}

describe('academic session overlap', () => {
  it('detects room and instructor overlap on the same interval', () => {
    const a = session({ id: 1, date: '2026-11-11', plannedStart: '16:00:00', plannedEnd: '19:00:00', roomId: 5, instructorIds: [1] })
    const b = session({ id: 2, date: '2026-11-11', plannedStart: '17:00:00', plannedEnd: '20:00:00', roomId: 5, instructorIds: [2], courseRunId: 2 })
    expect(sessionsOverlapOnResource(a, b, 'room')).toBe(true)
    expect(sessionsOverlapOnResource(a, b, 'instructor')).toBe(false)
    expect(detectSessionConflicts({ candidate: b, existing: [a] }).some((item) => item.type === 'ROOM_CONFLICT')).toBe(true)
  })

  it('does not occupy a room after the CEP phase ends', () => {
    const theory = session({
      id: 1,
      date: '2026-09-09',
      plannedStart: '16:00:00',
      plannedEnd: '19:00:00',
      roomId: 5,
      sessionType: 'THEORY',
    })
    const practice = session({
      id: 2,
      date: '2026-12-09',
      plannedStart: '16:00:00',
      plannedEnd: '19:00:00',
      roomId: null,
      sessionType: 'EXTERNAL_PRACTICE',
      venueId: 90,
    })
    expect(roomOccupiedOnInterval([theory, practice], 5, '2026-12-09', '16:00:00', '19:00:00')).toBe(false)
    expect(roomOccupiedDates([theory, practice], 5)).toEqual(['2026-09-09'])
    expect(occupancyStateForRoom([theory, practice], 5, '2026-12-09', '16:00:00', '19:00:00')).toBe('free')
  })

  it('warns when a teacher has no travel buffer between campuses', () => {
    const norte = session({
      id: 1,
      date: '2026-11-11',
      plannedStart: '10:00:00',
      plannedEnd: '14:00:00',
      roomId: 1,
      instructorIds: [8],
      courseRunId: 1,
    })
    const sur = session({
      id: 2,
      date: '2026-11-11',
      plannedStart: '14:00:00',
      plannedEnd: '17:00:00',
      roomId: 2,
      instructorIds: [8],
      courseRunId: 2,
    })
    const warnings = detectSessionConflicts({
      candidate: sur,
      existing: [norte],
      campusByRoom: new Map([['1', 10], ['2', 20]]),
      travelBuffers: [{ instructorId: 8, bufferMinutes: 45 }],
    })
    expect(warnings.some((item) => item.type === 'TRAVEL_BUFFER_WARNING')).toBe(true)
  })

  it('ignores cancelled and rescheduled sessions', () => {
    const cancelled = session({ id: 1, date: '2026-11-18', plannedStart: '10:00:00', plannedEnd: '14:00:00', status: 'cancelled' })
    const candidate = session({ id: 2, date: '2026-11-18', plannedStart: '10:00:00', plannedEnd: '14:00:00' })
    expect(sessionsOverlapOnResource(cancelled, candidate, 'room')).toBe(false)
  })
})

describe('course hours and calculated end date', () => {
  it('sums mixed 3h and 4h sessions instead of a weekly template', () => {
    const sessions = [
      session({ date: '2026-11-11', plannedStart: '10:00:00', plannedEnd: '14:00:00', sessionType: 'THEORY' }),
      session({ date: '2026-11-18', plannedStart: '10:00:00', plannedEnd: '13:00:00', instructorIds: [11], sessionType: 'THEORY' }),
    ]
    const summary = summarizeCourseHours(sessions, { plannedHours: 120 }, '2027-06-30')
    expect(summary.scheduledHours).toBe(7)
    expect(summary.remainingHours).toBe(113)
    expect(summary.calculatedEndDate).toBe('2026-11-18')
    expect(summary.endDateWarning).toBe(true)
    expect(hoursMismatchWarning(summary)).toBe(true)
  })

  it('reproduces Estéticas Norte 120h with 3h and 4h blocks ending 2027-06-30', () => {
    const fourHourDates = [
      '2026-11-11', '2026-11-25', '2026-12-09', '2027-01-13', '2027-01-27',
      '2027-02-10', '2027-02-24', '2027-03-10', '2027-03-24', '2027-04-07',
      '2027-04-21', '2027-05-05', '2027-05-19', '2027-06-02', '2027-06-16',
    ]
    const threeHourDates = [
      '2026-11-18', '2026-12-02', '2026-12-16', '2027-01-20', '2027-02-03',
      '2027-02-17', '2027-03-03', '2027-03-17', '2027-03-31', '2027-04-14',
      '2027-04-28', '2027-05-12', '2027-05-26', '2027-06-09', '2027-06-23',
      '2026-12-23', '2027-01-07', '2027-06-30', '2027-04-01', '2027-05-06',
    ]
    const sessions = [
      ...fourHourDates.map((date) => session({ date, plannedStart: '10:00:00', plannedEnd: '14:00:00', instructorIds: [1] })),
      ...threeHourDates.map((date) => session({ date, plannedStart: '10:00:00', plannedEnd: '13:00:00', instructorIds: [2] })),
    ]
    expect(fourHourDates.length * 4 + threeHourDates.length * 3).toBe(120)
    const summary = summarizeCourseHours(sessions, { plannedHours: 120, theoryHours: 120 }, '2027-06-30')
    expect(summary.scheduledHours).toBe(120)
    expect(summary.remainingHours).toBe(0)
    expect(summary.calculatedEndDate).toBe('2027-06-30')
    expect(summary.endDateWarning).toBe(false)
  })
})

describe('recurrence exceptions', () => {
  it('generates weekly sessions and keeps manual exceptions', () => {
    const rule = {
      id: 7,
      courseRunId: 1,
      weekdays: ['wednesday' as const],
      startDate: '2026-11-11',
      endDate: '2026-12-02',
      startTime: '10:00:00',
      endTime: '14:00:00',
      roomId: 5,
      instructorIds: [10],
    }
    const generated = generateSessionsFromRule(rule)
    expect(generated).toHaveLength(4)
    const existing = [
      { ...generated[1], origin: 'exception' as const, plannedEnd: '13:00:00', plannedMinutes: 180 },
    ]
    const next = regenerateSessionsPreservingExceptions(rule, existing)
    expect(next.keep).toHaveLength(1)
    expect(next.keep[0].plannedEnd).toBe('13:00:00')
    expect(next.create).toHaveLength(3)
  })
})

describe('availability and occupancy', () => {
  it('recommends a free room and answers recurring wednesday queries', () => {
    const rooms = [
      { id: 1, campusId: 8, name: 'Aula 1', capacity: 12 },
      { id: 5, campusId: 8, name: 'Aula 5', capacity: 20 },
      { id: 9, campusId: 2, name: 'Aula Sur', capacity: 30 },
    ]
    const sessions = [
      session({ date: '2026-09-09', plannedStart: '17:00:00', plannedEnd: '20:00:00', roomId: 5 }),
    ]
    const recommended = recommendRooms(rooms, sessions, {
      date: '2026-09-16',
      start: '17:00:00',
      end: '20:00:00',
      campusId: 8,
      capacity: 16,
    })
    expect(recommended.map((room) => room.id)).toEqual([5, 9])

    const free = roomsFreeOnRecurringSlot(rooms, sessions, {
      weekday: 'wednesday',
      start: '17:00:00',
      end: '20:00:00',
      from: '2026-09-01',
      to: '2026-09-30',
    })
    expect(free.map((room) => room.id)).toEqual([1, 9])
  })

  it('marks a six-month run as occupying the room only during the first phase', () => {
    const sessions = [
      session({ date: '2026-09-09', plannedStart: '16:00:00', plannedEnd: '19:00:00', roomId: 5, sessionType: 'THEORY' }),
      session({ date: '2026-12-09', plannedStart: '16:00:00', plannedEnd: '19:00:00', roomId: 5, sessionType: 'EXTERNAL_PRACTICE' }),
    ]
    const slots = buildDayOccupancy([{ id: 5 }], sessions, '2026-12-09', [{ start: '16:00:00', end: '19:00:00' }])
    expect(slots[0].state).toBe('external')
    expect(occupancyStateForRoom(sessions, 5, '2026-09-09', '16:00:00', '19:00:00')).toBe('occupied')
    expect(occupancyStateForRoom(sessions, 5, '2026-12-09', '16:00:00', '19:00:00')).toBe('free')
  })
})

describe('publication, ledger and importer', () => {
  it('relaxes single-room publication when session-first has planned sessions', () => {
    expect(usesSessionFirstPlanning({ planning_model: 'session_first' }, [])).toBe(true)
    const blockers = validateSessionFirstPublication(
      { codigo: 'NOR-2026-001', course: 1, start_date: '2026-11-11', end_date: '2027-06-30', max_students: 16, enrollment_status: 'open', delivery_mode: 'presencial' },
      [session({ date: '2026-11-11', plannedStart: '10:00:00', plannedEnd: '14:00:00', roomId: 5 })],
    )
    expect(blockers).toEqual([])
  })

  it('creates ledger entries only from completed sessions and never pays from plan', () => {
    const completed = session({
      id: 33,
      date: '2026-11-11',
      plannedStart: '10:00:00',
      plannedEnd: '14:00:00',
      status: 'completed',
      actualStart: '10:05:00',
      actualEnd: '13:05:00',
      instructorIds: [1, 2],
    })
    const entries = createLedgerEntries(completed)
    expect(entries).toHaveLength(2)
    expect(entries[0].deliveredMinutes).toBe(180)
    expect(entries[0].approvedMinutes).toBe(0)
    expect(payableAmount(0, 25)).toBeNull()
    const hours = summarizeInstructorHours(1, [completed])
    expect(hours.deliveredMinutes).toBe(180)
    expect(hours.plannedMinutes).toBe(240)
  })

  it('validates cronograma import without writing rows', () => {
    const csv = [
      'fecha,inicio,fin,docente,aula,tipo',
      '2026-11-11,10:00,14:00,Ana,Aula 5,THEORY',
      '2026-11-11,10:00,13:00,Desconocida,Aula 5,THEORY',
    ].join('\n')
    const rows = parseCsvCronograma(csv)
    const preview = previewCronogramaImport({
      courseRunId: 1,
      startDate: '2026-11-11',
      endDate: '2027-06-30',
      rows,
      catalog: {
        instructors: [{ id: 1, name: 'Ana' }],
        rooms: [{ id: 5, name: 'Aula 5' }],
        venues: [],
      },
    })
    expect(preview.canCommit).toBe(false)
    expect(preview.issues.some((issue) => issue.code === 'instructor_missing')).toBe(true)
    expect(preview.issues.some((issue) => issue.code === 'session_overlap')).toBe(true)
  })

  it('detects multi-instructor hour totals independently', () => {
    const sessions = [
      session({ date: '2026-11-11', plannedStart: '10:00:00', plannedEnd: '14:00:00', instructorIds: [1] }),
      session({ date: '2026-11-18', plannedStart: '10:00:00', plannedEnd: '13:00:00', instructorIds: [2] }),
    ]
    expect(summarizeInstructorHours(1, sessions).plannedMinutes).toBe(240)
    expect(summarizeInstructorHours(2, sessions).plannedMinutes).toBe(180)
    expect(collectAllConflicts(sessions)).toEqual([])
  })
})
