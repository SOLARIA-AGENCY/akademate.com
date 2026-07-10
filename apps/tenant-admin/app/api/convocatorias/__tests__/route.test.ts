import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, jwtVerifyMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    auth: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  jwtVerifyMock: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('jose', () => ({ jwtVerify: jwtVerifyMock }))

async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

describe('/api/convocatorias instructor assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jwtVerifyMock.mockRejectedValue(new Error('invalid test token'))
    payloadMock.auth.mockResolvedValue({ user: { id: 11, role: 'admin', tenant: 1 } })
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

  it('tries Payload JWT extraction when the request only provides the session cookie', async () => {
    payloadMock.auth.mockImplementation(async ({ headers }: { headers: Headers }) => {
      return headers.get('authorization') === 'JWT session-token'
        ? { user: { id: 11, role: 'admin', tenant: 1 } }
        : { user: null }
    })
    payloadMock.find.mockResolvedValue({ docs: [], totalDocs: 0 })

    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/convocatorias', {
      headers: { cookie: 'payload-token=session-token' },
    }))

    expect(response.status).toBe(200)
    expect(payloadMock.auth).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      headers: expect.any(Headers),
    }))
    expect(payloadMock.auth.mock.calls.some(([args]) => args.headers.get('authorization') === 'JWT session-token')).toBe(true)
  })

  it('loads the user after verifying the token when Payload user access blocks auth lookup', async () => {
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-secret'
    payloadMock.auth.mockResolvedValue({ user: null })
    jwtVerifyMock.mockResolvedValue({ payload: { collection: 'users', id: 11 } })
    payloadMock.find.mockResolvedValue({ docs: [], totalDocs: 0 })

    try {
      const { GET } = await loadRoute()
      const response = await GET(new NextRequest('http://localhost/api/convocatorias', {
        headers: { cookie: 'payload-token=signed-token' },
      }))

      expect(response.status).toBe(200)
      expect(payloadMock.findByID).toHaveBeenCalledWith(expect.objectContaining({
        collection: 'users',
        id: 11,
        overrideAccess: true,
      }))
    } finally {
      if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
      else process.env.PAYLOAD_SECRET = previousSecret
    }
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

  it('creates a convocatoria with editable planning metadata and financial fields', async () => {
    payloadMock.findByID.mockResolvedValue({
      id: 301,
      name: 'Auxiliar de Odontología e Higiene',
    })
    payloadMock.create.mockResolvedValue({ id: 909 })

    const { POST } = await loadRoute()
    const response = await POST(new NextRequest('http://localhost/api/convocatorias', {
      method: 'POST',
      body: JSON.stringify({
        courseId: '301',
        fechaInicio: '2026-11-25',
        fechaFin: '2027-06-02',
        horario: [{ day: 'wednesday', startTime: '10:00:00', endTime: '14:00:00' }],
        estado: 'enrollment_open',
        plazasTotales: 22,
        precio: 990,
        matricula: 150,
        profesorId: '248',
        profesorIds: ['248', '222'],
        sedeId: '2',
        aulaId: '8',
        trainingType: 'private',
        horasPracticas: '200h',
        certificacion: 'CEP',
      }),
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      data: expect.objectContaining({
        course: 301,
        campus: 2,
        classroom: 8,
        instructor: 248,
        instructors: [248, 222],
        status: 'enrollment_open',
        planning_status: 'published',
        price_override: 990,
        price_snapshot: 990,
        enrollment_fee_snapshot: 150,
        max_students: 22,
        practice_hours: '200h',
        certification_type: 'CEP',
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

  it('keeps cycle convocations when the course relation is null', async () => {
    payloadMock.find.mockImplementation(async ({ collection }: any) => {
      if (collection === 'course-runs') {
        return {
          docs: [{
            id: 1,
            codigo: 'SC-2026-001',
            course: null,
            campus: { id: 1, name: 'Sede Santa Cruz' },
            classroom: null,
            start_date: '2026-09-21T00:00:00.000Z',
            end_date: '2028-06-30T00:00:00.000Z',
            schedule_days: ['monday'],
            schedule_time_start: '17:00',
            schedule_time_end: '21:00',
            status: 'enrollment_open',
            enrollment_status: 'open',
            planning_status: 'published',
            training_type: 'cycle',
            shift: 'afternoon',
            max_students: 18,
            current_enrollments: 0,
            notes: null,
            instructors: [],
            instructor: null,
          }],
          totalDocs: 1,
        }
      }
      return { docs: [], totalDocs: 0 }
    })

    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/convocatorias'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data[0]).toMatchObject({
      codigo: 'SC-2026-001',
      cursoNombre: 'Curso',
      campusNombre: 'Sede Santa Cruz',
      aulaNombre: 'Sin aula',
    })
  })
})
