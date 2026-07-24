import { describe, expect, it } from 'vitest'
import {
  compareCoursesByPublicAvailability,
  comparePublicRunsByStartDate,
  isEligiblePublicOpenRun,
  selectEligiblePublicOpenRuns,
} from '@/app/lib/public-course-availability'

const NOW = new Date('2026-07-24T10:00:00+02:00')

describe('public course availability', () => {
  it('only exposes future runs that really accept enrollments', () => {
    expect(
      isEligiblePublicOpenRun({ status: 'enrollment_open', start_date: '2026-07-25' }, NOW)
    ).toBe(true)
    expect(
      isEligiblePublicOpenRun(
        { status: 'published', enrollment_status: 'open', start_date: '2026-07-24' },
        NOW
      )
    ).toBe(true)
    expect(
      isEligiblePublicOpenRun(
        { status: 'draft', enrollment_status: 'open', start_date: '2026-07-25' },
        NOW
      )
    ).toBe(false)
  })

  it('fails closed for past, scheduled, invalid, and full runs', () => {
    expect(
      isEligiblePublicOpenRun({ status: 'enrollment_open', start_date: '2026-07-23' }, NOW)
    ).toBe(false)
    expect(
      isEligiblePublicOpenRun(
        { status: 'published', enrollment_status: 'scheduled', start_date: '2026-07-25' },
        NOW
      )
    ).toBe(false)
    expect(isEligiblePublicOpenRun({ status: 'published', start_date: 'not-a-date' }, NOW)).toBe(
      false
    )
    expect(
      isEligiblePublicOpenRun(
        {
          status: 'published',
          start_date: '2026-07-25',
          max_students: 12,
          current_enrollments: 12,
        },
        NOW
      )
    ).toBe(false)
  })

  it('orders runs by their nearest real start date', () => {
    const runs = [
      { id: 'late', start_date: '2026-10-01' },
      { id: 'early', start_date: '2026-08-01' },
      { id: 'unknown', start_date: null },
    ].sort(comparePublicRunsByStartDate)
    expect(runs.map((run) => run.id)).toEqual(['early', 'late', 'unknown'])
  })

  it('deduplicates eligible runs without losing chronological order', () => {
    const runs = selectEligiblePublicOpenRuns(
      [
        { id: 'second', status: 'published', start_date: '2026-09-01' },
        { id: 'first', status: 'enrollment_open', start_date: '2026-08-01' },
        { id: 'first', status: 'enrollment_open', start_date: '2026-08-01' },
        { id: 'past', status: 'published', start_date: '2026-06-01' },
      ],
      NOW
    )

    expect(runs.map((run) => run.id)).toEqual(['first', 'second'])
  })

  it('orders open courses first, then by date, then alphabetically', () => {
    const courses = [
      { nombre: 'Zeta', enrollmentStatus: 'none', nextRun: null },
      { nombre: 'Beta', enrollmentStatus: 'open', nextRun: { startDate: '2026-09-01' } },
      { nombre: 'Álgebra', enrollmentStatus: 'open', nextRun: { startDate: '2026-08-01' } },
      { nombre: 'Alfarería', enrollmentStatus: 'none', nextRun: null },
    ].sort(compareCoursesByPublicAvailability)

    expect(courses.map((course) => course.nombre)).toEqual(['Álgebra', 'Beta', 'Alfarería', 'Zeta'])
  })
})
