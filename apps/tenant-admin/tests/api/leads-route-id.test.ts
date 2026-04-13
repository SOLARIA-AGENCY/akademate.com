import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockFindByID, mockUpdate } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockFindByID = vi.fn()
  const mockUpdate = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    findByID: mockFindByID,
    update: mockUpdate,
    db: {},
  }

  return {
    mockPayload,
    mockGetPayloadHMR,
    mockAuth,
    mockFindByID,
    mockUpdate,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { PATCH } from '@/app/api/leads/[id]/route'

function buildContext(id = '16') {
  return { params: Promise.resolve({ id }) }
}

describe('Leads [id] route - PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 4, tenant: 2 } })
    mockFindByID.mockResolvedValue({
      id: 16,
      tenant: 2,
      status: 'new',
    })
  })

  it('returns 400 when status is not supported', async () => {
    const request = new NextRequest('http://localhost/api/leads/16', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({ status: 'bad_status' }),
    })

    const response = await PATCH(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('Estado inválido')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('persists valid CRM status and returns updated lead', async () => {
    mockFindByID
      .mockResolvedValueOnce({ id: 16, tenant: 2, status: 'new' })
      .mockResolvedValueOnce({ id: 16, tenant: 2, status: 'interested' })

    const request = new NextRequest('http://localhost/api/leads/16', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({ status: 'interested' }),
    })

    const response = await PATCH(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.lead.status).toBe('interested')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        id: '16',
        data: expect.objectContaining({ status: 'interested' }),
      }),
    )
  })

  it('returns 400 with migration hint when DB enum rejects CRM status', async () => {
    mockUpdate.mockRejectedValue(new Error('invalid input value for enum enum_leads_status: "interested"'))

    const request = new NextRequest('http://localhost/api/leads/16', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({ status: 'interested' }),
    })

    const response = await PATCH(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('Falta migración')
  })
})

