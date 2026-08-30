import { describe, expect, it } from 'vitest'
import {
  evaluateMultiEntityOperationalAccessShadow,
  resolveMultiEntityOperationalAccessMode,
  type AuthorizationSnapshot,
  type MultiEntityOperationalResourceOwner,
} from '../src/multi-entity-operational-access-shadow'

const northSnapshot: AuthorizationSnapshot = {
  groupMemberships: [],
  legalEntityMemberships: [
    {
      userId: 'user-north',
      legalEntityId: 'entity-north',
      status: 'active',
      capabilities: ['operations.read', 'enrollments.read', 'marketing.read'],
      campusScope: { kind: 'selected', campusIds: ['campus-north'] },
    },
  ],
}

const northEnrollment: MultiEntityOperationalResourceOwner = {
  resourceType: 'enrollment',
  resourceId: 'enrollment-north',
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-north',
  campusId: 'campus-north',
}

function input(
  overrides: Partial<Parameters<typeof evaluateMultiEntityOperationalAccessShadow>[0]> = {}
) {
  return {
    configuredMode: 'shadow',
    legacyAllowed: true,
    userId: 'user-north',
    tenantId: 'tenant-cep',
    resourceType: 'enrollment' as const,
    resourceId: 'enrollment-north',
    resource: northEnrollment,
    snapshot: northSnapshot,
    ...overrides,
  }
}

describe('multi-entity operational access shadow', () => {
  it('defaults unsupported modes to disabled without proposed authorization', () => {
    expect(resolveMultiEntityOperationalAccessMode('enforced')).toBe('disabled')
    expect(
      evaluateMultiEntityOperationalAccessShadow(
        input({ configuredMode: 'enforced', legacyAllowed: false })
      )
    ).toEqual({
      mode: 'disabled',
      decisionSource: 'legacy',
      effectiveAllowed: false,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      changePermissions: false,
    })
  })

  it('accepts an entity and campus match while preserving the legacy allow', () => {
    expect(evaluateMultiEntityOperationalAccessShadow(input())).toMatchObject({
      mode: 'shadow',
      effectiveAllowed: true,
      divergence: false,
      proposedDecision: {
        allowed: true,
        reason: 'membership_allows',
        capability: 'enrollments.read',
      },
      canApply: false,
      changePermissions: false,
    })
  })

  it('reports a cross-entity enrollment without revoking the current grant', () => {
    const evaluation = evaluateMultiEntityOperationalAccessShadow(
      input({
        resource: { ...northEnrollment, legalEntityId: 'entity-sur' },
      })
    )

    expect(evaluation.effectiveAllowed).toBe(true)
    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'no_active_membership',
      capability: 'enrollments.read',
    })
    expect(evaluation.divergence).toBe(true)
  })

  it('reports a cross-tenant resource even when the entity membership matches', () => {
    const evaluation = evaluateMultiEntityOperationalAccessShadow(
      input({
        resource: { ...northEnrollment, tenantId: 'tenant-other' },
      })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'tenant_mismatch',
    })
    expect(evaluation.effectiveAllowed).toBe(true)
  })

  it('allows a campaign without a campus because marketing is entity-bound', () => {
    const evaluation = evaluateMultiEntityOperationalAccessShadow(
      input({
        resourceType: 'campaign',
        resourceId: 'campaign-north',
        resource: {
          resourceType: 'campaign',
          resourceId: 'campaign-north',
          tenantId: 'tenant-cep',
          legalEntityId: 'entity-north',
        },
      })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: true,
      reason: 'membership_allows',
      capability: 'marketing.read',
    })
    expect(evaluation.divergence).toBe(false)
  })

  it('fails closed for an enrollment whose campus owner is unresolved', () => {
    const evaluation = evaluateMultiEntityOperationalAccessShadow(
      input({
        resource: { ...northEnrollment, campusId: null },
        legacyAllowed: false,
      })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'resource_scope_unresolved',
    })
    expect(evaluation.effectiveAllowed).toBe(false)
    expect(evaluation.divergence).toBe(false)
  })

  it('fails closed for a malformed request without throwing', () => {
    const evaluation = evaluateMultiEntityOperationalAccessShadow(
      input({ tenantId: '', resource: undefined as never })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'request_scope_unresolved',
    })
    expect(evaluation.effectiveAllowed).toBe(true)
  })
})
