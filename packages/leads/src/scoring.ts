/**
 * @module @akademate/leads/scoring
 * Lead scoring service
 */

import {
  type Lead,
  type ScoringRule,
  type ScoringCondition,
  type LeadScoreResult,
} from './types.js'

// ============================================================================
// Default Scoring Rules
// ============================================================================

export const DEFAULT_SCORING_RULES: ScoringRule[] = [
  // Demographic rules
  {
    id: 'has_phone',
    name: 'Tiene teléfono',
    description: 'El lead proporcionó número de teléfono',
    condition: { field: 'phone', operator: 'exists', value: true },
    points: 10,
    category: 'demographic',
  },
  {
    id: 'has_name',
    name: 'Tiene nombre completo',
    description: 'El lead proporcionó su nombre',
    condition: { field: 'name', operator: 'exists', value: true },
    points: 5,
    category: 'demographic',
  },

  // Interest/Fit rules
  {
    id: 'interested_in_course',
    name: 'Interesado en curso específico',
    description: 'El lead mostró interés en un curso específico',
    condition: { field: 'courseRunId', operator: 'exists', value: true },
    points: 20,
    category: 'fit',
  },
  {
    id: 'from_campaign',
    name: 'Viene de campaña',
    description: 'El lead llegó a través de una campaña de marketing',
    condition: { field: 'campaignId', operator: 'exists', value: true },
    points: 15,
    category: 'engagement',
  },

  // Source rules
  {
    id: 'source_referral',
    name: 'Fuente: Referido',
    description: 'El lead fue referido por otro cliente',
    condition: { field: 'source', operator: 'equals', value: 'referral' },
    points: 25,
    category: 'engagement',
  },
  {
    id: 'source_website',
    name: 'Fuente: Web',
    description: 'El lead llegó desde el sitio web',
    condition: { field: 'source', operator: 'equals', value: 'website' },
    points: 10,
    category: 'engagement',
  },
  {
    id: 'source_ads',
    name: 'Fuente: Publicidad',
    description: 'El lead llegó desde anuncios',
    condition: { field: 'source', operator: 'equals', value: 'ads' },
    points: 15,
    category: 'engagement',
  },

  // Engagement rules
  {
    id: 'marketing_consent',
    name: 'Consentimiento marketing',
    description: 'El lead aceptó recibir comunicaciones de marketing',
    condition: { field: 'marketingConsent', operator: 'equals', value: true },
    points: 10,
    category: 'engagement',
  },
  {
    id: 'has_notes',
    name: 'Tiene mensaje/notas',
    description: 'El lead dejó un mensaje o notas adicionales',
    condition: { field: 'notes', operator: 'exists', value: true },
    points: 5,
    category: 'behavioral',
  },
]

// ============================================================================
// Scoring Service
// ============================================================================

export class LeadScoringService {
  private rules: ScoringRule[]

  constructor(customRules?: ScoringRule[]) {
    this.rules = customRules ?? DEFAULT_SCORING_RULES
  }

  /**
   * Calculate lead score based on rules
   */
  score(lead: Partial<Lead>): LeadScoreResult {
    const breakdown: LeadScoreResult['breakdown'] = []
    let totalScore = 0

    for (const rule of this.rules) {
      const matched = this.evaluateCondition(lead, rule.condition)
      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        points: matched ? rule.points : 0,
        matched,
      })
      if (matched) {
        totalScore += rule.points
      }
    }

    // Cap score at 100
    totalScore = Math.min(totalScore, 100)

    return {
      totalScore,
      breakdown,
      grade: this.calculateGrade(totalScore),
      recommendation: this.getRecommendation(totalScore),
    }
  }

  /**
   * Evaluate a single condition against lead data
   */
  private evaluateCondition(lead: Partial<Lead>, condition: ScoringCondition): boolean {
    const value = this.getFieldValue(lead, condition.field)

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'contains':
        return typeof value === 'string' && value.includes(String(condition.value))
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number)
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number)
      case 'exists':
        return condition.value ? value !== undefined && value !== null && value !== '' : !value
      case 'matches':
        return typeof value === 'string' && new RegExp(String(condition.value)).test(value)
      default:
        return false
    }
  }

  /**
   * Get field value from lead object (supports nested paths)
   */
  private getFieldValue(lead: Partial<Lead>, field: string): unknown {
    const parts = field.split('.')
    let value: unknown = lead

    for (const part of parts) {
      if (value === null || value === undefined) return undefined
      value = (value as Record<string, unknown>)[part]
    }

    return value
  }

  /**
   * Calculate letter grade from score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A'
    if (score >= 60) return 'B'
    if (score >= 40) return 'C'
    if (score >= 20) return 'D'
    return 'F'
  }

  /**
   * Get action recommendation based on score
   */
  private getRecommendation(score: number): string {
    if (score >= 80) {
      return 'Lead altamente cualificado. Contactar inmediatamente para cerrar inscripción.'
    }
    if (score >= 60) {
      return 'Lead cualificado. Programar llamada de seguimiento en 24-48h.'
    }
    if (score >= 40) {
      return 'Lead tibio. Enviar información adicional y nurturing por email.'
    }
    if (score >= 20) {
      return 'Lead frío. Incluir en secuencia de nurturing automatizada.'
    }
    return 'Lead de baja calidad. Monitorear pero no priorizar.'
  }

  /**
   * Add custom scoring rule
   */
  addRule(rule: ScoringRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove scoring rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get all rules
   */
  getRules(): ScoringRule[] {
    return [...this.rules]
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: ScoringRule['category']): ScoringRule[] {
    return this.rules.filter(r => r.category === category)
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick score calculation without full breakdown
 */
export function quickScore(lead: Partial<Lead>, rules: ScoringRule[] = DEFAULT_SCORING_RULES): number {
  const service = new LeadScoringService(rules)
  return service.score(lead).totalScore
}

/**
 * Check if lead meets minimum score threshold
 */
export function isQualified(lead: Partial<Lead>, threshold = 40): boolean {
  return quickScore(lead) >= threshold
}
