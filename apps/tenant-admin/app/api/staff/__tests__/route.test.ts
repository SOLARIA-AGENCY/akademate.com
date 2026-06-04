import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, sqlMock } = vi.hoisted(() => ({
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

async function loadRoute() {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  vi.resetModules()
  return import('../route')
}

describe('/api/staff qualified areas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    const response = await GET(new NextRequest('http://localhost/api/staff?type=profesor&status=active&qualifiedArea=7'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].qualifiedAreas).toEqual([{ id: 7, codigo: 'SAN', nombre: 'Sanitaria y Clínica' }])
    expect(sqlMock.unsafe).toHaveBeenCalledWith(
      expect.stringContaining("sr3.path = 'qualified_areas'"),
      expect.arrayContaining(['active', '7']),
    )
  })

  it('rejects invalid qualified area filters', async () => {
    const { GET } = await loadRoute()

    const response = await GET(new NextRequest('http://localhost/api/staff?type=profesor&qualifiedArea=abc'))
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
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'staff',
      id: 44,
      data: expect.objectContaining({
        qualified_areas: [7, 9],
      }),
    }))
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
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'staff',
      data: expect.objectContaining({
        qualified_areas: [7, 9],
      }),
    }))
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
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        staff_type: 'administrativo',
        qualified_areas: [],
      }),
    }))
  })
})
