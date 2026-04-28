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
    const executedSql = mockExecute.mock.calls.map(([sql]) => String(sql)).join('\n')
    expect(executedSql).toContain('VALUES (16, 7,')
    expect(executedSql).not.toContain('9999')
    expect(executedSql).toContain('UPDATE leads SET last_contacted_at = NOW()')
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

  it('POST note_added does not trigger automatic status transitions', async () => {
    mockExecute.mockResolvedValue({ rows: [] })

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({
        channel: 'system',
        result: 'note_added',
        note: 'Nota interna',
      }),
    })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    const executedSql = mockExecute.mock.calls.map(([sql]) => String(sql)).join('\n')
    expect(executedSql).toContain('result, note, tenant_id')
    expect(executedSql).toContain("VALUES (16, 7, 'system', 'note_added'")
    expect(executedSql).not.toContain('SELECT COUNT(*) as cnt FROM lead_interactions')
    expect(executedSql).not.toContain('status = \'contacted\'')
  })

  it('POST note_added retries with backward-compatible result when DB check constraint rejects it', async () => {
    const checkConstraintError = new Error(
      'new row for relation "lead_interactions" violates check constraint "lead_interactions_result_check" (result)'
    )
    mockExecute
      .mockRejectedValueOnce(checkConstraintError) // first insert with note_added
      .mockResolvedValueOnce({ rows: [] }) // fallback insert with status_changed
      .mockResolvedValueOnce({ rows: [] }) // update last_contacted_at

    const request = new NextRequest('http://localhost/api/leads/16/interactions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'payload-token=test-token',
      },
      body: JSON.stringify({
        channel: 'system',
        result: 'note_added',
        note: 'Nota interna',
      }),
    })

    const response = await POST(request, buildContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.result).toBe('status_changed')

    const executedSql = mockExecute.mock.calls.map(([sql]) => String(sql)).join('\n')
    expect(executedSql).toContain("VALUES (16, 7, 'system', 'note_added'")
    expect(executedSql).toContain("VALUES (16, 7, 'system', 'status_changed'")
    expect(executedSql).not.toContain('SELECT COUNT(*) as cnt FROM lead_interactions')
  })
})
