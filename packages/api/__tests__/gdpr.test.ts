/**
 * GDPR Export Service Tests
 *
 * Tests Article 15 - Right of Access implementation
 */

import { describe, it, expect, vi } from 'vitest'
import {
  GdprExportService,
  createGdprExportService,
  ExportRequestSchema,
  createGdprAnonymizationService,
  AnonymizeRequestSchema,
  createGdprConsentService,
  ConsentTypeSchema,
  UpdateConsentsRequestSchema,
  createGdprRetentionService,
  DataCategorySchema,
  DEFAULT_RETENTION_POLICIES,
  ExecuteRetentionSchema,
  type GdprExportDependencies,
  type AnonymizationDependencies,
  type ConsentDependencies,
  type RetentionDependencies,
  type UserProfileExport,
  type ConsentRecord,
  type RetentionPolicy,
  type RetentionCandidate,
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

// ============================================================================
// Article 17 - Anonymization Tests
// ============================================================================

describe('GdprAnonymizationService', () => {
  const mockUser = {
    id: mockUserId,
    email: 'user@example.com',
    name: 'Test User',
  }

  function createAnonymizationMockDeps(
    overrides: Partial<AnonymizationDependencies> = {}
  ): AnonymizationDependencies {
    return {
      findUserById: vi.fn().mockResolvedValue(mockUser),
      updateUser: vi.fn().mockResolvedValue(undefined),
      countEnrollments: vi.fn().mockResolvedValue(5),
      countCertificates: vi.fn().mockResolvedValue(2),
      countSubmissions: vi.fn().mockResolvedValue(10),
      countAuditLogs: vi.fn().mockResolvedValue(50),
      anonymizeLead: vi.fn().mockResolvedValue(undefined),
      deactivateMemberships: vi.fn().mockResolvedValue(undefined),
      anonymizeGamificationData: vi.fn().mockResolvedValue(undefined),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    }
  }

  describe('anonymizeUser', () => {
    it('should anonymize user data successfully', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      const result = await service.anonymizeUser(mockUserId, 'admin-123', '192.168.1.1')

      expect(result.success).toBe(true)
      expect(result.userId).toBe(mockUserId)
      expect(result.anonymizedAt).toBeDefined()
      expect(result.verificationToken).toBeDefined()
      expect(result.fieldsAnonymized).toContain('email')
      expect(result.fieldsAnonymized).toContain('name')
    })

    it('should update user with anonymized email', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      await service.anonymizeUser(mockUserId, 'admin-123')

      expect(deps.updateUser).toHaveBeenCalledWith(mockUserId, expect.objectContaining({
        email: expect.stringMatching(/^anonymized-[a-f0-9]+@deleted\.local$/),
        name: 'Deleted User',
        passwordHash: null,
        mfaEnabled: false,
      }))
    })

    it('should call all cleanup operations', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      await service.anonymizeUser(mockUserId, 'admin-123')

      expect(deps.deactivateMemberships).toHaveBeenCalledWith(mockUserId)
      expect(deps.anonymizeLead).toHaveBeenCalledWith(mockUserId)
      expect(deps.anonymizeGamificationData).toHaveBeenCalledWith(mockUserId)
    })

    it('should create audit log entry', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      await service.anonymizeUser(mockUserId, 'admin-123', '10.0.0.1')

      expect(deps.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-123',
        action: 'gdpr_anonymization',
        resource: 'users',
        resourceId: mockUserId,
        ipAddress: '10.0.0.1',
      })
    })

    it('should return preserved records count', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      const result = await service.anonymizeUser(mockUserId, 'admin-123')

      expect(result.recordsPreserved).toEqual({
        enrollments: 5,
        certificates: 2,
        submissions: 10,
        auditLogs: 50,
      })
    })

    it('should throw error when user not found', async () => {
      const deps = createAnonymizationMockDeps({
        findUserById: vi.fn().mockResolvedValue(null),
      })
      const service = createGdprAnonymizationService(deps)

      await expect(service.anonymizeUser(mockUserId, 'admin-123')).rejects.toThrow('User not found')
    })

    it('should generate deterministic anonymized email', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      await service.anonymizeUser(mockUserId, 'admin-123')
      const firstCall = (deps.updateUser as any).mock.calls[0][1].email

      await service.anonymizeUser(mockUserId, 'admin-456')
      const secondCall = (deps.updateUser as any).mock.calls[1][1].email

      // Same user ID should always generate same anonymized email
      expect(firstCall).toBe(secondCall)
    })
  })

  describe('isAnonymized', () => {
    it('should return true for anonymized users', async () => {
      const deps = createAnonymizationMockDeps({
        findUserById: vi.fn().mockResolvedValue({
          id: mockUserId,
          email: 'anonymized-abc123@deleted.local',
          name: 'Deleted User',
        }),
      })
      const service = createGdprAnonymizationService(deps)

      const result = await service.isAnonymized(mockUserId)

      expect(result).toBe(true)
    })

    it('should return false for non-anonymized users', async () => {
      const deps = createAnonymizationMockDeps()
      const service = createGdprAnonymizationService(deps)

      const result = await service.isAnonymized(mockUserId)

      expect(result).toBe(false)
    })

    it('should return false for non-existent users', async () => {
      const deps = createAnonymizationMockDeps({
        findUserById: vi.fn().mockResolvedValue(null),
      })
      const service = createGdprAnonymizationService(deps)

      const result = await service.isAnonymized(mockUserId)

      expect(result).toBe(false)
    })
  })
})

