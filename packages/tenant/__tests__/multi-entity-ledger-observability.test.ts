import { describe, expect, it } from 'vitest'
import {
  createRedactedUnifiedLedgerObservation,
  summarizeUnifiedLedgerObservations,
  type RedactedUnifiedLedgerObservation,
} from '../src/multi-entity-ledger-observability'
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

describe('redacted unified ledger observability', () => {
  it('emits aggregate allow-listed counters without operational identifiers', () => {
    const plan = planUnifiedMultiEntityShadow(input)
    const observation = createRedactedUnifiedLedgerObservation(plan)
    const serialized = JSON.stringify(observation)

    expect(observation).toEqual({
      mode: 'unified_shadow',
      readiness: 'ready',
      sourceRecords: 3,
      projectedRecords: 3,
      targetRecords: 3,
      alreadyAssigned: 0,
      coveredRecords: 3,
      unresolvedRecords: 0,
      coverageBasisPoints: 10_000,
      blockedIssues: 0,
      proposalSources: {
        campusBinding: 1,
        explicitReview: 1,
        parentCampaign: 1,
      },
      issueStages: {
        topology: 0,
        projection: 0,
        campusBackfill: 0,
        explicitResolution: 0,
        unifiedCoverage: 0,
      },
    })
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
  })

  it('reports blocked stages and partial coverage without copying issue identifiers', () => {
    const plan = planUnifiedMultiEntityShadow({ ...input, explicitResolutions: [] })
    const observation = createRedactedUnifiedLedgerObservation(plan)

    expect(observation).toMatchObject({
      readiness: 'blocked',
      targetRecords: 3,
      coveredRecords: 1,
      unresolvedRecords: 2,
      blockedIssues: expect.any(Number),
      proposalSources: { campusBinding: 1, explicitReview: 0, parentCampaign: 0 },
      issueStages: {
        topology: 0,
        projection: 0,
        campusBackfill: 0,
        explicitResolution: expect.any(Number),
        unifiedCoverage: 2,
      },
    })
    expect(JSON.stringify(observation)).not.toContain('campaign-secret-id')
  })

  it('aggregates repeated runs using safe integer counters', () => {
    const ready = createRedactedUnifiedLedgerObservation(planUnifiedMultiEntityShadow(input))
    const blocked = createRedactedUnifiedLedgerObservation(
      planUnifiedMultiEntityShadow({ ...input, explicitResolutions: [] })
    )

    expect(summarizeUnifiedLedgerObservations([ready, blocked])).toMatchObject({
      runs: 2,
      readyRuns: 1,
      blockedRuns: 1,
      sourceRecords: 6,
      targetRecords: 6,
      coveredRecords: 4,
      unresolvedRecords: 2,
      coverageBasisPoints: 6666,
      proposalSources: {
        campusBinding: 2,
        explicitReview: 1,
        parentCampaign: 1,
      },
    })
  })

  it('rejects a manipulated plan before creating telemetry', () => {
    const plan = planUnifiedMultiEntityShadow(input)

    expect(() =>
      createRedactedUnifiedLedgerObservation({
        ...plan,
        summary: { ...plan.summary, coveredRecords: plan.summary.coveredRecords - 1 },
      })
    ).toThrow('Invalid unified ledger shadow plan summary.')
  })

  it('rejects fabricated observations with inconsistent readiness or coverage', () => {
    const observation = createRedactedUnifiedLedgerObservation(planUnifiedMultiEntityShadow(input))

    expect(() =>
      summarizeUnifiedLedgerObservations([
        { ...observation, readiness: 'ready', blockedIssues: 1 } as never,
      ])
    ).toThrow('Invalid redacted unified ledger observation contract.')
    expect(() =>
      summarizeUnifiedLedgerObservations([{ ...observation, coverageBasisPoints: 9_999 } as never])
    ).toThrow('Invalid redacted unified ledger observation contract.')
    expect(() =>
      summarizeUnifiedLedgerObservations([{ ...observation, readiness: 'blocked' } as never])
    ).toThrow('Invalid redacted unified ledger observation contract.')
  })

  it('rejects extra fields instead of accepting hidden telemetry dimensions', () => {
    const observation = createRedactedUnifiedLedgerObservation(planUnifiedMultiEntityShadow(input))

    expect(() =>
      summarizeUnifiedLedgerObservations([
        { ...observation, tenantId: 'must-not-be-accepted' } as never,
      ])
    ).toThrow('Invalid redacted unified ledger observation fields.')
    expect(() =>
      summarizeUnifiedLedgerObservations([
        {
          ...observation,
          proposalSources: { ...observation.proposalSources, legalEntity: 1 },
        } as never,
      ])
    ).toThrow('Invalid redacted unified ledger observation fields.')
  })

  it('rejects counter overflow instead of emitting imprecise telemetry', () => {
    const huge: RedactedUnifiedLedgerObservation = {
      mode: 'unified_shadow',
      readiness: 'ready',
      sourceRecords: Number.MAX_SAFE_INTEGER,
      projectedRecords: Number.MAX_SAFE_INTEGER,
      targetRecords: Number.MAX_SAFE_INTEGER,
      alreadyAssigned: Number.MAX_SAFE_INTEGER,
      coveredRecords: Number.MAX_SAFE_INTEGER,
      unresolvedRecords: 0,
      coverageBasisPoints: 10_000,
      blockedIssues: 0,
      proposalSources: { campusBinding: 0, explicitReview: 0, parentCampaign: 0 },
      issueStages: {
        topology: 0,
        projection: 0,
        campusBackfill: 0,
        explicitResolution: 0,
        unifiedCoverage: 0,
      },
    }

    expect(() => summarizeUnifiedLedgerObservations([huge, huge])).toThrow(
      'Unified ledger metric overflow.'
    )
  })

  it('does not mutate plans or observations during redaction and aggregation', () => {
    const plan = planUnifiedMultiEntityShadow(input)
    const beforePlan = JSON.stringify(plan)
    const observation = createRedactedUnifiedLedgerObservation(plan)
    const beforeObservation = JSON.stringify(observation)

    summarizeUnifiedLedgerObservations([observation])

    expect(JSON.stringify(plan)).toBe(beforePlan)
    expect(JSON.stringify(observation)).toBe(beforeObservation)
  })

  it('bounds the number of observations processed in one aggregation', () => {
    const observation = createRedactedUnifiedLedgerObservation(planUnifiedMultiEntityShadow(input))

    expect(() => summarizeUnifiedLedgerObservations(Array(10_001).fill(observation))).toThrow(
      'Unified ledger observation limit exceeded.'
    )
  })
})
