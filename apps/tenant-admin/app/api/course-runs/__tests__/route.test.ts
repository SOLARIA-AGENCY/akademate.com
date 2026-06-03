import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '../[id]/route'
import { GET as GET_AVAILABILITY } from '../[id]/availability/route'
import { GET as GET_NEW_AVAILABILITY } from '../availability/route'
import { POST as GENERATE_SESSIONS } from '../[id]/generate-sessions/route'

const { payloadMock, authMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  authMock: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: authMock,
}))

const tenantId = 17
const currentRun = {
  id: 84,
  tenant: tenantId,
  codigo: 'NOR-2026-043',
  campus: 1,
  classroom: 10,
  start_date: '2026-09-01T00:00:00.000Z',
  end_date: '2026-11-17T00:00:00.000Z',
  schedule_days: ['monday'],
  schedule_time_start: '09:00:00',
  schedule_time_end: '13:00:00',
  status: 'published',
  enrollment_status: 'open',
  training_type: 'private',
  max_students: 17,
  course: 187,
  instructor: 44,
}

function params(id = '84') {
  return { params: Promise.resolve({ id }) }
}

function installFindRouter(options?: {
  noCurrent?: boolean
  conflict?: boolean
  missingCampus?: boolean
  missingClassroom?: boolean
  foreignClassroomCampus?: boolean
  missingStaff?: boolean
  inactiveStaff?: boolean
  staffQualifiedAreas?: Array<number | string>
  conflictInstructor?: number
  currentOverrides?: Record<string, unknown>
}) {
  payloadMock.find.mockImplementation(async ({ collection, where }: any) => {
    if (collection === 'course-runs' && where?.and) {
      const idCondition = where.and.find((item: any) => item?.id?.equals === '84')
      const classroomCondition = where.and.find((item: any) => item?.classroom?.equals === 10 || item?.classroom?.equals === '10')
      if (idCondition && !classroomCondition) {
        return { docs: options?.noCurrent ? [] : [{ ...currentRun, ...(options?.currentOverrides ?? {}) }] }
      }
      return {
        docs: options?.conflict
          ? [{
              id: 99,
              codigo: 'SC-2026-099',
              classroom: { id: 10, name: 'Aula 2' },
              start_date: '2026-09-10T00:00:00.000Z',
              end_date: '2026-10-10T00:00:00.000Z',
              schedule_days: ['monday'],
              schedule_time_start: '10:00:00',
              schedule_time_end: '12:00:00',
              status: 'published',
              instructor: options?.conflictInstructor ? { id: options.conflictInstructor, full_name: 'Docente Ocupado' } : undefined,
            }]
          : [],
      }
    }
    if (collection === 'campuses') {
      return { docs: options?.missingCampus ? [] : [{ id: 1, tenant: tenantId, name: 'Sede Norte' }] }
    }
    if (collection === 'classrooms') {
      return {
        docs: options?.missingClassroom
          ? []
          : [{ id: 10, tenant: tenantId, campus: options?.foreignClassroomCampus ? 2 : 1, name: 'Aula 2' }],
      }
    }
    if (collection === 'staff') {
      return {
        docs: options?.missingStaff
          ? []
          : [{
              id: 44,
              tenant: tenantId,
              full_name: options?.inactiveStaff ? 'Docente Inactivo' : 'Docente Activo',
              is_active: !options?.inactiveStaff,
              employment_status: options?.inactiveStaff ? 'inactive' : 'active',
              qualified_areas: options?.staffQualifiedAreas ?? [7],
            }],
      }
    }
    if (collection === 'courses') {
      return { docs: [{ id: 187, tenant: tenantId, name: 'Curso test', area_formativa: 7 }] }
    }
    if (collection === 'course-run-sessions') {
      return { docs: [] }
    }
    return { docs: [] }
  })
}

