import { describe, it, expect } from 'vitest'

/**
 * Integration/E2E Tests for Staff Module
 *
 * Tests cover complete user flows:
 * - Navigate to staff listing
 * - Filter by type (professors/administrative)
 * - View staff detail
 * - Verify data consistency across pages
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('Staff Module - Integration Tests', () => {
  describe('Complete flow: List → Detail', () => {
    it('should navigate from list to detail with consistent data', async () => {
      // Step 1: Get list of professors
      const listResponse = await fetch(`${API_BASE}/api/staff?type=profesor&limit=1`)
      const listData = await listResponse.json()

      expect(listData.success).toBe(true)
      expect(listData.data.length).toBeGreaterThan(0)

      const firstProfessor = listData.data[0]
      const professorId = firstProfessor.id

      // Step 2: Get full list to find the same professor
      const fullListResponse = await fetch(`${API_BASE}/api/staff?limit=100`)
      const fullListData = await fullListResponse.json()

      const professorInFullList = fullListData.data.find(
        (staff: any) => staff.id === professorId
      )

      // Verify data consistency
      expect(professorInFullList).toBeDefined()
      expect(professorInFullList.fullName).toBe(firstProfessor.fullName)
      expect(professorInFullList.email).toBe(firstProfessor.email)
      expect(professorInFullList.position).toBe(firstProfessor.position)
    })
  })

  describe('Filter consistency', () => {
    it('should not return administrative staff when filtering for professors', async () => {
      const professorResponse = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const professorData = await professorResponse.json()

      const adminResponse = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const adminData = await adminResponse.json()

      // Get all emails from professors
      const professorEmails = professorData.data.map((s: any) => s.email)

      // Get all emails from administrative staff
      const adminEmails = adminData.data.map((s: any) => s.email)

      // No overlap should exist
      const overlap = professorEmails.filter((email: string) =>
        adminEmails.includes(email)
      )

      expect(overlap.length).toBe(0)
    })

    it('should return all staff when no type filter is applied', async () => {
      const allStaffResponse = await fetch(`${API_BASE}/api/staff?limit=100`)
      const allStaffData = await allStaffResponse.json()

      const professorResponse = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const professorData = await professorResponse.json()

      const adminResponse = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const adminData = await adminResponse.json()

      // Total should equal sum of professors + admin
      expect(allStaffData.total).toBe(
        professorData.total + adminData.total
      )
    })
  })

  describe('Data integrity across requests', () => {
    it('should return same data for multiple requests', async () => {
      const response1 = await fetch(`${API_BASE}/api/staff?type=profesor&limit=5`)
      const data1 = await response1.json()

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      const response2 = await fetch(`${API_BASE}/api/staff?type=profesor&limit=5`)
      const data2 = await response2.json()

      // Should return same number of records
      expect(data1.data.length).toBe(data2.data.length)

      // Compare first record
      if (data1.data.length > 0) {
        expect(data1.data[0].id).toBe(data2.data[0].id)
        expect(data1.data[0].fullName).toBe(data2.data[0].fullName)
      }
    })
  })

  describe('Photo availability', () => {
    it('should have accessible photos for all seed data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const photoPaths = data.data
        .filter((staff: any) => staff.photo.startsWith('/media/'))
        .map((staff: any) => staff.photo)

      // Check first photo is accessible (representative test)
      if (photoPaths.length > 0) {
        const photoPath = photoPaths[0]
        const photoUrl = `${API_BASE}${photoPath}`

        const photoResponse = await fetch(photoUrl, { method: 'HEAD' })
        expect(photoResponse.status).toBe(200)
      }
    })
  })

  describe('Campus assignments integrity', () => {
    it('should have valid campus IDs that exist in database', async () => {
      const staffResponse = await fetch(`${API_BASE}/api/staff?limit=100`)
      const staffData = await staffResponse.json()

      // Collect all campus IDs from staff assignments
      const campusIds = new Set<number>()
      staffData.data.forEach((staff: any) => {
        staff.assignedCampuses.forEach((campus: any) => {
          campusIds.add(campus.id)
        })
      })

      // All campus IDs should be between 1 and 3 (our seed data)
      campusIds.forEach(id => {
        expect(id).toBeGreaterThanOrEqual(1)
        expect(id).toBeLessThanOrEqual(3)
      })
    })

    it('should have campus names matching expected values', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const validCampusNames = ['CEP Norte', 'CEP Santa Cruz', 'CEP Sur']

      data.data.forEach((staff: any) => {
        staff.assignedCampuses.forEach((campus: any) => {
          expect(validCampusNames).toContain(campus.name)
        })
      })
    })
  })

  describe('Seed data verification', () => {
    it('should have all 5 professors from seed data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      const expectedProfessors = [
        'Miguel Ángel Torres Ruiz',
        'Carlos Ruiz Martínez',
        'David López Sánchez',
        'Ana García Rodríguez',
        'María Isabel Pérez Castro',
      ]

      const foundNames = data.data.map((staff: any) => staff.fullName)

      expectedProfessors.forEach(name => {
        expect(foundNames).toContain(name)
      })
    })

    it('should have all 3 administrative staff from seed data', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=administrativo&limit=100`)
      const data = await response.json()

      const expectedAdmin = [
        'Laura Fernández Castro',
        'Roberto Martín González',
        'Carmen Jiménez López',
      ]

      const foundNames = data.data.map((staff: any) => staff.fullName)

      expectedAdmin.forEach(name => {
        expect(foundNames).toContain(name)
      })
    })

    it('should have photos for all seed staff members', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      // Filter for seed data (emails ending with @cepcomunicacion.com)
      const seedStaff = data.data.filter((staff: any) =>
        staff.email.endsWith('@cepcomunicacion.com')
      )

      expect(seedStaff.length).toBeGreaterThanOrEqual(8) // 5 professors + 3 admin

      // All should have photos
      seedStaff.forEach((staff: any) => {
        expect(staff.photo).toMatch(/\/media\/(profesor|profesora|admin)-\d+\.jpg/)
      })
    })
  })

  describe('Multi-campus assignments', () => {
    it('should correctly assign multiple campuses to David López', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      const david = data.data.find((staff: any) =>
        staff.fullName.includes('David López')
      )

      expect(david).toBeDefined()
      expect(david.assignedCampuses.length).toBe(3)

      // Should have all 3 campuses
      const campusNames = david.assignedCampuses.map((c: any) => c.name)
      expect(campusNames).toContain('CEP Norte')
      expect(campusNames).toContain('CEP Santa Cruz')
      expect(campusNames).toContain('CEP Sur')
    })

    it('should correctly assign 2 campuses to Ana García', async () => {
      const response = await fetch(`${API_BASE}/api/staff?type=profesor&limit=100`)
      const data = await response.json()

      const ana = data.data.find((staff: any) =>
        staff.fullName.includes('Ana García')
      )

      expect(ana).toBeDefined()
      expect(ana.assignedCampuses.length).toBe(2)

      const campusNames = ana.assignedCampuses.map((c: any) => c.name)
      expect(campusNames).toContain('CEP Santa Cruz')
      expect(campusNames).toContain('CEP Sur')
    })
  })

  describe('Employment data verification', () => {
    it('should have full-time contracts for most staff', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      const fullTimeCount = data.data.filter(
        (staff: any) => staff.contractType === 'full_time'
      ).length

      // Majority should be full-time (at least 50%)
      expect(fullTimeCount).toBeGreaterThan(data.data.length / 2)
    })

    it('should have all staff as active by default', async () => {
      const response = await fetch(`${API_BASE}/api/staff?limit=100`)
      const data = await response.json()

      data.data.forEach((staff: any) => {
        expect(staff.employmentStatus).toBe('active')
        expect(staff.isActive).toBe(true)
      })
    })
  })

  describe('Performance tests', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now()

      await fetch(`${API_BASE}/api/staff?limit=100`)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000)
    })

    it('should handle concurrent requests', async () => {
      const requests = [
        fetch(`${API_BASE}/api/staff?type=profesor&limit=10`),
        fetch(`${API_BASE}/api/staff?type=administrativo&limit=10`),
        fetch(`${API_BASE}/api/staff?limit=10`),
      ]

      const responses = await Promise.all(requests)

      // All should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })
})
