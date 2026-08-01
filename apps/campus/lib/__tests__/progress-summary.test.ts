import { describe, expect, it } from 'vitest'

import { progressSummaryFromEnrollments } from '../progress-summary'

describe('progressSummaryFromEnrollments', () => {
  it('derives totals and a weighted-safe average from real enrollment data', () => {
    expect(
      progressSummaryFromEnrollments([
        {
          progressPercent: 50,
          totalModules: 8,
          completedModules: 4,
          estimatedMinutesRemaining: 90,
        },
        {
          progressPercent: 100,
          totalModules: 4,
          completedModules: 4,
          estimatedMinutesRemaining: 0,
        },
      ])
    ).toEqual({
      averageProgress: 75,
      totalModules: 12,
      completedModules: 8,
      estimatedMinutesRemaining: 90,
    })
  })

  it('returns zeroes for an empty learner record', () => {
    expect(progressSummaryFromEnrollments([])).toEqual({
      averageProgress: 0,
      totalModules: 0,
      completedModules: 0,
      estimatedMinutesRemaining: 0,
    })
  })

  it('clamps malformed percentages and negative counters', () => {
    expect(
      progressSummaryFromEnrollments([
        {
          progressPercent: 140,
          totalModules: -5,
          completedModules: -2,
          estimatedMinutesRemaining: -30,
        },
        {
          progressPercent: -20,
          totalModules: 2.8,
          completedModules: 9,
          estimatedMinutesRemaining: Number.NaN,
        },
      ])
    ).toEqual({
      averageProgress: 50,
      totalModules: 2,
      completedModules: 2,
      estimatedMinutesRemaining: 0,
    })
  })
})
