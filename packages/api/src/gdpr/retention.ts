/**
 * @module @akademate/api/gdpr/retention
 * GDPR Data Retention Service
 *
 * Implements Article 5(1)(e) - Storage Limitation
 *
 * Default retention policies:
 * - Leads without conversion: 2 years
 * - Inactive users: 5 years
 * - Audit logs: 7 years
 * - Completed enrollments: 10 years (accreditation)
 * - Certificates: Indefinite (legal requirement)
 *
 * Features:
 * - Configurable retention periods per data type
 * - Dry-run mode for testing
 * - Batch processing for large datasets
 * - Audit trail of all deletions
 */

import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export const DataCategorySchema = z.enum([
  'leads_unconverted',
  'users_inactive',
  'audit_logs',
  'enrollments_completed',
  'lesson_progress',
  'submissions',
  'session_data',
  'analytics_events',
])

export type DataCategory = z.infer<typeof DataCategorySchema>

export interface RetentionPolicy {
  category: DataCategory
  retentionDays: number
  description: string
  isActive: boolean
  lastExecuted: string | null
}

export interface RetentionJobResult {
  jobId: string
  category: DataCategory
  executedAt: string
  dryRun: boolean
  recordsFound: number
  recordsDeleted: number
  recordsAnonymized: number
  recordsSkipped: number
  errors: string[]
  duration: number // milliseconds
}

export interface RetentionCandidate {
  id: string
  category: DataCategory
  lastActivityAt: string
  daysInactive: number
  canDelete: boolean
  reason: string
}

// ============================================================================
// Default Retention Policies (in days)
// ============================================================================

export const DEFAULT_RETENTION_POLICIES: Record<DataCategory, number> = {
  leads_unconverted: 730, // 2 years
  users_inactive: 1825, // 5 years
  audit_logs: 2555, // 7 years
  enrollments_completed: 3650, // 10 years
  lesson_progress: 1825, // 5 years
  submissions: 3650, // 10 years
  session_data: 90, // 90 days
  analytics_events: 365, // 1 year
}

// ============================================================================
// Service Dependencies
// ============================================================================

export interface RetentionDependencies {
  // Policy management
  getPolicies: (tenantId: string) => Promise<RetentionPolicy[]>
  updatePolicy: (tenantId: string, policy: RetentionPolicy) => Promise<void>

  // Find candidates for each category
  findUnconvertedLeads: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  findInactiveUsers: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  findOldAuditLogs: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  findOldLessonProgress: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  findOldSessionData: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  findOldAnalyticsEvents: (
    tenantId: string,
    olderThanDays: number,
    limit: number
  ) => Promise<RetentionCandidate[]>

  // Deletion operations
  deleteRecords: (category: DataCategory, ids: string[]) => Promise<number>
  anonymizeRecords: (category: DataCategory, ids: string[]) => Promise<number>

  // Audit logging
  logRetentionJob: (result: RetentionJobResult) => Promise<void>

  // Generate unique job ID
  generateJobId: () => string
}

// ============================================================================
// Retention Service
// ============================================================================

export class GdprRetentionService {
  constructor(private deps: RetentionDependencies) {}

  /**
   * Get all retention policies for a tenant
   */
  async getPolicies(tenantId: string): Promise<RetentionPolicy[]> {
    const policies = await this.deps.getPolicies(tenantId)

    // Fill in defaults for any missing categories
    const policyMap = new Map(policies.map((p) => [p.category, p]))

    return Object.entries(DEFAULT_RETENTION_POLICIES).map(([category, defaultDays]) => {
      const existing = policyMap.get(category as DataCategory)
      return (
        existing || {
          category: category as DataCategory,
          retentionDays: defaultDays,
          description: this.getCategoryDescription(category as DataCategory),
          isActive: true,
          lastExecuted: null,
        }
      )
    })
  }

  /**
   * Update a retention policy
   */
  async updatePolicy(
    tenantId: string,
    category: DataCategory,
    retentionDays: number,
    isActive: boolean
  ): Promise<RetentionPolicy> {
    const policy: RetentionPolicy = {
      category,
      retentionDays,
      description: this.getCategoryDescription(category),
      isActive,
      lastExecuted: null,
    }

    await this.deps.updatePolicy(tenantId, policy)
    return policy
  }

  /**
   * Preview what would be affected by retention policies
   * Does not delete anything - useful for reporting
   */
  async previewRetention(
    tenantId: string,
    category: DataCategory,
    limit: number = 100
  ): Promise<RetentionCandidate[]> {
    const policies = await this.getPolicies(tenantId)
    const policy = policies.find((p) => p.category === category)

    if (!policy || !policy.isActive) {
      return []
    }

    return this.findCandidates(tenantId, category, policy.retentionDays, limit)
  }

