import { describe, expect, it } from 'vitest'
import {
  planExplicitEntityResolutions,
  type ExplicitEntityResolutionInput,
} from '../src/multi-entity-explicit-resolution'

const input: ExplicitEntityResolutionInput = {
  targetTenantId: 'cep',
  legalEntities: [
    { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
    { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
  ],
  campusBindings: [
    {
      id: 'binding-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
      status: 'validated',
    },
  ],
  records: [
    {
      id: 'campaign-norte',
      recordType: 'campaign',
      tenantId: 'cep',
      campusId: null,
      legalEntityId: null,
    },
    {
      id: 'spend-norte',
      recordType: 'advertising_spend',
      tenantId: 'cep',
      campusId: null,
      legalEntityId: null,
    },
  ],
  resolutions: [
    {
      recordType: 'campaign',
      recordId: 'campaign-norte',
      proposedLegalEntityId: 'entity-norte',
      reviewReference: 'review://campaign-norte/001',
    },
  ],
  dependencies: [
    {
      childRecordType: 'advertising_spend',
      childRecordId: 'spend-norte',
      parentRecordType: 'campaign',
      parentRecordId: 'campaign-norte',
    },
  ],
}

describe('explicit legal-entity resolution dry-run', () => {
  it('proposes a reviewed campaign and inherits its entity for advertising spend', () => {
    const result = planExplicitEntityResolutions(input)

    expect(result).toMatchObject({
      mode: 'explicit_resolution_dry_run',
      canApply: false,
      ready: true,
      summary: {
        total: 2,
        proposed: 2,
        inheritedFromCampaign: 1,
        blocked: 0,
        unresolved: 0,
      },
    })
    expect(result.proposals).toEqual([
      expect.objectContaining({
        recordType: 'advertising_spend',
        recordId: 'spend-norte',
        proposedLegalEntityId: 'entity-norte',
        resolutionSource: 'parent_campaign',
      }),
      expect.objectContaining({
        recordType: 'campaign',
        recordId: 'campaign-norte',
        proposedLegalEntityId: 'entity-norte',
        resolutionSource: 'explicit_review',
      }),
    ])
    expect(result.proposals[0]?.rollback).toEqual({
      operation: 'restore_null_if_unchanged',
      expectedLegalEntityId: 'entity-norte',
      restoreLegalEntityId: null,
    })
  })

  it('is idempotent when existing entities already match the reviewed resolution', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      records: input.records.map((record) => ({
        ...record,
        legalEntityId: 'entity-norte',
      })),
    })

    expect(result).toMatchObject({
      ready: true,
      proposals: [],
      summary: { unchanged: 1, unresolved: 0, blocked: 0 },
    })
  })

  it('rejects a child resolution that conflicts with its campaign', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      resolutions: [
        ...input.resolutions,
        {
          recordType: 'advertising_spend',
          recordId: 'spend-norte',
          proposedLegalEntityId: 'entity-sur',
          reviewReference: 'review://spend-norte/001',
        },
      ],
    })

    expect(result.issues).toContainEqual({
      code: 'dependency_entity_conflict',
      recordType: 'advertising_spend',
      recordId: 'spend-norte',
      relatedId: 'campaign-norte',
    })
    expect(result.ready).toBe(false)
  })

  it('rejects an explicit entity that contradicts the record campus', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      records: [
        {
          id: 'lead-norte',
          recordType: 'lead',
          tenantId: 'cep',
          campusId: 'campus-norte',
          legalEntityId: null,
        },
      ],
      resolutions: [
        {
          recordType: 'lead',
          recordId: 'lead-norte',
          proposedLegalEntityId: 'entity-sur',
          reviewReference: 'review://lead-norte/001',
        },
      ],
      dependencies: [],
    })

    expect(result.issues).toContainEqual({
      code: 'resolution_conflicts_with_campus',
      recordType: 'lead',
      recordId: 'lead-norte',
      relatedId: 'entity-norte',
    })
  })

  it('rejects campus bindings backed by missing or inactive entities', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      legalEntities: [
        { id: 'entity-norte', tenantId: 'cep', status: 'inactive' },
        { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
      ],
      records: [
        {
          id: 'lead-norte',
          recordType: 'lead',
          tenantId: 'cep',
          campusId: 'campus-norte',
          legalEntityId: null,
        },
      ],
      resolutions: [
        {
          recordType: 'lead',
          recordId: 'lead-norte',
          proposedLegalEntityId: 'entity-sur',
          reviewReference: 'review://lead-norte/002',
        },
      ],
      dependencies: [],
    })

    expect(result.issues).toContainEqual({
      code: 'campus_binding_entity_missing_or_inactive',
      recordType: 'lead',
      recordId: 'lead-norte',
      relatedId: 'campus-norte',
    })
    expect(result.proposals).toEqual([])
  })

  it('rejects duplicate legal-entity authority records', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      legalEntities: [input.legalEntities[0]!, input.legalEntities[0]!],
    })

    expect(result.issues).toContainEqual({
      code: 'legal_entity_duplicate',
      relatedId: 'entity-norte',
    })
    expect(result.ready).toBe(false)
  })

  it('fails closed for missing review evidence, entity or target record', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      resolutions: [
        {
          recordType: 'campaign',
          recordId: 'campaign-norte',
          proposedLegalEntityId: 'entity-norte',
          reviewReference: 'contains spaces',
        },
        {
          recordType: 'campaign',
          recordId: 'missing-campaign',
          proposedLegalEntityId: 'missing-entity',
          reviewReference: 'review://missing/001',
        },
      ],
    })

    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'resolution_review_reference_invalid',
        'resolution_record_missing',
        'dependency_parent_unresolved',
      ])
    )
    expect(result.ready).toBe(false)
  })

  it('rejects duplicate inputs and bounds records plus review artifacts', () => {
    const duplicate = planExplicitEntityResolutions({
      ...input,
      records: [input.records[0]!, input.records[0]!],
      resolutions: [input.resolutions[0]!, input.resolutions[0]!],
      dependencies: [input.dependencies[0]!, input.dependencies[0]!],
    })
    const oversized = planExplicitEntityResolutions({ ...input, maxRecords: 1 })

    expect(duplicate.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'duplicate_record_id',
        'resolution_duplicate',
        'dependency_duplicate',
      ])
    )
    expect(oversized).toMatchObject({
      ready: false,
      proposals: [],
      issues: [{ code: 'record_limit_exceeded' }],
    })
  })

  it('does not mutate inputs and returns deterministic output', () => {
    const frozen = Object.freeze({
      ...input,
      records: Object.freeze(input.records.map((record) => Object.freeze(record))),
      resolutions: Object.freeze(input.resolutions.map((resolution) => Object.freeze(resolution))),
      dependencies: Object.freeze(
        input.dependencies.map((dependency) => Object.freeze(dependency))
      ),
    })
    const before = JSON.stringify(frozen)

    const first = planExplicitEntityResolutions(frozen)
    const second = planExplicitEntityResolutions(frozen)

    expect(first).toEqual(second)
    expect(JSON.stringify(frozen)).toBe(before)
  })

  it('keeps issue output limited to codes and identifiers', () => {
    const result = planExplicitEntityResolutions({
      ...input,
      resolutions: [
        {
          ...input.resolutions[0]!,
          reviewReference: 'Sensitive free text must not be emitted',
        },
      ],
    })

    expect(JSON.stringify(result.issues)).not.toContain('Sensitive')
    expect(result.issues).toContainEqual({
      code: 'resolution_review_reference_invalid',
      recordType: 'campaign',
      recordId: 'campaign-norte',
    })
  })
})
