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
})
