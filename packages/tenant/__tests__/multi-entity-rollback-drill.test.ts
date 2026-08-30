import { describe, expect, it } from 'vitest'
import {
  MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
  createRedactedMultiEntityRollbackObservation,
  planMultiEntityRollbackDrill,
  serializeMultiEntityRollbackObservation,
  type MultiEntityRollbackDrillInput,
  type MultiEntityRollbackRecord,
} from '../src/multi-entity-rollback-drill'

const DIGEST = `sha256:${'a'.repeat(64)}`

function record(overrides: Partial<MultiEntityRollbackRecord> = {}): MultiEntityRollbackRecord {
  return {
    operation: 'restore_null_if_unchanged',
    recordType: 'enrollment',
    recordId: 'enrollment-1',
    tenantId: 'cep',
    expectedLegalEntityId: 'cep-norte',
    currentLegalEntityId: 'cep-norte',
    restoreLegalEntityId: null,
    ...overrides,
  }
}

function input(
  overrides: Partial<MultiEntityRollbackDrillInput> = {}
): MultiEntityRollbackDrillInput {
  return {
    targetTenantId: 'cep',
    reviewReference: 'review://rollback-drill-001',
    accessBaseline: {
      capturedDigest: DIGEST,
      currentDigest: DIGEST,
    },
    flagState: {
      AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: true,
      AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: true,
      AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: true,
      AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: true,
      AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: true,
      AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: true,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: true,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: true,
      AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'shadow',
    },
    records: [record(), record({ recordType: 'campaign', recordId: 'campaign-1' })],
    ...overrides,
  }
}

