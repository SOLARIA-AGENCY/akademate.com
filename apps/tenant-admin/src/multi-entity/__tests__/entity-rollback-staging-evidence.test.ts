import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EntityScopedRecordType } from '../../../../../packages/tenant/src/multi-entity-backfill'
import {
  createMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceSample,
  type MultiEntityRollbackRehearsalRole,
} from '../../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import type {
  MultiEntityRollbackDrillInput,
  MultiEntityRollbackFlagState,
} from '../../../../../packages/tenant/src/multi-entity-rollback-drill'
import {
  assertEntityRollbackStagingEvidenceManifest,
  createEntityRollbackStagingEvidenceManifest,
  serializeEntityRollbackStagingEvidenceManifest,
  type EntityRollbackStagingEvidenceInput,
} from '../entity-rollback-staging-evidence'
import {
  ENTITY_ROLLBACK_REVIEWED_READINESS_GATE,
  EntityRollbackBindingError,
  createEntityRollbackBindingProposal,
} from '../entity-rollback-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const accessBaselineDigest = `sha256:${'c'.repeat(64)}`
const labels = ['norte', 'santa-cruz', 'sur'] as const
const recordTypes: readonly EntityScopedRecordType[] = [
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
]

function flags(active: boolean): MultiEntityRollbackFlagState {
  return {
    AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: active,
    AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: active,
    AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: active,
    AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: active,
    AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: active ? 'shadow' : 'disabled',
  }
}

function globalSample(
  role: MultiEntityRollbackRehearsalRole
): MultiEntityRollbackRehearsalEvidenceSample {
  const reviewReference = `review://rollback/global/${role}/v1`
  const shared = {
    targetTenantId: 'tenant-private',
    reviewReference,
    accessBaseline: {
      capturedDigest: accessBaselineDigest,
      currentDigest: accessBaselineDigest,
    },
    flagState: flags(false),
  }
  if (role === 'full_reversible') {
    return {
      role,
      reviewReference,
      drillInput: {
        ...shared,
        flagState: flags(true),
        records: recordTypes.map((recordType) => ({
          operation: 'restore_null_if_unchanged' as const,
          recordType,
          recordId: `global-${recordType}`,
          tenantId: 'tenant-private',
          expectedLegalEntityId: 'entity-global-private',
          currentLegalEntityId: 'entity-global-private',
          restoreLegalEntityId: null,
        })),
      },
    }
  }
  if (role === 'access_drift_blocked') {
    return {
      role,
      reviewReference,
      drillInput: {
        ...shared,
        accessBaseline: {
          capturedDigest: accessBaselineDigest,
          currentDigest: `sha256:${'d'.repeat(64)}`,
        },
        records: [],
      },
    }
  }
  return {
    role,
    reviewReference,
    drillInput: {
      ...shared,
      records: [
        {
          operation: 'restore_null_if_unchanged',
          recordType: role === 'cross_tenant_blocked' ? 'course_run' : 'campaign',
          recordId: `global-${role}`,
          tenantId: role === 'cross_tenant_blocked' ? 'other-tenant' : 'tenant-private',
          expectedLegalEntityId: 'entity-global-private',
          currentLegalEntityId:
            role === 'changed_record_blocked' ? 'entity-changed-private' : 'entity-global-private',
          restoreLegalEntityId: null,
        },
      ],
    },
  }
}

function globalArtifact() {
  return createMultiEntityRollbackRehearsalEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      globalSample('full_reversible'),
      globalSample('access_drift_blocked'),
      globalSample('cross_tenant_blocked'),
      globalSample('changed_record_blocked'),
    ],
  })
}

function entityDrill(label: (typeof labels)[number]): MultiEntityRollbackDrillInput {
  return {
    targetTenantId: 'tenant-private',
    reviewReference: `review://rollback/entity/${label}/v1`,
    accessBaseline: {
      capturedDigest: accessBaselineDigest,
      currentDigest: accessBaselineDigest,
    },
    flagState: flags(false),
    records: recordTypes.map((recordType) => ({
      operation: 'restore_null_if_unchanged',
      recordType,
      recordId: `${label}-${recordType}-private`,
      tenantId: 'tenant-private',
      expectedLegalEntityId: `entity-${label}-private`,
      currentLegalEntityId: `entity-${label}-private`,
      restoreLegalEntityId: null,
    })),
  }
}

function input(): EntityRollbackStagingEvidenceInput {
  return {
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    globalRollbackArtifact: globalArtifact(),
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `accounting-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      rollbackReviewReference: `review://rollback/entity/${label}/v1`,
      ...(label === 'sur' ? { pilotReviewReference: 'review://rollback/entity/sur/pilot/v1' } : {}),
      drillInput: entityDrill(label),
    })),
  }
}

