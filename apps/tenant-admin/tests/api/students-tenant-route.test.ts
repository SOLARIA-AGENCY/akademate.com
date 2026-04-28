import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockFind, mockCreate, mockGetPayloadHMR, mockGetAuthenticatedUserContext } = vi.hoisted(() => ({
  mockFind: vi.fn(),
  mockCreate: vi.fn(),
  mockGetPayloadHMR: vi.fn(),
  mockGetAuthenticatedUserContext: vi.fn(),
}))

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: mockGetAuthenticatedUserContext,
}))

import { GET, POST } from '@/app/api/students/route'

describe('Students route tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.DEFAULT_TENANT_ID
    delete process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID

    mockGetPayloadHMR.mockResolvedValue({
      find: mockFind,
      create: mockCreate,
    })
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })
    mockCreate.mockResolvedValue({ id: 10, tenant: 7 })
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 7 })
  })

  it('filters GET by authenticated tenant even when another tenant is passed in query', async () => {
    const request = new NextRequest('http://localhost/api/students?tenantId=99&status=active')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalDocs).toBe(0)
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'students',
        overrideAccess: true,
        where: {
          and: [
            { tenant: { equals: 7 } },
            { status: { equals: 'active' } },
          ],
        },
      }),
    )
  })

  it('falls back to explicit tenant query when no authenticated context exists', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/students?tenantId=3')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ tenant: { equals: 3 } }],
        },
      }),
    )
  })

  it('rejects GET without tenant context', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/students')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.success).toBe(false)
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('assigns authenticated tenant on POST and ignores body tenant spoofing', async () => {
    const request = new NextRequest('http://localhost/api/students', {
      method: 'POST',
      body: JSON.stringify({
        first_name: 'Ana',
        last_name: 'Perez',
        email: 'ana@example.com',
        phone: '+34 600 000 000',
        tenant: 99,
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.doc.id).toBe(10)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'students',
        overrideAccess: true,
        data: expect.objectContaining({
          first_name: 'Ana',
          tenant: 7,
        }),
      }),
    )
  })
})
