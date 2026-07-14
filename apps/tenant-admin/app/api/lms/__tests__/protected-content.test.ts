import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockPayload, mockReadCampusSession } = vi.hoisted(() => ({
  mockPayload: {
    find: vi.fn(),
    findByID: vi.fn(),
  },
  mockReadCampusSession: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue(mockPayload) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/src/lib/campus/auth', () => ({ readCampusSession: mockReadCampusSession }))

import { GET } from '../content/route'

describe('Protected campus content API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'staging'
    process.env.CAMPUS_JWT_SECRET = 'staging-campus-secret-with-more-than-32-characters'
  })

  it('rejects unauthenticated access', async () => {
    mockReadCampusSession.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/lms/content?courseId=course-1'))
    expect(response.status).toBe(401)
  })

  it('rejects a course without an active campus enrollment', async () => {
    mockReadCampusSession.mockResolvedValue({ student: { id: 'student-1' }, enrollments: [], token: {} })
    const response = await GET(new NextRequest('http://localhost/api/lms/content?courseId=course-1'))
    expect(response.status).toBe(403)
  })

  it('returns only published content and replaces material URLs with protected endpoints', async () => {
    mockReadCampusSession.mockResolvedValue({
      student: { id: 'student-1' },
      enrollments: [{ id: 'enrollment-1', courseId: 'course-1' }],
      token: {},
    })
    mockPayload.find.mockResolvedValue({
      docs: [
        { id: 'module-1', title: 'Modulo', is_published: true },
      ],
      totalDocs: 1,
    })

    const response = await GET(new NextRequest('http://localhost/api/lms/content?courseId=course-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.modules).toHaveLength(1)
    expect(data.data.modules[0].title).toBe('Modulo')
  })
})
