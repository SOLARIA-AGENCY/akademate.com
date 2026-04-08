import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockFindByID, mockFind, mockCreate, mockUpdate, mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockAuth = vi.fn()
  const mockFindByID = vi.fn()
  const mockFind = vi.fn()
  const mockCreate = vi.fn()
  const mockUpdate = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    findByID: mockFindByID,
    find: mockFind,
    create: mockCreate,
    update: mockUpdate,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return {
    mockPayload,
    mockGetPayloadHMR,
    mockAuth,
    mockFindByID,
    mockFind,
    mockCreate,
    mockUpdate,
    mockExecute,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { POST } from '@/app/api/leads/[id]/enroll/route'

function buildContext(id = '16') {
  return { params: Promise.resolve({ id }) }
}

describe('Lead enroll route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 4, tenantId: 2 } })
  })

  it('returns 401 when request is unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/leads/16/enroll', { method: 'POST' })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
  })

  it('returns 422 when lead has no course and no course-runs fallback exists', async () => {
    mockFindByID.mockResolvedValue({
      id: 16,
      status: 'interested',
      tenant_id: 2,
      enrollment_id: null,
    })
    mockFind.mockResolvedValue({ docs: [] })

    const request = new NextRequest('http://localhost/api/leads/16/enroll', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok' },
    })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.error).toContain('No hay convocatoria disponible')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates enrollment with relationship fields and logs action with authenticated user', async () => {
    mockFindByID.mockResolvedValue({
      id: 16,
      status: 'interested',
      tenant_id: 2,
      enrollment_id: null,
      course_id: 11,
    })
    mockCreate.mockResolvedValue({ id: 31 })
    mockExecute.mockResolvedValue({ rows: [] })

    const request = new NextRequest('http://localhost/api/leads/16/enroll', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok' },
    })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ success: true, enrollmentId: 31 })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'enrollments',
        overrideAccess: true,
        data: expect.objectContaining({
          student: 16,
          course_run: 11,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 0,
          amount_paid: 0,
        }),
      }),
    )

    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(mockExecute.mock.calls[0][0]).toContain("UPDATE leads SET status = 'enrolling'")
    expect(mockExecute.mock.calls[1][0]).toContain("VALUES (16, 4, 'system', 'enrollment_started'")
  })
})
