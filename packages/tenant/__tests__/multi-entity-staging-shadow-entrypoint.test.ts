import { describe, expect, it, vi } from 'vitest'

import {
  MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_ENVIRONMENT,
  MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_FLAG,
  digestMultiEntityStagingShadowSnapshot,
  runMultiEntityStagingShadowEntrypoint,
  type ContentAddressedStagingSnapshot,
  type MultiEntityStagingShadowEntrypointOptions,
} from '../src/multi-entity-staging-shadow-entrypoint'
import { createMultiEntityRestoredBackupEvidenceArtifact } from '../src/multi-entity-restored-backup-evidence'
import type { MultiEntityShadowOwnershipReportInput } from '../src/multi-entity-shadow-ownership-report'
import type { UnifiedMultiEntityShadowInput } from '../src/multi-entity-unified-shadow-plan'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const payloadDigest = `sha256:${'f'.repeat(64)}`
const environment = {
  [MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_FLAG]: 'true',
  [MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_ENVIRONMENT]: 'staging',
}

const topology = {
  legalEntities: [{ id: 'entity-secret', tenantId: 'tenant-secret', status: 'validated' as const }],
  campuses: [{ id: 'campus-secret', tenantId: 'tenant-secret' }],
  campusBindings: [
    {
      id: 'binding-secret',
      tenantId: 'tenant-secret',
      legalEntityId: 'entity-secret',
      campusId: 'campus-secret',
      status: 'validated' as const,
    },
  ],
  staffAssignments: [],
  accountingConnections: [],
}

const unifiedValue: UnifiedMultiEntityShadowInput = {
  targetTenantId: 'tenant-secret',
  classrooms: [
    {
      id: 'classroom-secret',
      tenant: 'tenant-secret',
      campus: 'campus-secret',
      legalEntity: 'entity-secret',
    },
  ],
  courseRuns: [],
  enrollments: [],
  leads: [],
  campaigns: [],
  advertisingSpends: [],
  topology,
  explicitResolutions: [],
}

const ownershipValue: MultiEntityShadowOwnershipReportInput = {
  targetTenantId: 'tenant-secret',
  legalEntities: topology.legalEntities,
  campusBindings: topology.campusBindings,
  records: [
    {
      id: 'classroom-secret',
      recordType: 'classroom',
      tenantId: 'tenant-secret',
      legalEntityId: 'entity-secret',
      campusId: 'campus-secret',
    },
  ],
}

function envelope<T>(value: T): ContentAddressedStagingSnapshot<T> {
  return {
    sourceDigest,
    targetTenantDigest,
    snapshotDigest: digestMultiEntityStagingShadowSnapshot(value),
    value,
  }
}

function backup() {
  return createMultiEntityRestoredBackupEvidenceArtifact({
    restoreEnvironment: 'staging',
    campaignReviewReference: 'review://campaign/cep-shadow/001',
    readinessReviewReference: 'review://readiness/cep-shadow/001',
    sourceDigest,
    targetTenantDigest,
    backupManifestDigest: `sha256:${'c'.repeat(64)}`,
    restoreExecutionReportDigest: `sha256:${'d'.repeat(64)}`,
    verificationReportDigest: `sha256:${'e'.repeat(64)}`,
    backupPayloadDigest: payloadDigest,
    restoredPayloadDigest: payloadDigest,
  })
}

function options(): MultiEntityStagingShadowEntrypointOptions {
  return {
    environment,
    expectedSourceDigest: sourceDigest,
    expectedTargetTenantDigest: targetTenantDigest,
    adapters: {
      readUnifiedSnapshot: async () => envelope(unifiedValue),
      readOwnershipSnapshot: async () => envelope(ownershipValue),
      readRestoredBackupEvidence: async () => backup(),
    },
  }
}