describe('entity rollback staging evidence', () => {
  it('seals three isolated CAS rollbacks linked to the global rehearsal', () => {
    const manifest = createEntityRollbackStagingEvidenceManifest(input())
    expect(manifest).toMatchObject({
      kind: 'cep_multi_entity_entity_rollback_staging_evidence',
      mode: 'three_entity_compare_and_set_rollback_review',
      verdict: 'eligible_for_manual_staging_binding',
      canWrite: false,
      canApply: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        reviewedEntityRollbacks: 3,
        readyEntityRollbacks: 3,
        recordTypesPerEntity: 6,
        reversibleRecords: 18,
        conflictedRecords: 0,
        pilotEntities: 1,
        appliedRollbacks: 0,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(new Set(manifest.entities.map((entity) => entity.accountingScopeDigest)).size).toBe(3)
    expect(manifest.entities.filter((entity) => entity.role === 'cep_sur_pilot')).toHaveLength(1)
    expect(JSON.stringify(manifest)).not.toMatch(/tenant-private|entity-sur-private|sur-enrollment/)
    expect(() => assertEntityRollbackStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('rejects cross-entity, changed and already-restored records', () => {
    for (const currentLegalEntityId of ['entity-other-private', null] as const) {
      const source = input()
      const first = source.samples[0]!
      source.samples[0] = {
        ...first,
        drillInput: {
          ...first.drillInput,
          records: [
            { ...first.drillInput.records[0]!, currentLegalEntityId },
            ...first.drillInput.records.slice(1),
          ],
        },
      }
      expect(() => createEntityRollbackStagingEvidenceManifest(source)).toThrow(
        'ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID'
      )
    }
  })

  it('rejects access drift and duplicated global flag shutdown', () => {
    const drift = input()
    drift.samples[0] = {
      ...drift.samples[0]!,
      drillInput: {
        ...drift.samples[0]!.drillInput,
        accessBaseline: {
          capturedDigest: accessBaselineDigest,
          currentDigest: `sha256:${'e'.repeat(64)}`,
        },
      },
    }
    expect(() => createEntityRollbackStagingEvidenceManifest(drift)).toThrow(
      'ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID'
    )

    const activeFlags = input()
    activeFlags.samples[1] = {
      ...activeFlags.samples[1]!,
      drillInput: { ...activeFlags.samples[1]!.drillInput, flagState: flags(true) },
    }
    expect(() => createEntityRollbackStagingEvidenceManifest(activeFlags)).toThrow(
      'ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects a record reused by another entity or a missing record type', () => {
    const reused = input()
    reused.samples[1] = {
      ...reused.samples[1]!,
      drillInput: {
        ...reused.samples[1]!.drillInput,
        records: [
          {
            ...reused.samples[1]!.drillInput.records[0]!,
            recordId: reused.samples[0]!.drillInput.records[0]!.recordId,
          },
          ...reused.samples[1]!.drillInput.records.slice(1),
        ],
      },
    }
    expect(() => createEntityRollbackStagingEvidenceManifest(reused)).toThrow(
      'ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID'
    )

    const duplicateType = input()
    duplicateType.samples[2] = {
      ...duplicateType.samples[2]!,
      drillInput: {
        ...duplicateType.samples[2]!.drillInput,
        records: duplicateType.samples[2]!.drillInput.records.map((record, index) =>
          index === 5 ? { ...record, recordType: 'campaign' } : record
        ),
      },
    }
    expect(() => createEntityRollbackStagingEvidenceManifest(duplicateType)).toThrow(
      'ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID'
    )
  })

  it('is deterministic and rejects forged artifact context', () => {
    const source = input()
    expect(
      serializeEntityRollbackStagingEvidenceManifest({
        ...source,
        samples: [...source.samples].reverse(),
      })
    ).toBe(serializeEntityRollbackStagingEvidenceManifest(source))

    const manifest = createEntityRollbackStagingEvidenceManifest(source)
    expect(() =>
      assertEntityRollbackStagingEvidenceManifest({
        ...manifest,
        entities: [
          { ...manifest.entities[0]!, globalRollbackArtifactDigest: `sha256:${'f'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      })
    ).toThrow('ENTITY_ROLLBACK_STAGING_EVIDENCE_INVALID')
  })

  it('exports no apply, execute, write or permission operation', async () => {
    const module = await import('../entity-rollback-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /apply|execute|write|activate|deploy|permission|rollbackNow/i.test(key)
      )
    ).toEqual([])
  })

  it('proposes three manual entity bindings without rollback authority', () => {
    const manifest = createEntityRollbackStagingEvidenceManifest(input())
    const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
    const proposal = createEntityRollbackBindingProposal({
      manifest,
      campaignReviewReference,
      readinessReviewReference,
      entities: manifest.entities.map((entity) => ({
        artifactDigest: entity.artifactDigest,
        entityReviewReference: reviews.find(
          (review) => entity.entityReviewReferenceDigest === digest(review)
        )!,
      })),
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canWrite: false,
      canApply: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
    })
    expect(proposal.bindings).toHaveLength(3)
    expect(
      proposal.bindings.every(
        (binding) =>
          binding.gate === ENTITY_ROLLBACK_REVIEWED_READINESS_GATE &&
          binding.artifactKind === 'cep_multi_entity_entity_rollback_review_evidence'
      )
    ).toBe(true)
  })

  it('rejects partial and cross-campaign binding proposals', () => {
    const manifest = createEntityRollbackStagingEvidenceManifest(input())
    const reviews = labels.map((label) => `review://finance/${label}/entity/v1`)
    const targets = manifest.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: reviews.find(
        (review) => entity.entityReviewReferenceDigest === digest(review)
      )!,
    }))
    const expectCode = (run: () => unknown, code: EntityRollbackBindingError['code']) =>
      expect(run).toThrowError(
        expect.objectContaining<Partial<EntityRollbackBindingError>>({ code })
      )
    expectCode(
      () =>
        createEntityRollbackBindingProposal({
          manifest,
          campaignReviewReference,
          readinessReviewReference,
          entities: targets.slice(1),
        }),
      'ENTITY_ROLLBACK_BINDING_INPUT_INVALID'
    )
    expectCode(
      () =>
        createEntityRollbackBindingProposal({
          manifest,
          campaignReviewReference: 'review://campaign/other/v1',
          readinessReviewReference,
          entities: targets,
        }),
      'ENTITY_ROLLBACK_CAMPAIGN_MISMATCH'
    )
  })
})

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}
