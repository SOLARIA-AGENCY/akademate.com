import { describe, expect, it } from 'vitest'
import {
  planUnifiedMultiEntityShadow,
  type UnifiedMultiEntityShadowInput,
} from '../src/multi-entity-unified-shadow-plan'

const input: UnifiedMultiEntityShadowInput = {
  targetTenantId: 'cep',
  classrooms: [{ id: 10, tenant: 'cep', campus: 1 }],
  courseRuns: [{ id: 20, tenant: 'cep', campus: 1 }],
  enrollments: [{ id: 30, tenant: 'cep', course_run: 20 }],
  leads: [{ id: 40, tenant: 'cep', campus: 1 }],
  campaigns: [{ id: 50, tenant: 'cep' }],
  advertisingSpends: [{ id: 60, tenant: 'cep', campaign: 50 }],
  topology: {
    legalEntities: [
      { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
      { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
    ],
    campuses: [
      { id: '1', tenantId: 'cep' },
      { id: '2', tenantId: 'cep' },
    ],
    campusBindings: [
      {
        id: 'binding-norte',
        tenantId: 'cep',
        legalEntityId: 'entity-norte',
        campusId: '1',
        status: 'validated',
      },
      {
        id: 'binding-sur',
        tenantId: 'cep',
        legalEntityId: 'entity-sur',
        campusId: '2',
        status: 'proposed',
      },
    ],
    staffAssignments: [],
    accountingConnections: [],
  },
  explicitResolutions: [
    {
      recordType: 'campaign',
      recordId: '50',
      proposedLegalEntityId: 'entity-norte',
      reviewReference: 'review://campaign-50/001',
    },
  ],
}

describe('unified multi-entity shadow plan', () => {
  it('combines campus, reviewed campaign and inherited spend into complete coverage', () => {
    const result = planUnifiedMultiEntityShadow(input)

    expect(result).toMatchObject({
      mode: 'unified_shadow_dry_run',
      canWrite: false,
      canApply: false,
      ready: true,
      summary: {
        sourceRecords: 6,
        projectedRecords: 6,
        targetRecords: 6,
        alreadyAssigned: 0,
        campusBindingProposals: 4,
        explicitReviewProposals: 1,
        inheritedCampaignProposals: 1,
        coveredRecords: 6,
        unresolvedRecords: 0,
        blockedIssues: 0,
      },
    })
    expect(result.proposals).toHaveLength(6)
    expect(result.proposals.every(({ operation }) => operation === 'set_if_null')).toBe(true)
    expect(
      result.proposals.every(({ rollback }) => rollback.operation === 'restore_null_if_unchanged')
    ).toBe(true)
  })

  it('remains blocked when a campusless campaign lacks reviewed resolution', () => {
    const result = planUnifiedMultiEntityShadow({ ...input, explicitResolutions: [] })

    expect(result.ready).toBe(false)
    expect(result.explicitResolution.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['resolution_missing', 'dependency_parent_unresolved'])
    )
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'coverage_gap', recordType: 'campaign' }),
        expect.objectContaining({ code: 'coverage_gap', recordType: 'advertising_spend' }),
      ])
    )
  })

  it('rejects an explicit override for a record already resolved by campus', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      explicitResolutions: [
        ...input.explicitResolutions,
        {
          recordType: 'lead',
          recordId: '40',
          proposedLegalEntityId: 'entity-norte',
          reviewReference: 'review://lead-40/001',
        },
      ],
    })

    expect(result.ready).toBe(false)
    expect(result.explicitResolution.issues).toContainEqual({
      code: 'resolution_record_missing',
      recordType: 'lead',
      recordId: '40',
    })
  })

  it('blocks the unified plan when Payload projection is malformed', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      enrollments: [{ id: 30, tenant: 'cep', course_run: 'missing-run' }],
    })

    expect(result.ready).toBe(false)
    expect(result.projection.issues).toContainEqual({
      code: 'course_run_missing',
      recordType: 'enrollment',
      recordId: '30',
      relatedId: 'missing-run',
    })
  })

  it('blocks on an invalid complete topology even when the extra campus is absent from the batch', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      topology: {
        ...input.topology,
        campusBindings: [
          ...input.topology.campusBindings,
          {
            id: 'binding-crossed',
            tenantId: 'cep',
            legalEntityId: 'entity-sur',
            campusId: '1',
            status: 'proposed',
          },
        ],
      },
    })

    expect(result.ready).toBe(false)
    expect(result.topologyIssues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'campus_multiple_entities' })])
    )
  })

  it('blocks a conflicting explicit spend entity against its campaign', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      explicitResolutions: [
        ...input.explicitResolutions,
        {
          recordType: 'advertising_spend',
          recordId: '60',
          proposedLegalEntityId: 'entity-sur',
          reviewReference: 'review://spend-60/001',
        },
      ],
    })

    expect(result.ready).toBe(false)
    expect(result.explicitResolution.issues).toContainEqual({
      code: 'dependency_entity_conflict',
      recordType: 'advertising_spend',
      recordId: '60',
      relatedId: '50',
    })
  })

  it('is idempotent when every record already has the validated entity', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      classrooms: [{ id: 10, tenant: 'cep', campus: 1, legalEntity: 'entity-norte' }],
      courseRuns: [{ id: 20, tenant: 'cep', campus: 1, legalEntity: 'entity-norte' }],
      enrollments: [{ id: 30, tenant: 'cep', course_run: 20, legalEntity: 'entity-norte' }],
      leads: [{ id: 40, tenant: 'cep', campus: 1, legalEntity: 'entity-norte' }],
      campaigns: [{ id: 50, tenant: 'cep', legalEntity: 'entity-norte' }],
      advertisingSpends: [{ id: 60, tenant: 'cep', campaign: 50, legalEntity: 'entity-norte' }],
    })

    expect(result).toMatchObject({
      ready: true,
      proposals: [],
      summary: {
        alreadyAssigned: 6,
        coveredRecords: 6,
        unresolvedRecords: 0,
        blockedIssues: 0,
      },
    })
  })

  it('does not count a contradictory existing entity as covered', () => {
    const result = planUnifiedMultiEntityShadow({
      ...input,
      leads: [{ id: 40, tenant: 'cep', campus: 1, legalEntity: 'entity-sur' }],
    })

    expect(result.ready).toBe(false)
    expect(result.campusBackfill.issues).toContainEqual({
      code: 'existing_entity_conflict',
      recordType: 'lead',
      recordId: '40',
      relatedId: 'entity-sur',
    })
    expect(result.issues).toContainEqual({
      code: 'coverage_gap',
      recordType: 'lead',
      recordId: '40',
    })
    expect(result.summary).toMatchObject({
      alreadyAssigned: 0,
      coveredRecords: 5,
      unresolvedRecords: 1,
    })
  })

  it('does not mutate inputs and returns deterministic output', () => {
    const before = JSON.stringify(input)
    const first = planUnifiedMultiEntityShadow(input)
    const second = planUnifiedMultiEntityShadow(input)

    expect(first).toEqual(second)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('keeps the unified ledger limited to identifiers and review references', () => {
    const result = planUnifiedMultiEntityShadow(input)

    expect(JSON.stringify(result.proposals)).not.toContain('email')
    expect(JSON.stringify(result.proposals)).not.toContain('name')
    expect(JSON.stringify(result.proposals)).not.toContain('amount')
  })
})
