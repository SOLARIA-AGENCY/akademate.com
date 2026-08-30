import { describe, expect, it } from 'vitest'

import {
  evaluateFinanceReadAuthorizationShadow,
  evaluateProposedFinanceReadAuthorization,
  resolveFinanceReadAuthorizationMode,
  type FinanceReadAuthorizationInput,
} from '../src'

const scope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  connectionId: 'connection-sur',
} as const

const reviewedConnection = {
  scope,
  integrationMode: 'read_only' as const,
  connectionStatus: 'active' as const,
  reviewReference: 'review://finance/sur/connection/v1',
}

function input(
  overrides: Partial<FinanceReadAuthorizationInput> = {}
): FinanceReadAuthorizationInput {
  return {
    configuredMode: 'shadow',
    currentEffectiveAllowed: false,
    principal: {
      userId: 'user-finance-sur',
      tenantId: scope.tenantId,
      isPlatformSuperadmin: false,
    },
    scope,
    memberships: [
      {
        userId: 'user-finance-sur',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        status: 'active',
        capabilities: ['finance.read'],
      },
    ],
    reviewedConnections: [reviewedConnection],
    ...overrides,
  }
}

describe('finance read authorization rollout safety', () => {
  it('keeps the legacy decision and performs no proposed authorization when disabled', () => {
    const result = evaluateFinanceReadAuthorizationShadow(
      input({
        configuredMode: 'disabled',
        currentEffectiveAllowed: true,
        memberships: [] as FinanceReadAuthorizationInput['memberships'],
        reviewedConnections: [],
      })
    )

    expect(result).toEqual({
      mode: 'disabled',
      decisionSource: 'legacy',
      effectiveAllowed: true,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      canChangePermissions: false,
    })
  })

  it('allows only an explicit finance.read membership for one reviewed read-only connection', () => {
    expect(evaluateProposedFinanceReadAuthorization(input())).toEqual({
      allowed: true,
      reason: 'membership_allows',
    })
  })

  it('never replaces the legacy decision in shadow mode', () => {
    const result = evaluateFinanceReadAuthorizationShadow(input({ currentEffectiveAllowed: true }))

    expect(result.effectiveAllowed).toBe(true)
    expect(result.proposedDecision).toEqual({ allowed: true, reason: 'membership_allows' })
    expect(result.divergence).toBe(false)
    expect(result.canApply).toBe(false)
    expect(result.canChangePermissions).toBe(false)
  })

  it('reports a legacy divergence without enforcing the future denial', () => {
    const result = evaluateFinanceReadAuthorizationShadow(
      input({
        currentEffectiveAllowed: true,
        memberships: [],
      })
    )

    expect(result.effectiveAllowed).toBe(true)
    expect(result.proposedDecision).toEqual({ allowed: false, reason: 'membership_missing' })
    expect(result.divergence).toBe(true)
  })

  it.each([
    [
      'tenant mismatch',
      { principal: { ...input().principal, tenantId: 'tenant-other' } },
      'tenant_mismatch',
    ],
    [
      'entity membership missing',
      { memberships: [] as FinanceReadAuthorizationInput['memberships'] },
      'membership_missing',
    ],
    [
      'finance capability missing',
      {
        memberships: [
          {
            ...input().memberships[0]!,
            capabilities: ['finance.manage' as const],
          },
        ],
      },
      'capability_missing',
    ],
    ['connection not reviewed', { reviewedConnections: [] }, 'connection_not_reviewed'],
    [
      'connection inactive',
      {
        reviewedConnections: [{ ...reviewedConnection, connectionStatus: 'suspended' as const }],
      },
      'connection_inactive',
    ],
    [
      'connection not read-only',
      {
        reviewedConnections: [{ ...reviewedConnection, integrationMode: 'write' as const }],
      },
      'connection_not_read_only',
    ],
  ])('fails closed for %s', (_label, overrides, reason) => {
    expect(evaluateProposedFinanceReadAuthorization(input(overrides))).toEqual({
      allowed: false,
      reason,
    })
  })

  it('does not treat a platform superadmin as a business finance membership', () => {
    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          principal: {
            userId: 'platform-admin',
            tenantId: scope.tenantId,
            isPlatformSuperadmin: true,
          },
          memberships: [],
        })
      )
    ).toEqual({ allowed: false, reason: 'platform_superadmin_not_business_authority' })
  })

  it('denies an active membership from another entity in the same tenant', () => {
    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          memberships: [
            {
              ...input().memberships[0]!,
              legalEntityId: 'entity-north',
            },
          ],
        })
      )
    ).toEqual({ allowed: false, reason: 'membership_missing' })
  })

  it('denies a reviewed connection from another entity in the same tenant', () => {
    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          reviewedConnections: [
            {
              ...reviewedConnection,
              scope: { ...scope, legalEntityId: 'entity-north' },
              reviewReference: 'review://finance/north/connection/v1',
            },
          ],
        })
      )
    ).toEqual({ allowed: false, reason: 'connection_not_reviewed' })
  })

  it('denies malformed authorization data instead of throwing a potentially permissive error', () => {
    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          principal: { ...input().principal, tenantId: null },
        })
      )
    ).toEqual({ allowed: false, reason: 'tenant_mismatch' })

    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          reviewedConnections: [
            {
              ...reviewedConnection,
              reviewReference: 'not-a-review-reference',
            },
          ],
        })
      )
    ).toEqual({ allowed: false, reason: 'input_invalid' })
  })

  it('rejects duplicate entity connections before a decision can be made', () => {
    expect(
      evaluateProposedFinanceReadAuthorization(
        input({
          reviewedConnections: [
            reviewedConnection,
            {
              ...reviewedConnection,
              scope: { ...scope, connectionId: 'connection-sur-2' },
              reviewReference: 'review://finance/sur/connection/v2',
            },
          ],
        })
      )
    ).toEqual({ allowed: false, reason: 'input_invalid' })
  })

  it.each(['enforced', 'true', '1', '', undefined])(
    'fails closed to disabled for unsupported mode %s',
    (configuredMode) => {
      expect(resolveFinanceReadAuthorizationMode(configuredMode)).toBe('disabled')
    }
  )
})