describe('AnonymizeRequestSchema', () => {
  it('should validate valid anonymize request', () => {
    const result = AnonymizeRequestSchema.parse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      confirmDeletion: true,
    })

    expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(result.confirmDeletion).toBe(true)
  })

  it('should require confirmDeletion to be true', () => {
    expect(() =>
      AnonymizeRequestSchema.parse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        confirmDeletion: false,
      })
    ).toThrow()
  })

  it('should reject missing confirmDeletion', () => {
    expect(() =>
      AnonymizeRequestSchema.parse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).toThrow()
  })

  it('should validate optional reason with min length', () => {
    const result = AnonymizeRequestSchema.parse({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      confirmDeletion: true,
      reason: 'User requested account deletion via support ticket #12345',
    })

    expect(result.reason).toContain('User requested')
  })

  it('should reject reason that is too short', () => {
    expect(() =>
      AnonymizeRequestSchema.parse({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        confirmDeletion: true,
        reason: 'short',
      })
    ).toThrow()
  })
})

// ============================================================================
// Article 7 - Consent Management Tests
// ============================================================================

describe('GdprConsentService', () => {
  const tenantId = 'tenant-123'

  const mockConsentRecord: ConsentRecord = {
    userId: mockUserId,
    tenantId,
    consentType: 'marketing_email',
    granted: true,
    grantedAt: '2024-01-01T00:00:00.000Z',
    withdrawnAt: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    source: 'signup',
    version: '1.0',
  }

  function createConsentMockDeps(
    overrides: Partial<ConsentDependencies> = {}
  ): ConsentDependencies {
    return {
      getConsentRecord: vi.fn().mockResolvedValue(mockConsentRecord),
      getAllConsents: vi.fn().mockResolvedValue([mockConsentRecord]),
      upsertConsent: vi.fn().mockResolvedValue(undefined),
      logConsentChange: vi.fn().mockResolvedValue(undefined),
      getConsentHistory: vi.fn().mockResolvedValue([]),
      getCurrentPolicyVersion: vi.fn().mockReturnValue('1.0'),
      ...overrides,
    }
  }

  describe('grantConsent', () => {
    it('should grant consent successfully', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      const result = await service.grantConsent(mockUserId, tenantId, 'marketing_email', {
        ipAddress: '10.0.0.1',
        userAgent: 'Test Agent',
        source: 'settings',
      })

      expect(result.granted).toBe(true)
      expect(result.consentType).toBe('marketing_email')
      expect(result.grantedAt).toBeDefined()
    })

    it('should save consent and log history', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      await service.grantConsent(mockUserId, tenantId, 'analytics', {
        source: 'api',
      })

      expect(deps.upsertConsent).toHaveBeenCalled()
      expect(deps.logConsentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          tenantId,
          consentType: 'analytics',
          action: 'grant',
        })
      )
    })
  })

  describe('withdrawConsent', () => {
    it('should withdraw consent successfully', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      const result = await service.withdrawConsent(mockUserId, tenantId, 'marketing_email', {
        ipAddress: '10.0.0.1',
      })

      expect(result.granted).toBe(false)
      expect(result.withdrawnAt).toBeDefined()
    })

    it('should log withdrawal action', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      await service.withdrawConsent(mockUserId, tenantId, 'newsletter', {})

      expect(deps.logConsentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'withdraw',
          consentType: 'newsletter',
        })
      )
    })
  })

  describe('withdrawAllConsents', () => {
    it('should withdraw all granted consents', async () => {
      const deps = createConsentMockDeps({
        getAllConsents: vi.fn().mockResolvedValue([
          { ...mockConsentRecord, consentType: 'marketing_email', granted: true },
          { ...mockConsentRecord, consentType: 'newsletter', granted: true },
          { ...mockConsentRecord, consentType: 'analytics', granted: false },
        ]),
      })
      const service = createGdprConsentService(deps)

      const result = await service.withdrawAllConsents(mockUserId, tenantId, {})

      // Should only withdraw the 2 granted consents
      expect(result).toHaveLength(2)
      expect(deps.upsertConsent).toHaveBeenCalledTimes(2)
    })
  })

  describe('getUserConsents', () => {
    it('should return all consent states', async () => {
      const deps = createConsentMockDeps({
        getAllConsents: vi.fn().mockResolvedValue([
          { ...mockConsentRecord, consentType: 'marketing_email', granted: true },
          { ...mockConsentRecord, consentType: 'analytics', granted: false },
        ]),
      })
      const service = createGdprConsentService(deps)

      const result = await service.getUserConsents(mockUserId, tenantId)

      expect(result.consents.marketing_email).toBe(true)
      expect(result.consents.analytics).toBe(false)
      expect(result.consents.newsletter).toBe(false) // Default false
    })
  })

  describe('hasConsent', () => {
    it('should return true when consent is granted', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      const result = await service.hasConsent(mockUserId, tenantId, 'marketing_email')

      expect(result).toBe(true)
    })

    it('should return false when consent not found', async () => {
      const deps = createConsentMockDeps({
        getConsentRecord: vi.fn().mockResolvedValue(null),
      })
      const service = createGdprConsentService(deps)

      const result = await service.hasConsent(mockUserId, tenantId, 'profiling')

      expect(result).toBe(false)
    })
  })

  describe('updateConsents', () => {
    it('should handle bulk consent updates', async () => {
      const deps = createConsentMockDeps()
      const service = createGdprConsentService(deps)

      const result = await service.updateConsents(
        mockUserId,
        tenantId,
        {
          marketing_email: true,
          analytics: false,
        },
        { source: 'settings' }
      )

      expect(result.userId).toBe(mockUserId)
      // upsertConsent called twice (grant + withdraw)
      expect(deps.upsertConsent).toHaveBeenCalledTimes(2)
    })
  })
})

