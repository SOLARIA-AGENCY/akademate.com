import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockFindByID, mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockAuth = vi.fn()
  const mockFindByID = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    findByID: mockFindByID,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return { mockPayload, mockGetPayloadHMR, mockAuth, mockFindByID, mockExecute }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { GET, POST } from '@/app/api/leads/[id]/interactions/route'

function buildContext(id = '16') {
  return { params: Promise.resolve({ id }) }
}

describe('Leads interactions route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 7, tenantId: 2 } })
    mockFindByID.mockResolvedValue({ id: 16, tenant_id: 2, status: 'contacted', is_test: false })
  })

  it('GET returns 401 when payload-token is missing', async () => {
    const request = new NextRequest('http://localhost/api/leads/16/interactions')

    const response = await GET(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
  })

  it('POST records interaction with authenticated user id (ignores forged body user_id)', async () => {
    mockExecute.mockResolvedValue({ rows: [] })

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({
        channel: 'system',
        result: 'status_changed',
        note: 'Cambio manual',
        user_id: 9999,
      }),
    })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockExecute).toHaveBeenCalledTimes(2)
    expect(mockExecute.mock.calls[0][0]).toContain('VALUES (16, 7,')
    expect(mockExecute.mock.calls[0][0]).not.toContain('9999')
  })

  it('GET hides interactions for test leads', async () => {
    mockFindByID.mockResolvedValueOnce({ id: 16, tenant_id: 2, is_test: true })

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request, buildContext())
    expect(response.status).toBe(404)
  })

  it('POST rejects interactions for test leads', async () => {
    mockFindByID.mockResolvedValueOnce({ id: 16, tenant_id: 2, is_test: true })

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({
        channel: 'phone',
        result: 'no_answer',
      }),
    })

    const response = await POST(request, buildContext())
    expect(response.status).toBe(404)
  })
})
