import { describe, expect, it } from 'vitest'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  planMultiEntityStagingReadiness,
  serializeMultiEntityStagingReadiness,
  type MultiEntityEntityStagingGate,
  type MultiEntityGlobalStagingGate,
  type MultiEntityStagingEntityCandidate,
  type MultiEntityStagingEvidence,
  type MultiEntityStagingReadinessInput,
} from '../src/multi-entity-staging-readiness'

function verified(reference: string): MultiEntityStagingEvidence {
  return { status: 'verified', evidenceReference: `evidence://${reference}` }
}

function globalChecks(): Record<MultiEntityGlobalStagingGate, MultiEntityStagingEvidence> {
  return Object.fromEntries(
    MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => [gate, verified(`global/${gate}/v1`)])
  ) as Record<MultiEntityGlobalStagingGate, MultiEntityStagingEvidence>
}

function entityChecks(
  label: string
): Record<MultiEntityEntityStagingGate, MultiEntityStagingEvidence> {
  return Object.fromEntries(
    MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => [gate, verified(`entity/${label}/${gate}/v1`)])
  ) as Record<MultiEntityEntityStagingGate, MultiEntityStagingEvidence>
}

function entity(
  label: 'norte' | 'santa-cruz' | 'sur',
  change: Partial<MultiEntityStagingEntityCandidate> = {}
): MultiEntityStagingEntityCandidate {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-cep',
    legalEntityId: `entity-${label}`,
    accountingConnectionId: `accounting-${label}`,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    reviewReference: `review://staging/entity/${label}/v1`,
    ...(pilot ? { pilotReviewReference: 'review://staging/entity/sur/pilot/v1' } : {}),
    checks: entityChecks(label),
    ...change,
  }
}

function input(
  change: Partial<MultiEntityStagingReadinessInput> = {}
): MultiEntityStagingReadinessInput {
  return {
    readinessReviewReference: 'review://staging/readiness/v1',
    globalChecks: globalChecks(),
    entities: [entity('norte'), entity('santa-cruz'), entity('sur')],
    ...change,
  }
}

function expectCode(action: () => unknown, code: string): void {
  expect(action).toThrowError(expect.objectContaining({ code }))
}

