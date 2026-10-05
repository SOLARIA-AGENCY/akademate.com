import { describe, expect, it } from 'vitest'
import {
  closedConvocatoriaKeys,
  combineEnrollment,
  combineHomeBadges,
  enrollmentByCourseSlug,
  enrollmentByCycleSlug,
  enrollmentLabel,
  homeBadgeByCourseSlug,
  homeRunBadge,
  isEnrollmentDeadlinePassed,
  runEnrollment,
} from './enrollment-state'
import type { CatalogSnapshot } from './render'

const now = new Date('2026-09-04T12:00:00.000Z')

describe('enrollment from Payload', () => {
  it('keeps enrollment_open until the Payload deadline', () => {
    expect(runEnrollment({ status: 'enrollment_open', enrollmentDeadline: '2026-09-10' }, now)).toBe('open')
    expect(isEnrollmentDeadlinePassed('2026-09-04', now)).toBe(false)
  })

  it('closes when Payload status is enrollment_closed or the deadline passed', () => {
    expect(runEnrollment({ status: 'enrollment_closed', enrollmentDeadline: '2026-09-10' }, now)).toBe('closed')
    expect(runEnrollment({ status: 'enrollment_open', enrollmentDeadline: '2026-09-01' }, now)).toBe('closed')
    expect(runEnrollment({ status: 'in_progress' }, now)).toBe('closed')
  })

  it('prefers an open convocatoria over a closed one', () => {
    expect(combineEnrollment(['closed', 'open', 'upcoming'])).toBe('open')
    expect(combineEnrollment(['closed', 'upcoming'])).toBe('upcoming')
    expect(combineEnrollment(['closed'])).toBe('closed')
    expect(enrollmentLabel('closed')).toBe('Matrícula cerrada')
  })

  it('maps catalog convocatorias by course slug', () => {
    const snapshot = {
      data: {
        convocatorias: [
          {
            codigo: 'SC-2026-001',
            status: 'enrollment_open',
            enrollmentDeadline: '2026-09-01',
            course: { slug: 'atv-priv' },
          },
          {
            codigo: 'SC-2026-002',
            status: 'published',
            course: { slug: 'pilates-priv' },
            cycle: { slug: 'cfgs-higiene-bucodental' },
          },
        ],
        courses: [{ slug: 'atv-priv', enrollmentStatus: 'open' }],
        cycles: [],
      },
    } as CatalogSnapshot
    expect(enrollmentByCourseSlug(snapshot, now)).toEqual({
      'atv-priv': 'closed',
      'pilates-priv': 'upcoming',
    })
    expect(enrollmentByCycleSlug(snapshot, now)).toEqual({
      'cfgs-higiene-bucodental': 'upcoming',
    })
    expect(closedConvocatoriaKeys(snapshot, now)).toEqual(['SC-2026-001'])
  })

  it('splits the home list into open, en curso and próximamente', () => {
    expect(homeRunBadge({ status: 'in_progress' }, now)).toBe('running')
    expect(homeRunBadge({ status: 'enrollment_closed', startDate: '2026-09-01' }, now)).toBe('running')
    expect(homeRunBadge({ status: 'enrollment_closed', startDate: '2026-10-01' }, now)).toBe('upcoming')
    expect(homeRunBadge({ status: 'enrollment_open', enrollmentDeadline: '2026-09-01', startDate: '2026-09-02' }, now)).toBe('running')
    expect(homeRunBadge({ status: 'enrollment_open', enrollmentDeadline: '2026-09-01' }, now)).toBe('upcoming')
    expect(homeRunBadge({ status: 'completed', startDate: '2026-01-01' }, now)).toBeNull()
    expect(homeRunBadge({ status: 'published' }, now)).toBe('upcoming')
    expect(combineHomeBadges(['upcoming', 'running', 'open'])).toBe('open')
    expect(combineHomeBadges(['upcoming', 'running'])).toBe('running')
    expect(combineHomeBadges([null])).toBeNull()

    const snapshot = {
      data: {
        convocatorias: [
          { status: 'in_progress', startDate: '2026-09-01', course: { slug: 'yoga' } },
          { status: 'completed', startDate: '2025-01-01', course: { slug: 'acabado' } },
          { status: 'enrollment_open', enrollmentDeadline: '2026-09-10', course: { slug: 'yoga' } },
        ],
        courses: [
          { slug: 'yoga' },
          { slug: 'acabado', enrollmentStatus: 'closed' },
          { slug: 'zumba', enrollmentStatus: 'none' },
        ],
        cycles: [],
      },
    } as CatalogSnapshot
    expect(homeBadgeByCourseSlug(snapshot, now)).toEqual({
      yoga: 'open',
      acabado: null,
      zumba: 'upcoming',
    })
  })
})
