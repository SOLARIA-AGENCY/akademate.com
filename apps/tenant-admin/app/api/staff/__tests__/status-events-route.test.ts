import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
}))

vi.mock('postgres', () => ({
  default: vi.fn(() => sqlMock),
}))

async function loadRoute() {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  vi.resetModules()
  return import('../[id]/status-events/route')
}

describe('/api/staff/[id]/status-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns actor name, email and historical fallback metadata', async () => {
    sqlMock.mockResolvedValue([
      {
        id: 10,
        previous_status: 'created',
        new_status: 'active',
        reason: 'Alta creada manualmente',
        source: 'manual',
        import_batch: null,
        changed_at: '2026-06-29T19:33:14.000Z',
        notes: null,
        changed_by_id: 7,
        changed_by_name: 'Carlos Perez',
        changed_by_email: 'carlos@example.com',
        changed_by_fallback: true,
      },
    ])

    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/staff/28/status-events'), {
      params: Promise.resolve({ id: '28' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual([
      expect.objectContaining({
        id: 10,
        previousStatus: 'created',
        newStatus: 'active',
        changedById: 7,
        changedByName: 'Carlos Perez',
        changedByEmail: 'carlos@example.com',
        changedByFallback: true,
      }),
    ])
    expect(sqlMock).toHaveBeenCalledTimes(1)
  })
})
