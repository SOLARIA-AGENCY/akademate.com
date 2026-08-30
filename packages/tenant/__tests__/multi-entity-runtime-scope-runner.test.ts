import { describe, expect, it, vi } from 'vitest'
import {
  MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV,
  MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG,
  createMultiEntityRuntimeScopeShadowEvidenceManifest,
  resolveMultiEntityRuntimeScopeShadowRunnerGate,
  runMultiEntityRuntimeScopeShadowEvidence,
  type MultiEntityRuntimeScopeShadowSnapshot,
} from '../src/multi-entity-runtime-scope-runner'

const enabledEnvironment = {
  [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG]: 'true',
  [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
  [MULTI_ENTITY_RUNTIME_SCOPE_MODE_ENV]: 'shadow',
}

const snapshot: MultiEntityRuntimeScopeShadowSnapshot = {
  records: [
    {
      context: { tenantId: 'cep', legalEntityId: 'entity-norte', campusId: 'campus-norte' },
      resourceType: 'enrollment',
      resourceId: 'enrollment-secret-norte',
      resource: {
        resourceType: 'enrollment',
        resourceId: 'enrollment-secret-norte',
        tenantId: 'cep',
        legalEntityId: 'entity-norte',
        campusId: 'campus-norte',
      },
      legacyAllowed: true,
    },
    {
      context: { tenantId: 'cep', legalEntityId: 'entity-norte', campusId: 'campus-norte' },
      resourceType: 'campaign',
      resourceId: 'campaign-secret-sur',
      resource: {
        resourceType: 'campaign',
        resourceId: 'campaign-secret-sur',
        tenantId: 'cep',
        legalEntityId: 'entity-sur',
        campusId: 'campus-sur',
      },
      legacyAllowed: true,
    },
  ],
}

describe('multi-entity runtime scope shadow runner', () => {
  it('does not load snapshots when the flag is disabled', async () => {
    const loadSnapshot = vi.fn(async () => snapshot)

    await expect(
      runMultiEntityRuntimeScopeShadowEvidence({ environment: {}, loadSnapshot })
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it.each([
    [{ [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed outside explicit staging: %o', async (environment, reason) => {
    const loadSnapshot = vi.fn(async () => snapshot)

    expect(resolveMultiEntityRuntimeScopeShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
    await expect(
      runMultiEntityRuntimeScopeShadowEvidence({ environment, loadSnapshot })
    ).resolves.toMatchObject({ status: 'skipped', reason })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('returns redacted blocked metrics in staging without changing the legacy decision', async () => {
    const loadSnapshot = vi.fn(async () => snapshot)
    const result = await runMultiEntityRuntimeScopeShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot,
    })

    expect(loadSnapshot).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
      manifest: {
        verdict: 'blocked',
        metrics: {
          total: 2,
          evaluated: 2,
          divergences: 1,
          wouldGrant: 0,
          wouldRevoke: 1,
          unresolved: 0,
        },
      },
    })

    const serialized = JSON.stringify(result)
    for (const secret of [
      'enrollment-secret-norte',
      'campaign-secret-sur',
      'entity-norte',
      'entity-sur',
      'campus-norte',
      'campus-sur',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('requires the explicit runtime scope mode in addition to the staging flag', async () => {
    const loadSnapshot = vi.fn(async () => snapshot)
    const environment = {
      [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_FLAG]: 'true',
      [MULTI_ENTITY_RUNTIME_SCOPE_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
    }

    expect(resolveMultiEntityRuntimeScopeShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason: 'scope_mode_disabled',
    })
    await expect(
      runMultiEntityRuntimeScopeShadowEvidence({ environment, loadSnapshot })
    ).resolves.toMatchObject({ status: 'skipped', reason: 'scope_mode_disabled' })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('reports insufficient evidence for an empty snapshot', () => {
    expect(createMultiEntityRuntimeScopeShadowEvidenceManifest({ records: [] })).toEqual({
      schemaVersion: 1,
      kind: 'cep_multi_entity_runtime_scope_shadow',
      mode: 'shadow_evidence',
      canWrite: false,
      canApply: false,
      changePermissions: false,
      verdict: 'insufficient_evidence',
      metrics: {
        total: 0,
        evaluated: 0,
        divergences: 0,
        wouldGrant: 0,
        wouldRevoke: 0,
        unresolved: 0,
        byReason: {
          scope_match: 0,
          request_scope_unresolved: 0,
          resource_missing: 0,
          resource_scope_unresolved: 0,
          resource_type_mismatch: 0,
          resource_id_mismatch: 0,
          tenant_mismatch: 0,
          legal_entity_mismatch: 0,
          campus_mismatch: 0,
        },
        byResourceType: {
          enrollment: {
            evaluated: 0,
            divergences: 0,
            wouldGrant: 0,
            wouldRevoke: 0,
            unresolved: 0,
          },
          course_run: {
            evaluated: 0,
            divergences: 0,
            wouldGrant: 0,
            wouldRevoke: 0,
            unresolved: 0,
          },
          campaign: { evaluated: 0, divergences: 0, wouldGrant: 0, wouldRevoke: 0, unresolved: 0 },
          lead: { evaluated: 0, divergences: 0, wouldGrant: 0, wouldRevoke: 0, unresolved: 0 },
          media: { evaluated: 0, divergences: 0, wouldGrant: 0, wouldRevoke: 0, unresolved: 0 },
        },
      },
    })
  })

  it('redacts loader and malformed snapshot failures', async () => {
    await expect(
      runMultiEntityRuntimeScopeShadowEvidence({
        environment: enabledEnvironment,
        loadSnapshot: async () => {
          throw new Error('Bearer secret-token')
        },
      })
    ).resolves.toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })

    const malformed = await runMultiEntityRuntimeScopeShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => null as never,
    })
    expect(malformed).toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  })

  it('fails closed when the snapshot exceeds the hard bound', async () => {
    const tooMany = Array.from({ length: 10_001 }, () => snapshot.records[0]!)
    const result = await runMultiEntityRuntimeScopeShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({ records: tooMany }),
    })

    expect(result).toMatchObject({ status: 'failed', reason: 'shadow_planning_failed' })
    expect(JSON.stringify(result)).not.toContain('enrollment-secret-norte')
  })

  it('rejects snapshots with unexpected fields before producing metrics', async () => {
    const malformedRecord = {
      ...snapshot.records[0]!,
      leakedSecret: 'secret-that-must-not-escape',
    }
    const result = await runMultiEntityRuntimeScopeShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({ records: [malformedRecord] as never }),
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
    expect(JSON.stringify(result)).not.toContain('secret-that-must-not-escape')
  })

  it('rejects unexpected snapshot container fields before producing metrics', async () => {
    const result = await runMultiEntityRuntimeScopeShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () =>
        ({
          records: snapshot.records,
          leakedSecret: 'container-secret-that-must-not-escape',
        }) as never,
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
    expect(JSON.stringify(result)).not.toContain('container-secret-that-must-not-escape')
  })

  it('fails closed for malformed runner options instead of throwing', async () => {
    await expect(runMultiEntityRuntimeScopeShadowEvidence(null as never)).resolves.toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })

    await expect(
      runMultiEntityRuntimeScopeShadowEvidence({
        environment: null as never,
        loadSnapshot: async () => snapshot,
      })
    ).resolves.toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
      changePermissions: false,
    })
  })
})
