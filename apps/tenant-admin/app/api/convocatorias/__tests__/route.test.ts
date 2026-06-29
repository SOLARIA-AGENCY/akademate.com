import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))

async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

describe('/api/convocatorias instructor assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMock.findByID.mockImplementation(async ({ collection }: any) => {
      if (collection === 'course-runs') {
        return {
          id: 84,
          course: { id: 187, area_formativa: 7 },
          instructors: [],
        }
      }
      if (collection === 'staff') {
        return {
          id: 44,
          full_name: 'Docente Test',
          is_active: true,
          employment_status: 'active',
          qualified_areas: [7],
        }
      }
      return { id: 1 }
    })
    payloadMock.update.mockResolvedValue({ id: 84 })
  })

  it('rejects assigning a teacher without enabled areas through the legacy endpoint', async () => {
    payloadMock.findByID.mockImplementation(async ({ collection }: any) => {
      if (collection === 'course-runs') {
        return {
          id: 84,
          course: { id: 187, area_formativa: 7 },
          instructors: [],
        }
      }
      if (collection === 'staff') {
        return {
          id: 44,
          full_name: 'Docente Sin Area',
          is_active: true,
          employment_status: 'active',
          qualified_areas: [],
        }
      }
      return { id: 1 }
    })

    const { PATCH } = await loadRoute()
    const response = await PATCH(new NextRequest('http://localhost/api/convocatorias', {
      method: 'PATCH',
      body: JSON.stringify({ convocatoriaId: 84, profesorId: 44 }),
    }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/áreas habilitadas/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects assigning a teacher from another training area through the legacy endpoint', async () => {
    payloadMock.findByID.mockImplementation(async ({ collection }: any) => {
      if (collection === 'course-runs') {
        return {
          id: 84,
          course: { id: 187, area_formativa: 7 },
          instructors: [],
        }
      }
      if (collection === 'staff') {
        return {
          id: 44,
          full_name: 'Docente Otra Area',
          is_active: true,
          employment_status: 'active',
          qualified_areas: [9],
        }
      }
      return { id: 1 }
    })

    const { PATCH } = await loadRoute()
    const response = await PATCH(new NextRequest('http://localhost/api/convocatorias', {
      method: 'PATCH',
      body: JSON.stringify({ convocatoriaId: 84, profesorId: 44 }),
    }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/no está habilitado/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('allows assigning an active teacher enabled for the course area through the legacy endpoint', async () => {
    const { PATCH } = await loadRoute()
    const response = await PATCH(new NextRequest('http://localhost/api/convocatorias', {
      method: 'PATCH',
      body: JSON.stringify({ convocatoriaId: 84, profesorId: 44 }),
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      id: 84,
      data: expect.objectContaining({
        instructor: 44,
        instructors: [44],
      }),
    }))
  })

  it('returns Excel planning metadata from course and start date when notes are empty', async () => {
    payloadMock.find.mockImplementation(async ({ collection }: any) => {
      if (collection === 'course-runs') {
        return {
          docs: [{
            id: 909,
            codigo: 'SC-2026-009',
            course: {
              id: 301,
              name: 'Auxiliar de Odontología e Higiene',
              course_type: 'privado',
            },
            campus: { id: 2, name: 'Sede Santa Cruz' },
            classroom: { id: 8, name: 'Sillones / Área común', capacity: 22 },
            start_date: '2026-11-25T00:00:00.000Z',
            end_date: '2027-06-02T00:00:00.000Z',
            schedule_days: ['wednesday'],
            schedule_time_start: '10:00',
            schedule_time_end: '14:00',
            status: 'published',
            enrollment_status: 'enrollment_open',
            planning_status: 'confirmed',
            training_type: 'privado',
            shift: 'morning',
            max_students: 22,
            current_enrollments: 0,
            price_override: null,
            price_snapshot: 990,
            enrollment_fee_snapshot: 150,
            notes: '',
            instructors: [],
            instructor: null,
          }],
          totalDocs: 1,
        }
      }
      if (collection === 'campaigns') {
        return { docs: [], totalDocs: 0 }
      }
      return { docs: [], totalDocs: 0 }
    })

    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/convocatorias'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data[0]).toMatchObject({
      codigo: 'SC-2026-009',
      horasPracticas: '200h',
      certificacion: 'CEP',
    })
  })
})
