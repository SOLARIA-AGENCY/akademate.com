import { describe, expect, it } from 'vitest'
import {
  continueEnrollments,
  dueBadgeLabel,
  greetingSubtitle,
  overallProgressPercent,
} from '@/app/campus/lib/dashboard'
import {
  averageAttendance,
  buildLiveAndUpcoming,
  mapEnrollmentCard,
  weeklyActivityFromStreak,
  type LooseEnrollmentDoc,
} from '@/app/api/campus/dashboard/_lib'

describe('campus dashboard helpers', () => {
  it('builds a greeting from live classes and assignments', () => {
    expect(greetingSubtitle(0, 0)).toBe('Continúa donde lo dejaste.')
    expect(greetingSubtitle(1, 2)).toBe('Tienes 1 clase en directo hoy y 2 tareas pendientes de entrega.')
  })

  it('averages active enrollment progress', () => {
    expect(
      overallProgressPercent([
        {
          id: '1',
          courseTitle: 'A',
          courseRunTitle: '',
          status: 'in_progress',
          progressPercent: 40,
          estimatedMinutesRemaining: 0,
        },
        {
          id: '2',
          courseTitle: 'B',
          courseRunTitle: '',
          status: 'completed',
          progressPercent: 100,
          estimatedMinutesRemaining: 0,
        },
      ])
    ).toBe(40)
  })

  it('shows a 24h due badge only inside the window', () => {
    const now = new Date('2026-08-30T10:00:00.000Z')
    expect(dueBadgeLabel('2026-08-30T20:00:00.000Z', now)).toBe('Quedan 10h')
    expect(dueBadgeLabel('2026-09-02T10:00:00.000Z', now)).toBeNull()
  })

  it('maps payload snake_case enrollments', () => {
    const card = mapEnrollmentCard({
      id: 9,
      status: 'confirmed',
      course_run: {
        codigo: 'NOR-2026-001',
        course: { name: 'Desarrollo web', featured_image: { url: '/img.png' }, duration_hours: 10 },
      },
      progress_percent: 30,
    })
    expect(card.courseTitle).toBe('Desarrollo web')
    expect(card.courseRunTitle).toBe('NOR-2026-001')
    expect(card.progressPercent).toBe(30)
    expect(card.courseThumbnail).toBe('/img.png')
  })

  it('returns null live class and empty upcoming when there is no schedule', () => {
    const docs: LooseEnrollmentDoc[] = [{ id: '1', status: 'confirmed' }]
    expect(buildLiveAndUpcoming(docs)).toEqual({ liveClass: null, upcoming: [] })
  })

  it('derives a live class from today schedule', () => {
    const now = new Date('2026-08-31T11:00:00')
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      now.getDay()
    ]
    const result = buildLiveAndUpcoming(
      [
        {
          id: 'e1',
          status: 'confirmed',
          course_run: {
            course: { name: 'Interfaces web' },
            instructor: { first_name: 'Elena', last_name: 'Ruiz' },
            classroom: { name: 'Aula 102' },
            schedule_days: [weekday],
            schedule_time_start: '10:00:00',
            schedule_time_end: '12:00:00',
          },
        },
      ],
      now
    )
    expect(result.liveClass?.title).toBe('Interfaces web')
    expect(result.liveClass?.teacherName).toBe('Elena Ruiz')
    expect(result.liveClass?.place).toBe('Aula 102')
  })

  it('averages attendance and encodes streak bars', () => {
    expect(
      averageAttendance([
        { id: '1', attendance_percentage: 90 },
        { id: '2', attendance_percentage: 70 },
      ])
    ).toBe(80)
    expect(averageAttendance([{ id: '1' }])).toBeNull()
    expect(weeklyActivityFromStreak(3)).toEqual([0, 0, 0, 0, 1, 1, 1])
  })

  it('limits continue cards', () => {
    expect(
      continueEnrollments([
        {
          id: '1',
          courseTitle: 'A',
          courseRunTitle: '',
          status: 'in_progress',
          progressPercent: 10,
          estimatedMinutesRemaining: 0,
        },
        {
          id: '2',
          courseTitle: 'B',
          courseRunTitle: '',
          status: 'completed',
          progressPercent: 100,
          estimatedMinutesRemaining: 0,
        },
      ])
    ).toHaveLength(1)
  })
})
