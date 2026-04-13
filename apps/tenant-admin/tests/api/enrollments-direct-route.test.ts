import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockFindByID, mockCreate, mockUpdate, mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockAuth = vi.fn()
  const mockFindByID = vi.fn()
  const mockCreate = vi.fn()
  const mockUpdate = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    findByID: mockFindByID,
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

import { POST } from '@/app/api/enrollments/direct/route'

describe('Direct enrollment route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 4, tenantId: 2 } })
  })

  it('returns 401 when request is unauthenticated', async () => {
    const request = new NextRequest('http://localhost/api/enrollments/direct', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
  })

  it('returns 400 when required fields are missing', async () => {
    const request = new NextRequest('http://localhost/api/enrollments/direct', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok', 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Ana' }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('Faltan campos requeridos')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 404 when course run is from another tenant', async () => {
    mockFindByID.mockResolvedValue({
      id: 15,
      status: 'enrollment_open',
      tenant: 999,
      course: 20,
    })

    const request = new NextRequest('http://localhost/api/enrollments/direct', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@example.com',
        phone: '612345678',
        courseRunId: 15,
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe('Convocatoria no encontrada')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 422 when course run is not open for enrollment', async () => {
    mockFindByID.mockResolvedValue({
      id: 15,
      status: 'published',
      tenant: 2,
      course: 20,
    })

    const request = new NextRequest('http://localhost/api/enrollments/direct', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@example.com',
        phone: '612345678',
        courseRunId: 15,
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.error).toContain('no está abierta para matrícula')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates lead and enrollment for direct registrations', async () => {
    mockFindByID.mockResolvedValue({
      id: 15,
      status: 'enrollment_open',
      tenant: 2,
      course: 20,
    })
    mockCreate
      .mockResolvedValueOnce({ id: 501 })
      .mockResolvedValueOnce({ id: 901 })
    mockExecute.mockResolvedValue({ rows: [] })

    const request = new NextRequest('http://localhost/api/enrollments/direct', {
      method: 'POST',
      headers: { cookie: 'payload-token=ok', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@example.com',
        phone: '+34 612 345 678',
        courseRunId: 15,
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      mode: 'direct',
      leadId: 501,
      enrollmentId: 901,
    })

    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'leads',
        data: expect.objectContaining({
          first_name: 'Ana',
          last_name: 'Lopez',
          email: 'ana@example.com',
          phone: '+34 612 345 678',
          status: 'enrolling',
          tenant: 2,
          course: 20,
        }),
      }),
    )

    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'enrollments',
        data: expect.objectContaining({
          student: 501,
          course_run: 15,
          status: 'pending',
          payment_status: 'pending',
        }),
      }),
    )

    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(mockExecute.mock.calls[0][0]).toContain("UPDATE leads SET status = 'enrolling'")
    expect(mockExecute.mock.calls[1][0]).toContain("'Matricula directa creada'")
  })
})
