import { describe, expect, it } from 'vitest'
import {
  evaluateMultiEntityAuthorizationShadow,
  evaluateProposedAuthorization,
  resolveMultiEntityAuthorizationMode,
  type AuthorizationSnapshot,
} from '../src/multi-entity-shadow'

const emptySnapshot: AuthorizationSnapshot = {
  groupMemberships: [],
  legalEntityMemberships: [],
}

const northSnapshot: AuthorizationSnapshot = {
  groupMemberships: [
    {
      userId: 'user-north',
      groupId: 'cep-group',
      status: 'active',
      capabilities: ['catalog.read', 'teachers.read'],
    },
  ],
  legalEntityMemberships: [
    {
      userId: 'user-north',
      legalEntityId: 'cep-north',
      status: 'active',
      capabilities: ['operations.manage', 'enrollments.read'],
      campusScope: { kind: 'selected', campusIds: ['north-main'] },
    },
  ],
}

describe('multi-entity authorization rollout safety', () => {
  it('keeps a legacy grant when the feature is disabled', () => {
    const result = evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'disabled',
      legacyAllowed: true,
      request: {
        scope: 'legal-entity',
        userId: 'user-without-membership',
        legalEntityId: 'cep-sur',
        capability: 'finance.read',
      },
      snapshot: emptySnapshot,
    })

    expect(result).toEqual({
      mode: 'disabled',
      decisionSource: 'legacy',
      effectiveAllowed: true,
      proposedDecision: null,
      divergence: null,
    })
  })

  it('does not expand a legacy denial in shadow mode', () => {
    const result = evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed: false,
      request: {
        scope: 'group',
        userId: 'user-north',
        groupId: 'cep-group',
        capability: 'catalog.read',
      },
      snapshot: northSnapshot,
    })

    expect(result.effectiveAllowed).toBe(false)
    expect(result.decisionSource).toBe('legacy')
    expect(result.proposedDecision).toEqual({
      allowed: true,
      reason: 'membership_allows',
    })
    expect(result.divergence).toBe(true)
  })

  it('does not revoke a legacy grant in shadow mode', () => {
    const result = evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed: true,
      request: {
        scope: 'legal-entity',
        userId: 'user-north',
        legalEntityId: 'cep-sur',
        capability: 'operations.read',
        campusId: 'sur-main',
      },
      snapshot: northSnapshot,
    })

    expect(result.effectiveAllowed).toBe(true)
    expect(result.proposedDecision).toEqual({
      allowed: false,
      reason: 'no_active_membership',
    })
    expect(result.divergence).toBe(true)
  })

  it.each(['enforced', 'true', '1', '', undefined])(
    'fails closed to disabled for unsupported mode %s',
    (configuredMode) => {
      expect(resolveMultiEntityAuthorizationMode(configuredMode)).toBe('disabled')
    }
  )
})

describe('proposed multi-entity boundaries', () => {
  it('rejects a membership from another legal entity', () => {
    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'user-north',
          legalEntityId: 'cep-sur',
          capability: 'operations.manage',
          campusId: 'sur-main',
        },
        northSnapshot
      )
    ).toEqual({ allowed: false, reason: 'no_active_membership' })
  })

  it('does not infer finance access from operational management', () => {
    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'user-north',
          legalEntityId: 'cep-north',
          capability: 'finance.read',
        },
        northSnapshot
      )
    ).toEqual({ allowed: false, reason: 'capability_missing' })
  })

  it('requires campus context for campus-bound operations', () => {
    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'user-north',
          legalEntityId: 'cep-north',
          capability: 'operations.manage',
        },
        northSnapshot
      )
    ).toEqual({ allowed: false, reason: 'campus_required' })
  })

  it('rejects an unassigned campus inside the correct legal entity', () => {
    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'user-north',
          legalEntityId: 'cep-north',
          capability: 'operations.manage',
          campusId: 'north-secondary',
        },
        northSnapshot
      )
    ).toEqual({ allowed: false, reason: 'campus_out_of_scope' })
  })

  it('rejects suspended memberships even when they contain finance access', () => {
    const suspendedSnapshot: AuthorizationSnapshot = {
      groupMemberships: [],
      legalEntityMemberships: [
        {
          userId: 'finance-user',
          legalEntityId: 'cep-sur',
          status: 'suspended',
          capabilities: ['finance.read'],
          campusScope: { kind: 'all' },
        },
      ],
    }

    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'finance-user',
          legalEntityId: 'cep-sur',
          capability: 'finance.read',
        },
        suspendedSnapshot
      )
    ).toEqual({ allowed: false, reason: 'no_active_membership' })
  })

  it('does not turn group catalog access into entity finance access', () => {
    expect(
      evaluateProposedAuthorization(
        {
          scope: 'legal-entity',
          userId: 'user-north',
          legalEntityId: 'cep-north',
          capability: 'finance.read',
        },
        northSnapshot
      )
    ).toEqual({ allowed: false, reason: 'capability_missing' })
  })
})
