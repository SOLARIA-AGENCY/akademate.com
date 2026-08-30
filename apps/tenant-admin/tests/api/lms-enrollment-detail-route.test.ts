import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSql, mockReadCampusSession, mockEnrollmentBelongsToStudent } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockReadCampusSession: vi.fn(),
  mockEnrollmentBelongsToStudent: vi.fn(),
}))

vi.mock('@/src/lib/campus/environment', () => ({
  campusEnvironmentError: vi.fn(() => null),
}))

vi.mock('@/src/lib/campus/auth', () => ({
  campusSql: mockSql,
  readCampusSession: mockReadCampusSession,
  campusEnrollmentBelongsToStudent: mockEnrollmentBelongsToStudent,
}))

import { GET } from '@/app/api/lms/enrollments/[id]/route'

const session = {
  student: { id: 'student-1', tenantId: 7 },
  enrollments: [{ id: '31', courseId: '12' }],
  token: {},
}

function request(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/lms/enrollments/${id}`)
}

function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('LMS enrollment detail route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CAMPUS_INTERNAL_ENABLED = 'true'
    process.env.CAMPUS_ENVIRONMENT = 'staging'
    mockSql.array = vi.fn((values: unknown[]) => values)
    mockReadCampusSession.mockResolvedValue(session)
    mockEnrollmentBelongsToStudent.mockResolvedValue(true)
  })

  it('rejects malformed, zero and negative enrollment ids before querying SQL', async () => {
    for (const id of ['abc', '0', '-2', '1.5']) {
      const response = await GET(request(id), context(id))
      expect(response.status).toBe(400)
    }

    expect(mockReadCampusSession).not.toHaveBeenCalled()
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated and cross-student reads', async () => {
    mockReadCampusSession.mockResolvedValueOnce(null)
    const unauthenticated = await GET(request('31'), context('31'))
    expect(unauthenticated.status).toBe(401)

    mockEnrollmentBelongsToStudent.mockResolvedValueOnce(false)
    const crossStudent = await GET(request('31'), context('31'))
    expect(crossStudent.status).toBe(403)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 404 when the tenant-scoped enrollment query has no row', async () => {
    mockSql.mockResolvedValueOnce([])

    const response = await GET(request('31'), context('31'))
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload).toMatchObject({ success: false, error: 'Matrícula no encontrada.' })
  })

  it('loads modules by course and keeps progress scoped to published lesson ids', async () => {
    mockSql
      .mockResolvedValueOnce([{
        id: 31,
        status: 'pending',
        enrolled_at: '2026-04-01T10:00:00.000Z',
        course_run_id: 77,
        course_run_title: 'Convocatoria Abril',
        course_id: 12,
        course_title: 'Farmacia',
        course_slug: 'farmacia',
        start_date: '2026-04-01',
        end_date: '2026-05-01',
        course_run_status: 'published',
      }])
      .mockResolvedValueOnce([{ id: 1, title: 'Módulo 1', order: 1, estimated_duration_minutes: 60 }])
      .mockResolvedValueOnce([{ id: 2, module_id: 1, title: 'Lección 1', order: 1, estimated_duration_minutes: 30, requires_completion: true }])
      .mockResolvedValueOnce([{ lesson_id: 2, is_completed: true, watched_percentage: 100 }])

    const response = await GET(request('31'), context('31'))
    const payload = await response.json()
    const queries = mockSql.mock.calls.map(([strings]: [TemplateStringsArray]) => strings.join(' '))

    expect(response.status).toBe(200)
    expect(payload.data.course.title).toBe('Farmacia')
    expect(payload.data.modules[0].lessons[0].progress.status).toBe('completed')
    expect(payload.data.progress.progressPercent).toBe(100)
    expect(queries[1]).toContain('WHERE course_id =')
    expect(queries[1]).not.toContain('course_run_id')
    expect(queries[3]).toContain('lesson_progress')
    expect(mockSql.array).toHaveBeenCalledWith([1])
    expect(mockSql.array).toHaveBeenCalledWith([2])
  })
})
