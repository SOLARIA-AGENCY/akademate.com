/**
 * GDPR Export Service Tests
 *
 * Tests Article 15 - Right of Access implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  GdprExportService,
  createGdprExportService,
  ExportRequestSchema,
  type GdprExportDependencies,
  type UserProfileExport,
} from '../src/gdpr'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUserId = '123e4567-e89b-12d3-a456-426614174000'

const mockProfile: UserProfileExport = {
  id: mockUserId,
  email: 'test@example.com',
  name: 'Test User',
  mfaEnabled: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
}

const mockMemberships = [
  {
    tenantId: 'tenant-1',
    tenantName: 'Academia Test',
    roles: ['student'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const mockEnrollments = [
  {
    id: 'enrollment-1',
    courseRunId: 'course-run-1',
    courseRunName: 'Web Development 2024',
    status: 'active',
    progress: 45.5,
    enrolledAt: '2024-01-10T00:00:00.000Z',
    startedAt: '2024-01-11T00:00:00.000Z',
    completedAt: null,
    lastAccessAt: '2024-01-20T00:00:00.000Z',
  },
]

const mockCertificates = [
  {
    id: 'cert-1',
    courseRunId: 'course-run-0',
    courseRunName: 'JavaScript Basics',
    verificationHash: 'abc123hash',
    issuedAt: '2023-12-15T00:00:00.000Z',
    expiresAt: null,
    pdfUrl: 'https://storage.example.com/certs/abc123.pdf',
  },
]

// ============================================================================
// Mock Dependencies Factory
// ============================================================================

function createMockDeps(overrides: Partial<GdprExportDependencies> = {}): GdprExportDependencies {
  return {
    findUserById: vi.fn().mockResolvedValue(mockProfile),
    findMembershipsByUserId: vi.fn().mockResolvedValue(mockMemberships),
    findEnrollmentsByUserId: vi.fn().mockResolvedValue(mockEnrollments),
    findLessonProgressByUserId: vi.fn().mockResolvedValue([]),
    findSubmissionsByUserId: vi.fn().mockResolvedValue([]),
    findCertificatesByUserId: vi.fn().mockResolvedValue(mockCertificates),
    findBadgesByUserId: vi.fn().mockResolvedValue([]),
    findPointsTransactionsByUserId: vi.fn().mockResolvedValue([]),
    findStreaksByUserId: vi.fn().mockResolvedValue([]),
    findAttendanceByUserId: vi.fn().mockResolvedValue([]),
    findLeadDataByUserId: vi.fn().mockResolvedValue(null),
    findAuditLogsByUserId: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('GdprExportService', () => {
  describe('exportUserData', () => {
    it('should export all user data when no sections specified', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      const result = await service.exportUserData(mockUserId, 'json')

      expect(result.userId).toBe(mockUserId)
      expect(result.format).toBe('json')
      expect(result.profile).toEqual(mockProfile)
      expect(result.memberships).toEqual(mockMemberships)
      expect(result.enrollments).toEqual(mockEnrollments)
      expect(result.certificates).toEqual(mockCertificates)
      expect(result.exportedAt).toBeDefined()
    })

    it('should call all dependency functions', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      await service.exportUserData(mockUserId)

      expect(deps.findUserById).toHaveBeenCalledWith(mockUserId)
      expect(deps.findMembershipsByUserId).toHaveBeenCalledWith(mockUserId)
      expect(deps.findEnrollmentsByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findLessonProgressByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findSubmissionsByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findCertificatesByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findBadgesByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findPointsTransactionsByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findStreaksByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findAttendanceByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findLeadDataByUserId).toHaveBeenCalledWith(mockUserId, undefined)
      expect(deps.findAuditLogsByUserId).toHaveBeenCalledWith(mockUserId, undefined)
    })

    it('should throw error when user not found', async () => {
      const deps = createMockDeps({
        findUserById: vi.fn().mockResolvedValue(null),
      })
      const service = createGdprExportService(deps)

      await expect(service.exportUserData(mockUserId)).rejects.toThrow('User not found')
    })

    it('should pass tenantId to scoped queries', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)
      const tenantId = 'tenant-123'

      await service.exportUserData(mockUserId, 'json', tenantId)

      expect(deps.findEnrollmentsByUserId).toHaveBeenCalledWith(mockUserId, tenantId)
      expect(deps.findCertificatesByUserId).toHaveBeenCalledWith(mockUserId, tenantId)
    })

    it('should only fetch specified sections', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      await service.exportUserData(mockUserId, 'json', undefined, ['profile', 'enrollments'])

      expect(deps.findUserById).toHaveBeenCalled()
      expect(deps.findEnrollmentsByUserId).toHaveBeenCalled()
      expect(deps.findMembershipsByUserId).not.toHaveBeenCalled()
      expect(deps.findCertificatesByUserId).not.toHaveBeenCalled()
    })

    it('should default format to json', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      const result = await service.exportUserData(mockUserId)

      expect(result.format).toBe('json')
    })
  })

  describe('toCSV', () => {
    it('should convert export data to CSV format', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      const exportData = await service.exportUserData(mockUserId, 'csv')
      const csvFiles = service.toCSV(exportData)

      expect(csvFiles['profile.csv']).toBeDefined()
      expect(csvFiles['profile.csv']).toContain('email')
      expect(csvFiles['profile.csv']).toContain('test@example.com')
    })

    it('should create separate CSV files for each section', async () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      const exportData = await service.exportUserData(mockUserId, 'csv')
      const csvFiles = service.toCSV(exportData)

      expect(csvFiles['profile.csv']).toBeDefined()
      expect(csvFiles['memberships.csv']).toBeDefined()
      expect(csvFiles['enrollments.csv']).toBeDefined()
      expect(csvFiles['certificates.csv']).toBeDefined()
    })

    it('should handle empty arrays by not creating CSV', async () => {
      const deps = createMockDeps({
        findBadgesByUserId: vi.fn().mockResolvedValue([]),
      })
      const service = createGdprExportService(deps)

      const exportData = await service.exportUserData(mockUserId)
      const csvFiles = service.toCSV(exportData)

      expect(csvFiles['badges.csv']).toBeUndefined()
    })

    it('should properly escape CSV values with commas', async () => {
      const deps = createMockDeps({
        findUserById: vi.fn().mockResolvedValue({
          ...mockProfile,
          name: 'User, With Comma',
        }),
      })
      const service = createGdprExportService(deps)

      const exportData = await service.exportUserData(mockUserId)
      const csvFiles = service.toCSV(exportData)

      expect(csvFiles['profile.csv']).toContain('"User, With Comma"')
    })

    it('should properly escape CSV values with quotes', async () => {
      const deps = createMockDeps({
        findUserById: vi.fn().mockResolvedValue({
          ...mockProfile,
          name: 'User "Nickname" Test',
        }),
      })
      const service = createGdprExportService(deps)

      const exportData = await service.exportUserData(mockUserId)
      const csvFiles = service.toCSV(exportData)

      expect(csvFiles['profile.csv']).toContain('"User ""Nickname"" Test"')
    })
  })

  describe('createGdprExportService factory', () => {
    it('should create a GdprExportService instance', () => {
      const deps = createMockDeps()
      const service = createGdprExportService(deps)

      expect(service).toBeInstanceOf(GdprExportService)
    })
  })
})

describe('ExportRequestSchema', () => {
  it('should validate valid export request', () => {
    const result = ExportRequestSchema.parse({
      format: 'json',
    })

    expect(result.format).toBe('json')
  })

  it('should default format to json', () => {
    const result = ExportRequestSchema.parse({})

    expect(result.format).toBe('json')
  })

  it('should accept csv format', () => {
    const result = ExportRequestSchema.parse({
      format: 'csv',
    })

    expect(result.format).toBe('csv')
  })

  it('should reject invalid format', () => {
    expect(() =>
      ExportRequestSchema.parse({
        format: 'xml',
      })
    ).toThrow()
  })

  it('should validate userId as UUID', () => {
    const result = ExportRequestSchema.parse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
    })

    expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
  })

  it('should reject invalid UUID', () => {
    expect(() =>
      ExportRequestSchema.parse({
        userId: 'not-a-uuid',
      })
    ).toThrow()
  })

  it('should validate includeSections array', () => {
    const result = ExportRequestSchema.parse({
      includeSections: ['profile', 'enrollments', 'certificates'],
    })

    expect(result.includeSections).toEqual(['profile', 'enrollments', 'certificates'])
  })

  it('should reject invalid section names', () => {
    expect(() =>
      ExportRequestSchema.parse({
        includeSections: ['profile', 'invalid_section'],
      })
    ).toThrow()
  })
})
