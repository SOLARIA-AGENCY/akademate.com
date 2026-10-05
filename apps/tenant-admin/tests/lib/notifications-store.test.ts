import { describe, expect, it, vi } from 'vitest'
import { listNotificationsAfter, markNotificationsRead } from '@/lib/server/notifications-store'

describe('notifications SQL contract', () => {
  it('uses tagged SQL with bound tenant, cursor and ids parameters', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 4 }] })
    const payload = { db: { drizzle: { execute } } }

    await listNotificationsAfter(payload, '42', 3)
    await markNotificationsRead(payload, '42', [4])

    for (const [query] of execute.mock.calls) {
      expect(typeof query).not.toBe('string')
      expect(query).toHaveProperty('queryChunks')
    }
    expect(JSON.stringify(execute.mock.calls)).not.toContain('tenant_id = 42')
    expect(JSON.stringify(execute.mock.calls)).not.toContain('IN (4)')
  })
})
