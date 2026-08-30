import { describe, expect, it } from 'vitest'

import type { EntityScopedRecordType } from '../../../../../packages/tenant/src/multi-entity-backfill'
import {
  createMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceSample,
  type MultiEntityRollbackRehearsalRole,
} from '../../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import {
  ROLLBACK_REHEARSED_READINESS_GATE,
  RollbackRehearsalEvidenceBindingError,
  createRollbackRehearsalEvidenceBindingProposal,
} from '../rollback-rehearsal-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const accessDigest = `sha256:${'c'.repeat(64)}`
const recordTypes: readonly EntityScopedRecordType[] = [
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
]

function flags(active: boolean) {
  return {
    AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: active,
    AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: active,
    AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: active,
    AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: active,
    AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: active ? ('shadow' as const) : ('disabled' as const),
  }
}

function sample(
  role: MultiEntityRollbackRehearsalRole
): MultiEntityRollbackRehearsalEvidenceSample {
  const reviewReference = `review://rollback/${role}/v1`
  const record = (recordType: EntityScopedRecordType) => ({
    operation: 'restore_null_if_unchanged' as const,
    recordType,
    recordId: `private-${recordType}`,
    tenantId: 'tenant-private',
    expectedLegalEntityId: 'entity-private',
    currentLegalEntityId: 'entity-private',
    restoreLegalEntityId: null,
  })
  const shared = {
    targetTenantId: 'tenant-private',
    reviewReference,
    accessBaseline: { capturedDigest: accessDigest, currentDigest: accessDigest },
    flagState: flags(false),
  }
  if (role === 'full_reversible') {
    return {
      role,
      reviewReference,
      drillInput: {
        ...shared,
        flagState: flags(true),
        records: recordTypes.map(record),
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
          capturedDigest: accessDigest,
          currentDigest: `sha256:${'d'.repeat(64)}`,
        },
        records: [],
      },
    }
  }
  const selected = record(role === 'cross_tenant_blocked' ? 'course_run' : 'campaign')
  return {
    role,
    reviewReference,
    drillInput: {
      ...shared,
      records: [
        role === 'cross_tenant_blocked'
          ? { ...selected, tenantId: 'other-private' }
          : { ...selected, currentLegalEntityId: 'changed-private' },
      ],
    },
  }
}

function artifact() {
  return createMultiEntityRollbackRehearsalEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      sample('full_reversible'),
      sample('access_drift_blocked'),
      sample('cross_tenant_blocked'),
      sample('changed_record_blocked'),
    ],
  })
}

function expectCode(action: () => unknown, code: RollbackRehearsalEvidenceBindingError['code']) {
  expect(action).toThrowError(
    expect.objectContaining<Partial<RollbackRehearsalEvidenceBindingError>>({ code })
  )
}

describe('rollback rehearsal evidence binding proposal', () => {
  it('proposes only the exact rollback gate without applying anything', () => {
    const source = artifact()
    const proposal = createRollbackRehearsalEvidenceBindingProposal({
      artifact: source,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toEqual({
      schemaVersion: 1,
      mode: 'manual_rollback_rehearsal_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canWrite: false,
      canApply: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: ROLLBACK_REHEARSED_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: source.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: 'cep_multi_entity_rollback_rehearsal_evidence',
        artifactDigest: source.artifactDigest,
      },
    })
    expect(Object.isFrozen(proposal.binding)).toBe(true)
  })

  it.each([
    ['campaign', 'review://campaign/other/v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://readiness/other/v1'],
  ])('rejects reuse under another %s review', (_label, campaign, readiness) => {
    expectCode(
      () =>
        createRollbackRehearsalEvidenceBindingProposal({
          artifact: artifact(),
          campaignReviewReference: campaign,
          readinessReviewReference: readiness,
        }),
      'ROLLBACK_REHEARSAL_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a forged artifact', () => {
    expectCode(
      () =>
        createRollbackRehearsalEvidenceBindingProposal({
          artifact: { ...artifact(), canApply: true } as never,
          campaignReviewReference,
          readinessReviewReference,
        }),
      'ROLLBACK_REHEARSAL_EVIDENCE_ARTIFACT_INVALID'
    )
  })

  it('rejects automation metadata and exports no execution operation', async () => {
    expectCode(
      () =>
        createRollbackRehearsalEvidenceBindingProposal({
          artifact: artifact(),
          campaignReviewReference,
          readinessReviewReference,
          execute: true,
        } as never),
      'ROLLBACK_REHEARSAL_EVIDENCE_BINDING_INPUT_INVALID'
    )
    const module = await import('../rollback-rehearsal-evidence-binding')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['execute', 'apply', 'rollback', 'activate', 'markVerified'])
    )
  })
})
