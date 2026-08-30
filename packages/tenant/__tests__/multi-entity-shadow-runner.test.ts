import { describe, expect, it, vi } from 'vitest'
import {
  MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG,
  resolveUnifiedLedgerShadowRunnerGate,
  runUnifiedLedgerShadowEvidence,
} from '../src/multi-entity-shadow-runner'
import type { UnifiedMultiEntityShadowInput } from '../src/multi-entity-unified-shadow-plan'

const enabledEnvironment = {
  [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG]: 'true',
  [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

const input: UnifiedMultiEntityShadowInput = {
  targetTenantId: 'tenant-secret-id',
  classrooms: [
    { id: 'classroom-secret-id', tenant: 'tenant-secret-id', campus: 'campus-secret-id' },
  ],
  courseRuns: [],
  enrollments: [],
  leads: [],
  campaigns: [{ id: 'campaign-secret-id', tenant: 'tenant-secret-id' }],
  advertisingSpends: [
    {
      id: 'spend-secret-id',
      tenant: 'tenant-secret-id',
      campaign: 'campaign-secret-id',
    },
  ],
  topology: {
    legalEntities: [{ id: 'entity-secret-id', tenantId: 'tenant-secret-id', status: 'validated' }],
    campuses: [{ id: 'campus-secret-id', tenantId: 'tenant-secret-id' }],
    campusBindings: [
      {
        id: 'binding-secret-id',
        tenantId: 'tenant-secret-id',
        legalEntityId: 'entity-secret-id',
        campusId: 'campus-secret-id',
        status: 'validated',
      },
    ],
    staffAssignments: [],
    accountingConnections: [],
  },
  explicitResolutions: [
    {
      recordType: 'campaign',
      recordId: 'campaign-secret-id',
      proposedLegalEntityId: 'entity-secret-id',
      reviewReference: 'review://secret-reference/001',
    },
  ],
}

describe('unified ledger staging shadow runner', () => {
  it('does not call the loader when the flag is disabled', async () => {
    const loadSnapshot = vi.fn(async () => input)

    await expect(
      runUnifiedLedgerShadowEvidence({ environment: {}, loadSnapshot })
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it.each([
    [{ [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed outside explicit staging: %o', async (environment, reason) => {
    const loadSnapshot = vi.fn(async () => input)

    expect(resolveUnifiedLedgerShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
    const result = await runUnifiedLedgerShadowEvidence({ environment, loadSnapshot })
    expect(result).toMatchObject({ status: 'skipped', reason })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('loads exactly once and returns only redacted evidence in staging', async () => {
    const loadSnapshot = vi.fn(async () => input)
    const result = await runUnifiedLedgerShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot,
    })

    expect(loadSnapshot).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      manifest: { verdict: 'ready', metrics: { runs: 1 } },
    })
    const serialized = JSON.stringify(result)
    for (const secret of [
      'tenant-secret-id',
      'entity-secret-id',
      'campus-secret-id',
      'campaign-secret-id',
      'spend-secret-id',
      'review://secret-reference/001',
    ]) {
      expect(serialized).not.toContain(secret)
    }
    expect(Object.keys(result)).toEqual([
      'status',
      'reason',
      'canWrite',
      'canApply',
      'manifest',
      'serializedManifest',
    ])
  })

  it('returns a blocked manifest as evidence instead of treating it as a runner failure', async () => {
    const result = await runUnifiedLedgerShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({ ...input, explicitResolutions: [] }),
    })

    expect(result).toMatchObject({
      status: 'observed',
      manifest: { verdict: 'blocked', metrics: { unresolvedRecords: 2 } },
    })
  })

  it('redacts loader failures instead of returning provider or credential details', async () => {
    const result = await runUnifiedLedgerShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => {
        throw new Error('Bearer provider-secret-value')
      },
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('provider-secret-value')
  })

  it('redacts malformed snapshot failures without returning the snapshot', async () => {
    const result = await runUnifiedLedgerShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => null as never,
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
    })
  })
})
