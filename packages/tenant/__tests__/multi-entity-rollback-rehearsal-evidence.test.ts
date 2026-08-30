import { describe, expect, it } from 'vitest'

import type { EntityScopedRecordType } from '../src/multi-entity-backfill'
import {
  assertMultiEntityRollbackRehearsalEvidenceArtifact,
  createMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceSample,
  type MultiEntityRollbackRehearsalRole,
} from '../src/multi-entity-rollback-rehearsal-evidence'
import type {
  MultiEntityRollbackFlagState,
  MultiEntityRollbackRecord,
} from '../src/multi-entity-rollback-drill'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const accessDigest = `sha256:${'c'.repeat(64)}`
const targetTenantId = 'tenant-private'
const entityId = 'entity-private'
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

function record(
  recordType: EntityScopedRecordType,
  change: Partial<MultiEntityRollbackRecord> = {}
): MultiEntityRollbackRecord {
  return {
    operation: 'restore_null_if_unchanged',
    recordType,
    recordId: `private-${recordType}`,
    tenantId: targetTenantId,
    expectedLegalEntityId: entityId,
    currentLegalEntityId: entityId,
    restoreLegalEntityId: null,
    ...change,
  }
}

function sample(
  role: MultiEntityRollbackRehearsalRole
): MultiEntityRollbackRehearsalEvidenceSample {
  const reviewReference = `review://rollback/${role}/v1`
  if (role === 'full_reversible') {
    return {
      role,
      reviewReference,
      drillInput: {
        targetTenantId,
        reviewReference,
        accessBaseline: { capturedDigest: accessDigest, currentDigest: accessDigest },
        flagState: flags(true),
        records: recordTypes.map((recordType) => record(recordType)),
      },
    }
  }
  if (role === 'access_drift_blocked') {
    return {
      role,
      reviewReference,
      drillInput: {
        targetTenantId,
        reviewReference,
        accessBaseline: {
          capturedDigest: accessDigest,
          currentDigest: `sha256:${'d'.repeat(64)}`,
        },
        flagState: flags(false),
        records: [],
      },
    }
  }
  if (role === 'cross_tenant_blocked') {
    return {
      role,
      reviewReference,
      drillInput: {
        targetTenantId,
        reviewReference,
        accessBaseline: { capturedDigest: accessDigest, currentDigest: accessDigest },
        flagState: flags(false),
        records: [record('course_run', { tenantId: 'other-tenant-private' })],
      },
    }
  }
  return {
    role,
    reviewReference,
    drillInput: {
      targetTenantId,
      reviewReference,
      accessBaseline: { capturedDigest: accessDigest, currentDigest: accessDigest },
      flagState: flags(false),
      records: [record('campaign', { currentLegalEntityId: 'changed-entity-private' })],
    },
  }
}

function samples(): MultiEntityRollbackRehearsalEvidenceSample[] {
  return [
    sample('full_reversible'),
    sample('access_drift_blocked'),
    sample('cross_tenant_blocked'),
    sample('changed_record_blocked'),
  ]
}

function artifact() {
  return createMultiEntityRollbackRehearsalEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: samples(),
  })
}

