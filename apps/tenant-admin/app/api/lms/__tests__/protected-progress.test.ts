import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSql, mockPostgres, mockReadCampusSession, mockEnrollmentBelongsToStudent, mockStorageAvailable } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockPostgres: vi.fn(),
  mockReadCampusSession: vi.fn(),
  mockEnrollmentBelongsToStudent: vi.fn(),
  mockStorageAvailable: vi.fn(),
}))

vi.mock('postgres', () => ({ default: mockPostgres }))
vi.mock('@/src/lib/campus/auth', () => ({
  readCampusSession: mockReadCampusSession,
  campusEnrollmentBelongsToStudent: mockEnrollmentBelongsToStudent,
}))
vi.mock('../_lib/lessonProgressStorage', () => ({
  isLessonProgressStorageAvailable: mockStorageAvailable,
}))

import { GET, POST } from '../progress/route'

describe('Protected campus progress API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'staging'
    process.env.CAMPUS_JWT_SECRET = 'staging-campus-secret-with-more-than-32-characters'
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/akademate_campus_staging'
    mockPostgres.mockReturnValue(mockSql)
    mockStorageAvailable.mockResolvedValue(true)
  })

  it('rejects unauthenticated progress reads before touching storage', async () => {
    mockReadCampusSession.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/lms/progress?enrollmentId=enrollment-1'))

    expect(response.status).toBe(401)
    expect(mockPostgres).not.toHaveBeenCalled()
  })

  it('rejects progress writes for another student enrollment', async () => {
    mockReadCampusSession.mockResolvedValue({
      student: { id: 'student-1', tenantId: 1 },
      enrollments: [],
      token: {},
    })
    mockEnrollmentBelongsToStudent.mockResolvedValue(false)

    const response = await POST(new NextRequest('http://localhost/api/lms/progress', {
      method: 'POST',
      body: JSON.stringify({ enrollmentId: '1', lessonId: '1', isCompleted: true }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(403)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('rejects invalid time values before touching auth or storage', async () => {
    const response = await POST(new NextRequest('http://localhost/api/lms/progress', {
      method: 'POST',
      body: JSON.stringify({ enrollmentId: '1', lessonId: '1', timeSpent: -1 }),
      headers: { 'content-type': 'application/json' },
    }))

    expect(response.status).toBe(400)
    expect(mockReadCampusSession).not.toHaveBeenCalled()
    expect(mockStorageAvailable).not.toHaveBeenCalled()
  })

  it('calculates the percentage against all published lessons, not only visited lessons', async () => {
    mockReadCampusSession.mockResolvedValue({
      student: { id: 'student-1', tenantId: 1 },
      enrollments: [{ id: '1', courseId: '1' }],
      token: {},
    })
    mockEnrollmentBelongsToStudent.mockResolvedValue(true)
    mockSql
      .mockResolvedValueOnce([{ id: 1, status: 'confirmed', course_run_id: 1 }])
      .mockResolvedValueOnce([{ id: 1, enrollment: 1, lesson: 1, isCompleted: true, timeSpent: 60 }])
      .mockResolvedValueOnce([{ count: 2 }])

    const response = await GET(new NextRequest('http://localhost/api/lms/progress?enrollmentId=1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.completedLessons).toBe(1)
    expect(data.data.totalLessons).toBe(2)
    expect(data.data.progressPercent).toBe(50)
  })

  it('writes progress only for a published lesson in the enrolled course', async () => {
    mockReadCampusSession.mockResolvedValue({
      student: { id: 'student-1', tenantId: 1 },
      enrollments: [{ id: '1', courseId: '1' }],
      token: {},
    })
    mockEnrollmentBelongsToStudent.mockResolvedValue(true)
    mockSql
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{
        id: 1,
        enrollment: 1,
        lesson: 1,
        isCompleted: true,
        completedAt: '2026-07-13T00:00:00.000Z',
        timeSpent: 120,
        lastAccessAt: '2026-07-13T00:00:00.000Z',
        lastPosition: 30,
      }])

    const response = await POST(new NextRequest('http://localhost/api/lms/progress', {
      method: 'POST',
      body: JSON.stringify({ enrollmentId: '1', lessonId: '1', isCompleted: true, timeSpent: 120, lastPosition: 30 }),
      headers: { 'content-type': 'application/json' },
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.isCompleted).toBe(true)
    expect(data.data.timeSpent).toBe(120)
    expect(mockSql).toHaveBeenCalledTimes(3)
  })
})