  /**
   * Execute retention policy for a specific category
   *
   * @param tenantId - Tenant ID
   * @param category - Data category to process
   * @param dryRun - If true, don't actually delete/anonymize
   * @param batchSize - Number of records to process per batch
   */
  async executeRetention(
    tenantId: string,
    category: DataCategory,
    dryRun: boolean = false,
    batchSize: number = 100
  ): Promise<RetentionJobResult> {
    const startTime = Date.now()
    const jobId = this.deps.generateJobId()

    const result: RetentionJobResult = {
      jobId,
      category,
      executedAt: new Date().toISOString(),
      dryRun,
      recordsFound: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0,
    }

    try {
      const policies = await this.getPolicies(tenantId)
      const policy = policies.find((p) => p.category === category)

      if (!policy || !policy.isActive) {
        result.errors.push(`Policy not active for category: ${category}`)
        result.duration = Date.now() - startTime
        return result
      }

      // Find candidates
      const candidates = await this.findCandidates(
        tenantId,
        category,
        policy.retentionDays,
        batchSize
      )

      result.recordsFound = candidates.length

      if (candidates.length === 0 || dryRun) {
        result.duration = Date.now() - startTime
        if (!dryRun) {
          await this.deps.logRetentionJob(result)
        }
        return result
      }

      // Separate deletable and anonymizable records
      const toDelete = candidates.filter((c) => c.canDelete).map((c) => c.id)
      const toAnonymize = candidates.filter((c) => !c.canDelete).map((c) => c.id)
      const skipped = candidates.filter(
        (c) => c.reason.includes('skip') || c.reason.includes('protected')
      )

      result.recordsSkipped = skipped.length

      // Execute deletions
      if (toDelete.length > 0) {
        result.recordsDeleted = await this.deps.deleteRecords(category, toDelete)
      }

      // Execute anonymization
      if (toAnonymize.length > 0) {
        result.recordsAnonymized = await this.deps.anonymizeRecords(category, toAnonymize)
      }

      // Update policy last executed
      policy.lastExecuted = new Date().toISOString()
      await this.deps.updatePolicy(tenantId, policy)
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    result.duration = Date.now() - startTime
    await this.deps.logRetentionJob(result)

    return result
  }

  /**
   * Execute all active retention policies
   */
  async executeAllRetentionPolicies(
    tenantId: string,
    dryRun: boolean = false,
    batchSize: number = 100
  ): Promise<RetentionJobResult[]> {
    const policies = await this.getPolicies(tenantId)
    const activePolicies = policies.filter((p) => p.isActive)

    const results: RetentionJobResult[] = []

    for (const policy of activePolicies) {
      const result = await this.executeRetention(tenantId, policy.category, dryRun, batchSize)
      results.push(result)
    }

    return results
  }

  /**
   * Get summary of data that would be affected by all policies
   */
  async getRetentionSummary(
    tenantId: string
  ): Promise<Record<DataCategory, { count: number; oldestRecord: string | null }>> {
    const policies = await this.getPolicies(tenantId)
    const summary: Record<DataCategory, { count: number; oldestRecord: string | null }> =
      {} as Record<DataCategory, { count: number; oldestRecord: string | null }>

    for (const policy of policies) {
      if (policy.isActive) {
        const candidates = await this.findCandidates(
          tenantId,
          policy.category,
          policy.retentionDays,
          1000
        )
        summary[policy.category] = {
          count: candidates.length,
          oldestRecord:
            candidates.length > 0
              ? candidates.reduce((oldest, c) =>
                  c.lastActivityAt < oldest.lastActivityAt ? c : oldest
                ).lastActivityAt
              : null,
        }
      } else {
        summary[policy.category] = { count: 0, oldestRecord: null }
      }
    }

    return summary
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async findCandidates(
    tenantId: string,
    category: DataCategory,
    olderThanDays: number,
    limit: number
  ): Promise<RetentionCandidate[]> {
    switch (category) {
      case 'leads_unconverted':
        return this.deps.findUnconvertedLeads(tenantId, olderThanDays, limit)
      case 'users_inactive':
        return this.deps.findInactiveUsers(tenantId, olderThanDays, limit)
      case 'audit_logs':
        return this.deps.findOldAuditLogs(tenantId, olderThanDays, limit)
      case 'lesson_progress':
        return this.deps.findOldLessonProgress(tenantId, olderThanDays, limit)
      case 'session_data':
        return this.deps.findOldSessionData(tenantId, olderThanDays, limit)
      case 'analytics_events':
        return this.deps.findOldAnalyticsEvents(tenantId, olderThanDays, limit)
      default:
        return []
    }
  }

  private getCategoryDescription(category: DataCategory): string {
    const descriptions: Record<DataCategory, string> = {
      leads_unconverted: 'Leads that never converted to enrolled students',
      users_inactive: 'Users with no activity for extended period',
      audit_logs: 'System audit logs for compliance',
      enrollments_completed: 'Completed course enrollments',
      lesson_progress: 'Individual lesson progress records',
      submissions: 'Assignment submissions and grades',
      session_data: 'User session and login data',
      analytics_events: 'Website and app analytics events',
    }
    return descriptions[category]
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createGdprRetentionService(deps: RetentionDependencies): GdprRetentionService {
  return new GdprRetentionService(deps)
}

// ============================================================================
// Request/Response Schemas
// ============================================================================

export const UpdateRetentionPolicySchema = z.object({
  category: DataCategorySchema,
  retentionDays: z.number().int().min(30).max(3650), // 30 days to 10 years
  isActive: z.boolean(),
})

export type UpdateRetentionPolicyRequest = z.infer<typeof UpdateRetentionPolicySchema>

export const ExecuteRetentionSchema = z.object({
  category: DataCategorySchema.optional(), // If not provided, run all
  dryRun: z.boolean().default(true),
  batchSize: z.number().int().min(10).max(1000).default(100),
})

export type ExecuteRetentionRequest = z.infer<typeof ExecuteRetentionSchema>
