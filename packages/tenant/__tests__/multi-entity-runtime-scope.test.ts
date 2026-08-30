import { describe, expect, it } from 'vitest'
import {
  evaluateMultiEntityRuntimeScopeShadow,
  resolveMultiEntityRuntimeScopeMode,
  type MultiEntityRuntimeResourceOwner,
  type MultiEntityRuntimeScopeContext,
} from '../src/multi-entity-runtime-scope'

const norteContext: MultiEntityRuntimeScopeContext = {
  tenantId: 'cep',
  legalEntityId: 'entity-norte',
  campusId: 'campus-norte',
}

const norteEnrollment: MultiEntityRuntimeResourceOwner = {
  resourceType: 'enrollment',
  resourceId: 'enrollment-norte',
  tenantId: 'cep',
  legalEntityId: 'entity-norte',
  campusId: 'campus-norte',
}

function input(
  overrides: Partial<Parameters<typeof evaluateMultiEntityRuntimeScopeShadow>[0]> = {}
) {
  return {
    configuredMode: 'shadow',
    legacyAllowed: true,
    context: norteContext,
    resourceType: 'enrollment' as const,
    resourceId: 'enrollment-norte',
    resource: norteEnrollment,
    ...overrides,
  }
}

describe('CEP multi-entity runtime scope', () => {
  it('defaults unknown mode to disabled and preserves the legacy decision', () => {
    expect(resolveMultiEntityRuntimeScopeMode('enforce')).toBe('disabled')
    expect(
      evaluateMultiEntityRuntimeScopeShadow({
        ...input({ configuredMode: 'enforce', legacyAllowed: false }),
      })
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

  it('allows an explicitly matching scope in shadow without changing permissions', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(input())

    expect(evaluation).toMatchObject({
      mode: 'shadow',
      decisionSource: 'legacy',
      effectiveAllowed: true,
      divergence: false,
      canApply: false,
      changePermissions: false,
      proposedDecision: {
        allowed: true,
        reason: 'scope_match',
      },
    })
  })

  it('reports an entity mismatch while preserving a legacy allow', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({
        resource: { ...norteEnrollment, legalEntityId: 'entity-sur' },
        legacyAllowed: true,
      })
    )

    expect(evaluation.effectiveAllowed).toBe(true)
    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'legal_entity_mismatch',
    })
    expect(evaluation.divergence).toBe(true)
  })

  it('evaluates leads with the same explicit tenant, entity and campus contract', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({
        resourceType: 'lead',
        resourceId: 'lead-norte',
        resource: {
          resourceType: 'lead',
          resourceId: 'lead-norte',
          tenantId: 'cep',
          legalEntityId: 'entity-norte',
          campusId: 'campus-norte',
        },
      })
    )

    expect(evaluation).toMatchObject({
      mode: 'shadow',
      effectiveAllowed: true,
      divergence: false,
      proposedDecision: {
        allowed: true,
        reason: 'scope_match',
        resourceType: 'lead',
        resourceId: 'lead-norte',
      },
      canApply: false,
      changePermissions: false,
    })
  })

  it('reports a campus mismatch for a shared resource assigned to another sede', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({
        resourceType: 'course_run',
        resourceId: 'run-sur',
        resource: {
          resourceType: 'course_run',
          resourceId: 'run-sur',
          tenantId: 'cep',
          legalEntityId: 'entity-norte',
          campusId: 'campus-sur',
        },
      })
    )

    expect(evaluation.proposedDecision).toEqual({
      allowed: false,
      reason: 'campus_mismatch',
      resourceType: 'course_run',
      resourceId: 'run-sur',
    })
  })

  it('fails closed when the request scope is incomplete', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({ context: { tenantId: 'cep', legalEntityId: 'entity-norte' } })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'request_scope_unresolved',
    })
    expect(evaluation.effectiveAllowed).toBe(true)
    expect(evaluation.canApply).toBe(false)
  })

  it('fails closed when a legacy resource has no entity or campus owner', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({ resource: { ...norteEnrollment, legalEntityId: null, campusId: null } })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'resource_scope_unresolved',
    })
  })

  it('rejects a cross-tenant media resource even when its ids look valid', () => {
    expect(
      evaluateMultiEntityRuntimeScopeShadow(
        input({
          resourceType: 'media',
          resourceId: 'media-sur',
          resource: {
            resourceType: 'media',
            resourceId: 'media-sur',
            tenantId: 'other-tenant',
            legalEntityId: 'entity-sur',
            campusId: 'campus-sur',
          },
        })
      ).proposedDecision
    ).toMatchObject({ allowed: false, reason: 'tenant_mismatch' })
  })

  it('does not treat a missing resource as confirmed absence or grant access', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({ resource: null, legacyAllowed: false })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'resource_missing',
    })
    expect(evaluation.effectiveAllowed).toBe(false)
    expect(evaluation.divergence).toBe(false)
  })

  it('rejects a resource whose declared type or identifier differs from the request', () => {
    expect(
      evaluateMultiEntityRuntimeScopeShadow(
        input({
          resourceType: 'campaign',
          resourceId: 'campaign-norte',
          resource: norteEnrollment,
        })
      ).proposedDecision
    ).toMatchObject({ allowed: false, reason: 'resource_type_mismatch' })

    expect(
      evaluateMultiEntityRuntimeScopeShadow(
        input({
          resourceId: 'campaign-norte',
          resource: { ...norteEnrollment, resourceId: 'different-id' },
        })
      ).proposedDecision
    ).toMatchObject({ allowed: false, reason: 'resource_id_mismatch' })
  })

  it('fails closed for malformed DTOs instead of throwing', () => {
    const evaluation = evaluateMultiEntityRuntimeScopeShadow(
      input({ context: null as never, resource: undefined as never })
    )

    expect(evaluation.proposedDecision).toMatchObject({
      allowed: false,
      reason: 'request_scope_unresolved',
      resourceType: 'enrollment',
      resourceId: 'enrollment-norte',
    })
    expect(evaluation.effectiveAllowed).toBe(true)
  })
})
