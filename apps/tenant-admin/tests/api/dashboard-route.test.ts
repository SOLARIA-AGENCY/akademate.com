import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockExecute, mockFind, mockGetPayloadHMR } = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockFind = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  return { mockExecute, mockFind, mockGetPayloadHMR }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { GET } from '@/app/api/dashboard/route'

describe('Dashboard route - GET /api/dashboard', () => {
  let hasIsTestColumn = false

  beforeEach(() => {
    vi.clearAllMocks()
    hasIsTestColumn = false

    mockGetPayloadHMR.mockResolvedValue({
      find: mockFind,
      db: {
        drizzle: {
          execute: mockExecute,
        },
      },
    })

    mockFind.mockImplementation(async (args: any) => {
      const collection = String(args?.collection ?? '')
      if (collection === 'courses') return { docs: [{ id: 1, active: true }], totalDocs: 1 }
      if (collection === 'course-runs') return { docs: [], totalDocs: 0 }
      if (collection === 'campuses') return { docs: [], totalDocs: 0 }
      if (collection === 'staff') return { docs: [], totalDocs: 0 }
      if (collection === 'campaigns') {
        return {
          docs: [{ id: 'cmp-1', name: 'SOLARIA AGENCY TEST', status: 'active', budget: 100 }],
          totalDocs: 1,
        }
      }
      return { docs: [], totalDocs: 0 }
    })

    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns') && sql.includes("column_name = 'is_test'")) {
        return { rows: [{ cnt: hasIsTestColumn ? '1' : '0' }] }
      }
      if (sql.includes('COUNT(*)::int AS cnt') && sql.includes('FROM leads')) {
        return { rows: [{ cnt: '0' }] }
      }
      if (sql.includes('GROUP BY 1')) return { rows: [] }
      if (sql.includes('SELECT first_name, last_name, email, created_at')) return { rows: [] }
      if (sql.includes('FROM tenants')) return { rows: [] }
      return { rows: [] }
    })
  })

  it('does not append is_test filter when column does not exist', async () => {
    const request = new NextRequest('http://localhost/api/dashboard?tenantId=2')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)

    const leadSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .filter((sql) => sql.includes('FROM leads'))
      .join('\n')
    expect(leadSql).not.toContain('COALESCE(is_test, false) = false')
  })

  it('appends is_test filter when column exists', async () => {
    hasIsTestColumn = true

    const request = new NextRequest('http://localhost/api/dashboard?tenantId=2')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)

    const leadSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .filter((sql) => sql.includes('FROM leads'))
      .join('\n')
    expect(leadSql).toContain('COALESCE(is_test, false) = false')
  })
})
