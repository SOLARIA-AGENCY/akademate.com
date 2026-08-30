import { describe, expect, it } from 'vitest'

import {
  MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS,
  assertMultiEntitySchemaExpansionPlan,
  digestMultiEntitySchemaExpansionPlan,
  planMultiEntitySchemaExpansion,
  type MultiEntitySchemaExpansionRecord,
} from '../src/multi-entity-schema-expansion-plan'

function record(
  change: Partial<MultiEntitySchemaExpansionRecord> = {}
): MultiEntitySchemaExpansionRecord {
  return {
    collection: 'course-runs',
    recordId: 'run-1',
    tenantId: 'tenant-cep',
    currentLegalEntityId: null,
    reviewedLegalEntityIds: ['entity-north'],
    dependencyLegalEntityIds: ['entity-north'],
    ...change,
  }
}

describe('multi-entity schema authority contract', () => {
  it('keeps Payload authoritative and lists nullable entity fields without changing shared masters', () => {
    expect(MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS).toHaveLength(8)
    expect(
      MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS.every(
        (entry) => entry.operationalAuthority === 'payload'
      )
    ).toBe(true)
    expect(
      MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS.filter(
        (entry) => entry.ownershipMode === 'legal_entity_owned'
      ).map((entry) => entry.collection)
    ).toEqual(['campuses', 'classrooms', 'course-runs', 'enrollments', 'campaigns', 'leads'])
    expect(
      MULTI_ENTITY_SCHEMA_AUTHORITY_DECISIONS.filter(
        (entry) => entry.ownershipMode === 'tenant_shared_master'
      ).map((entry) => [entry.collection, entry.nullableExpansionFields])
    ).toEqual([
      ['staff', []],
      ['media', []],
    ])
  })
})

