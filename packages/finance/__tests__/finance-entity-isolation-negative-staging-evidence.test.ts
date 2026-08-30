import { describe, expect, it } from 'vitest'

import {
  FINANCE_ISOLATION_AUDIT_FLAG,
  assertFinanceEntityIsolationNegativeStagingEvidenceManifest,
  createFinanceEntityIsolationNegativeStagingEvidenceManifest,
  createFinanceIsolationScopeDigest,
  serializeFinanceEntityIsolationNegativeStagingEvidenceManifest,
  type FinanceEntityIsolationEvidenceRole,
  type FinanceEntityIsolationNegativeAuditObservation,
  type FinanceEntityIsolationNegativeStagingEvidenceInput,
  type FinanceEntityIsolationNegativeStagingEvidenceSample,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const roles = [
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

function observation(
  label: string,
  change: Partial<FinanceEntityIsolationNegativeAuditObservation> = {}
): FinanceEntityIsolationNegativeAuditObservation {
  const scopeDigest = createFinanceIsolationScopeDigest({
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    connectionId: `connection-${label}-private`,
  })
  return {
    schemaVersion: 1,
    mode: 'three_case_entity_finance_isolation_negative_audit',
    scopeDigest,
    verdict: 'all_breaches_rejected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedCases: 3,
      evaluatedCases: 3,
      rejectedCases: 3,
      gapCases: 0,
      isolationBreaches: 3,
    },
    cases: [...roles]
      .sort()
      .map((role) => ({ role, verdict: 'breach_detected' as const, isolationBreaches: 1 })),
    ...change,
  }
}

function sample(
  label: 'norte' | 'santa-cruz' | 'sur',
  change: Partial<FinanceEntityIsolationNegativeStagingEvidenceSample> = {}
): FinanceEntityIsolationNegativeStagingEvidenceSample {
  const pilot = label === 'sur'
  const role: FinanceEntityIsolationEvidenceRole = pilot ? 'cep_sur_pilot' : 'existing_entity'
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    role,
    entityReviewReference: `review://finance/isolation/${label}/entity/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/isolation/sur/pilot/v1' } : {}),
    caseReviews: roles.map((caseRole) => ({
      role: caseRole,
      runReviewReference: `review://finance/isolation/${label}/${caseRole}/v1`,
    })),
    observation: observation(label),
    ...change,
  }
}

function input(
  change: Partial<FinanceEntityIsolationNegativeStagingEvidenceInput> = {}
): FinanceEntityIsolationNegativeStagingEvidenceInput {
  return {
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true,
    campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v1',
    readinessReviewReference: 'review://staging/readiness/v1',
    sourceDigest,
    targetTenantDigest,
    samples: [sample('norte'), sample('santa-cruz'), sample('sur')],
    ...change,
  }
}

describe('finance entity isolation negative staging evidence', () => {
  it('seals nine scope-bound negative cases across three entities', () => {
    const manifest = createFinanceEntityIsolationNegativeStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_entity_isolation_negative_staging_evidence',
      mode: 'three_entity_scope_bound_negative_observations',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        expectedEntities: 3,
        observedEntities: 3,
        verifiedNegativeCases: 9,
        pilotEntities: 1,
      },
    })
    expect(manifest.entities).toHaveLength(3)
    expect(new Set(manifest.entities.map(({ scopeDigest }) => scopeDigest)).size).toBe(3)
    expect(manifest.entities.flatMap(({ caseReviews }) => caseReviews)).toHaveLength(9)
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.entities)).toBe(true)
    expect(manifest.entities.every(Object.isFrozen)).toBe(true)
    expect(() =>
      assertFinanceEntityIsolationNegativeStagingEvidenceManifest(manifest)
    ).not.toThrow()
  })

  it('is deterministic and redacts every raw scope and review', () => {
    const source = input()
    const first = serializeFinanceEntityIsolationNegativeStagingEvidenceManifest(source)
    const second = serializeFinanceEntityIsolationNegativeStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    for (const privateValue of [
      'tenant-private',
      'entity-norte-private',
      'connection-sur-private',
      'review://',
    ]) {
      expect(first).not.toContain(privateValue)
    }
    expect(first).not.toContain('generatedAt')
  })

  it.each([
    ['production', { executionEnvironment: 'production' }],
    ['disabled flag', { runnerFlagValue: false }],
    ['unknown flag', { runnerFlag: 'UNKNOWN' }],
    ['same digests', { targetTenantDigest: sourceDigest }],
    ['missing entity', { samples: [sample('norte'), sample('sur')] }],
  ])('rejects invalid envelope: %s', (_label, change) => {
    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(input(change as never))
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'tenant mismatch',
      [sample('norte'), sample('santa-cruz', { tenantId: 'other-private' }), sample('sur')],
    ],
    [
      'duplicate entity',
      [
        sample('norte'),
        sample('santa-cruz', { legalEntityId: 'entity-norte-private' }),
        sample('sur'),
      ],
    ],
    [
      'shared connection',
      [
        sample('norte'),
        sample('santa-cruz', { accountingConnectionId: 'connection-norte-private' }),
        sample('sur'),
      ],
    ],
    [
      'no pilot',
      [
        sample('norte'),
        sample('santa-cruz'),
        sample('sur', {
          role: 'existing_entity',
          pilotReviewReference: undefined,
        } as never),
      ],
    ],
  ])('rejects invalid entity isolation: %s', (_label, samples) => {
    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(input({ samples }))
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
  })

  it('rejects scope substitution, an isolation gap and incomplete case reviews', () => {
    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(
        input({
          samples: [
            sample('norte'),
            sample('santa-cruz', {
              observation: observation('norte'),
            }),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')

    const gap = observation('santa-cruz', {
      verdict: 'gap_detected',
      metrics: {
        expectedCases: 3,
        evaluatedCases: 3,
        rejectedCases: 2,
        gapCases: 1,
        isolationBreaches: 2,
      },
    })
    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(
        input({
          samples: [sample('norte'), sample('santa-cruz', { observation: gap }), sample('sur')],
        })
      )
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')

    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(
        input({
          samples: [
            sample('norte'),
            sample('santa-cruz', { caseReviews: sample('santa-cruz').caseReviews.slice(1) }),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
  })

  it('rejects reuse of the entity review as a negative-case review', () => {
    const norte = sample('norte')
    expect(() =>
      createFinanceEntityIsolationNegativeStagingEvidenceManifest(
        input({
          samples: [
            {
              ...norte,
              caseReviews: [
                { ...norte.caseReviews[0]!, runReviewReference: norte.entityReviewReference },
                ...norte.caseReviews.slice(1),
              ],
            },
            sample('santa-cruz'),
            sample('sur'),
          ],
        })
      )
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'manifest digest',
      (value: object) => ({ ...value, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['activation', (value: object) => ({ ...value, canActivate: true })],
    [
      'entity observation',
      (value: ReturnType<typeof createFinanceEntityIsolationNegativeStagingEvidenceManifest>) => ({
        ...value,
        entities: [
          { ...value.entities[0]!, observationDigest: `sha256:${'d'.repeat(64)}` },
          ...value.entities.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceEntityIsolationNegativeStagingEvidenceManifest(input())
    expect(() =>
      assertFinanceEntityIsolationNegativeStagingEvidenceManifest(forge(manifest) as never)
    ).toThrow('FINANCE_ENTITY_ISOLATION_NEGATIVE_STAGING_EVIDENCE_INVALID')
  })

  it('exports no execution, binding or permission mutation function', async () => {
    const module = await import('../src/entity-isolation-negative-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /execute|apply|activate|deploy|bind|markVerified|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
