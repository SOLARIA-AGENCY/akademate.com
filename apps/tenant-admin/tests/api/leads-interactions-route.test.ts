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

  it('GET keeps returning interactions when users name columns are missing', async () => {
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'first_name'")) {
        return { rows: [] }
      }
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'last_name'")) {
        return { rows: [] }
      }
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'email'")) {
        return { rows: [{ exists: 1 }] }
      }
      if (sql.includes('FROM lead_interactions li')) {
        return {
          rows: [
            {
              id: 101,
              lead_id: 16,
              user_id: 7,
              channel: 'whatsapp',
              result: 'message_sent',
              note: 'Primer contacto',
              created_at: '2026-04-20T12:00:00.000Z',
              first_name: null,
              last_name: null,
              email: 'vero@cepformacion.com',
            },
          ],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.interactions).toHaveLength(1)
    expect(payload.interactions[0]).toMatchObject({
      lead_id: 16,
      user_first_name: null,
      user_last_name: null,
      user_email: 'vero@cepformacion.com',
      note: 'Primer contacto',
    })

    const interactionsQuery = mockExecute.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('FROM lead_interactions li'),
    )?.[0]
    expect(interactionsQuery).toContain('NULL::text AS first_name')
    expect(interactionsQuery).toContain('NULL::text AS last_name')
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
