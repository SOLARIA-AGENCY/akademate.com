/**
 * @module @akademate/leads/conversion
 * Lead-to-enrollment conversion workflow
 */

import {
  LeadStatus,
  type Lead,
  type ConversionRequest,
  type ConversionResult,
  type LeadStatusTransition,
} from './types.js'

// ============================================================================
// Status Transitions
// ============================================================================

/**
 * Valid status transitions for leads
 */
const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.LOST],
  [LeadStatus.CONTACTED]: [LeadStatus.QUALIFIED, LeadStatus.LOST],
  [LeadStatus.QUALIFIED]: [LeadStatus.CONVERTED, LeadStatus.CONTACTED, LeadStatus.LOST],
  [LeadStatus.CONVERTED]: [], // Terminal state
  [LeadStatus.LOST]: [LeadStatus.NEW], // Can reactivate
}

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(from: LeadStatus, to: LeadStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get available next statuses
 */
export function getNextStatuses(currentStatus: LeadStatus): LeadStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? []
}

// ============================================================================
// Conversion Service
// ============================================================================

export interface ConversionServiceConfig {
  onPreConvert?: (request: ConversionRequest) => Promise<void>
  onPostConvert?: (result: ConversionResult) => Promise<void>
  onConversionFailed?: (request: ConversionRequest, errors: string[]) => Promise<void>
}

export class LeadConversionService {
  private config: ConversionServiceConfig

  constructor(config: ConversionServiceConfig = {}) {
    this.config = config
  }

  /**
   * Convert a qualified lead to enrollment
   * This is the main conversion workflow
   */
  async convert(request: ConversionRequest): Promise<ConversionResult> {
    const errors: string[] = []

    // Validation would typically check against database
    // For now, validate the request structure
    if (!request.leadId) {
      errors.push('leadId es requerido')
    }
    if (!request.tenantId) {
      errors.push('tenantId es requerido')
    }
    if (!request.courseRunId) {
      errors.push('courseRunId es requerido')
    }
    if (!request.userId) {
      errors.push('userId (agente que convierte) es requerido')
    }

    if (errors.length > 0) {
      if (this.config.onConversionFailed) {
        await this.config.onConversionFailed(request, errors)
      }
      return { success: false, errors }
    }

    // Pre-conversion hook
    if (this.config.onPreConvert) {
      await this.config.onPreConvert(request)
    }

    // In a real implementation, this would:
    // 1. Create user account if needed
    // 2. Create enrollment record
    // 3. Update lead status to CONVERTED
    // 4. Record conversion timestamp
    // 5. Link lead to new user account
    // 6. Trigger welcome email
    // 7. Create audit log entry

    const result: ConversionResult = {
      success: true,
      enrollmentId: crypto.randomUUID(), // Would be real enrollment ID
      userId: crypto.randomUUID(), // Would be real or existing user ID
    }

    // Post-conversion hook
    if (this.config.onPostConvert) {
      await this.config.onPostConvert(result)
    }

    return result
  }

  /**
   * Validate if lead can be converted
   */
  canConvert(lead: Partial<Lead>): { canConvert: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Must be in qualified status
    if (lead.status !== LeadStatus.QUALIFIED) {
      reasons.push(`Lead debe estar en estado "qualified", actualmente: ${lead.status}`)
    }

    // Must have GDPR consent
    if (!lead.gdprConsent) {
      reasons.push('Lead no tiene consentimiento GDPR')
    }

    // Must have email
    if (!lead.email) {
      reasons.push('Lead no tiene email')
    }

    return {
      canConvert: reasons.length === 0,
      reasons,
    }
  }

  /**
   * Mark lead as lost with reason
   */
  async markAsLost(params: {
    leadId: string
    tenantId: string
    userId: string
    reason: string
    notes?: string
  }): Promise<LeadStatusTransition> {
    return {
      leadId: params.leadId,
      fromStatus: LeadStatus.QUALIFIED, // Would be current status from DB
      toStatus: LeadStatus.LOST,
      userId: params.userId,
      reason: params.reason,
      notes: params.notes,
    }
  }

  /**
   * Reactivate a lost lead
   */
  async reactivate(params: {
    leadId: string
    tenantId: string
    userId: string
    notes?: string
  }): Promise<LeadStatusTransition> {
    return {
      leadId: params.leadId,
      fromStatus: LeadStatus.LOST,
      toStatus: LeadStatus.NEW,
      userId: params.userId,
      notes: params.notes,
    }
  }
}

// ============================================================================
// Conversion Eligibility Checks
// ============================================================================

/**
 * Business rules for conversion eligibility
 */
export interface EligibilityCheck {
  id: string
  name: string
  check: (lead: Partial<Lead>) => boolean
  errorMessage: string
}

export const DEFAULT_ELIGIBILITY_CHECKS: EligibilityCheck[] = [
  {
    id: 'has_gdpr_consent',
    name: 'GDPR Consent',
    check: lead => lead.gdprConsent === true,
    errorMessage: 'El lead debe aceptar la política de privacidad',
  },
  {
    id: 'has_email',
    name: 'Email válido',
    check: lead => !!lead.email && lead.email.includes('@'),
    errorMessage: 'El lead debe tener un email válido',
  },
  {
    id: 'is_qualified',
    name: 'Estado cualificado',
    check: lead => lead.status === LeadStatus.QUALIFIED,
    errorMessage: 'El lead debe estar en estado "qualified"',
  },
  {
    id: 'not_already_converted',
    name: 'No convertido',
    check: lead => lead.status !== LeadStatus.CONVERTED,
    errorMessage: 'El lead ya ha sido convertido',
  },
]

/**
 * Run all eligibility checks on a lead
 */
export function checkEligibility(
  lead: Partial<Lead>,
  checks: EligibilityCheck[] = DEFAULT_ELIGIBILITY_CHECKS
): { eligible: boolean; failedChecks: EligibilityCheck[] } {
  const failedChecks = checks.filter(check => !check.check(lead))
  return {
    eligible: failedChecks.length === 0,
    failedChecks,
  }
}
