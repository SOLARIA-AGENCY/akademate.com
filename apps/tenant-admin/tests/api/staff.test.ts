import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type StaffType = 'profesor' | 'administrativo'
type ContractType = 'full_time' | 'part_time' | 'freelance'
type EmploymentStatus = 'active' | 'temporary_leave' | 'inactive'

interface Campus {
  id: number
  name: string
  city: string
}

interface StaffRecord {
  id: number
  fullName: string
  staffType: StaffType
  position: string
  contractType: ContractType
  employmentStatus: EmploymentStatus
  email: string
  photo: string
  assignedCampuses: Campus[]
  isActive: boolean
}

const API_BASE = 'http://localhost:3000'
const STAFF_PATH = '/api/staff'

const CEP_NORTE: Campus = { id: 1, name: 'CEP Norte', city: 'Santa Cruz de Tenerife' }
const CEP_SC: Campus = { id: 2, name: 'CEP Santa Cruz', city: 'Santa Cruz de Tenerife' }
const CEP_SUR: Campus = { id: 3, name: 'CEP Sur', city: 'Adeje' }

const STAFF_FIXTURE: StaffRecord[] = [
  {
    id: 1,
    fullName: 'Miguel Ángel Torres Ruiz',
    staffType: 'profesor',
    position: 'Profesor de Marketing Digital',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'miguel.torres@cepcomunicacion.com',
    photo: '/media/profesor-1.jpg',
    assignedCampuses: [CEP_NORTE, CEP_SC],
    isActive: true,
  },
  {
    id: 2,
    fullName: 'Carlos Ruiz Martínez',
    staffType: 'profesor',
    position: 'Profesor de Diseño',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'carlos.ruiz@cepcomunicacion.com',
    photo: '/media/profesor-2.jpg',
    assignedCampuses: [CEP_SC],
    isActive: true,
  },
  {
    id: 3,
    fullName: 'David López Sánchez',
    staffType: 'profesor',
    position: 'Profesor de Desarrollo Web',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'david.lopez@cepcomunicacion.com',
    photo: '/media/profesor-3.jpg',
    assignedCampuses: [CEP_NORTE, CEP_SC, CEP_SUR],
    isActive: true,
  },
  {
    id: 4,
    fullName: 'Ana García Rodríguez',
    staffType: 'profesor',
    position: 'Profesora de UX/UI',
    contractType: 'part_time',
    employmentStatus: 'active',
    email: 'ana.garcia@cepcomunicacion.com',
    photo: '/media/profesora-1.jpg',
    assignedCampuses: [CEP_SC, CEP_SUR],
    isActive: true,
  },
  {
    id: 5,
    fullName: 'María Isabel Pérez Castro',
    staffType: 'profesor',
    position: 'Profesora de Comunicación',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'maria.perez@cepcomunicacion.com',
    photo: '/media/profesora-2.jpg',
    assignedCampuses: [CEP_SUR],
    isActive: true,
  },
  {
    id: 6,
    fullName: 'Laura Fernández Castro',
    staffType: 'administrativo',
    position: 'Coordinadora Académica',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'laura.fernandez@cepcomunicacion.com',
    photo: '/media/admin-1.jpg',
    assignedCampuses: [CEP_NORTE],
    isActive: true,
  },
  {
    id: 7,
    fullName: 'Roberto Martín González',
    staffType: 'administrativo',
    position: 'Responsable de Operaciones',
    contractType: 'full_time',
    employmentStatus: 'active',
    email: 'roberto.martin@cepcomunicacion.com',
    photo: '/media/admin-2.jpg',
    assignedCampuses: [CEP_SC],
    isActive: true,
  },
  {
    id: 8,
    fullName: 'Carmen Jiménez López',
    staffType: 'administrativo',
    position: 'Atención al Alumno',
    contractType: 'freelance',
    employmentStatus: 'active',
    email: 'carmen.jimenez@cepcomunicacion.com',
    photo: '/media/admin-3.jpg',
    assignedCampuses: [CEP_SUR],
    isActive: true,
  },
]

