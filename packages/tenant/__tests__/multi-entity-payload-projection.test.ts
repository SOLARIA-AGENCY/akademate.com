import { describe, expect, it } from 'vitest'
import {
  planPayloadMultiEntityBackfill,
  projectPayloadOperationalSnapshot,
  type PayloadBackfillPlanningInput,
  type PayloadOperationalSnapshot,
} from '../src/multi-entity-payload-projection'

const snapshot: PayloadOperationalSnapshot = {
  targetTenantId: 'cep',
  classrooms: [{ id: 10, tenant: { id: 'cep' }, campus: { id: 1 } }],
  courseRuns: [{ id: 20, tenant: 'cep', campus: 1 }],
  enrollments: [{ id: 30, tenant: { id: 'cep' }, course_run: { id: 20 } }],
  leads: [{ id: 40, tenant: 'cep', campus: { id: 1 } }],
  campaigns: [{ id: 50, tenant: 'cep' }],
  advertisingSpends: [{ id: 60, tenant: 'cep', campaign: { id: 50 } }],
}

describe('Payload operational snapshot shadow projection', () => {
  it('normalizes scalar and populated relationships without mutating the source', () => {
    const frozen = Object.freeze({
      ...snapshot,
      classrooms: Object.freeze(snapshot.classrooms.map((record) => Object.freeze(record))),
    })
    const before = JSON.stringify(frozen)
    const result = projectPayloadOperationalSnapshot(frozen)

    expect(JSON.stringify(frozen)).toBe(before)
    expect(result).toMatchObject({
      mode: 'shadow_projection',
      canWrite: false,
      readyForBackfill: false,
      summary: {
        sourceRecords: 6,
        projectedRecords: 6,
        campusResolved: 4,
        campusUnresolved: 2,
        blocked: 0,
      },
    })
    expect(result.records).toContainEqual({
      id: '10',
      recordType: 'classroom',
      tenantId: 'cep',
      campusId: '1',
      legalEntityId: null,
    })
  })

  it('inherits an enrollment campus only from its referenced course run', () => {
    const result = projectPayloadOperationalSnapshot(snapshot)

    expect(result.records).toContainEqual({
      id: '30',
      recordType: 'enrollment',
      tenantId: 'cep',
      campusId: '1',
      legalEntityId: null,
    })
  })

  it('leaves campaigns and advertising spend unresolved instead of guessing a campus', () => {
    const result = projectPayloadOperationalSnapshot(snapshot)

    expect(result.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recordType: 'campaign', campusId: null }),
        expect.objectContaining({ recordType: 'advertising_spend', campusId: null }),
      ])
    )
    expect(result.dependencies).toEqual([
      {
        childRecordType: 'advertising_spend',
        childRecordId: '60',
        parentRecordType: 'campaign',
        parentRecordId: '50',
      },
    ])
    expect(result.readyForBackfill).toBe(false)
  })

  it('fails closed when an enrollment references a missing course run', () => {
    const result = projectPayloadOperationalSnapshot({
      ...snapshot,
      enrollments: [{ id: 30, tenant: 'cep', course_run: 'missing-run' }],
    })

    expect(result.issues).toContainEqual({
      code: 'course_run_missing',
      recordType: 'enrollment',
      recordId: '30',
      relatedId: 'missing-run',
    })
    expect(result.records).toContainEqual(
      expect.objectContaining({ recordType: 'enrollment', campusId: null })
    )
  })

  it('preserves an existing legal entity only as a normalized compare-and-set input', () => {
    const result = projectPayloadOperationalSnapshot({
      ...snapshot,
      courseRuns: [
        {
          id: 20,
          tenant: 'cep',
          campus: 1,
          legalEntity: { id: 'entity-norte' },
        },
      ],
    })

    expect(result.records).toContainEqual(
      expect.objectContaining({
        recordType: 'course_run',
        legalEntityId: 'entity-norte',
      })
    )
  })

  it('reports cross-tenant input and never treats it as ready', () => {
    const result = projectPayloadOperationalSnapshot({
      ...snapshot,
      leads: [{ id: 40, tenant: 'other-tenant', campus: 1 }],
    })

    expect(result.issues).toContainEqual({
      code: 'record_outside_target_tenant',
      recordType: 'lead',
      recordId: '40',
      relatedId: 'other-tenant',
    })
    expect(result.summary.outsideTargetTenant).toBe(1)
    expect(result.readyForBackfill).toBe(false)
  })

  it('rejects duplicate records, invalid relationships and oversized snapshots', () => {
    const duplicate = projectPayloadOperationalSnapshot({
      ...snapshot,
      classrooms: [snapshot.classrooms[0]!, snapshot.classrooms[0]!],
      courseRuns: [{ id: 20, tenant: 'cep', campus: { id: ' ' } }],
    })
    const oversized = projectPayloadOperationalSnapshot({ ...snapshot, maxRecords: 1 })

    expect(duplicate.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['duplicate_record_id', 'campus_relationship_invalid'])
    )
    expect(oversized).toMatchObject({
      readyForBackfill: false,
      records: [],
      issues: [{ code: 'record_limit_exceeded' }],
    })
  })

  it('treats a populated relationship without a scalar id as malformed, not absent', () => {
    const result = projectPayloadOperationalSnapshot({
      ...snapshot,
      courseRuns: [
        {
          id: 20,
          tenant: 'cep',
          campus: { id: { nested: 'campus-norte' } } as never,
        },
      ],
    })

    expect(result.issues).toContainEqual({
      code: 'campus_relationship_invalid',
      recordType: 'course_run',
      recordId: '20',
    })
    expect(result.readyForBackfill).toBe(false)
  })

  it('chains into the dry-run planner and proposes only campus-resolved records', () => {
    const input: PayloadBackfillPlanningInput = {
      ...snapshot,
      campaigns: [],
      advertisingSpends: [],
      legalEntities: [{ id: 'entity-norte', tenantId: 'cep', status: 'validated' }],
      campusBindings: [
        {
          id: 'binding-norte',
          tenantId: 'cep',
          legalEntityId: 'entity-norte',
          campusId: '1',
          status: 'validated',
        },
      ],
    }

    const result = planPayloadMultiEntityBackfill(input)

    expect(result).toMatchObject({
      mode: 'shadow_projection_and_dry_run',
      canWrite: false,
      ready: true,
      projection: { readyForBackfill: true },
      backfill: {
        mode: 'dry-run',
        canApply: false,
        fullyMappable: true,
        summary: { total: 4, proposed: 4, blocked: 0 },
      },
    })
  })

  it('returns sanitized issues containing identifiers only', () => {
    const result = projectPayloadOperationalSnapshot({
      ...snapshot,
      advertisingSpends: [{ id: 60, tenant: 'cep', campaign: 'missing-campaign' }],
    })

    expect(result.issues).toContainEqual({
      code: 'campaign_missing',
      recordType: 'advertising_spend',
      recordId: '60',
      relatedId: 'missing-campaign',
    })
    expect(JSON.stringify(result.issues)).not.toContain('secret')
  })
})
