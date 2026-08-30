import { describe, expect, it } from 'vitest'
import {
  reportMultiEntityShadowOwnership,
  type MultiEntityShadowOwnershipReportInput,
} from '../src/multi-entity-shadow-ownership-report'

const input: MultiEntityShadowOwnershipReportInput = {
  targetTenantId: 'cep',
  legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'validated' }],
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
      id: 'run-norte',
      recordType: 'course_run',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
    },
  ],
}

describe('multi-entity shadow ownership report', () => {
  it('reports explicit validated ownership without exposing an apply path', () => {
    const result = reportMultiEntityShadowOwnership(input)

    expect(result).toMatchObject({
      mode: 'shadow_ownership_report',
      canWrite: false,
      canApply: false,
      summary: { ready: 1, missing: 0, ambiguous: 0, cross_scope: 0 },
    })
    expect(result.records).toEqual([
      {
        recordType: 'course_run',
        recordId: 'run-norte',
        ownerLegalEntityId: 'entity-norte',
        campusId: 'campus-norte',
        classification: 'ready',
        reason: 'owner_explicit_and_validated',
      },
    ])
  })

  it('never falls back from a null owner to a uniquely bound campus', () => {
    const result = reportMultiEntityShadowOwnership({
      ...input,
      records: [{ ...input.records[0]!, legalEntityId: null }],
    })

    expect(result.records[0]).toMatchObject({
      classification: 'missing',
      reason: 'owner_missing',
      ownerLegalEntityId: null,
    })
    expect(result.summary).toEqual({ ready: 0, missing: 1, ambiguous: 0, cross_scope: 0 })
  })

  it('classifies duplicate campus ownership as ambiguous rather than selecting a binding', () => {
    const result = reportMultiEntityShadowOwnership({
      ...input,
      legalEntities: [
        ...input.legalEntities,
        { id: 'entity-sur', tenantId: 'cep', status: 'validated' },
      ],
      campusBindings: [
        ...input.campusBindings,
        {
          id: 'binding-sur',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          campusId: 'campus-norte',
          status: 'validated',
        },
      ],
    })

    expect(result.records[0]).toMatchObject({
      classification: 'ambiguous',
      reason: 'campus_owner_ambiguous',
    })
  })

  it.each([
    {
      name: 'record tenant differs from the target',
      record: { ...input.records[0]!, tenantId: 'other' },
      reason: 'record_outside_target_tenant',
    },
    {
      name: 'owner belongs to a different tenant',
      entities: [{ id: 'entity-norte', tenantId: 'other', status: 'validated' as const }],
      record: input.records[0]!,
      reason: 'owner_outside_target_tenant',
    },
    {
      name: 'campus is bound to a different owner',
      record: { ...input.records[0]!, legalEntityId: 'entity-sur' },
      entities: [
        ...input.legalEntities,
        { id: 'entity-sur', tenantId: 'cep', status: 'validated' as const },
      ],
      reason: 'campus_owner_mismatch',
    },
    {
      name: 'campus binding belongs to a different tenant',
      bindings: [{ ...input.campusBindings[0]!, tenantId: 'other' }],
      record: input.records[0]!,
      reason: 'campus_outside_target_tenant',
    },
  ])(
    'fails closed when $name',
    ({ entities = input.legalEntities, bindings = input.campusBindings, record, reason }) => {
      const result = reportMultiEntityShadowOwnership({
        ...input,
        legalEntities: entities,
        campusBindings: bindings,
        records: [record],
      })
      expect(result.records[0]).toMatchObject({ classification: 'cross_scope', reason })
    }
  )

  it('is deterministic, preserves the input, and treats duplicate records as ambiguous', () => {
    const records = Object.freeze([
      Object.freeze(input.records[0]!),
      Object.freeze({ ...input.records[0]! }),
    ])
    const frozenInput = Object.freeze({ ...input, records })
    const before = JSON.stringify(frozenInput)

    const first = reportMultiEntityShadowOwnership(frozenInput)
    const second = reportMultiEntityShadowOwnership(frozenInput)

    expect(first).toEqual(second)
    expect(JSON.stringify(frozenInput)).toBe(before)
    expect(first.summary).toEqual({ ready: 1, missing: 0, ambiguous: 1, cross_scope: 0 })
    expect(first.records[1]).toMatchObject({
      classification: 'ambiguous',
      reason: 'duplicate_record',
    })
  })

  it('fails closed for invalid configuration and unknown owners', () => {
    const invalid = reportMultiEntityShadowOwnership({ ...input, targetTenantId: ' ' })
    const unknown = reportMultiEntityShadowOwnership({
      ...input,
      records: [{ ...input.records[0]!, legalEntityId: 'unknown-entity' }],
    })

    expect(invalid.summary).toEqual({ ready: 0, missing: 1, ambiguous: 0, cross_scope: 0 })
    expect(unknown.records[0]).toMatchObject({
      classification: 'missing',
      reason: 'owner_unknown_inactive_or_unvalidated',
    })
  })

  it('fails closed for malformed topology arrays without throwing', () => {
    for (const malformed of [{ legalEntities: [null] }, { campusBindings: [null] }]) {
      const result = reportMultiEntityShadowOwnership({ ...input, ...malformed } as never)
      expect(result.summary).toEqual({ ready: 0, missing: 1, ambiguous: 0, cross_scope: 0 })
      expect(result.records[0]).toMatchObject({
        classification: 'missing',
        reason: 'invalid_record',
      })
    }
  })

  it('does not call a proposed entity ready', () => {
    const result = reportMultiEntityShadowOwnership({
      ...input,
      legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'proposed' }],
    })

    expect(result.records[0]).toMatchObject({
      classification: 'missing',
      reason: 'owner_unknown_inactive_or_unvalidated',
    })
  })
})
