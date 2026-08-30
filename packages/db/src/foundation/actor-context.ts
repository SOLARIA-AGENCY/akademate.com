import type {
  ActorChannel,
  ActorContext,
  ActorType,
  CorrelationId,
  OrganizationGroupId,
  PolicyDecision,
  TenantId,
} from '@akademate/types'
import { generateCorrelationId } from './ids'

export interface CreateActorContextInput {
  actorType: ActorType
  actorId: string
  purpose: string
  channel: ActorChannel
  tenantId?: TenantId
  accountId?: OrganizationGroupId
  delegatedBy?: string
  correlationId?: CorrelationId
  timestamp?: Date
  policyDecision?: PolicyDecision
  roles?: string[]
}

export function createActorContext(input: CreateActorContextInput): ActorContext {
  if (!input.actorId.trim()) {
    throw new Error('ActorContext requires actorId')
  }
  if (!input.purpose.trim()) {
    throw new Error('ActorContext requires purpose')
  }

  return {
    actorType: input.actorType,
    actorId: input.actorId,
    purpose: input.purpose,
    channel: input.channel,
    tenantId: input.tenantId,
    accountId: input.accountId,
    delegatedBy: input.delegatedBy,
    correlationId: input.correlationId ?? generateCorrelationId(),
    timestamp: input.timestamp ?? new Date(),
    policyDecision: input.policyDecision,
    roles: input.roles,
  }
}

export function assertAuthorizedActor(context: ActorContext): void {
  if (context.policyDecision === 'deny') {
    throw new Error(
      `Actor ${context.actorId} denied for purpose ${context.purpose} (correlation ${context.correlationId})`,
    )
  }
}
