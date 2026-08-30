import { describe, expect, it } from 'vitest'
import {
  createRedactedMultiEntityShadowObservation,
  summarizeMultiEntityShadowObservations,
} from '../src/multi-entity-observability'
import {
  evaluateMultiEntityAuthorizationShadow,
  type MultiEntityAccessRequest,
} from '../src/multi-entity-shadow'

const request: MultiEntityAccessRequest = {
  scope: 'legal-entity',
  userId: 'user-secret-id',
  legalEntityId: 'entity-secret-id',
  campusId: 'campus-secret-id',
  capability: 'finance.read',
}

describe('redacted multi-entity shadow observability', () => {
  it('allow-lists telemetry fields and does not serialize scope identifiers', () => {
    const evaluation = evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed: true,
      request,
      snapshot: { groupMemberships: [], legalEntityMemberships: [] },
    })
    const observation = createRedactedMultiEntityShadowObservation(request, evaluation)
    const serialized = JSON.stringify(observation)

    expect(observation).toEqual({
      mode: 'shadow',
      scope: 'legal-entity',
      capability: 'finance.read',
      legacyAllowed: true,
      proposedAllowed: false,
      proposedReason: 'no_active_membership',
      divergence: true,
    })
    expect(serialized).not.toContain('user-secret-id')
    expect(serialized).not.toContain('entity-secret-id')
    expect(serialized).not.toContain('campus-secret-id')
  })

  it('counts would-grant and would-revoke separately without changing effective decisions', () => {
    const wouldRevoke = createRedactedMultiEntityShadowObservation(
      request,
      evaluateMultiEntityAuthorizationShadow({
        configuredMode: 'shadow',
        legacyAllowed: true,
        request,
        snapshot: { groupMemberships: [], legalEntityMemberships: [] },
      })
    )
    const wouldGrant = createRedactedMultiEntityShadowObservation(
      request,
      evaluateMultiEntityAuthorizationShadow({
        configuredMode: 'shadow',
        legacyAllowed: false,
        request,
        snapshot: {
          groupMemberships: [],
          legalEntityMemberships: [
            {
              userId: request.userId,
              legalEntityId: request.legalEntityId,
              status: 'active',
              capabilities: ['finance.read'],
              campusScope: { kind: 'all' },
            },
          ],
        },
      })
    )

    expect(wouldRevoke.legacyAllowed).toBe(true)
    expect(wouldGrant.legacyAllowed).toBe(false)
    expect(summarizeMultiEntityShadowObservations([wouldRevoke, wouldGrant])).toEqual({
      total: 2,
      disabled: 0,
      evaluated: 2,
      divergences: 2,
      wouldGrant: 1,
      wouldRevoke: 1,
      byCapability: {
        'finance.read': {
          evaluated: 2,
          divergences: 2,
          wouldGrant: 1,
          wouldRevoke: 1,
          alignedAllow: 0,
          alignedDeny: 0,
        },
      },
    })
  })

  it('keeps disabled evaluations out of future-policy metrics', () => {
    const disabled = createRedactedMultiEntityShadowObservation(
      request,
      evaluateMultiEntityAuthorizationShadow({
        configuredMode: 'disabled',
        legacyAllowed: true,
        request,
        snapshot: { groupMemberships: [], legalEntityMemberships: [] },
      })
    )

    expect(summarizeMultiEntityShadowObservations([disabled])).toEqual({
      total: 1,
      disabled: 1,
      evaluated: 0,
      divergences: 0,
      wouldGrant: 0,
      wouldRevoke: 0,
      byCapability: {},
    })
  })

  it('fails closed on a malformed observation instead of fabricating metrics', () => {
    expect(() =>
      summarizeMultiEntityShadowObservations([
        {
          mode: 'shadow',
          scope: 'legal-entity',
          capability: 'finance.read',
          legacyAllowed: true,
          proposedAllowed: null,
          proposedReason: null,
          divergence: null,
        } as never,
      ])
    ).toThrow('Invalid redacted multi-entity shadow observation contract.')
  })

  it('rejects unknown or cross-scope capability keys before aggregation', () => {
    expect(() =>
      summarizeMultiEntityShadowObservations([
        {
          mode: 'shadow',
          scope: 'group',
          capability: '__proto__',
          legacyAllowed: true,
          proposedAllowed: false,
          proposedReason: 'capability_missing',
          divergence: true,
        } as never,
      ])
    ).toThrow('Invalid multi-entity scope/capability telemetry contract.')

    expect(() =>
      createRedactedMultiEntityShadowObservation(
        { ...request, scope: 'group', groupId: 'group', capability: 'finance.read' } as never,
        evaluateMultiEntityAuthorizationShadow({
          configuredMode: 'shadow',
          legacyAllowed: true,
          request,
          snapshot: { groupMemberships: [], legalEntityMemberships: [] },
        })
      )
    ).toThrow('Invalid multi-entity scope/capability telemetry contract.')
  })

  it('rejects fabricated divergence and decision-reason combinations', () => {
    const validEvaluation = evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed: true,
      request,
      snapshot: { groupMemberships: [], legalEntityMemberships: [] },
    })

    expect(() =>
      createRedactedMultiEntityShadowObservation(request, {
        ...validEvaluation,
        divergence: false,
      } as never)
    ).toThrow('Invalid multi-entity shadow evaluation contract.')

    expect(() =>
      summarizeMultiEntityShadowObservations([
        {
          mode: 'shadow',
          scope: 'legal-entity',
          capability: 'finance.read',
          legacyAllowed: false,
          proposedAllowed: true,
          proposedReason: 'capability_missing',
          divergence: true,
        },
      ])
    ).toThrow('Invalid redacted multi-entity shadow observation contract.')
  })
})