describe('multi-entity staging shadow entrypoint', () => {
  it('records a deterministic, content-addressed and identifier-free execution', async () => {
    const first = await runMultiEntityStagingShadowEntrypoint(options())
    const second = await runMultiEntityStagingShadowEntrypoint(options())

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      status: 'recorded',
      reason: 'shadow_execution_recorded',
      canWrite: false,
      canApply: false,
      canRestore: false,
      canChangePermissions: false,
      record: {
        verdict: 'eligible_for_manual_review',
        metrics: {
          ledger: { runs: 1, readyRuns: 1 },
          ownership: { ready: 1, missing: 0, ambiguous: 0, crossScope: 0 },
          backup: { payloadDigestMatches: true, contractDatabaseWrites: 0 },
        },
      },
    })
    const serialized = JSON.stringify(first)
    for (const secret of [
      'tenant-secret',
      'entity-secret',
      'campus-secret',
      'classroom-secret',
      'review://',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('fails closed in production before invoking any adapter', async () => {
    const readUnifiedSnapshot = vi.fn(async () => envelope(unifiedValue))
    const configured = options()
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      environment: {
        [MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_FLAG]: 'true',
        [MULTI_ENTITY_STAGING_SHADOW_ENTRYPOINT_ENVIRONMENT]: 'production',
      },
      adapters: { ...configured.adapters, readUnifiedSnapshot },
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'production_forbidden' })
    expect(readUnifiedSnapshot).not.toHaveBeenCalled()
  })

  it('fails closed when a required adapter is absent', async () => {
    const configured = options()
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      adapters: {
        readUnifiedSnapshot: configured.adapters.readUnifiedSnapshot,
        readRestoredBackupEvidence: configured.adapters.readRestoredBackupEvidence,
      },
    } as never)

    expect(result).toEqual({
      status: 'blocked',
      reason: 'adapter_contract_invalid',
      canWrite: false,
      canApply: false,
      canRestore: false,
      canChangePermissions: false,
    })
  })

  it('fails closed when an adapter snapshot digest is inconsistent', async () => {
    const configured = options()
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      adapters: {
        ...configured.adapters,
        readUnifiedSnapshot: async () => ({
          ...envelope(unifiedValue),
          snapshotDigest: `sha256:${'0'.repeat(64)}`,
        }),
      },
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'snapshot_digest_inconsistent' })
  })

  it('rejects snapshots beyond the explicit contract limit before evaluation', async () => {
    const configured = options()
    const oversized = {
      ...unifiedValue,
      maxRecords: 1,
      classrooms: [...unifiedValue.classrooms, {}],
    }
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      adapters: {
        ...configured.adapters,
        readUnifiedSnapshot: async () => envelope(oversized as never),
      },
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'snapshot_limit_exceeded' })
  })

  it('rejects a write callback without calling it or any read adapter', async () => {
    const configured = options()
    const readUnifiedSnapshot = vi.fn(configured.adapters.readUnifiedSnapshot)
    const writeExecution = vi.fn()
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      adapters: {
        ...configured.adapters,
        readUnifiedSnapshot,
        writeExecution,
      },
    } as never)

    expect(result).toMatchObject({ status: 'blocked', reason: 'adapter_contract_invalid' })
    expect(readUnifiedSnapshot).not.toHaveBeenCalled()
    expect(writeExecution).not.toHaveBeenCalled()
  })

  it('binds every adapter to the expected source and tenant digests', async () => {
    const configured = options()
    const result = await runMultiEntityStagingShadowEntrypoint({
      ...configured,
      adapters: {
        ...configured.adapters,
        readOwnershipSnapshot: async () => ({
          ...envelope(ownershipValue),
          targetTenantDigest: `sha256:${'9'.repeat(64)}`,
        }),
      },
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'evidence_digest_inconsistent' })
  })

  it('canonicalizes unordered snapshot collections for reproducible digests', () => {
    expect(digestMultiEntityStagingShadowSnapshot({ values: ['b', 'a'] })).toBe(
      digestMultiEntityStagingShadowSnapshot({ values: ['a', 'b'] })
    )
  })
})