describe('multi-entity staging readiness manifest', () => {
  it('requires the complete 20 global and 36 entity checks before review', () => {
    const manifest = planMultiEntityStagingReadiness(input())

    expect(MULTI_ENTITY_GLOBAL_STAGING_GATES).toHaveLength(20)
    expect(MULTI_ENTITY_ENTITY_STAGING_GATES).toHaveLength(12)
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_staging_readiness',
      mode: 'evidence_gate_only',
      verdict: 'ready_for_staging_review',
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        globalChecks: 20,
        entityChecks: 36,
        totalChecks: 56,
        verified: 56,
        pending: 0,
        failed: 0,
        missing: 0,
        blockingChecks: 0,
      },
    })
    expect(manifest.gates).toHaveLength(32)
    expect(manifest.gates[0]).toEqual({
      scope: 'global',
      gate: 'schema_authority_decided',
      required: 1,
      verified: 1,
      pending: 0,
      failed: 0,
      missing: 0,
    })
    expect(manifest.gates.at(-1)).toEqual({
      scope: 'entity',
      gate: 'enrollment_campaign_scope_reviewed',
      required: 3,
      verified: 3,
      pending: 0,
      failed: 0,
      missing: 0,
    })
  })

  it('treats missing and pending evidence as insufficient, never ready', () => {
    const global = globalChecks()
    delete (global as Partial<typeof global>).schema_authority_decided
    global.node22_runtime_verified = { status: 'pending' }
    const manifest = planMultiEntityStagingReadiness(input({ globalChecks: global }))

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { verified: 54, pending: 1, failed: 0, missing: 1, blockingChecks: 2 },
    })
    expect(manifest.gates.find(({ gate }) => gate === 'schema_authority_decided')).toMatchObject({
      missing: 1,
      verified: 0,
    })
  })

  it('requires explicit accounting import staging evidence before review', () => {
    const global = globalChecks()
    delete (global as Partial<typeof global>).accounting_import_staging_verified

    const manifest = planMultiEntityStagingReadiness(input({ globalChecks: global }))

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { verified: 55, missing: 1, blockingChecks: 1 },
    })
    expect(
      manifest.gates.find(({ gate }) => gate === 'accounting_import_staging_verified')
    ).toMatchObject({ scope: 'global', required: 1, verified: 0, missing: 1 })
  })

  it('requires explicit evidence that nominal permission changes remain phase-locked', () => {
    const global = globalChecks()
    delete (global as Partial<typeof global>).nominal_permission_phase_lock_verified

    const manifest = planMultiEntityStagingReadiness(input({ globalChecks: global }))

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      canChangePermissions: false,
      metrics: { verified: 55, missing: 1, blockingChecks: 1 },
    })
    expect(
      manifest.gates.find(({ gate }) => gate === 'nominal_permission_phase_lock_verified')
    ).toMatchObject({ scope: 'global', required: 1, verified: 0, missing: 1 })
  })

  it('blocks the whole review when one global or entity check failed', () => {
    const global = globalChecks()
    global.rollback_rehearsed = {
      status: 'failed',
      evidenceReference: 'evidence://global/rollback/failed/v1',
    }
    const norte = entity('norte', {
      checks: {
        ...entityChecks('norte'),
        accounting_connection_reviewed: { status: 'failed' },
      },
    })
    const manifest = planMultiEntityStagingReadiness(
      input({ globalChecks: global, entities: [norte, entity('santa-cruz'), entity('sur')] })
    )

    expect(manifest).toMatchObject({
      verdict: 'blocked',
      metrics: { verified: 54, failed: 2, blockingChecks: 2 },
    })
  })

  it('does not treat review references without gate evidence as readiness', () => {
    const manifest = planMultiEntityStagingReadiness(
      input({
        globalChecks: {},
        entities: [
          entity('norte', { checks: {} }),
          entity('santa-cruz', { checks: {} }),
          entity('sur', { checks: {} }),
        ],
      })
    )

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { verified: 0, missing: 56, blockingChecks: 56 },
    })
  })

  it('counts only own evidence properties and ignores inherited fabricated checks', () => {
    const inherited = Object.create(
      globalChecks()
    ) as MultiEntityStagingReadinessInput['globalChecks']
    const manifest = planMultiEntityStagingReadiness(input({ globalChecks: inherited }))

    expect(manifest).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { verified: 36, missing: 20, blockingChecks: 20 },
    })
  })

  it('serializes deterministically without entity, connection or evidence identifiers', () => {
    const source = input()
    const first = serializeMultiEntityStagingReadiness(source)
    const second = serializeMultiEntityStagingReadiness({
      ...source,
      entities: [...source.entities].reverse(),
    })

    expect(first).toBe(second)
    for (const privateValue of [
      'tenant-cep',
      'entity-norte',
      'entity-santa-cruz',
      'entity-sur',
      'accounting-norte',
      'review://',
      'evidence://',
    ]) {
      expect(first).not.toContain(privateValue)
    }
    expect(first).not.toContain('generatedAt')
    expect(first).not.toContain('signature')
  })

  it('freezes the manifest, totals and every gate metric', () => {
    const manifest = planMultiEntityStagingReadiness(input())

    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.metrics)).toBe(true)
    expect(Object.isFrozen(manifest.gates)).toBe(true)
    expect(manifest.gates.every(Object.isFrozen)).toBe(true)
  })

  it.each([
    [{ status: 'verified' }, 'missing verified reference'],
    [{ status: 'verified', evidenceReference: 'review://wrong/scheme' }, 'wrong scheme'],
    [{ status: 'fabricated', evidenceReference: 'evidence://fake/v1' }, 'unknown status'],
    [
      { status: 'verified', evidenceReference: 'evidence://valid/v1', note: 'private note' },
      'extra field',
    ],
  ])('rejects invalid or fabricated evidence: %s', (evidence) => {
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            globalChecks: {
              ...globalChecks(),
              schema_authority_decided: evidence as never,
            },
          })
        ),
      'MULTI_ENTITY_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects unknown gates and extra root or entity dimensions', () => {
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            globalChecks: { ...globalChecks(), invented_gate: verified('invented/v1') } as never,
          })
        ),
      'MULTI_ENTITY_STAGING_GATE_UNKNOWN'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness({ ...input(), operatorEmail: 'private@cep.test' } as never),
      'MULTI_ENTITY_STAGING_INPUT_INVALID'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              { ...entity('norte'), companyName: 'Private company' } as never,
              entity('santa-cruz'),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_ENTITY_INVALID'
    )
  })

  it.each([[0], [2], [4]])('requires exactly three entities, received %i', (count) => {
    const base = input().entities
    const entities = count === 4 ? [...base, entity('norte')] : base.slice(0, count)
    expectCode(
      () => planMultiEntityStagingReadiness(input({ entities })),
      'MULTI_ENTITY_STAGING_INPUT_INVALID'
    )
  })

  it('rejects cross-tenant, duplicate entity and shared accounting connection plans', () => {
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz', { tenantId: 'other-tenant' }),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_TENANT_MISMATCH'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz', { legalEntityId: 'entity-norte' }),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_DUPLICATE_ENTITY'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz', { accountingConnectionId: 'accounting-norte' }),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_SHARED_CONNECTION'
    )
  })

  it('requires one independently reviewed CEP Sur pilot', () => {
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz'),
              entity('sur', { role: 'existing_entity', pilotReviewReference: undefined }),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_PILOT_COUNT_INVALID'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte', {
                role: 'cep_sur_pilot',
                pilotReviewReference: 'review://staging/entity/norte/pilot/v1',
              }),
              entity('santa-cruz'),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_PILOT_COUNT_INVALID'
    )
  })

  it('rejects reused scope and pilot review references', () => {
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz', { reviewReference: 'review://staging/entity/norte/v1' }),
              entity('sur'),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_REVIEW_REUSED'
    )
    expectCode(
      () =>
        planMultiEntityStagingReadiness(
          input({
            entities: [
              entity('norte'),
              entity('santa-cruz'),
              entity('sur', {
                pilotReviewReference: 'review://staging/entity/sur/v1',
              }),
            ],
          })
        ),
      'MULTI_ENTITY_STAGING_ENTITY_INVALID'
    )
  })
})
