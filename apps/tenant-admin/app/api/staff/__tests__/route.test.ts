import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { authMock, payloadMock, sqlMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  sqlMock: Object.assign(vi.fn(), {
    unsafe: vi.fn(),
  }),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('postgres', () => ({
  default: vi.fn(() => sqlMock),
}))

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: authMock,
}))

async function loadRoute() {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  vi.resetModules()
  return import('../route')
}

describe('/api/staff qualified areas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue(null)
    sqlMock.unsafe.mockResolvedValue([])
    payloadMock.findByID.mockResolvedValue({
      id: 44,
      staff_type: 'profesor',
      employment_status: 'active',
      contract_type: 'full_time',
      qualified_areas: [7],
    })
    payloadMock.update.mockResolvedValue({
      id: 44,
      full_name: 'Docente Test',
    })
    payloadMock.create.mockImplementation(async ({ collection, data }: any) => {
      if (collection === 'staff') {
        return { id: 44, full_name: 'Docente Test', ...data }
      }
      return { id: 1, ...data }
    })
  })

  it('filters active teachers by qualified area when requested', async () => {
    const { GET } = await loadRoute()
    sqlMock.unsafe.mockResolvedValue([
      {
        id: 44,
        staff_type: 'profesor',
        first_name: 'Docente',
        last_name: 'Sanidad',
        full_name: 'Docente Sanidad',
        nif: null,
        email: 'docente@example.com',
        phone: null,
        position: 'Docente',
        contract_type: 'freelance',
        employment_status: 'active',
        inactive_reason: null,
        inactive_at: null,
        reactivated_at: null,
        hire_date: null,
        bio: null,
        data_quality_status: 'complete',
        import_review_status: 'validated',
        last_import_batch: null,
        source: null,
        alias_names: null,
        detected_courses: null,
        is_active: true,
        created_at: '2026-06-01T00:00:00.000Z',
        updated_at: '2026-06-01T00:00:00.000Z',
        photo_id: null,
        photo_filename: null,
        photo_url: null,
        campuses: [],
        course_runs: [],
        certifications: [],
        qualified_areas: [{ id: 7, codigo: 'SAN', nombre: 'Sanitaria y Clínica' }],
      },
    ])

    const response = await GET(
      new NextRequest('http://localhost/api/staff?type=profesor&status=active&qualifiedArea=7')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].qualifiedAreas).toEqual([
      { id: 7, codigo: 'SAN', nombre: 'Sanitaria y Clínica' },
    ])
    expect(sqlMock.unsafe).toHaveBeenCalledWith(
      expect.stringContaining("sr3.path = 'qualified_areas'"),
      expect.arrayContaining(['active', '7'])
    )
  })

  it('rejects invalid qualified area filters', async () => {
    const { GET } = await loadRoute()

    const response = await GET(
      new NextRequest('http://localhost/api/staff?type=profesor&qualifiedArea=abc')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/área habilitada/i)
    expect(sqlMock.unsafe).not.toHaveBeenCalled()
  })

  it('persists qualifiedAreas when updating staff', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        firstName: 'Docente',
        lastName: 'Test',
        position: 'Sanidad',
        qualifiedAreas: ['7', 9],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        id: 44,
        data: expect.objectContaining({
          qualified_areas: [7, 9],
        }),
      })
    )
  })

  it('persists qualifiedAreas when creating staff', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Test',
        email: 'docente@example.com',
        position: 'Sanidad',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: ['7', 9],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          qualified_areas: [7, 9],
        }),
      })
    )
  })

  it('creates staff with separate surnames and preserves base campus inside assigned campuses', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'ELENA',
        firstSurname: 'MICELLO',
        secondSurname: 'ROSSI',
        email: 'elena@example.com',
        nif: ' y0079474t ',
        phone: '620442974',
        address: 'Calle Principal 12',
        city: 'SANTA CRUZ DE TENERIFE',
        postalCode: '38001',
        position: 'DOCENTE VETERINARIA',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        baseCampusId: 2,
        qualifiedAreas: [7],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          first_name: 'Elena',
          first_surname: 'Micello',
          second_surname: 'Rossi',
          last_name: 'Micello Rossi',
          nif: 'Y0079474T',
          phone: '+34 620 442 974',
          city: 'Santa Cruz de Tenerife',
          postal_code: '38001',
          assigned_campuses: [1, 2],
          base_campus: 2,
        }),
      })
    )
  })

  it('adds a changed base campus without removing existing assigned campuses', async () => {
    payloadMock.findByID.mockResolvedValueOnce({
      id: 44,
      staff_type: 'profesor',
      employment_status: 'active',
      contract_type: 'full_time',
      qualified_areas: [7],
      assigned_campuses: [{ id: 1 }],
      base_campus: { id: 1 },
    })
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        baseCampusId: 2,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        id: 44,
        data: expect.objectContaining({
          assigned_campuses: [1, 2],
          base_campus: 2,
        }),
      })
    )
  })

  it('records the authenticated user in the staff status event when creating staff', async () => {
    authMock.mockResolvedValue({ userId: 9, tenantId: 1 })
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Auditado',
        email: 'auditado@example.com',
        position: 'Docente',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [7],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff-status-events',
        data: expect.objectContaining({
          staff: 44,
          previous_status: 'created',
          new_status: 'active',
          changed_by: 9,
        }),
      })
    )
  })

  it('normalizes staff nominative fields when creating staff', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'NURIA ESTHER',
        lastName: 'ÁNGEL RAMOS',
        email: 'docente@example.com',
        position: 'DOCENTE DE INGLÉS Y FRANCÉS',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [7],
        certifications: [
          {
            title: 'TÉCNICO SUPERIOR EN HIGIENE BUCODENTAL',
            institution: 'CEP FORMACION',
            year: 2026,
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          first_name: 'Nuria Esther',
          last_name: 'Ángel Ramos',
          position: 'Docente de Inglés y Francés',
          certifications: [
            expect.objectContaining({
              title: 'Técnico Superior en Higiene Bucodental',
              institution: 'CEP Formacion',
            }),
          ],
        }),
      })
    )
  })

  it('normalizes staff nominative fields when updating staff', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        firstName: 'DANIEL',
        lastName: 'ZAMBRANA ACEDO',
        position: 'DOCENTE DE ODONTOLOGÍA',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          first_name: 'Daniel',
          last_name: 'Zambrana Acedo',
          position: 'Docente de Odontología',
        }),
      })
    )
  })

  it('normalizes fixed Spanish phone numbers when creating staff', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Telefono',
        email: 'docente@example.com',
        phone: '922219257',
        position: 'Docente',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [7],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          phone: '+34 922 219 257',
        }),
      })
    )
  })

  it('normalizes email and DNI/NIF when creating staff', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'administrativo',
        firstName: 'Admin',
        lastName: 'Contacto',
        email: '  ADMIN.CONTACTO@EXAMPLE.COM  ',
        nif: ' 12345678 z ',
        position: 'Administración',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          email: 'admin.contacto@example.com',
          nif: '12345678Z',
        }),
      })
    )
  })

  it('normalizes and clears email and DNI/NIF when updating staff', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        email: '  DOCENTE.TEST@EXAMPLE.COM  ',
        nif: '',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          email: 'docente.test@example.com',
          nif: null,
        }),
      })
    )
  })

  it('rejects invalid staff email before calling Payload', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        email: 'correo-invalido',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/email válido/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects invalid DNI/NIF before calling Payload', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        nif: '??',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/dni|nif|nie/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('normalizes mobile Spanish phone numbers when updating staff', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        phone: '+34 677 615 684',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'staff',
        data: expect.objectContaining({
          phone: '+34 677 615 684',
        }),
      })
    )
  })

  it('rejects invalid Spanish phone numbers with a clear message', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        phone: '555555555',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/teléfono fijo o móvil español válido/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('rejects creating a teacher without qualified areas', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Sin Areas',
        email: 'docente@example.com',
        position: 'Sanidad',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/área habilitada/i)
    expect(payloadMock.create).not.toHaveBeenCalled()
  })

  it('rejects removing all qualified areas from an existing teacher', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/área habilitada/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('allows administrative staff without teaching areas', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'administrativo',
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@example.com',
        position: 'Administración',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          staff_type: 'administrativo',
          qualified_areas: [],
        }),
      })
    )
  })
})
