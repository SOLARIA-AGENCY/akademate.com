import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetPayloadHMR, mockFindByID, mockFind, mockPayload } = vi.hoisted(() => {
  const mockFindByID = vi.fn()
  const mockFind = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    findByID: mockFindByID,
    find: mockFind,
  }

  return {
    mockGetPayloadHMR,
    mockFindByID,
    mockFind,
    mockPayload,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { GET } from '@/app/api/lms/enrollments/[id]/route'

function buildContext(id = '31') {
  return { params: Promise.resolve({ id }) }
}

describe('LMS enrollment detail route - GET /api/lms/enrollments/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
  })

  it('returns 404 when enrollment does not exist', async () => {
    mockFindByID.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/lms/enrollments/31')
    const response = await GET(request, buildContext('31'))
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload).toMatchObject({
      success: false,
      error: 'Enrollment not found',
    })
  })

  it('queries modules by course (not courseRun) to avoid invalid path errors', async () => {
    mockFindByID.mockResolvedValue({
      id: '31',
      status: 'pending',
      createdAt: '2026-04-01T10:00:00.000Z',
      course_run: {
        id: '77',
        title: 'Convocatoria Abril',
        course: {
          id: '12',
          title: 'Farmacia',
          slug: 'farmacia',
        },
      },
    })

    mockFind.mockImplementation(async (args: any) => {
      if (args.collection === 'modules') {
        return {
          docs: [{ id: 'm1', title: 'Módulo 1', order: 1, estimatedMinutes: 60 }],
          totalDocs: 1,
        }
      }

      if (args.collection === 'lessons') {
        return {
          docs: [{ id: 'l1', title: 'Lección 1', order: 1, estimatedMinutes: 30, isMandatory: true }],
          totalDocs: 1,
        }
      }

      if (args.collection === 'lesson-progress') {
        return {
          docs: [{ lesson: 'l1', status: 'completed', progressPercent: 100 }],
          totalDocs: 1,
        }
      }

      return { docs: [], totalDocs: 0 }
    })

    const request = new NextRequest('http://localhost/api/lms/enrollments/31')
    const response = await GET(request, buildContext('31'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)

    const modulesCall = mockFind.mock.calls.find(([args]: [any]) => args.collection === 'modules')?.[0]
    expect(modulesCall).toBeDefined()
    expect(modulesCall.where).toEqual({ course: { equals: '12' } })
    expect(JSON.stringify(modulesCall.where)).not.toContain('courseRun')
  })

  it('does not query modules when enrollment has no base course relation', async () => {
    mockFindByID.mockResolvedValue({
      id: '44',
      status: 'pending',
      createdAt: '2026-04-01T10:00:00.000Z',
      course_run: null,
    })

    mockFind.mockResolvedValue({ docs: [], totalDocs: 0 })

    const request = new NextRequest('http://localhost/api/lms/enrollments/44')
    const response = await GET(request, buildContext('44'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.course).toBeNull()
    expect(payload.data.modules).toEqual([])
    expect(
      mockFind.mock.calls.some(([args]: [any]) => args.collection === 'modules')
    ).toBe(false)
  })
})