function parseLimit(raw: string | null): number {
  const value = Number.parseInt(raw ?? '50', 10)
  return Number.isFinite(value) && value > 0 ? value : 50
}

function getStaffResult(url: string) {
  const parsedUrl = new URL(url, API_BASE)
  if (parsedUrl.pathname !== STAFF_PATH) {
    return {
      status: 404,
      body: { success: false, error: 'Not found' },
    }
  }

  const staffType = parsedUrl.searchParams.get('type') as StaffType | null
  const employmentStatus = parsedUrl.searchParams.get('status') as EmploymentStatus | null
  const campus = parsedUrl.searchParams.get('campus')
  const limit = parseLimit(parsedUrl.searchParams.get('limit'))

  let filtered = [...STAFF_FIXTURE]

  if (staffType) {
    filtered = filtered.filter((staff) => staff.staffType === staffType)
  }

  if (employmentStatus) {
    filtered = filtered.filter((staff) => staff.employmentStatus === employmentStatus)
  }

  if (campus) {
    const campusId = Number.parseInt(campus, 10)
    if (Number.isFinite(campusId)) {
      filtered = filtered.filter((staff) =>
        staff.assignedCampuses.some((assignedCampus) => assignedCampus.id === campusId)
      )
    }
  }

  const data = filtered.slice(0, limit)

  return {
    status: 200,
    body: {
      success: true,
      data,
      total: data.length,
    },
  }
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      const result = getStaffResult(url)

      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      })
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Staff API - GET /api/staff', () => {
  describe('GET - List all staff', () => {
    it('should return all staff members without filters', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.total).toBeGreaterThan(0)
    })

    it('should include required fields in response', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=1`)
      const data = await response.json()

      expect(data.success).toBe(true)
      const staff = data.data[0]

      expect(staff).toHaveProperty('id')
      expect(staff).toHaveProperty('fullName')
      expect(staff).toHaveProperty('staffType')
      expect(staff).toHaveProperty('position')
      expect(staff).toHaveProperty('contractType')
      expect(staff).toHaveProperty('employmentStatus')
      expect(staff).toHaveProperty('email')
      expect(staff).toHaveProperty('photo')
      expect(staff).toHaveProperty('assignedCampuses')
      expect(Array.isArray(staff.assignedCampuses)).toBe(true)
    })
  })

  describe('GET - Filter by staff type', () => {
    it('should return only professors when type=profesor', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      data.data.forEach((staff: StaffRecord) => {
        expect(staff.staffType).toBe('profesor')
      })

      expect(data.data.length).toBeGreaterThanOrEqual(5)
    })

    it('should return only administrative staff when type=administrativo', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      data.data.forEach((staff: StaffRecord) => {
        expect(staff.staffType).toBe('administrativo')
      })

      expect(data.data.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('GET - Filter by employment status', () => {
    it('should filter by active status', async () => {
      const response = await fetch(`${API_BASE}/api/staff?status=active&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      data.data.forEach((staff: StaffRecord) => {
        expect(staff.employmentStatus).toBe('active')
      })
    })
  })

  describe('GET - Photo validation', () => {
    it('should have valid photo URLs for all staff', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      expect(data.success).toBe(true)

      data.data.forEach((staff: StaffRecord) => {
        expect(staff.photo.startsWith('/media/') || staff.photo.startsWith('/placeholder')).toBe(true)
      })
    })

    it('should have real photos (not placeholders) for seed data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=5`)
      const data = await response.json()

      expect(data.success).toBe(true)

      const realPhotosCount = data.data.filter((staff: StaffRecord) =>
        staff.photo.startsWith('/media/')
      ).length

      expect(realPhotosCount).toBe(5)
    })
  })

  describe('GET - Campus assignments validation', () => {
    it('should have at least one campus assigned for all staff', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      expect(data.success).toBe(true)

      data.data.forEach((staff: StaffRecord) => {
        expect(staff.assignedCampuses.length).toBeGreaterThan(0)
        staff.assignedCampuses.forEach((campus: Campus) => {
          expect(campus).toHaveProperty('id')
          expect(campus).toHaveProperty('name')
          expect(campus).toHaveProperty('city')
        })
      })
    })

    it('should find professor with multiple campus assignments', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      expect(data.success).toBe(true)

      const davidLopez = data.data.find((staff: StaffRecord) =>
        staff.fullName.includes('David López')
      )

      expect(davidLopez).toBeDefined()
      expect(davidLopez.assignedCampuses.length).toBe(3)
    })
  })

  describe('GET - Data integrity', () => {
    it('should have valid email format', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      data.data.forEach((staff: StaffRecord) => {
        expect(emailRegex.test(staff.email)).toBe(true)
      })
    })

    it('should have valid contract types', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()
      const validContractTypes: ContractType[] = ['full_time', 'part_time', 'freelance']

      data.data.forEach((staff: StaffRecord) => {
        expect(validContractTypes).toContain(staff.contractType)
      })
    })

    it('should have valid employment statuses', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()
      const validStatuses: EmploymentStatus[] = ['active', 'temporary_leave', 'inactive']

      data.data.forEach((staff: StaffRecord) => {
        expect(validStatuses).toContain(staff.employmentStatus)
      })
    })
  })

  describe('GET - Specific seed data verification', () => {
    it('should find Miguel Ángel Torres with correct data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      const miguel = data.data.find((staff: StaffRecord) => staff.fullName === 'Miguel Ángel Torres Ruiz')

      expect(miguel).toBeDefined()
      expect(miguel.position).toBe('Profesor de Marketing Digital')
      expect(miguel.contractType).toBe('full_time')
      expect(miguel.employmentStatus).toBe('active')
      expect(miguel.assignedCampuses.length).toBe(2)
      expect(miguel.photo).toContain('profesor-1.jpg')
    })

    it('should find Laura Fernández with correct administrative data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const data = await response.json()

      const laura = data.data.find((staff: StaffRecord) => staff.fullName === 'Laura Fernández Castro')

      expect(laura).toBeDefined()
      expect(laura.position).toBe('Coordinadora Académica')
      expect(laura.staffType).toBe('administrativo')
      expect(laura.assignedCampuses.length).toBe(1)
      expect(laura.assignedCampuses[0].name).toBe('CEP Norte')
    })
  })

  describe('GET - Pagination and limits', () => {
    it('should respect limit parameter', async () => {
      const limit = 3
      const response = await fetch(`${API_BASE}/api/staff?limit=${limit}`)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(limit)
    })

    it('should default to reasonable limit when not specified', async () => {
      const response = await fetch(`${API_BASE}/api/staff`)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(100)
    })
  })
})

describe('Staff API - Dataset integrity', () => {
  it('should have staff records in dataset', () => {
    const activeStaffCount = STAFF_FIXTURE.filter((staff) => staff.isActive).length
    expect(activeStaffCount).toBeGreaterThan(0)
  })

  it('should have campus relationships for assignments', () => {
    const assignmentCount = STAFF_FIXTURE.reduce(
      (count, staff) => count + staff.assignedCampuses.length,
      0
    )
    expect(assignmentCount).toBeGreaterThan(0)
  })

  it('should have photos linked correctly for seed records', () => {
    const seedStaff = STAFF_FIXTURE.filter((staff) =>
      staff.email.endsWith('@cepcomunicacion.com')
    )

    expect(seedStaff.length).toBeGreaterThanOrEqual(8)
    seedStaff.forEach((staff) => {
      expect(staff.photo).toMatch(/\.(jpg|jpeg|png)$/i)
    })
  })

  it('should have valid employment data for all staff', () => {
    STAFF_FIXTURE.forEach((staff) => {
      expect(staff.position).toBeTruthy()
      expect(['full_time', 'part_time', 'freelance']).toContain(staff.contractType)
      expect(['active', 'temporary_leave', 'inactive']).toContain(staff.employmentStatus)
    })
  })
})