describe('expand-only schema planner', () => {
  it('content-addresses the empty source-level plan without granting read, write or apply authority', () => {
    const plan = planMultiEntitySchemaExpansion([])

    expect(() => assertMultiEntitySchemaExpansionPlan(plan)).not.toThrow()
    expect(digestMultiEntitySchemaExpansionPlan(plan)).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(plan).toMatchObject({
      operationalAuthority: 'payload',
      canReadData: false,
      canWrite: false,
      canApplyMigration: false,
      canChangePermissions: false,
      items: [],
      summary: { ready: 0, missing: 0, ambiguous: 0, cross_scope: 0 },
    })
  })

  it.each([
    ['authority', { operationalAuthority: 'drizzle_control_plane' }],
    ['read capability', { canReadData: true }],
    ['write capability', { canWrite: true }],
    ['migration capability', { canApplyMigration: true }],
    ['permission capability', { canChangePermissions: true }],
    ['summary', { summary: { ready: 1, missing: 0, ambiguous: 0, cross_scope: 0 } }],
  ])('rejects a forged source-level plan %s', (_label, change) => {
    const plan = planMultiEntitySchemaExpansion([])

    expect(() => digestMultiEntitySchemaExpansionPlan({ ...plan, ...change })).toThrow(
      'MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:invalid_plan'
    )
  })

  it('plans only set-if-null and a guarded null-if-unchanged rollback', () => {
    const plan = planMultiEntitySchemaExpansion([record()])
    expect(plan).toMatchObject({
      mode: 'dry_run',
      operationalAuthority: 'payload',
      canReadData: false,
      canWrite: false,
      canApplyMigration: false,
      canChangePermissions: false,
      summary: { ready: 1, missing: 0, ambiguous: 0, cross_scope: 0 },
    })
    expect(plan.items[0]).toMatchObject({
      status: 'ready',
      proposedLegalEntityId: 'entity-north',
      operation: 'set_if_null',
      rollback: {
        strategy: 'null_if_unchanged',
        expectedCurrentLegalEntityId: 'entity-north',
        restoreLegalEntityId: null,
      },
    })
  })

  it('classifies missing and ambiguous reviewed ownership without proposals', () => {
    const plan = planMultiEntitySchemaExpansion([
      record({ recordId: 'missing', reviewedLegalEntityIds: [], dependencyLegalEntityIds: [] }),
      record({
        recordId: 'ambiguous',
        reviewedLegalEntityIds: ['entity-north', 'entity-south'],
        dependencyLegalEntityIds: [],
      }),
    ])
    expect(plan.summary).toEqual({ ready: 0, missing: 1, ambiguous: 1, cross_scope: 0 })
    expect(
      plan.items.map(({ status, operation, rollback }) => ({ status, operation, rollback }))
    ).toEqual([
      { status: 'ambiguous', operation: 'none', rollback: null },
      { status: 'missing', operation: 'none', rollback: null },
    ])
  })

  it('fails closed on cross-scope dependencies and never overwrites an existing owner', () => {
    const dependencyConflict = planMultiEntitySchemaExpansion([
      record({ dependencyLegalEntityIds: ['entity-north', 'entity-south'] }),
    ])
    const existingConflict = planMultiEntitySchemaExpansion([
      record({ currentLegalEntityId: 'entity-south' }),
    ])
    expect(dependencyConflict.items[0]).toMatchObject({
      status: 'cross_scope',
      reason: 'dependency_owner_conflict',
      operation: 'none',
    })
    expect(existingConflict.items[0]).toMatchObject({
      status: 'cross_scope',
      reason: 'existing_owner_conflict',
      operation: 'none',
    })
  })

  it('keeps staff and media shared and rejects attempts to assign them silently', () => {
    const shared = planMultiEntitySchemaExpansion([
      record({
        collection: 'staff',
        recordId: 'staff-1',
        reviewedLegalEntityIds: [],
        dependencyLegalEntityIds: [],
      }),
      record({
        collection: 'media',
        recordId: 'media-1',
        reviewedLegalEntityIds: [],
        dependencyLegalEntityIds: [],
      }),
    ])
    const assigned = planMultiEntitySchemaExpansion([
      record({
        collection: 'staff',
        recordId: 'staff-2',
        reviewedLegalEntityIds: ['entity-north'],
      }),
    ])
    expect(shared.summary.ready).toBe(2)
    expect(shared.items.every((entry) => entry.operation === 'none')).toBe(true)
    expect(assigned.items[0]).toMatchObject({ status: 'ambiguous', operation: 'none' })
  })

  it('rejects duplicate records, malformed identifiers and unknown collections', () => {
    expect(() => planMultiEntitySchemaExpansion([record(), record()])).toThrow(
      'MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:duplicate_record'
    )
    expect(() => planMultiEntitySchemaExpansion([record({ tenantId: ' tenant ' })])).toThrow(
      'MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:invalid_record'
    )
    expect(() =>
      planMultiEntitySchemaExpansion([record({ collection: 'courses' as never })])
    ).toThrow('MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:invalid_record')
  })

  it('fails closed for malformed top-level input and unexpected record fields', () => {
    expect(() => planMultiEntitySchemaExpansion(null as never)).toThrow(
      'MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:invalid_input'
    )
    expect(() =>
      planMultiEntitySchemaExpansion([{ ...record(), writeCallback: () => undefined } as never])
    ).toThrow('MULTI_ENTITY_SCHEMA_EXPANSION_PLAN_INVALID:invalid_record')
  })

  it('is deterministic for an empty edge input and sorted synthetic records', () => {
    expect(planMultiEntitySchemaExpansion([]).items).toEqual([])
    const first = planMultiEntitySchemaExpansion([
      record({ collection: 'leads', recordId: 'z' }),
      record({ collection: 'campuses', recordId: 'a' }),
    ])
    const second = planMultiEntitySchemaExpansion(
      [...first.items].map((item) =>
        record({
          collection: item.collection,
          recordId: item.recordId,
        })
      )
    )
    expect(first.items.map((entry) => `${entry.collection}:${entry.recordId}`)).toEqual([
      'campuses:a',
      'leads:z',
    ])
    expect(second.items.map((entry) => `${entry.collection}:${entry.recordId}`)).toEqual([
      'campuses:a',
      'leads:z',
    ])
  })
})
