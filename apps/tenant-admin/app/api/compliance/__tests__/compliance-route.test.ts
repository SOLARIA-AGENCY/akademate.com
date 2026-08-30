import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, authMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  authMock: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMock) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/api/leads/_lib/auth', () => ({ getAuthenticatedUserContext: authMock }))

import { GET as getPolicy } from '../policy/route'
import { GET as getAttendance, POST as postAttendance } from '../attendance/route'
import { GET as getReports } from '../reports/route'

function request(path: string, init?: RequestInit) {
  return new NextRequest(`http://localhost${path}`, init)
}

describe('compliance routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMock.find.mockImplementation(async ({ collection }: { collection?: string }) => {
      if (collection === 'region-pack-bindings') {
        return { docs: [{ pack_id: 'es-canarias-sce', scope: 'tenant', scope_id: '1', active: true }] }
      }
      return { docs: [] }
    })
    payloadMock.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }))
    payloadMock.update.mockImplementation(async ({ data, id }: { data: Record<string, unknown>; id: number }) => ({ id, ...data }))
  })

  it('rejects learners from the internal roster', async function () {
    authMock.mockResolvedValue({ userId: 9, tenantId: 1, role: 'alumno' })
    const response = await getAttendance(request('/api/compliance/attendance?courseRunId=1'))
    expect(response.status).toBe(401)
  })

  it('returns the worldwide pack catalog to staff', async function () {
    authMock.mockResolvedValue({ userId: 1, tenantId: 1, role: 'gestor' })
    const response = await getPolicy(request('/api/compliance/policy'))
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.catalog.map((pack: { id: string }) => pack.id)).toContain('es-canarias-sce')
    expect(json.data.families).toHaveLength(26)
  })

  it('marks attendance and persists a first 25 percent event for synthetic hours', async function () {
    authMock.mockResolvedValue({ userId: 1, tenantId: 1, role: 'admin' })
    const response = await postAttendance(
      request('/api/compliance/attendance', {
        method: 'POST',
        body: JSON.stringify({
          courseRunId: 12,
          enrollmentId: 4,
          date: '2026-01-01',
          code: 'A',
          scheduledHours: 10,
          plannedHours: 40,
        }),
      }),
    )
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.events.some((event: { type: string; value: number }) => event.type === 'milestone_reached' && event.value === 25)).toBe(true)
  })

  it('keeps auditor exports empty of real academy history', async function () {
    authMock.mockResolvedValue({ userId: 1, tenantId: 1, role: 'gestor' })
    const response = await getReports(request('/api/compliance/reports'))
    const json = await response.json()
    expect(json.data.loyalty).toEqual([])
    expect(json.data.note).toMatch(/Synthetic academy only/)
  })
})
