import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockGetPayloadHMR, mockAuth, mockExecute } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockAuth = vi.fn()
  const mockGetPayloadHMR = vi.fn()
  const mockFind = vi.fn()

  const mockPayload = {
    auth: mockAuth,
    find: mockFind,
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
    mockPayload.find.mockResolvedValue({ docs: [] })
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

  it('accepts socketToken in akademate_session cookie payload', async () => {
    const session = encodeURIComponent(JSON.stringify({ socketToken: 'socket-session-token' }))
    const request = new NextRequest('http://localhost/api/leads?limit=20', {
      headers: { cookie: `akademate_session=${session}` },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)

    const authCall = mockAuth.mock.calls[0]?.[0]
    const cookieHeader = authCall?.headers?.get('cookie')
    expect(cookieHeader).toContain('payload-token=socket-session-token')
  })

  it('resolves tenant from DB when payload auth returns user without tenant fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: '7' } })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT tenant_id FROM users WHERE id = 7 LIMIT 1')) {
        return { rows: [{ tenant_id: '2' }] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) return { rows: [{ cnt: '0' }] }
      if (sql.includes('SELECT * FROM leads l')) return { rows: [] }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?limit=20', {
      headers: { cookie: 'payload-token=test-token' },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)
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

  it('filters bucket=leads to only entries linked to active Meta campaigns', async () => {
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 501,
          name: 'SOLARIA AGENCY - Farmacia',
          status: 'active',
          utm_source: 'facebook',
          utm_campaign: 'farmacy_meta_2026',
          campaign_type: 'meta_ads',
          meta_campaign_id: 'meta-501',
        },
      ],
    })

    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'lead_type'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('information_schema.tables') && sql.includes("table_name = 'lead_interactions'")) {
        return { rows: [] }
      }
      if (sql.includes('information_schema.tables') && sql.includes("table_name = 'users'")) {
        return { rows: [] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) {
        return { rows: [{ cnt: '3' }] }
      }
      if (sql.includes('SELECT * FROM leads l')) {
        return {
          rows: [
            {
              id: 11,
              first_name: 'Meta',
              last_name: 'Qualified',
              email: 'meta-qualified@example.com',
              phone: '+34 611 111 111',
              campaign: 501,
              utm_source: 'facebook',
            },
            {
              id: 12,
              first_name: 'Meta',
              last_name: 'Unresolved',
              email: 'meta-unresolved@example.com',
              phone: '+34 622 222 222',
              utm_source: 'facebook',
              meta_campaign_id: 'meta-unlinked',
            },
            {
              id: 13,
              first_name: 'Organic',
              last_name: 'Lead',
              email: 'organic@example.com',
              phone: '+34 633 333 333',
              source_form: 'contacto',
            },
          ],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?bucket=leads&limit=50', {
      headers: { cookie: 'payload-token=test-token' },
    })
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)
    expect(payload.docs).toHaveLength(1)
    expect(payload.docs[0].id).toBe(11)
    expect(payload.docs[0].commercial_bucket).toBe('leads')
    expect(payload.docs[0].commercial_ads_active).toBe(true)
  })

  it('filters bucket=inscripciones including unresolved origin records', async () => {
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 501,
          name: 'SOLARIA AGENCY - Farmacia',
          status: 'active',
          utm_source: 'facebook',
          utm_campaign: 'farmacy_meta_2026',
          campaign_type: 'meta_ads',
          meta_campaign_id: 'meta-501',
        },
      ],
    })

    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'lead_type'")) {
        return { rows: [{ '?column?': 1 }] }
      }
      if (sql.includes('information_schema.tables') && sql.includes("table_name = 'lead_interactions'")) {
        return { rows: [] }
      }
      if (sql.includes('information_schema.tables') && sql.includes("table_name = 'users'")) {
        return { rows: [] }
      }
      if (sql.includes('COUNT(*) as cnt FROM leads l')) {
        return { rows: [{ cnt: '3' }] }
      }
      if (sql.includes('SELECT * FROM leads l')) {
        return {
          rows: [
            {
              id: 11,
              first_name: 'Meta',
              last_name: 'Qualified',
              email: 'meta-qualified@example.com',
              phone: '+34 611 111 111',
              campaign: 501,
              utm_source: 'facebook',
            },
            {
              id: 12,
              first_name: 'Meta',
              last_name: 'Unresolved',
              email: 'meta-unresolved@example.com',
              phone: '+34 622 222 222',
              utm_source: 'facebook',
              meta_campaign_id: 'meta-unlinked',
            },
            {
              id: 13,
              first_name: 'Organic',
              last_name: 'Lead',
              email: 'organic@example.com',
              phone: '+34 633 333 333',
              source_form: 'contacto',
            },
          ],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('http://localhost/api/leads?bucket=inscripciones&limit=50', {
      headers: { cookie: 'payload-token=test-token' },
    })
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload.docs)).toBe(true)
    expect(payload.docs).toHaveLength(2)
    expect(payload.docs.map((doc: any) => doc.id).sort()).toEqual([12, 13])
    expect(payload.docs.find((doc: any) => doc.id === 12)?.commercial_bucket).toBe('unresolved')
    expect(payload.docs.find((doc: any) => doc.id === 13)?.commercial_bucket).toBe('inscripciones')
  })
})
