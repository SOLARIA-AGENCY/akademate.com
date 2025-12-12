import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import postgres from 'postgres'

/**
 * API Tests for /api/staff endpoint
 *
 * Tests cover:
 * - GET with filters (type, campus, status)
 * - GET response structure validation
 * - Data integrity (photos, campuses, contact info)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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

      // Required fields
      expect(staff).toHaveProperty('id')
      expect(staff).toHaveProperty('fullName')
      expect(staff).toHaveProperty('staffType')
      expect(staff).toHaveProperty('position')
      expect(staff).toHaveProperty('contractType')
      expect(staff).toHaveProperty('employmentStatus')
      expect(staff).toHaveProperty('email')
      expect(staff).toHaveProperty('photo')
      expect(staff).toHaveProperty('assignedCampuses')

      // assignedCampuses should be an array
      expect(Array.isArray(staff.assignedCampuses)).toBe(true)
    })
  })

  describe('GET - Filter by staff type', () => {
    it('should return only professors when type=profesor', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // All returned staff should be professors
      data.data.forEach((staff: any) => {
        expect(staff.staffType).toBe('profesor')
      })

      // Should have at least 5 professors from seed data
      expect(data.data.length).toBeGreaterThanOrEqual(5)
    })

    it('should return only administrative staff when type=administrativo', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // All returned staff should be administrative
      data.data.forEach((staff: any) => {
        expect(staff.staffType).toBe('administrativo')
      })

      // Should have at least 3 administrative staff from seed data
      expect(data.data.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('GET - Filter by employment status', () => {
    it('should filter by active status', async () => {
      const response = await fetch(`${API_BASE}/api/staff?status=active&limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // All returned staff should be active
      data.data.forEach((staff: any) => {
        expect(staff.employmentStatus).toBe('active')
      })
    })
  })

  describe('GET - Photo validation', () => {
    it('should have valid photo URLs for all staff', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      expect(data.success).toBe(true)

      data.data.forEach((staff: any) => {
        // Photo should either be a local media path or placeholder
        expect(
          staff.photo.startsWith('/media/') ||
          staff.photo.startsWith('/placeholder')
        ).toBe(true)
      })
    })

    it('should have real photos (not placeholders) for seed data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=5`)
      const data = await response.json()

      expect(data.success).toBe(true)

      // All 5 seeded professors should have real photos
      const realPhotosCount = data.data.filter((staff: any) =>
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

      data.data.forEach((staff: any) => {
        expect(staff.assignedCampuses.length).toBeGreaterThan(0)

        // Each campus should have id, name, and city
        staff.assignedCampuses.forEach((campus: any) => {
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

      // David López should have 3 campuses assigned
      const davidLopez = data.data.find((staff: any) =>
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

      data.data.forEach((staff: any) => {
        expect(emailRegex.test(staff.email)).toBe(true)
      })
    })

    it('should have valid contract types', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const validContractTypes = ['full_time', 'part_time', 'freelance']

      data.data.forEach((staff: any) => {
        expect(validContractTypes).toContain(staff.contractType)
      })
    })

    it('should have valid employment statuses', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const validStatuses = ['active', 'temporary_leave', 'inactive']

      data.data.forEach((staff: any) => {
        expect(validStatuses).toContain(staff.employmentStatus)
      })
    })
  })

  describe('GET - Specific seed data verification', () => {
    it('should find Miguel Ángel Torres with correct data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      const miguel = data.data.find((staff: any) =>
        staff.fullName === 'Miguel Ángel Torres Ruiz'
      )

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

      const laura = data.data.find((staff: any) =>
        staff.fullName === 'Laura Fernández Castro'
      )

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
      // Should not return an unreasonable number
      expect(data.data.length).toBeLessThanOrEqual(100)
    })
  })
})

describe('Staff API - Database queries', () => {
  let sql: ReturnType<typeof postgres>

  beforeAll(() => {
    sql = postgres(
      process.env.DATABASE_URI ||
      'postgres://cepcomunicacion:wGWxjMYsUWSBvlqw2K9KU2BKUI=@localhost:5432/cepcomunicacion'
    )
  })

  afterAll(async () => {
    await sql.end()
  })

  it('should have staff records in database', async () => {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM staff
      WHERE is_active = true
    `

    expect(parseInt(result[0].count)).toBeGreaterThan(0)
  })

  it('should have staff_rels for campus assignments', async () => {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM staff_rels
      WHERE path = 'assigned_campuses'
    `

    expect(parseInt(result[0].count)).toBeGreaterThan(0)
  })

  it('should have photos linked correctly', async () => {
    const result = await sql`
      SELECT
        s.full_name,
        m.filename
      FROM staff s
      LEFT JOIN media m ON s.photo_id = m.id
      WHERE s.email LIKE '%@cepcomunicacion.com'
      AND s.photo_id IS NOT NULL
    `

    expect(result.length).toBeGreaterThanOrEqual(8) // 5 professors + 3 admin

    result.forEach(row => {
      expect(row.filename).toMatch(/\.(jpg|jpeg|png)$/i)
    })
  })

  it('should have valid employment data for all staff', async () => {
    const result = await sql`
      SELECT
        full_name,
        position,
        contract_type,
        employment_status,
        hire_date
      FROM staff
      WHERE is_active = true
    `

    result.forEach(row => {
      expect(row.position).toBeTruthy()
      expect(['full_time', 'part_time', 'freelance']).toContain(row.contract_type)
      expect(['active', 'temporary_leave', 'inactive']).toContain(row.employment_status)
      expect(row.hire_date).toBeTruthy()
    })
  })
})
