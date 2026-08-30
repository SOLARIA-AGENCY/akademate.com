import { describe, expect, it } from 'vitest'

import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  assertFinanceReconciliationStagingEvidenceManifest,
  createFinanceReconciliationStagingEvidenceManifest,
  serializeFinanceReconciliationStagingEvidenceManifest,
  type FinanceReconciliationShadowObservation,
  type FinanceReconciliationStagingEvidenceInput,
  type FinanceReconciliationStagingEvidenceSample,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function observation(
  change: Partial<FinanceReconciliationShadowObservation> = {}
): FinanceReconciliationShadowObservation {
  return {
    schemaVersion: 1,
    mode: 'read_only_finance_reconciliation_shadow',
    verdict: 'planned',
    canWrite: false,
    canApply: false,
    metrics: {
      accountingTransactions: 2,
      sourceRecords: 2,
      projectedRecords: 2,
      ignoredRecords: 0,
      blockedRecords: 0,
      projectionIssues: 0,
      reconciliationTransactions: 2,
      proposed: 1,
      unmatched: 1,
      ambiguous: 0,
      conflicted: 0,
    },
    ...change,
  }
}

function sample(
  label: 'norte' | 'santa-cruz' | 'sur',
  change: Partial<FinanceReconciliationStagingEvidenceSample> = {}
): FinanceReconciliationStagingEvidenceSample {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-cep-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    runReviewReference: `review://finance/${label}/shadow-run/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
    observation: observation(),
    ...change,
  }
}

function input(
  change: Partial<FinanceReconciliationStagingEvidenceInput> = {}
): FinanceReconciliationStagingEvidenceInput {
  return {
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
    runnerFlagValue: true,
    campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v1',
    readinessReviewReference: 'review://staging/readiness/v1',
    sourceDigest,
    targetTenantDigest,
    samples: [sample('norte'), sample('santa-cruz'), sample('sur')],
    ...change,
  }
}

function surWithoutPilot(): FinanceReconciliationStagingEvidenceSample {
  const { pilotReviewReference: _removed, ...sur } = sample('sur')
  return { ...sur, role: 'existing_entity' }
}

describe('finance reconciliation staging evidence', () => {
  it('seals three isolated planned observations without granting binding or activation', () => {
    const manifest = createFinanceReconciliationStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_reconciliation_staging_evidence',
      mode: 'three_entity_content_addressed_observations',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      metrics: {
        expectedEntities: 3,
        observedEntities: 3,
        plannedEntities: 3,
        blockedEntities: 0,
        pilotEntities: 1,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(new Set(manifest.entities.map(({ artifactDigest }) => artifactDigest)).size).toBe(3)
    expect(
      manifest.entities.every(({ evidenceReference, artifactDigest }) =>
        evidenceReference.endsWith(artifactDigest.slice('sha256:'.length))
      )
    ).toBe(true)
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.metrics)).toBe(true)
    expect(Object.isFrozen(manifest.entities)).toBe(true)
    expect(manifest.entities.every(Object.isFrozen)).toBe(true)
    expect(() => assertFinanceReconciliationStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('is deterministic regardless of sample order and does not mutate input', () => {
    const source = input()
    const before = JSON.stringify(source)
    const first = serializeFinanceReconciliationStagingEvidenceManifest(source)
    const second = serializeFinanceReconciliationStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    expect(JSON.stringify(source)).toBe(before)
  })

  it('blocks the whole manifest when one entity observation is blocked', () => {
    const blocked = observation({
      verdict: 'blocked',
      metrics: {
        ...observation().metrics,
        projectedRecords: 0,
        blockedRecords: 2,
        projectionIssues: 2,
        reconciliationTransactions: 0,
        proposed: 0,
        unmatched: 0,
      },
    })
    const manifest = createFinanceReconciliationStagingEvidenceManifest(
      input({
        samples: [sample('norte'), sample('santa-cruz'), sample('sur', { observation: blocked })],
      })
    )

    expect(manifest).toMatchObject({
      verdict: 'blocked',
      canBindAutomatically: false,
      canMarkVerified: false,
      metrics: { plannedEntities: 2, blockedEntities: 1 },
    })
    expect(manifest.entities.filter(({ verdict }) => verdict === 'blocked')).toHaveLength(1)
  })

  it.each([
    ['non-staging environment', { executionEnvironment: 'production' }],
    ['disabled flag', { runnerFlagValue: false }],
    ['unknown flag', { runnerFlag: 'AKADEMATE_UNKNOWN' }],
    ['same source and tenant digest', { targetTenantDigest: sourceDigest }],
    ['invalid campaign review', { campaignReviewReference: 'campaign-1' }],
    [
      'reused campaign and readiness review',
      { readinessReviewReference: 'review://campaign/cep-multi-entity/staging-v1' },
    ],
  ])('rejects an invalid campaign envelope: %s', (_label, change) => {
    expect(() =>
      createFinanceReconciliationStagingEvidenceManifest(input(change as never))
    ).toThrow('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'another tenant',
      [sample('norte'), sample('santa-cruz'), sample('sur', { tenantId: 'other-tenant' })],
    ],
    [
      'duplicate entity',
      [
        sample('norte'),
        sample('santa-cruz'),
        sample('sur', { legalEntityId: 'entity-norte-private' }),
      ],
    ],
    [
      'shared connection',
      [
        sample('norte'),
        sample('santa-cruz'),
        sample('sur', { accountingConnectionId: 'connection-norte-private' }),
      ],
    ],
    ['no pilot', [sample('norte'), sample('santa-cruz'), surWithoutPilot()]],
    [
      'two pilots',
      [
        sample('norte', {
          role: 'cep_sur_pilot',
          pilotReviewReference: 'review://finance/norte/pilot/v1',
        }),
        sample('santa-cruz'),
        sample('sur'),
      ],
    ],
    [
      'reused review',
      [
        sample('norte'),
        sample('santa-cruz'),
        sample('sur', { runReviewReference: 'review://finance/norte/entity/v1' }),
      ],
    ],
  ])('rejects invalid entity isolation: %s', (_label, samples) => {
    expect(() => createFinanceReconciliationStagingEvidenceManifest(input({ samples }))).toThrow(
      'FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID'
    )
  })

  it.each([
    ['write capability', { canWrite: true }],
    ['apply capability', { canApply: true }],
    ['unknown mode', { mode: 'live_reconciliation' }],
    ['inconsistent reconciliation totals', { metrics: { ...observation().metrics, proposed: 2 } }],
    [
      'planned observation with projection issues',
      { metrics: { ...observation().metrics, projectionIssues: 1 } },
    ],
  ])('rejects forged observation: %s', (_label, change) => {
    expect(() =>
      createFinanceReconciliationStagingEvidenceManifest(
        input({
          samples: [
            sample('norte'),
            sample('santa-cruz'),
            sample('sur', { observation: observation(change as never) }),
          ],
        })
      )
    ).toThrow('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
  })

  it('rejects extra fields rather than sealing identifiers or credentials', () => {
    expect(() =>
      createFinanceReconciliationStagingEvidenceManifest({
        ...input(),
        credential: 'must-not-leak',
      } as never)
    ).toThrow('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceReconciliationStagingEvidenceManifest(
        input({
          samples: [
            sample('norte'),
            sample('santa-cruz'),
            { ...sample('sur'), amount: '99999.99' } as never,
          ],
        })
      )
    ).toThrow('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
  })

  it('redacts raw scopes, reviews and financial observation metrics from the artifact', () => {
    const serialized = serializeFinanceReconciliationStagingEvidenceManifest(input())

    for (const privateValue of [
      'tenant-cep-private',
      'entity-norte-private',
      'connection-sur-private',
      'review://',
      'accountingTransactions',
      'sourceRecords',
      'proposed',
    ]) {
      expect(serialized).not.toContain(privateValue)
    }
    expect(serialized).not.toContain('generatedAt')
    expect(serialized).not.toContain('signature')
  })

  it.each([
    [
      'manifest digest',
      (manifest: object) => ({ ...manifest, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['activation flag', (manifest: object) => ({ ...manifest, canActivate: true })],
    ['automatic binding flag', (manifest: object) => ({ ...manifest, canBindAutomatically: true })],
    [
      'entity evidence digest',
      (manifest: ReturnType<typeof createFinanceReconciliationStagingEvidenceManifest>) => ({
        ...manifest,
        entities: [
          { ...manifest.entities[0]!, observationDigest: `sha256:${'d'.repeat(64)}` },
          ...manifest.entities.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceReconciliationStagingEvidenceManifest(input())
    expect(() =>
      assertFinanceReconciliationStagingEvidenceManifest(forge(manifest) as never)
    ).toThrow('FINANCE_RECONCILIATION_STAGING_EVIDENCE_INVALID')
  })

  it('exports no execution, binding, verification or mutation function', async () => {
    const module = await import('../src/reconciliation-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /execute|apply|activate|write|bind|markVerified|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