describe('multi-entity rollback rehearsal evidence', () => {
  it('seals one complete rehearsal and three independent fail-closed cases', () => {
    const result = artifact()
    expect(result).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_rollback_rehearsal_evidence',
      mode: 'four_case_fail_closed_rehearsal',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canWrite: false,
      canApply: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 4,
        readyCases: 1,
        blockedCases: 3,
        knownFlagsExercised: 9,
        recordTypesExercised: 6,
        negativeCases: 3,
      },
    })
    expect(result.cases).toHaveLength(4)
    expect(result.cases.find(({ role }) => role === 'full_reversible')).toMatchObject({
      verdict: 'ready_for_staging_rehearsal',
      expectedIssue: null,
      metrics: { flagsToDisable: 9, totalRecords: 6, reversibleRecords: 6, issues: 0 },
    })
    expect(result.cases.filter(({ verdict }) => verdict === 'blocked')).toHaveLength(3)
    expect(() => assertMultiEntityRollbackRehearsalEvidenceArtifact(result)).not.toThrow()
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.cases)).toBe(true)
  })

  it('is deterministic under sample and record reordering', () => {
    const source = samples()
    const positive = source.find(({ role }) => role === 'full_reversible')!
    const reordered = source.map((entry) =>
      entry.role === 'full_reversible'
        ? {
            ...entry,
            drillInput: {
              ...positive.drillInput,
              records: [...positive.drillInput.records].reverse(),
            },
          }
        : entry
    )
    const second = createMultiEntityRollbackRehearsalEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      samples: reordered.reverse(),
    })
    expect(second).toEqual(artifact())
  })

  it.each([
    ['missing case', samples().slice(0, 3)],
    [
      'duplicate role',
      [
        sample('full_reversible'),
        { ...sample('full_reversible'), reviewReference: 'review://rollback/duplicate/v1' },
        sample('cross_tenant_blocked'),
        sample('changed_record_blocked'),
      ],
    ],
  ])('rejects incomplete matrix: %s', (_label, source) => {
    expect(() =>
      createMultiEntityRollbackRehearsalEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source as MultiEntityRollbackRehearsalEvidenceSample[],
      })
    ).toThrow('MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID')
  })

  it('rejects a positive rehearsal that skips one record type', () => {
    const source = samples()
    const positive = source.find(({ role }) => role === 'full_reversible')!
    const reduced = {
      ...positive,
      drillInput: { ...positive.drillInput, records: positive.drillInput.records.slice(0, 5) },
    }
    expect(() =>
      createMultiEntityRollbackRehearsalEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source.map((entry) => (entry.role === 'full_reversible' ? reduced : entry)),
      })
    ).toThrow('MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID')
  })

  it('rejects a positive rehearsal that does not exercise every flag action', () => {
    const source = samples()
    const positive = source.find(({ role }) => role === 'full_reversible')!
    const weakened = {
      ...positive,
      drillInput: {
        ...positive.drillInput,
        flagState: {
          ...positive.drillInput.flagState,
          AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
        },
      },
    }
    expect(() =>
      createMultiEntityRollbackRehearsalEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source.map((entry) => (entry.role === 'full_reversible' ? weakened : entry)),
      })
    ).toThrow('MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID')
  })

  it.each([
    ['cross-tenant made local', 'cross_tenant_blocked', { tenantId: targetTenantId }],
    ['changed record restored', 'changed_record_blocked', { currentLegalEntityId: entityId }],
  ] as const)('rejects a negative case that no longer fails: %s', (_label, role, change) => {
    const source = samples()
    const target = source.find((entry) => entry.role === role)!
    const changed = {
      ...target,
      drillInput: {
        ...target.drillInput,
        records: [{ ...target.drillInput.records[0]!, ...change }],
      },
    }
    expect(() =>
      createMultiEntityRollbackRehearsalEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        samples: source.map((entry) => (entry.role === role ? changed : entry)),
      })
    ).toThrow('MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID')
  })

  it.each([
    ['digest', { artifactDigest: `sha256:${'e'.repeat(64)}` }],
    ['apply capability', { canApply: true }],
    ['write capability', { canWrite: true }],
    ['case issue', { cases: undefined }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const source = artifact()
    const forged =
      change.cases === undefined && Object.prototype.hasOwnProperty.call(change, 'cases')
        ? {
            ...source,
            cases: [
              { ...source.cases[0]!, expectedIssue: 'duplicate_record' },
              ...source.cases.slice(1),
            ],
          }
        : { ...source, ...change }
    expect(() => assertMultiEntityRollbackRehearsalEvidenceArtifact(forged)).toThrow(
      'MULTI_ENTITY_ROLLBACK_REHEARSAL_EVIDENCE_INVALID'
    )
  })

  it('omits raw identifiers and exports no apply or rollback execution operation', async () => {
    const serialized = JSON.stringify(artifact())
    for (const value of [
      targetTenantId,
      entityId,
      'private-course_run',
      'other-tenant-private',
      'changed-entity-private',
      'review://',
    ]) {
      expect(serialized).not.toContain(value)
    }
    const module = await import('../src/multi-entity-rollback-rehearsal-evidence')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['apply', 'execute', 'rollback', 'write', 'activate'])
    )
  })
})
