/**
 * @module @akademate/api/gdpr/consent
 * GDPR Consent Management Service
 *
 * Implements Article 7 - Conditions for Consent
 *
 * Features:
 * - Track consent grants with timestamp and IP
 * - Support consent withdrawal
 * - Maintain consent history for audit
 * - Handle multiple consent types (marketing, analytics, etc.)
 */

import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export const ConsentTypeSchema = z.enum([
  'marketing_email',
  'marketing_sms',
  'marketing_phone',
  'analytics',
  'third_party_sharing',
  'profiling',
  'newsletter',
])

export type ConsentType = z.infer<typeof ConsentTypeSchema>

export interface ConsentRecord {
  userId: string
  tenantId: string
  consentType: ConsentType
  granted: boolean
  grantedAt: string | null
  withdrawnAt: string | null
  ipAddress: string | null
  userAgent: string | null
  source: 'signup' | 'settings' | 'api' | 'import'
  version: string // Consent policy version
}

export interface ConsentHistoryEntry {
  id: string
  userId: string
  tenantId: string
  consentType: ConsentType
  action: 'grant' | 'withdraw'
  timestamp: string
  ipAddress: string | null
  userAgent: string | null
  policyVersion: string
}

export interface UserConsents {
  userId: string
  tenantId: string
  consents: Record<ConsentType, boolean>
  lastUpdated: string
}

// ============================================================================
// Service Dependencies
// ============================================================================

export interface ConsentDependencies {
  // Get current consent state
  getConsentRecord: (
    userId: string,
    tenantId: string,
    consentType: ConsentType
  ) => Promise<ConsentRecord | null>

  // Get all consents for user
  getAllConsents: (userId: string, tenantId: string) => Promise<ConsentRecord[]>

  // Update consent (grant or withdraw)
  upsertConsent: (consent: ConsentRecord) => Promise<void>

  // Log consent history
  logConsentChange: (entry: Omit<ConsentHistoryEntry, 'id'>) => Promise<void>

  // Get consent history
  getConsentHistory: (
    userId: string,
    tenantId: string,
    consentType?: ConsentType
  ) => Promise<ConsentHistoryEntry[]>

  // Get current policy version
  getCurrentPolicyVersion: () => string
}

// ============================================================================
// Consent Service
// ============================================================================

export class GdprConsentService {
  constructor(private deps: ConsentDependencies) {}

  /**
   * Grant consent for a specific type
   */
  async grantConsent(
    userId: string,
    tenantId: string,
    consentType: ConsentType,
    metadata: {
      ipAddress?: string
      userAgent?: string
      source: ConsentRecord['source']
    }
  ): Promise<ConsentRecord> {
    const now = new Date().toISOString()
    const policyVersion = this.deps.getCurrentPolicyVersion()

    const consentRecord: ConsentRecord = {
      userId,
      tenantId,
      consentType,
      granted: true,
      grantedAt: now,
      withdrawnAt: null,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      source: metadata.source,
      version: policyVersion,
    }

    // Save consent
    await this.deps.upsertConsent(consentRecord)

    // Log to history
    await this.deps.logConsentChange({
      userId,
      tenantId,
      consentType,
      action: 'grant',
      timestamp: now,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      policyVersion,
    })

    return consentRecord
  }

  /**
   * Withdraw consent for a specific type
   */
  async withdrawConsent(
    userId: string,
    tenantId: string,
    consentType: ConsentType,
    metadata: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<ConsentRecord> {
    const existing = await this.deps.getConsentRecord(userId, tenantId, consentType)
    const now = new Date().toISOString()
    const policyVersion = this.deps.getCurrentPolicyVersion()

    const consentRecord: ConsentRecord = {
      userId,
      tenantId,
      consentType,
      granted: false,
      grantedAt: existing?.grantedAt ?? null,
      withdrawnAt: now,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      source: existing?.source ?? 'api',
      version: policyVersion,
    }

    // Save withdrawn consent
    await this.deps.upsertConsent(consentRecord)

    // Log to history
    await this.deps.logConsentChange({
      userId,
      tenantId,
      consentType,
      action: 'withdraw',
      timestamp: now,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      policyVersion,
    })

    return consentRecord
  }

  /**
   * Withdraw ALL consents for a user (used before account deletion)
   */
  async withdrawAllConsents(
    userId: string,
    tenantId: string,
    metadata: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<ConsentRecord[]> {
    const allConsents = await this.deps.getAllConsents(userId, tenantId)
    const withdrawnConsents: ConsentRecord[] = []

    for (const consent of allConsents) {
      if (consent.granted) {
        const withdrawn = await this.withdrawConsent(
          userId,
          tenantId,
          consent.consentType,
          metadata
        )
        withdrawnConsents.push(withdrawn)
      }
    }

    return withdrawnConsents
  }

  /**
   * Get all consents for a user in a simplified format
   */
  async getUserConsents(userId: string, tenantId: string): Promise<UserConsents> {
    const consents = await this.deps.getAllConsents(userId, tenantId)

    const consentMap: Record<ConsentType, boolean> = {
      marketing_email: false,
      marketing_sms: false,
      marketing_phone: false,
      analytics: false,
      third_party_sharing: false,
      profiling: false,
      newsletter: false,
    }

    let lastUpdated = ''

    for (const consent of consents) {
      consentMap[consent.consentType] = consent.granted
      const updateTime = consent.withdrawnAt ?? consent.grantedAt
      if (updateTime && updateTime > lastUpdated) {
        lastUpdated = updateTime
      }
    }

    return {
      userId,
      tenantId,
      consents: consentMap,
      lastUpdated: lastUpdated || new Date().toISOString(),
    }
  }

  /**
   * Check if user has granted specific consent
   */
  async hasConsent(
    userId: string,
    tenantId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    const consent = await this.deps.getConsentRecord(userId, tenantId, consentType)
    return consent?.granted ?? false
  }

  /**
   * Get consent history for audit purposes
   */
  async getConsentAuditTrail(
    userId: string,
    tenantId: string,
    consentType?: ConsentType
  ): Promise<ConsentHistoryEntry[]> {
    return this.deps.getConsentHistory(userId, tenantId, consentType)
  }

  /**
   * Bulk update consents (e.g., from settings page)
   */
  async updateConsents(
    userId: string,
    tenantId: string,
    updates: Partial<Record<ConsentType, boolean>>,
    metadata: {
      ipAddress?: string
      userAgent?: string
      source: ConsentRecord['source']
    }
  ): Promise<UserConsents> {
    for (const [type, granted] of Object.entries(updates)) {
      const consentType = type as ConsentType
      if (granted) {
        await this.grantConsent(userId, tenantId, consentType, metadata)
      } else {
        await this.withdrawConsent(userId, tenantId, consentType, {
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        })
      }
    }

    return this.getUserConsents(userId, tenantId)
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createGdprConsentService(deps: ConsentDependencies): GdprConsentService {
  return new GdprConsentService(deps)
}

// ============================================================================
// Request/Response Schemas
// ============================================================================

export const UpdateConsentsRequestSchema = z.object({
  consents: z.record(ConsentTypeSchema, z.boolean()),
})

export type UpdateConsentsRequest = z.infer<typeof UpdateConsentsRequestSchema>

export const WithdrawConsentRequestSchema = z.object({
  consentType: ConsentTypeSchema,
})

export type WithdrawConsentRequest = z.infer<typeof WithdrawConsentRequestSchema>

export const ConsentAuditRequestSchema = z.object({
  consentType: ConsentTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type ConsentAuditRequest = z.infer<typeof ConsentAuditRequestSchema>
