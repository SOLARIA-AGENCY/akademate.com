import type { ActorContext, AuditEvent } from '@akademate/types'

export interface RecordAuditInput {
  actor: ActorContext
  action: string
  resource: string
  resourceId: string
  metadata?: Record<string, unknown>
}

export function buildAuditEvent(input: RecordAuditInput): AuditEvent {
  if (!input.action.trim()) {
    throw new Error('AuditEvent requires action')
  }
  if (!input.resource.trim() || !input.resourceId.trim()) {
    throw new Error('AuditEvent requires resource and resourceId')
  }
  if (!input.actor.correlationId) {
    throw new Error('AuditEvent requires correlationId from ActorContext')
  }

  return {
    tenantId: input.actor.tenantId,
    organizationGroupId: input.actor.accountId,
    actorId: input.actor.actorId,
    actorType: input.actor.actorType,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    purpose: input.actor.purpose,
    correlationId: input.actor.correlationId,
    channel: input.actor.channel,
    policyDecision: input.actor.policyDecision,
    createdAt: new Date(),
    metadata: input.metadata,
  }
}

export function tenantScopedRows<T extends { tenantId: string }>(rows: T[], tenantId: string): T[] {
  return rows.filter((row) => row.tenantId === tenantId)
}