describe('multi-entity rollback drill', () => {
  it('plans all real shadow controls and compare-and-set record restorations', () => {
    const plan = planMultiEntityRollbackDrill(input())

    expect(plan).toMatchObject({
      mode: 'rollback_dry_run',
      canWrite: false,
      canApply: false,
      ready: true,
      accessBaselineMatches: true,
      summary: {
        knownFlags: 9,
        flagsToDisable: 9,
        totalRecords: 2,
        reversibleRecords: 2,
        alreadyRestoredRecords: 0,
        conflictedRecords: 0,
        issues: 0,
      },
    })
    expect(plan.flagActions.map(({ variable }) => variable)).toEqual([
      ...MULTI_ENTITY_ROLLBACK_BOOLEAN_FLAGS,
      'AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE',
    ])
    expect(plan.recordActions).toEqual([
      expect.objectContaining({ recordType: 'campaign', recordId: 'campaign-1' }),
      expect.objectContaining({ recordType: 'enrollment', recordId: 'enrollment-1' }),
    ])
  })

  it('treats disabled flags and null values as an idempotent completed state', () => {
    const plan = planMultiEntityRollbackDrill(
      input({
        flagState: {
          AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: false,
          AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: false,
          AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: false,
          AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: false,
          AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: false,
          AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
          AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: false,
          AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: false,
          AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled',
        },
        records: [record({ currentLegalEntityId: null })],
      })
    )

    expect(plan.ready).toBe(true)
    expect(plan.flagActions).toEqual([])
    expect(plan.recordActions).toEqual([])
    expect(plan.summary.alreadyRestoredRecords).toBe(1)
  })

  it('blocks when the current access digest differs from the captured baseline', () => {
    const plan = planMultiEntityRollbackDrill(
      input({
        accessBaseline: {
          capturedDigest: DIGEST,
          currentDigest: `sha256:${'b'.repeat(64)}`,
        },
      })
    )

    expect(plan.ready).toBe(false)
    expect(plan.accessBaselineMatches).toBe(false)
    expect(plan.issues).toContainEqual({ code: 'access_baseline_changed' })
  })

  it('blocks a record changed after backfill and never proposes overwriting it', () => {
    const plan = planMultiEntityRollbackDrill(
      input({ records: [record({ currentLegalEntityId: 'cep-sur' })] })
    )

    expect(plan.ready).toBe(false)
    expect(plan.recordActions).toEqual([])
    expect(plan.issues).toEqual([
      {
        code: 'record_changed_since_backfill',
        recordType: 'enrollment',
        recordId: 'enrollment-1',
      },
    ])
  })

  it('rejects cross-tenant, duplicate and invalid identifiers fail closed', () => {
    const plan = planMultiEntityRollbackDrill(
      input({
        records: [
          record({ recordId: 'cross', tenantId: 'another-tenant' }),
          record({ recordId: 'duplicate' }),
          record({ recordId: 'duplicate' }),
          record({ recordId: ' ' }),
        ],
      })
    )

    expect(plan.ready).toBe(false)
    expect(plan.recordActions).toHaveLength(1)
    expect(plan.issues.map(({ code }) => code)).toEqual([
      'record_identifier_invalid',
      'record_outside_target_tenant',
      'duplicate_record',
    ])
  })

  it.each([
    [
      'invalid digest',
      { accessBaseline: { capturedDigest: 'not-a-digest', currentDigest: DIGEST } },
    ],
    ['invalid review reference', { reviewReference: 'ticket-1' }],
    ['invalid maximum', { maxRecords: 0 }],
  ])('rejects %s before planning', (_label, override) => {
    expect(() => planMultiEntityRollbackDrill(input(override))).toThrow()
  })

  it('rejects record counts above the explicit bounded limit', () => {
    expect(() => planMultiEntityRollbackDrill(input({ maxRecords: 1 }))).toThrow(
      'MULTI_ENTITY_ROLLBACK_RECORD_LIMIT_EXCEEDED'
    )
  })

  it('rejects extra input, flag, baseline and record fields', () => {
    const cases = [
      { ...input(), secret: 'no' },
      { ...input(), accessBaseline: { ...input().accessBaseline, userId: 'no' } },
      { ...input(), flagState: { ...input().flagState, unknownFlag: true } },
      { ...input(), records: [{ ...record(), legalName: 'no' }] },
    ]

    for (const value of cases) {
      expect(() => planMultiEntityRollbackDrill(value as never)).toThrow()
    }
  })

  it('rejects malformed rollback operations instead of broadening writes', () => {
    expect(() =>
      planMultiEntityRollbackDrill(
        input({
          records: [
            {
              ...record(),
              operation: 'force_restore',
            } as never,
          ],
        })
      )
    ).toThrow('MULTI_ENTITY_ROLLBACK_RECORD_INVALID')
  })

  it('is deterministic and does not mutate its input', () => {
    const source = input()
    const before = JSON.stringify(source)
    const first = planMultiEntityRollbackDrill(source)
    const second = planMultiEntityRollbackDrill({
      ...source,
      records: [...source.records].reverse(),
    })

    expect(first).toEqual(second)
    expect(JSON.stringify(source)).toBe(before)
    expect(Object.isFrozen(first)).toBe(true)
  })

  it('serializes only aggregate redacted evidence', () => {
    const source = input()
    const serialized = serializeMultiEntityRollbackObservation(source)
    const observation = createRedactedMultiEntityRollbackObservation(
      planMultiEntityRollbackDrill(source)
    )

    expect(JSON.parse(serialized)).toEqual(observation)
    for (const secret of [
      'cep-norte',
      'campaign-1',
      'enrollment-1',
      'rollback-drill-001',
      DIGEST,
    ]) {
      expect(serialized).not.toContain(secret)
    }
    expect(Object.keys(observation)).toEqual([
      'schemaVersion',
      'kind',
      'mode',
      'verdict',
      'canWrite',
      'canApply',
      'accessBaselineMatches',
      'metrics',
    ])
  })

  it('rejects a forged plan before producing observable evidence', () => {
    const plan = planMultiEntityRollbackDrill(input())
    expect(() =>
      createRedactedMultiEntityRollbackObservation({ ...plan, canApply: true } as never)
    ).toThrow('MULTI_ENTITY_ROLLBACK_PLAN_INVALID')
    expect(() =>
      createRedactedMultiEntityRollbackObservation({
        ...plan,
        summary: { ...plan.summary, conflictedRecords: -1, totalRecords: 1 },
      } as never)
    ).toThrow('MULTI_ENTITY_ROLLBACK_PLAN_INVALID')
  })

  it('exposes no apply or write function', async () => {
    const module = await import('../src/multi-entity-rollback-drill')
    expect(Object.keys(module).filter((key) => /apply|write|execute/i.test(key))).toEqual([])
  })
})
