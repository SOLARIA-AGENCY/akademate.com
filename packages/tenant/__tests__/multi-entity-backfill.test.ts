import { describe, expect, it } from 'vitest'
import {
  planMultiEntityBackfill,
  type MultiEntityBackfillInput,
} from '../src/multi-entity-backfill'

const input: MultiEntityBackfillInput = {
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
    {
      id: 'binding-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      status: 'proposed',
    },
  ],
  records: [
    {
      id: 'run-norte',
      recordType: 'course_run',
      tenantId: 'cep',
      campusId: 'campus-norte',
      legalEntityId: null,
    },
    {
      id: 'run-sur',
      recordType: 'course_run',
      tenantId: 'cep',
      campusId: 'campus-sur',
      legalEntityId: null,
    },
  ],
}

describe('CEP multi-entity backfill dry-run', () => {
  it('produces deterministic set-if-null proposals and has no apply mode', () => {
    const first = planMultiEntityBackfill(input)
    const second = planMultiEntityBackfill(input)

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      mode: 'dry-run',
      canApply: false,
      fullyMappable: true,
      summary: { total: 2, proposed: 2, unchanged: 0, blocked: 0 },
    })
    expect(first.proposals).toEqual([
      expect.objectContaining({
        operation: 'set_if_null',
        recordId: 'run-norte',
        beforeLegalEntityId: null,
        proposedLegalEntityId: 'entity-norte',
      }),
      expect.objectContaining({
        operation: 'set_if_null',
        recordId: 'run-sur',
        beforeLegalEntityId: null,
        proposedLegalEntityId: 'entity-sur',
      }),
    ])
  })

  it('is idempotent when records already carry the proposed entity', () => {
    const alreadyAssigned: MultiEntityBackfillInput = {
      ...input,
      records: input.records.map((record) => ({
        ...record,
        legalEntityId: record.campusId === 'campus-norte' ? 'entity-norte' : 'entity-sur',
      })),
    }

    expect(planMultiEntityBackfill(alreadyAssigned)).toMatchObject({
      fullyMappable: true,
      proposals: [],
      summary: { total: 2, proposed: 0, unchanged: 2, blocked: 0 },
    })
  })

  it('never overwrites an existing conflicting entity', () => {
    const result = planMultiEntityBackfill({
      ...input,
      records: [{ ...input.records[0]!, legalEntityId: 'entity-sur' }],
    })

    expect(result.canApply).toBe(false)
    expect(result.proposals).toEqual([])
    expect(result.issues).toContainEqual({
      code: 'existing_entity_conflict',
      recordType: 'course_run',
      recordId: 'run-norte',
      relatedId: 'entity-sur',
    })
  })

  it.each([
    {
      name: 'missing campus',
      record: { ...input.records[0]!, campusId: null },
      code: 'campus_missing',
    },
    {
      name: 'unmapped campus',
      record: { ...input.records[0]!, campusId: 'campus-unknown' },
      code: 'campus_unmapped',
    },
    {
      name: 'other tenant',
      record: { ...input.records[0]!, tenantId: 'other-tenant' },
      code: 'record_outside_target_tenant',
    },
  ] as const)('blocks $name instead of guessing', ({ record, code }) => {
    const result = planMultiEntityBackfill({ ...input, records: [record] })

    expect(result.fullyMappable).toBe(false)
    expect(result.proposals).toEqual([])
    expect(result.issues[0]?.code).toBe(code)
  })

  it('blocks a campus with two candidate legal entities', () => {
    const result = planMultiEntityBackfill({
      ...input,
      campusBindings: [
        ...input.campusBindings,
        {
          id: 'binding-crossed',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          campusId: 'campus-norte',
          status: 'proposed',
        },
      ],
      records: [input.records[0]!],
    })

    expect(result.issues[0]?.code).toBe('campus_ambiguous')
    expect(result.proposals).toEqual([])
  })

  it('rejects duplicate source records and bounds the batch size', () => {
    const duplicate = planMultiEntityBackfill({
      ...input,
      records: [input.records[0]!, input.records[0]!],
    })
    const oversized = planMultiEntityBackfill({ ...input, maxRecords: 1 })

    expect(duplicate.issues).toContainEqual(
      expect.objectContaining({ code: 'duplicate_record_id', recordId: 'run-norte' })
    )
    expect(oversized).toMatchObject({
      fullyMappable: false,
      proposals: [],
      issues: [{ code: 'record_limit_exceeded' }],
    })
  })

  it('blocks invalid identifiers and inactive legal-entity bindings', () => {
    const invalidRecord = planMultiEntityBackfill({
      ...input,
      records: [{ ...input.records[0]!, id: ' ' }],
    })
    const inactiveEntity = planMultiEntityBackfill({
      ...input,
      legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'inactive' }],
      campusBindings: [input.campusBindings[0]!],
      records: [input.records[0]!],
    })
    const invalidTenant = planMultiEntityBackfill({ ...input, targetTenantId: ' ' })

    expect(invalidRecord.issues[0]?.code).toBe('invalid_record_identifier')
    expect(inactiveEntity.issues[0]?.code).toBe('legal_entity_missing_or_inactive')
    expect(invalidTenant.issues).toEqual([{ code: 'invalid_target_tenant' }])
  })

  it('does not mutate or reorder source records', () => {
    const records = Object.freeze(
      [...input.records].reverse().map((record) => Object.freeze(record))
    )
    const before = JSON.stringify(records)

    planMultiEntityBackfill({ ...input, records })

    expect(JSON.stringify(records)).toBe(before)
  })
})
