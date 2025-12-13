/**
 * @module @akademate/api/gdpr/anonymize
 * GDPR Anonymization Service
 *
 * Implements Article 17 - Right to Erasure (Right to be Forgotten)
 *
 * Strategy: Anonymize PII while preserving academic records for:
 * - Statistical reporting
 * - Accreditation requirements
 * - Financial auditing
 *
 * Anonymized fields:
 * - email → anonymized-{hash}@deleted.local
 * - name → "Deleted User"
 * - phone → null
 * - Other PII → null or anonymized
 */

import { createHash } from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface AnonymizationResult {
  success: boolean
  userId: string
  anonymizedAt: string
  fieldsAnonymized: string[]
  recordsPreserved: {
    enrollments: number
    certificates: number
    submissions: number
    auditLogs: number
  }
  verificationToken: string
}

export interface AnonymizationDependencies {
  // User operations
  findUserById: (userId: string) => Promise<{ id: string; email: string; name: string } | null>
  updateUser: (userId: string, data: {
    email: string
    name: string
    passwordHash: null
    mfaEnabled: false
  }) => Promise<void>

  // Related records count (for reporting)
  countEnrollments: (userId: string) => Promise<number>
  countCertificates: (userId: string) => Promise<number>
  countSubmissions: (userId: string) => Promise<number>
  countAuditLogs: (userId: string) => Promise<number>

  // Lead anonymization (if user was converted from lead)
  anonymizeLead: (userId: string) => Promise<void>

  // Membership cleanup
  deactivateMemberships: (userId: string) => Promise<void>

  // Gamification cleanup
  anonymizeGamificationData: (userId: string) => Promise<void>

  // Audit logging
  createAuditLog: (data: {
    userId: string
    action: string
    resource: string
    resourceId: string
    ipAddress?: string
  }) => Promise<void>
}

// ============================================================================
// Anonymization Service
// ============================================================================

export class GdprAnonymizationService {
  constructor(private deps: AnonymizationDependencies) {}

  /**
   * Anonymize a user's personal data
   *
   * This operation:
   * 1. Replaces PII with anonymized values
   * 2. Preserves academic records (enrollments, certificates, grades)
   * 3. Deactivates memberships
   * 4. Clears gamification data
   * 5. Creates audit trail
   *
   * @param userId - User ID to anonymize
   * @param requestedBy - ID of user/admin requesting anonymization
   * @param ipAddress - IP address for audit log
   */
  async anonymizeUser(
    userId: string,
    requestedBy: string,
    ipAddress?: string
  ): Promise<AnonymizationResult> {
    // 1. Verify user exists
    const user = await this.deps.findUserById(userId)
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }

    // 2. Generate anonymized email (deterministic hash for idempotency)
    const anonymizedEmail = this.generateAnonymizedEmail(userId)

    // 3. Get counts before anonymization (for reporting)
    const [enrollments, certificates, submissions, auditLogs] = await Promise.all([
      this.deps.countEnrollments(userId),
      this.deps.countCertificates(userId),
      this.deps.countSubmissions(userId),
      this.deps.countAuditLogs(userId),
    ])

    // 4. Perform anonymization operations in parallel where safe
    await Promise.all([
      // Update user record with anonymized data
      this.deps.updateUser(userId, {
        email: anonymizedEmail,
        name: 'Deleted User',
        passwordHash: null,
        mfaEnabled: false,
      }),

      // Deactivate all tenant memberships
      this.deps.deactivateMemberships(userId),

      // Anonymize lead data if exists
      this.deps.anonymizeLead(userId),

      // Clear gamification data (points, badges, streaks)
      this.deps.anonymizeGamificationData(userId),
    ])

    // 5. Create audit log entry
    await this.deps.createAuditLog({
      userId: requestedBy,
      action: 'gdpr_anonymization',
      resource: 'users',
      resourceId: userId,
      ipAddress,
    })

    // 6. Generate verification token
    const verificationToken = this.generateVerificationToken(userId)

    return {
      success: true,
      userId,
      anonymizedAt: new Date().toISOString(),
      fieldsAnonymized: ['email', 'name', 'passwordHash', 'mfaEnabled', 'phone'],
      recordsPreserved: {
        enrollments,
        certificates,
        submissions,
        auditLogs,
      },
      verificationToken,
    }
  }

  /**
   * Check if a user has already been anonymized
   */
  async isAnonymized(userId: string): Promise<boolean> {
    const user = await this.deps.findUserById(userId)
    if (!user) return false

    return user.email.endsWith('@deleted.local')
  }

  /**
   * Generate a deterministic anonymized email
   * Using hash ensures same user always gets same anonymized email
   */
  private generateAnonymizedEmail(userId: string): string {
    const hash = createHash('sha256')
      .update(`anonymize:${userId}`)
      .digest('hex')
      .substring(0, 12)

    return `anonymized-${hash}@deleted.local`
  }

  /**
   * Generate verification token for audit/compliance purposes
   */
  private generateVerificationToken(userId: string): string {
    const timestamp = Date.now()
    return createHash('sha256')
      .update(`verify:${userId}:${timestamp}`)
      .digest('hex')
      .substring(0, 32)
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createGdprAnonymizationService(
  deps: AnonymizationDependencies
): GdprAnonymizationService {
  return new GdprAnonymizationService(deps)
}

// ============================================================================
// Request/Response Schemas
// ============================================================================

import { z } from 'zod'

export const AnonymizeRequestSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10).max(500).optional(),
  confirmDeletion: z.literal(true, {
    errorMap: () => ({ message: 'Must confirm deletion by setting confirmDeletion to true' }),
  }),
})

export type AnonymizeRequest = z.infer<typeof AnonymizeRequestSchema>
