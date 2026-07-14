import { describe, expect, it } from 'vitest'
import { buildCampusGamification, calculateStreaks } from '../gamification'

describe('Campus gamification derivation', () => {
  const now = new Date('2026-07-14T12:00:00.000Z')

  it('counts lessons, points, hours and badges from completed progress', () => {
    const result = buildCampusGamification([
      { completedAt: '2026-07-12T10:00:00.000Z', timeSpentMinutes: 30 },
      { completedAt: '2026-07-13T10:00:00.000Z', timeSpentMinutes: 45 },
      { completedAt: '2026-07-14T10:00:00.000Z', timeSpentMinutes: 15 },
    ], 1, now)

    expect(result.stats).toMatchObject({
      totalPoints: 30,
      lessonsCompleted: 3,
      hoursLearned: 2,
      coursesCompleted: 1,
      daysActive: 3,
      currentStreak: 3,
      longestStreak: 3,
    })
    expect(result.badges.find((badge) => badge.id === 'first-lesson')?.isEarned).toBe(true)
    expect(result.badges.find((badge) => badge.id === 'scholar')?.isEarned).toBe(true)
    expect(result.recentActivity).toHaveLength(3)
  })

  it('does not keep a current streak after two inactive days', () => {
    expect(calculateStreaks(['2026-07-10', '2026-07-11'], now)).toEqual({
      currentStreak: 0,
      longestStreak: 2,
      daysActive: 2,
    })
  })

  it('fails closed on invalid or empty dates without inventing progress', () => {
    const result = buildCampusGamification([
      { completedAt: null, timeSpentMinutes: 999 },
      { completedAt: 'not-a-date', timeSpentMinutes: 999 },
    ], 0, now)

    expect(result.stats).toMatchObject({
      totalPoints: 0,
      lessonsCompleted: 0,
      hoursLearned: 0,
      daysActive: 0,
      currentStreak: 0,
      longestStreak: 0,
    })
    expect(result.badges.every((badge) => badge.isEarned === false)).toBe(true)
  })
})
