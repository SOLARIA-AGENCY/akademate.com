import { describe, expect, it } from 'vitest'
import {
  createRedactedUnifiedLedgerObservation,
  type RedactedUnifiedLedgerObservation,
} from '../src/multi-entity-ledger-observability'
import {
  createUnifiedLedgerEvidenceManifest,
  serializeUnifiedLedgerEvidenceManifest,
} from '../src/multi-entity-shadow-evidence'
import {
  planUnifiedMultiEntityShadow,
  type UnifiedMultiEntityShadowInput,
} from '../src/multi-entity-unified-shadow-plan'

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

function readyObservation(): RedactedUnifiedLedgerObservation {
  return createRedactedUnifiedLedgerObservation(planUnifiedMultiEntityShadow(input))
}

function blockedObservation(): RedactedUnifiedLedgerObservation {
  return createRedactedUnifiedLedgerObservation(
    planUnifiedMultiEntityShadow({ ...input, explicitResolutions: [] })
  )
}

describe('unified ledger shadow evidence manifest', () => {
  it('creates a closed read-only manifest for a ready observation', () => {
    const manifest = createUnifiedLedgerEvidenceManifest([readyObservation()])

    expect(manifest).toEqual({
      schemaVersion: 1,
      kind: 'cep_multi_entity_unified_ledger',
      mode: 'shadow_evidence',
      canWrite: false,
      canApply: false,
      verdict: 'ready',
      metrics: {
        runs: 1,
        readyRuns: 1,
        blockedRuns: 0,
        sourceRecords: 3,
        projectedRecords: 3,
        targetRecords: 3,
        alreadyAssigned: 0,
        coveredRecords: 3,
        unresolvedRecords: 0,
        coverageBasisPoints: 10_000,
        blockedIssues: 0,
        proposalSources: { campusBinding: 1, explicitReview: 1, parentCampaign: 1 },
        issueStages: {
          topology: 0,
          projection: 0,
          campusBackfill: 0,
          explicitResolution: 0,
          unifiedCoverage: 0,
        },
      },
    })
    expect(Object.keys(manifest)).toEqual([
      'schemaVersion',
      'kind',
      'mode',
      'canWrite',
      'canApply',
      'verdict',
      'metrics',
    ])
  })

  it('never treats an empty manifest as positive evidence', () => {
    const manifest = createUnifiedLedgerEvidenceManifest([])

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { runs: 0, readyRuns: 0, blockedRuns: 0 },
    })
  })

  it('fails closed when any observation is blocked', () => {
    const manifest = createUnifiedLedgerEvidenceManifest([readyObservation(), blockedObservation()])

    expect(manifest).toMatchObject({
      verdict: 'blocked',
      metrics: { runs: 2, readyRuns: 1, blockedRuns: 1, unresolvedRecords: 2 },
    })
  })

  it('serializes equivalent observation sets to identical bytes without identifiers', () => {
    const ready = readyObservation()
    const blocked = blockedObservation()
    const first = serializeUnifiedLedgerEvidenceManifest([ready, blocked])
    const second = serializeUnifiedLedgerEvidenceManifest([blocked, ready])

    expect(first).toBe(second)
    for (const secret of [
      'tenant-secret-id',
      'entity-secret-id',
      'campus-secret-id',
      'campaign-secret-id',
      'spend-secret-id',
      'review://secret-reference/001',
    ]) {
      expect(first).not.toContain(secret)
    }
    expect(first).not.toContain('generatedAt')
    expect(first).not.toContain('manifestId')
  })

  it('freezes the complete manifest to prevent post-validation drift', () => {
    const manifest = createUnifiedLedgerEvidenceManifest([readyObservation()])

    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.metrics)).toBe(true)
    expect(Object.isFrozen(manifest.metrics.proposalSources)).toBe(true)
    expect(Object.isFrozen(manifest.metrics.issueStages)).toBe(true)
  })

  it('rejects fabricated telemetry dimensions before creating evidence', () => {
    const observation = readyObservation()

    expect(() =>
      createUnifiedLedgerEvidenceManifest([
        { ...observation, legalEntityId: 'hidden-dimension' } as never,
      ])
    ).toThrow('Invalid redacted unified ledger observation fields.')
  })
})
