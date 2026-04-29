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

import { GET } from '@/app/api/leads/dashboard/route'

describe('Leads dashboard route auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockAuth.mockResolvedValue({ user: { id: 'user-1', tenantId: 2 } })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('GROUP BY status')) {
        return { rows: [{ status: 'contacted', cnt: '1' }] }
      }
      if (sql.includes('avg_hours')) {
        return { rows: [{ avg_hours: '2.5' }] }
      }
      return { rows: [{ cnt: '0' }] }
    })
  })

  it('returns 401 when no auth cookies are present', async () => {
    const request = new NextRequest('http://localhost/api/leads/dashboard')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
  })

  it('authenticates using token stored in cep_session cookie', async () => {
    const session = encodeURIComponent(JSON.stringify({ token: 'legacy-session-token' }))
    const request = new NextRequest('http://localhost/api/leads/dashboard', {
      headers: { cookie: `cep_session=${session}` },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual(
      expect.objectContaining({
        totalLeads: expect.any(Number),
        unattended: expect.any(Number),
        conversionRate: expect.any(Number),
        avgResponseHours: expect.any(Number),
      }),
    )

    expect(mockAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        headers: expect.any(Headers),
      }),
    )

    const authCall = mockAuth.mock.calls[0]?.[0]
    const cookieHeader = authCall?.headers?.get('cookie')
    expect(cookieHeader).toContain('payload-token=legacy-session-token')
  })

  it('excludes test leads by default when is_test column exists', async () => {
    const request = new NextRequest('http://localhost/api/leads/dashboard', {
      headers: { cookie: 'payload-token=test-token' },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)

    const executedSql = mockExecute.mock.calls.map((call) => String(call[0])).join('\n')
    expect(executedSql).toContain('COALESCE(is_test, false) = false')
  })

  it('allows including test leads when include_tests=true', async () => {
    const request = new NextRequest('http://localhost/api/leads/dashboard?include_tests=true', {
      headers: { cookie: 'payload-token=test-token' },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)

    const countSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .filter((sql) => sql.includes('FROM leads'))
      .join('\n')
    expect(countSql).not.toContain('COALESCE(is_test, false) = false')
  })

  it('counts new leads with only system interactions as unattended', async () => {
    const request = new NextRequest('http://localhost/api/leads/dashboard', {
      headers: { cookie: 'payload-token=test-token' },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)

    const executedSql = mockExecute.mock.calls.map((call) => String(call[0])).join('\n')
    expect(executedSql).toContain("l.status = 'new'")
    expect(executedSql).toContain('l.last_contacted_at IS NULL')
    expect(executedSql).toContain("COALESCE(li.channel, '') <> 'system'")
    expect(executedSql).not.toContain("l.created_at < NOW() - INTERVAL '24 hours'")
  })
})
