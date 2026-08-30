import { describe, expect, it } from 'vitest'

import { dateValidationSchema } from '../../src/collections/CourseRuns/CourseRuns.validation'

describe('course-run enrollment deadline validation', () => {
  it('keeps the legacy before-start rule for ordinary training', () => {
    const result = dateValidationSchema.safeParse({
      start_date: '2026-09-01T09:00:00+01:00',
      end_date: '2026-12-31T18:00:00+01:00',
      enrollment_deadline: '2026-09-30T23:59:59+01:00',
      training_type: 'private',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['enrollment_deadline'],
          message: 'enrollment_deadline must be before start_date for non-cycle training',
        })
      )
    }
  })

  it('allows the annual authority deadline after a cycle has started', () => {
    expect(
      dateValidationSchema.safeParse({
        start_date: '2026-09-01T09:00:00+01:00',
        end_date: '2027-06-30T18:00:00+01:00',
        enrollment_deadline: '2026-09-30T23:59:59+01:00',
        training_type: 'cycle',
      }).success
    ).toBe(true)
  })

  it('still rejects an invalid course end date for cycles', () => {
    expect(
      dateValidationSchema.safeParse({
        start_date: '2026-09-01T09:00:00+01:00',
        end_date: '2026-08-31T18:00:00+01:00',
        enrollment_deadline: '2026-09-30T23:59:59+01:00',
        training_type: 'cycle',
      }).success
    ).toBe(false)
  })
})