describe('/api/course-runs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId: 31, tenantId })
    payloadMock.update.mockResolvedValue({ ...currentRun, campus: { id: 1, name: 'Sede Norte' } })
    payloadMock.create.mockImplementation(async ({ data }: any) => ({ id: Math.random(), ...data }))
    installFindRouter()
  })

  it('requires an authenticated tenant', async () => {
    authMock.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/course-runs/84'), params())

    expect(response.status).toBe(401)
    expect(payloadMock.find).not.toHaveBeenCalled()
  })

  it('reads course runs through tenant scope', async () => {
    const response = await GET(new NextRequest('http://localhost/api/course-runs/84?depth=2'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.doc.id).toBe(84)
    expect(payloadMock.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      where: expect.objectContaining({
        and: expect.arrayContaining([
          { id: { equals: '84' } },
          { tenant: { equals: tenantId } },
        ]),
      }),
    }))
  })

  it('updates dates when the range is valid', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({
        start_date: '2026-09-15T00:00:00.000Z',
        end_date: '2026-12-15T00:00:00.000Z',
      }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      id: '84',
      data: expect.objectContaining({
        start_date: '2026-09-15T00:00:00.000Z',
        end_date: '2026-12-15T00:00:00.000Z',
      }),
      overrideAccess: true,
    }))
  })

  it('rejects an end date before the start date', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({
        start_date: '2026-12-15T00:00:00.000Z',
        end_date: '2026-09-15T00:00:00.000Z',
      }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/fecha de fin/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('stores empty price as consultar without mutating the course price', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ price_override: '', enrollment_fee_snapshot: 120 }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        price_override: null,
        enrollment_fee_snapshot: 120,
      }),
    }))
  })

  it('updates enrollment status and deadline when valid', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({
        enrollment_status: 'closed',
        enrollment_deadline: '2026-08-20T00:00:00.000Z',
      }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        enrollment_status: 'closed',
        enrollment_deadline: '2026-08-20T00:00:00.000Z',
      }),
    }))
  })

  it('publishes a ready convocatoria and synchronizes planning status', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'published',
        planning_status: 'published',
      }),
    }))
  })

  it('rejects publishing when required public data is missing', async () => {
    installFindRouter()
    payloadMock.find.mockImplementationOnce(async () => ({
      docs: [{ ...currentRun, codigo: '', max_students: 0, course: null, cycle: null }],
    }))

    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/lista para publicar/i)
    expect(data.blockers.length).toBeGreaterThan(0)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects publishing a presencial convocatoria without assigned instructor', async () => {
    installFindRouter({ currentOverrides: { instructor: null, instructors: [] } })
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/lista para publicar/i)
    expect(data.blockers).toContain('La convocatoria presencial necesita docente asignado.')
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects saving when the already assigned instructor is inactive', async () => {
    installFindRouter({ inactiveStaff: true, staffQualifiedAreas: [7] })
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/no está activo/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('returns draft and planning draft when unpublishing', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'draft' }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'draft',
        planning_status: 'draft',
      }),
    }))
  })

  it('rejects enrollment status outside the commercial status contract', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ enrollment_status: 'published' }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/matrícula/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects enrollment deadline after the start date', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ enrollment_deadline: '2026-09-20T00:00:00.000Z' }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/matrícula/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects campus assignment from another tenant', async () => {
    installFindRouter({ missingCampus: true })
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ campus: 999 }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toMatch(/sede seleccionada/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects classroom assignment outside selected campus', async () => {
    installFindRouter({ foreignClassroomCampus: true })
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ campus: 1, classroom: 10 }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/aula seleccionada/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('assigns classroom and schedule when there is no occupation conflict', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({
        campus: 1,
        classroom: 10,
        schedule_days: ['monday', 'wednesday'],
        schedule_time_start: '09:00',
        schedule_time_end: '13:00',
        shift: 'morning',
      }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        classroom: 10,
        schedule_time_start: '09:00:00',
        schedule_time_end: '13:00:00',
      }),
    }))
  })

  it('rejects classroom and schedule when another run occupies the same slot', async () => {
    installFindRouter({ conflict: true })
    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({
        campus: 1,
        classroom: 10,
        schedule_days: ['monday'],
        schedule_time_start: '09:00',
        schedule_time_end: '13:00',
      }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toMatch(/aula ocupada/i)
    expect(data.detail).toContain('SC-2026-099')
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('returns availability blockers through tenant-scoped planning endpoint', async () => {
    installFindRouter({ conflict: true })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?classroom=10&schedule_days=monday&schedule_time_start=09:00&schedule_time_end=13:00'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers[0].type).toBe('classroom_overlap')
    expect(data.availability.blockers[0].message).toContain('SC-2026-099')
    expect(payloadMock.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      where: expect.objectContaining({
        and: expect.arrayContaining([
          { tenant: { equals: tenantId } },
          { id: { not_equals: 84 } },
        ]),
      }),
    }))
  })

  it('returns unavailable instructors for the selected planning slot', async () => {
    installFindRouter({ conflict: true, conflictInstructor: 44 })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?schedule_days=monday&schedule_time_start=09:00&schedule_time_end=13:00'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.unavailableInstructorIds).toEqual([44])
  })

  it('returns instructor area blockers through the availability endpoint', async () => {
    installFindRouter({ staffQualifiedAreas: [8] })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?instructor=44'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers).toEqual([
      expect.objectContaining({
        type: 'instructor_area_mismatch',
        severity: 'blocker',
      }),
    ])
  })

  it('returns a clear blocker when the selected instructor does not exist in the tenant', async () => {
    installFindRouter({ missingStaff: true })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?instructor=44'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers).toEqual([
      expect.objectContaining({
        type: 'instructor_not_found',
        severity: 'blocker',
        message: expect.stringMatching(/no existe|tenant/i),
      }),
    ])
  })

  it('returns a clear blocker when the selected instructor is inactive', async () => {
    installFindRouter({ inactiveStaff: true, staffQualifiedAreas: [7] })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?instructor=44'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers).toEqual([
      expect.objectContaining({
        type: 'instructor_inactive',
        severity: 'blocker',
        message: expect.stringMatching(/no está activo/i),
      }),
    ])
  })

  it('ignores blank availability query params instead of treating them as selected values', async () => {
    installFindRouter({ staffQualifiedAreas: [7] })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?campus=&classroom=&instructor=&schedule_time_start=&schedule_time_end='), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability).toEqual(expect.objectContaining({
      blockers: expect.any(Array),
      warnings: expect.any(Array),
    }))
  })

  it('returns co-instructor area blockers through the availability endpoint', async () => {
    installFindRouter({ staffQualifiedAreas: [8], currentOverrides: { instructor: null } })
    const response = await GET_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/84/availability?instructors=44'), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers).toEqual([
      expect.objectContaining({
        type: 'instructor_area_mismatch',
        severity: 'blocker',
      }),
    ])
  })

  it('validates a new course run candidate before creation', async () => {
    installFindRouter({ conflict: true, staffQualifiedAreas: [7], conflictInstructor: 44 })
    const response = await GET_NEW_AVAILABILITY(new NextRequest('http://localhost/api/course-runs/availability?course=187&campus=1&classroom=10&instructor=44&start_date=2026-09-01&end_date=2026-11-17&schedule_days=monday&schedule_time_start=09:00&schedule_time_end=13:00&shift=morning'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.availability.blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'classroom_overlap' }),
      expect.objectContaining({ type: 'instructor_overlap' }),
    ]))
    expect(data.availability.unavailableInstructorIds).toEqual([44])
  })

  it('generates concrete sessions from a configured convocatoria without duplicating existing sessions', async () => {
    const response = await GENERATE_SESSIONS(new NextRequest('http://localhost/api/course-runs/84/generate-sessions', {
      method: 'POST',
    }), params())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.created).toBeGreaterThan(0)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-run-sessions',
      data: expect.objectContaining({
        course_run: 84,
        weekday: 'monday',
        time_start: '09:00:00',
        time_end: '13:00:00',
        tenant: tenantId,
      }),
      overrideAccess: true,
    }))
  })

  it('rejects inactive instructor assignment', async () => {
    payloadMock.find.mockImplementation(async ({ collection, where }: any) => {
      if (collection === 'course-runs') return { docs: [currentRun] }
      if (collection === 'staff') return { docs: [{ id: 44, tenant: tenantId, full_name: 'Docente Baja', is_active: false, employment_status: 'inactive' }] }
      return { docs: [] }
    })

    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ instructor: 44 }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/no está activo/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects active instructor assignment when qualified areas do not match the course area', async () => {
    installFindRouter({ staffQualifiedAreas: [8] })

    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ instructor: 44 }),
    }), params())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/no está habilitado/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('allows instructor assignment when qualified areas match the course area', async () => {
    installFindRouter({ staffQualifiedAreas: [7, 8] })

    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ instructor: 44 }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ instructor: 44 }),
    }))
  })

  it('allows co-instructor assignment when qualified areas match the course area', async () => {
    installFindRouter({ staffQualifiedAreas: [7, 8] })

    const response = await PATCH(new NextRequest('http://localhost/api/course-runs/84', {
      method: 'PATCH',
      body: JSON.stringify({ instructors: [44] }),
    }), params())

    expect(response.status).toBe(200)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ instructors: [44] }),
    }))
  })
})
