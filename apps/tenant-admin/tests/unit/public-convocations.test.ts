import { describe, expect, it } from 'vitest'
import {
  formatPublicCurrency,
  formatRunSchedule,
  getRunModality,
  getRunPrice,
} from '@/app/lib/public-convocations'

describe('public convocation format helpers', () => {
  it('formats schedule days in Spanish', () => {
    expect(formatRunSchedule({
      schedule_days: ['monday', 'wednesday', 'viernes'],
      schedule_time_start: '10:00:00',
      schedule_time_end: '14:00:00',
    })).toBe('lunes, miércoles, viernes · 10:00-14:00')
  })

  it('uses run price snapshots before course prices', () => {
    expect(getRunPrice({ price_snapshot: 990, price_override: 850 }, { base_price: 700 })).toBe(990)
    expect(formatPublicCurrency(getRunPrice({ price_override: 850 }, { base_price: 700 })).replace(/\s+/g, ' ')).toBe('850 €')
  })

  it('treats a run with campus as presencial even if the base course is online', () => {
    expect(getRunModality({ campus: { id: 1 } }, { modality: 'online' })).toBe('presencial')
  })
})