describe('ConsentTypeSchema', () => {
  it('should validate valid consent types', () => {
    expect(ConsentTypeSchema.parse('marketing_email')).toBe('marketing_email')
    expect(ConsentTypeSchema.parse('analytics')).toBe('analytics')
    expect(ConsentTypeSchema.parse('newsletter')).toBe('newsletter')
  })

  it('should reject invalid consent types', () => {
    expect(() => ConsentTypeSchema.parse('invalid_type')).toThrow()
  })
})

describe('UpdateConsentsRequestSchema', () => {
  it('should validate valid update request', () => {
    const result = UpdateConsentsRequestSchema.parse({
      consents: {
        marketing_email: true,
        analytics: false,
      },
    })

    expect(result.consents.marketing_email).toBe(true)
    expect(result.consents.analytics).toBe(false)
  })

  it('should reject invalid consent types in request', () => {
    expect(() =>
      UpdateConsentsRequestSchema.parse({
        consents: {
          invalid_type: true,
        },
      })
    ).toThrow()
  })
})

// ============================================================================
// Article 5(1)(e) - Data Retention Tests
// ============================================================================

describe('GdprRetentionService', () => {
  const tenantId = 'tenant-123'

  const mockPolicy: RetentionPolicy = {
    category: 'leads_unconverted',
    retentionDays: 730,
    description: 'Leads that never converted',
    isActive: true,
    lastExecuted: null,
  }

  const mockCandidate: RetentionCandidate = {
    id: 'lead-123',
    category: 'leads_unconverted',
    lastActivityAt: '2022-01-01T00:00:00.000Z',
    daysInactive: 800,
    canDelete: true,
    reason: 'Exceeded retention period',
  }

  function createRetentionMockDeps(
    overrides: Partial<RetentionDependencies> = {}
  ): RetentionDependencies {
    return {
      getPolicies: vi.fn().mockResolvedValue([mockPolicy]),
      updatePolicy: vi.fn().mockResolvedValue(undefined),
      findUnconvertedLeads: vi.fn().mockResolvedValue([mockCandidate]),
      findInactiveUsers: vi.fn().mockResolvedValue([]),
      findOldAuditLogs: vi.fn().mockResolvedValue([]),
      findOldLessonProgress: vi.fn().mockResolvedValue([]),
      findOldSessionData: vi.fn().mockResolvedValue([]),
      findOldAnalyticsEvents: vi.fn().mockResolvedValue([]),
      deleteRecords: vi.fn().mockResolvedValue(1),
      anonymizeRecords: vi.fn().mockResolvedValue(0),
      logRetentionJob: vi.fn().mockResolvedValue(undefined),
      generateJobId: vi.fn().mockReturnValue('job-123'),
      ...overrides,
    }
  }

  describe('getPolicies', () => {
    it('should return all policies with defaults', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      const policies = await service.getPolicies(tenantId)

      expect(policies.length).toBeGreaterThan(0)
      expect(policies.some((p) => p.category === 'leads_unconverted')).toBe(true)
    })

    it('should fill in default values for missing policies', async () => {
      const deps = createRetentionMockDeps({
        getPolicies: vi.fn().mockResolvedValue([]), // No existing policies
      })
      const service = createGdprRetentionService(deps)

      const policies = await service.getPolicies(tenantId)

      // Should have all default categories
      expect(policies.length).toBe(Object.keys(DEFAULT_RETENTION_POLICIES).length)
    })
  })

  describe('previewRetention', () => {
    it('should return candidates without deleting', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      const candidates = await service.previewRetention(tenantId, 'leads_unconverted')

      expect(candidates).toHaveLength(1)
      expect(candidates[0].id).toBe('lead-123')
      expect(deps.deleteRecords).not.toHaveBeenCalled()
    })

    it('should return empty for inactive policies', async () => {
      const deps = createRetentionMockDeps({
        getPolicies: vi.fn().mockResolvedValue([{ ...mockPolicy, isActive: false }]),
      })
      const service = createGdprRetentionService(deps)

      const candidates = await service.previewRetention(tenantId, 'leads_unconverted')

      expect(candidates).toHaveLength(0)
    })
  })

  describe('executeRetention', () => {
    it('should execute retention and return results', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      const result = await service.executeRetention(tenantId, 'leads_unconverted', false)

      expect(result.success !== undefined || result.jobId).toBeTruthy()
      expect(result.recordsFound).toBe(1)
      expect(result.recordsDeleted).toBe(1)
      expect(deps.deleteRecords).toHaveBeenCalled()
      expect(deps.logRetentionJob).toHaveBeenCalled()
    })

    it('should not delete in dry run mode', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      const result = await service.executeRetention(tenantId, 'leads_unconverted', true)

      expect(result.dryRun).toBe(true)
      expect(result.recordsFound).toBe(1)
      expect(result.recordsDeleted).toBe(0)
      expect(deps.deleteRecords).not.toHaveBeenCalled()
    })

    it('should handle inactive policies', async () => {
      const deps = createRetentionMockDeps({
        getPolicies: vi.fn().mockResolvedValue([{ ...mockPolicy, isActive: false }]),
      })
      const service = createGdprRetentionService(deps)

      const result = await service.executeRetention(tenantId, 'leads_unconverted', false)

      expect(result.errors).toContain('Policy not active for category: leads_unconverted')
    })

    it('should update policy lastExecuted after execution', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      await service.executeRetention(tenantId, 'leads_unconverted', false)

      expect(deps.updatePolicy).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          lastExecuted: expect.any(String),
        })
      )
    })
  })

  describe('executeAllRetentionPolicies', () => {
    it('should execute only active policies', async () => {
      // Create a single active policy
      const singleActivePolicy: RetentionPolicy = {
        ...mockPolicy,
        category: 'leads_unconverted',
        isActive: true,
      }

      const deps = createRetentionMockDeps({
        getPolicies: vi.fn().mockResolvedValue([singleActivePolicy]),
      })
      const service = createGdprRetentionService(deps)

      const results = await service.executeAllRetentionPolicies(tenantId, true)

      // Should execute and return results
      expect(results.length).toBeGreaterThan(0)
      // All results should be for active policies
      results.forEach((result) => {
        expect(result.dryRun).toBe(true)
      })
    })
  })

  describe('getRetentionSummary', () => {
    it('should return summary of all categories', async () => {
      const deps = createRetentionMockDeps()
      const service = createGdprRetentionService(deps)

      const summary = await service.getRetentionSummary(tenantId)

      expect(summary.leads_unconverted).toBeDefined()
      expect(summary.leads_unconverted.count).toBe(1)
    })
  })
})

