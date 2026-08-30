import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSql, mockPostgres, mockReadCampusSession, mockBelongs, mockStorageAvailable } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockPostgres: vi.fn(),
  mockReadCampusSession: vi.fn(),
  mockBelongs: vi.fn(),
  mockStorageAvailable: vi.fn(),
}))

vi.mock('postgres', () => ({ default: mockPostgres }))
vi.mock('@/src/lib/campus/auth', () => ({
  readCampusSession: mockReadCampusSession,
  campusEnrollmentBelongsToStudent: mockBelongs,
}))
vi.mock('../../app/api/lms/_lib/lessonProgressStorage', () => ({
  isLessonProgressStorageAvailable: mockStorageAvailable,
}))

import { GET, POST } from '../../app/api/lms/progress/route'

describe('LMS progress route resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'staging'
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/akademate_test'
    mockPostgres.mockReturnValue(mockSql)
    mockReadCampusSession.mockResolvedValue({
      student: { id: 'student-1', tenantId: 7 },
      enrollments: [{ id: '3', courseId: '12' }],
      token: {},
    })
    mockBelongs.mockResolvedValue(true)
  })

  it('returns 400 when enrollmentId is missing before checking the session', async () => {
    const response = await GET(new NextRequest('http://localhost/api/lms/progress'))

    expect(response.status).toBe(400)
    expect(mockReadCampusSession).not.toHaveBeenCalled()
  })

  it('returns an empty successful payload when the progress table is unavailable', async () => {
    mockStorageAvailable.mockResolvedValue(false)
    mockSql.mockResolvedValueOnce([{ id: 3, status: 'completed', course_run_id: 5, course_id: 12 }])

    const response = await GET(new NextRequest('http://localhost/api/lms/progress?enrollmentId=3'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: {
        enrollmentId: '3',
        progressPercent: 0,
        lessonProgress: [],
      },
    })
  })

  it('fails closed on writes when progress storage is unavailable', async () => {
    mockStorageAvailable.mockResolvedValue(false)

    const response = await POST(new NextRequest('http://localhost/api/lms/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enrollmentId: '3', lessonId: '1', isCompleted: true }),
    }))
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.success).toBe(false)
    expect(String(json.error)).toContain('no esta disponible')
    expect(mockSql).not.toHaveBeenCalled()
  })
})
