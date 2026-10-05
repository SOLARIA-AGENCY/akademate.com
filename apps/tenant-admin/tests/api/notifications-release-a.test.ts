import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const authMock = vi.fn()
const listMock = vi.fn()
const markAllMock = vi.fn()
const markMock = vi.fn()
const afterMock = vi.fn()

vi.mock('@/lib/server/notifications-auth', () => ({
  resolveNotificationsPrincipal: authMock,
}))
vi.mock('@/lib/server/notifications-store', () => ({
  listNotifications: listMock,
  markAllNotificationsRead: markAllMock,
  markNotificationsRead: markMock,
  listNotificationsAfter: afterMock,
}))

const authenticated = {
  payload: { db: {} },
  principal: {
    userId: '7', tenantId: '42', roles: ['admin'], sessionVersion: 2,
    sessionId: 'sid', issuedAt: 1, expiresAt: 2,
  },
}

function request(path = '/api/notifications', init?: RequestInit) {
  return new NextRequest(`http://localhost${path}`, init)
}

describe('notifications Release A authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue(authenticated)
  })

  it('rejects anonymous and revoked sessions', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    authMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    expect((await GET(request())).status).toBe(401)
    expect((await GET(request())).status).toBe(401)
    expect(listMock).not.toHaveBeenCalled()
  })

  it('lists only the resolved principal tenant', async () => {
    const { GET } = await import('@/app/api/notifications/route')
    listMock.mockResolvedValue({
      notifications: [{ id: 1, type: 'lead', title: 'New', created_at: '2026-07-10T10:00:00' }],
      unreadCount: 1,
    })
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(listMock).toHaveBeenCalledWith(authenticated.payload, '42')
    expect(await response.json()).toMatchObject({ unreadCount: 1 })
  })

  it('returns 404 when any requested notification is outside the tenant', async () => {
    const { PATCH } = await import('@/app/api/notifications/route')
    markMock.mockResolvedValue([10])
    const response = await PATCH(request('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ ids: [10, 99] }),
      headers: { 'content-type': 'application/json' },
    }))
    expect(response.status).toBe(404)
    expect(markMock).toHaveBeenCalledWith(authenticated.payload, '42', [10, 99])
  })
})

describe('notifications SSE polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    authMock.mockResolvedValue(authenticated)
  })

  it('never overlaps sequential polls', async () => {
    const { GET, NOTIFICATION_POLL_INTERVAL_MS } = await import('@/app/api/notifications/stream/route')
    let resolveFirst!: (value: unknown[]) => void
    afterMock.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValue([])
    const response = await GET(request('/api/notifications/stream'))
    const reader = response.body!.getReader()
    await reader.read()
    await vi.advanceTimersByTimeAsync(NOTIFICATION_POLL_INTERVAL_MS * 2)
    expect(afterMock).toHaveBeenCalledTimes(1)
    resolveFirst([])
    await vi.runOnlyPendingTimersAsync()
    expect(afterMock).toHaveBeenCalledTimes(2)
    await reader.cancel()
    vi.useRealTimers()
  })

  it('does not enqueue or repoll after abort during a query', async () => {
    const { GET } = await import('@/app/api/notifications/stream/route')
    const controller = new AbortController()
    let resolveQuery!: (value: unknown[]) => void
    afterMock.mockReturnValue(new Promise((resolve) => { resolveQuery = resolve }))
    const response = await GET(request('/api/notifications/stream', { signal: controller.signal }))
    const reader = response.body!.getReader()
    await reader.read()
    await vi.runOnlyPendingTimersAsync()
    controller.abort()
    resolveQuery([{ id: 8, type: 'x', title: 'must not emit' }])
    await Promise.resolve()
    expect((await reader.read()).done).toBe(true)
    expect(afterMock).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('closes after five consecutive query errors', async () => {
    const { GET, NOTIFICATION_POLL_INTERVAL_MS } = await import('@/app/api/notifications/stream/route')
    afterMock.mockRejectedValue(new Error('db unavailable'))
    const response = await GET(request('/api/notifications/stream'))
    const reader = response.body!.getReader()
    await reader.read()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await vi.advanceTimersByTimeAsync(attempt === 0 ? 0 : NOTIFICATION_POLL_INTERVAL_MS)
    }
    expect(afterMock).toHaveBeenCalledTimes(5)
    expect((await reader.read()).done).toBe(true)
    vi.useRealTimers()
  })
})
