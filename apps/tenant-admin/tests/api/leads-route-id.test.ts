import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockPayload,
  mockGetPayloadHMR,
  mockAuth,
  mockFindByID,
  mockUpdate,
  mockCreate,
  mockDelete,
  mockExecute,
} = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockFindByID = vi.fn()
  const mockUpdate = vi.fn()
  const mockCreate = vi.fn()
  const mockDelete = vi.fn()
  const mockExecute = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    findByID: mockFindByID,
    update: mockUpdate,
    create: mockCreate,
    delete: mockDelete,
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
    mockUpdate,
    mockCreate,
    mockDelete,
    mockExecute,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { DELETE, PATCH } from '@/app/api/leads/[id]/route'

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
    mockExecute.mockResolvedValue({ rows: [] })
    mockCreate.mockResolvedValue({ id: 1 })
    mockDelete.mockResolvedValue({ id: 16 })
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
      .mockResolvedValueOnce({ id: 4, email: 'asesor@cep.com', role: 'asesor' })

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
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO lead_interactions'),
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-logs',
        data: expect.objectContaining({
          action: 'update',
          collection_name: 'leads',
          document_id: '16',
        }),
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

describe('Leads [id] route - DELETE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 4, tenant: 2 } })
    mockFindByID.mockResolvedValue({ id: 16, tenant: 2, status: 'discarded' })
    mockExecute.mockResolvedValue({ rows: [] })
    mockCreate.mockResolvedValue({ id: 2 })
    mockDelete.mockResolvedValue({ id: 16 })
  })

  it('deletes lead and writes audit log', async () => {
    mockFindByID
      .mockResolvedValueOnce({ id: 16, tenant: 2, status: 'discarded' })
      .mockResolvedValueOnce({ id: 4, email: 'asesor@cep.com', role: 'asesor' })

    const request = new NextRequest('http://localhost/api/leads/16', {
      method: 'DELETE',
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await DELETE(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        id: '16',
      }),
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-logs',
        data: expect.objectContaining({
          action: 'delete',
          collection_name: 'leads',
          document_id: '16',
        }),
      }),
    )
  })

  it('returns 404 when lead belongs to another tenant', async () => {
    mockFindByID.mockResolvedValue({ id: 16, tenant: 9, status: 'new' })
    const request = new NextRequest('http://localhost/api/leads/16', {
      method: 'DELETE',
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await DELETE(request, buildContext())
    expect(response.status).toBe(404)
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
