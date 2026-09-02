import { describe, expect, it } from 'vitest'
import { presenceFromTimestamps } from '../../src/domain/dashboard-presence'

describe('dashboard presence', () => {
  it('classifies online idle and offline from heartbeat', () => {
    const now = Date.parse('2026-09-02T12:00:00.000Z')
    expect(presenceFromTimestamps('2026-09-02T11:59:30.000Z', null, now)).toBe('online')
    expect(presenceFromTimestamps('2026-09-02T11:50:00.000Z', null, now)).toBe('idle')
    expect(presenceFromTimestamps('2026-09-02T10:00:00.000Z', null, now)).toBe('offline')
    expect(presenceFromTimestamps(null, null, now)).toBe('offline')
  })
})