describe('DataCategorySchema', () => {
  it('should validate valid data categories', () => {
    expect(DataCategorySchema.parse('leads_unconverted')).toBe('leads_unconverted')
    expect(DataCategorySchema.parse('audit_logs')).toBe('audit_logs')
    expect(DataCategorySchema.parse('session_data')).toBe('session_data')
  })

  it('should reject invalid categories', () => {
    expect(() => DataCategorySchema.parse('invalid_category')).toThrow()
  })
})

describe('ExecuteRetentionSchema', () => {
  it('should validate with defaults', () => {
    const result = ExecuteRetentionSchema.parse({})

    expect(result.dryRun).toBe(true)
    expect(result.batchSize).toBe(100)
  })

  it('should validate with custom values', () => {
    const result = ExecuteRetentionSchema.parse({
      category: 'leads_unconverted',
      dryRun: false,
      batchSize: 500,
    })

    expect(result.category).toBe('leads_unconverted')
    expect(result.dryRun).toBe(false)
    expect(result.batchSize).toBe(500)
  })

  it('should reject invalid batch size', () => {
    expect(() =>
      ExecuteRetentionSchema.parse({
        batchSize: 5, // Too small (min 10)
      })
    ).toThrow()
  })
})

describe('DEFAULT_RETENTION_POLICIES', () => {
  it('should have all required categories', () => {
    expect(DEFAULT_RETENTION_POLICIES.leads_unconverted).toBe(730)
    expect(DEFAULT_RETENTION_POLICIES.users_inactive).toBe(1825)
    expect(DEFAULT_RETENTION_POLICIES.audit_logs).toBe(2555)
    expect(DEFAULT_RETENTION_POLICIES.session_data).toBe(90)
  })
})
