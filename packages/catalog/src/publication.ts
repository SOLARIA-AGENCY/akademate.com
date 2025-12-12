/**
 * @module @akademate/catalog/publication
 * Publication workflow state machine
 */

import {
  PublicationStatus,
  type PublicationTransition,
  type PublicationEvent,
} from './types.js'

// ============================================================================
// Publication State Machine
// ============================================================================

/**
 * Allowed transitions between publication states
 * Based on editorial workflow: draft -> review -> published -> archived
 */
const ALLOWED_TRANSITIONS: PublicationTransition[] = [
  // From DRAFT
  { from: PublicationStatus.DRAFT, to: PublicationStatus.REVIEW, allowedRoles: ['admin', 'gestor', 'instructor'] },
  { from: PublicationStatus.DRAFT, to: PublicationStatus.ARCHIVED, allowedRoles: ['admin', 'gestor'] },

  // From REVIEW
  { from: PublicationStatus.REVIEW, to: PublicationStatus.DRAFT, allowedRoles: ['admin', 'gestor'] },
  { from: PublicationStatus.REVIEW, to: PublicationStatus.PUBLISHED, allowedRoles: ['admin', 'gestor'] },
  { from: PublicationStatus.REVIEW, to: PublicationStatus.ARCHIVED, allowedRoles: ['admin', 'gestor'] },

  // From PUBLISHED
  { from: PublicationStatus.PUBLISHED, to: PublicationStatus.DRAFT, allowedRoles: ['admin'] }, // Unpublish
  { from: PublicationStatus.PUBLISHED, to: PublicationStatus.ARCHIVED, allowedRoles: ['admin', 'gestor'] },

  // From ARCHIVED
  { from: PublicationStatus.ARCHIVED, to: PublicationStatus.DRAFT, allowedRoles: ['admin', 'gestor'] }, // Restore
]

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  from: PublicationStatus,
  to: PublicationStatus
): boolean {
  return ALLOWED_TRANSITIONS.some(t => t.from === from && t.to === to)
}

/**
 * Check if a role can perform a transition
 */
export function canTransition(
  from: PublicationStatus,
  to: PublicationStatus,
  userRoles: string[]
): boolean {
  const transition = ALLOWED_TRANSITIONS.find(t => t.from === from && t.to === to)
  if (!transition) return false
  return transition.allowedRoles.some(role => userRoles.includes(role))
}

/**
 * Get all possible next states from current state
 */
export function getNextStates(
  currentStatus: PublicationStatus,
  userRoles: string[]
): PublicationStatus[] {
  return ALLOWED_TRANSITIONS
    .filter(t => t.from === currentStatus)
    .filter(t => t.allowedRoles.some(role => userRoles.includes(role)))
    .map(t => t.to)
}

// ============================================================================
// Publication Service
// ============================================================================

export interface PublicationServiceConfig {
  onPublish?: (event: PublicationEvent) => Promise<void>
  onUnpublish?: (event: PublicationEvent) => Promise<void>
  onArchive?: (event: PublicationEvent) => Promise<void>
}

export class PublicationService {
  private config: PublicationServiceConfig

  constructor(config: PublicationServiceConfig = {}) {
    this.config = config
  }

  /**
   * Validate and execute a publication status change
   */
  async transition(params: {
    entityType: 'course' | 'courseRun'
    entityId: string
    tenantId: string
    fromStatus: PublicationStatus
    toStatus: PublicationStatus
    userId: string
    userRoles: string[]
    reason?: string
  }): Promise<PublicationEvent> {
    const { entityType, entityId, tenantId, fromStatus, toStatus, userId, userRoles, reason } = params

    // Validate transition
    if (!isValidTransition(fromStatus, toStatus)) {
      throw new PublicationError(
        `Invalid transition from ${fromStatus} to ${toStatus}`,
        'INVALID_TRANSITION'
      )
    }

    // Check authorization
    if (!canTransition(fromStatus, toStatus, userRoles)) {
      throw new PublicationError(
        `User does not have permission to transition from ${fromStatus} to ${toStatus}`,
        'UNAUTHORIZED'
      )
    }

    // Create event
    const event: PublicationEvent = {
      entityType,
      entityId,
      tenantId,
      fromStatus,
      toStatus,
      userId,
      timestamp: new Date(),
      reason,
    }

    // Trigger hooks
    if (toStatus === PublicationStatus.PUBLISHED && this.config.onPublish) {
      await this.config.onPublish(event)
    } else if (fromStatus === PublicationStatus.PUBLISHED && toStatus === PublicationStatus.DRAFT && this.config.onUnpublish) {
      await this.config.onUnpublish(event)
    } else if (toStatus === PublicationStatus.ARCHIVED && this.config.onArchive) {
      await this.config.onArchive(event)
    }

    return event
  }

  /**
   * Check if entity can be published
   */
  canPublish(currentStatus: PublicationStatus, userRoles: string[]): boolean {
    return canTransition(currentStatus, PublicationStatus.PUBLISHED, userRoles)
  }

  /**
   * Check if entity can be unpublished
   */
  canUnpublish(currentStatus: PublicationStatus, userRoles: string[]): boolean {
    return currentStatus === PublicationStatus.PUBLISHED &&
      canTransition(PublicationStatus.PUBLISHED, PublicationStatus.DRAFT, userRoles)
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class PublicationError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'PublicationError'
    this.code = code
  }
}
