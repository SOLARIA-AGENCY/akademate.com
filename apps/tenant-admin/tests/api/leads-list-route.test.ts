import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockAuth = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return { mockPayload, mockGetPayloadHMR, mockAuth, mockExecute }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { GET } from '@/app/api/leads/route'

describe('Leads list route auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 'user-1', tenantId: 2 } })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*) as cnt FROM leads l')) return { rows: [{ cnt: '0' }] }
      if (sql.includes('SELECT * FROM leads l')) return { rows: [] }
      return { rows: [] }
    })
  })

  it('returns 401 when no auth cookies are present', async () => {
    const request = new NextRequest('http://localhost/api/leads?limit=20')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
  })

  it('authenticates using token stored in akademate_session cookie', async () => {
    const session = encodeURIComponent(JSON.stringify({ token: 'session-token' }))
    const request = new NextRequest('http://localhost/api/leads?limit=20', {
      headers: { cookie: `akademate_session=${session}` },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)
    expect(mockAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        headers: expect.any(Headers),
      }),
    )

    const authCall = mockAuth.mock.calls[0]?.[0]
    const cookieHeader = authCall?.headers?.get('cookie')
    expect(cookieHeader).toContain('payload-token=session-token')
  })

  it('supports filtering by enrollment_id', async () => {
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'enrollment_id'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) {
        return { rows: [{ cnt: '1' }] }
      }
      if (sql.includes('SELECT * FROM leads l')) {
        return {
          rows: [{
            id: 10,
            enrollment_id: 99,
            first_name: 'Lead',
            last_name: 'Demo',
            email: 'lead@example.com',
            status: 'enrolled',
          }],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?enrollment_id=99&limit=20', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)
    expect(payload.docs).toHaveLength(1)
    expect(String(payload.docs[0].enrollment_id)).toBe('99')

    const selectSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .find((sql) => sql.includes('SELECT * FROM leads l'))

    expect(selectSql).toContain('l.enrollment_id = 99')
  })

  it('excludes test leads by default when is_test column exists', async () => {
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) return { rows: [{ cnt: '0' }] }
      if (sql.includes('SELECT * FROM leads l')) return { rows: [] }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?limit=20', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const selectSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .find((sql) => sql.includes('SELECT * FROM leads l'))

    expect(selectSql).toContain('COALESCE(l.is_test, false) = false')
  })

  it('allows including test leads when include_tests=true', async () => {
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) return { rows: [{ cnt: '0' }] }
      if (sql.includes('SELECT * FROM leads l')) return { rows: [] }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?limit=20&include_tests=true', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)

    const selectSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .find((sql) => sql.includes('SELECT * FROM leads l'))

    expect(selectSql).not.toContain('COALESCE(l.is_test, false) = false')
  })
})
