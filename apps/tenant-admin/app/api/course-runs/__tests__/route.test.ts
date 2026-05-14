import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from '../[id]/route'

const { payloadMock, authMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
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
}

function params(id = '84') {
  return { params: Promise.resolve({ id }) }
}

function installFindRouter(options?: { noCurrent?: boolean; conflict?: boolean; missingCampus?: boolean; missingClassroom?: boolean; foreignClassroomCampus?: boolean }) {
  payloadMock.find.mockImplementation(async ({ collection, where }: any) => {
    if (collection === 'course-runs' && where?.and) {
      const idCondition = where.and.find((item: any) => item?.id?.equals === '84')
      const classroomCondition = where.and.find((item: any) => item?.classroom?.equals === 10 || item?.classroom?.equals === '10')
      if (idCondition && !classroomCondition) {
        return { docs: options?.noCurrent ? [] : [currentRun] }
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
    return { docs: [] }
  })
}

describe('/api/course-runs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId: 31, tenantId })
    payloadMock.update.mockResolvedValue({ ...currentRun, campus: { id: 1, name: 'Sede Norte' } })
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
})
