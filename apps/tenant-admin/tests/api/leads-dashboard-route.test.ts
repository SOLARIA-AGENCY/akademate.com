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
})
