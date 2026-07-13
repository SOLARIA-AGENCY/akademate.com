import { describe, expect, it } from 'vitest'
import { cardMatchesDay, normalizePlannerDay } from '@/app/(dashboard)/planner/planner-days'

describe('planner day filters', () => {
  it('normalizes English, Spanish and abbreviated day values', () => {
    expect(normalizePlannerDay('Miércoles')).toBe('wednesday')
    expect(normalizePlannerDay('mie')).toBe('wednesday')
    expect(normalizePlannerDay('  FRIDAY ')).toBe('friday')
  })

  it('matches a course against the selected day without hiding the weekly view', () => {
    const card = { dias: ['monday', 'Wednesday'] }

    expect(cardMatchesDay(card, 'monday')).toBe(true)
    expect(cardMatchesDay(card, 'wednesday')).toBe(true)
    expect(cardMatchesDay(card, 'friday')).toBe(false)
    expect(cardMatchesDay(card, 'all')).toBe(true)
  })
})
