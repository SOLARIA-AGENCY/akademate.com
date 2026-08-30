import { describe, expect, it } from 'vitest'

import {
  FINANCE_ISOLATION_AUDIT_FLAG,
  assertFinanceIsolationStagingEvidenceManifest,
  createFinanceIsolationStagingEvidenceManifest,
  serializeFinanceIsolationStagingEvidenceManifest,
  type FinanceIsolationAuditObservation,
  type FinanceIsolationEvidenceCaseRole,
  type FinanceIsolationStagingEvidenceInput,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const roles = [
  'three_entity_isolated',
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

function observation(
  role: FinanceIsolationEvidenceCaseRole,
  change: Partial<FinanceIsolationAuditObservation> = {}
): FinanceIsolationAuditObservation {
  const isolated = role === 'three_entity_isolated'
  const negativeIndex = roles.indexOf(role)
  return {
    schemaVersion: 1,
    mode: 'three_entity_finance_isolation_audit',
    verdict: isolated ? 'isolated' : 'breach_detected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedEntities: 3,
      evaluatedEntities: isolated ? 3 : negativeIndex,
      evaluatedSurfaces: isolated ? 15 : negativeIndex * 5,
      isolationBreaches: isolated ? 0 : 1,
    },
    ...change,
  }
}

function input(change: Partial<FinanceIsolationStagingEvidenceInput> = {}) {
  return {
    executionEnvironment: 'staging' as const,
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true as const,
    campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v1',
    readinessReviewReference: 'review://staging/readiness/v1',
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      runReviewReference: `review://finance/isolation/${role}/v1`,
      observation: observation(role),
    })),
    ...change,
  }
}

describe('finance isolation staging evidence', () => {
  it('seals one positive and three fail-closed observations without operational authority', () => {
    const manifest = createFinanceIsolationStagingEvidenceManifest(input())

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_finance_isolation_staging_evidence',
      mode: 'four_case_content_addressed_isolation_matrix',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        requiredCases: 4,
        observedCases: 4,
        isolatedCases: 1,
        rejectedCases: 3,
        expectedEntities: 3,
        requiredPositiveSurfaces: 15,
      },
    })
    expect(manifest.cases).toHaveLength(4)
    expect(manifest.cases.map(({ role }) => role)).toEqual([...roles].sort())
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.metrics)).toBe(true)
    expect(Object.isFrozen(manifest.cases)).toBe(true)
    expect(manifest.cases.every(Object.isFrozen)).toBe(true)
    expect(() => assertFinanceIsolationStagingEvidenceManifest(manifest)).not.toThrow()
  })

  it('is deterministic across input order and emits no raw review or runtime identifiers', () => {
    const source = input()
    const first = serializeFinanceIsolationStagingEvidenceManifest(source)
    const second = serializeFinanceIsolationStagingEvidenceManifest({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    for (const privateValue of ['review://', 'tenantId', 'legalEntityId', 'connectionId']) {
      expect(first).not.toContain(privateValue)
    }
    expect(first).not.toContain('generatedAt')
  })

  it.each([
    ['production environment', { executionEnvironment: 'production' }],
    ['disabled flag', { runnerFlagValue: false }],
    ['unknown flag', { runnerFlag: 'AKADEMATE_UNKNOWN' }],
    ['same source and target', { targetTenantDigest: sourceDigest }],
    ['invalid review', { campaignReviewReference: 'campaign-1' }],
  ])('rejects an invalid envelope: %s', (_label, change) => {
    expect(() => createFinanceIsolationStagingEvidenceManifest(input(change as never))).toThrow(
      'FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects missing, duplicate and reused scenario reviews', () => {
    const source = input()
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({ ...source, samples: source.samples.slice(1) })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({
        ...source,
        samples: [source.samples[0]!, source.samples[0]!, ...source.samples.slice(2)],
      })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({
        ...source,
        samples: [
          { ...source.samples[0]!, runReviewReference: source.readinessReviewReference },
          ...source.samples.slice(1),
        ],
      })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
  })

  it('rejects reuse of one negative observation under multiple scenario labels', () => {
    const source = input()
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({
        ...source,
        samples: source.samples.map((sample) =>
          sample.role === 'payment_relationship_rejected'
            ? { ...sample, observation: observation('cross_scope_rejected') }
            : sample
        ),
      })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    ['write capability', { canWrite: true }],
    ['apply capability', { canApply: true }],
    ['wrong mode', { mode: 'live_isolation' }],
    [
      'short positive run',
      {
        metrics: { ...observation(roles[0]).metrics, evaluatedEntities: 2, evaluatedSurfaces: 10 },
      },
    ],
    [
      'breach in positive run',
      {
        verdict: 'breach_detected',
        metrics: { ...observation(roles[0]).metrics, isolationBreaches: 1 },
      },
    ],
  ])('rejects a forged positive observation: %s', (_label, change) => {
    const source = input()
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({
        ...source,
        samples: [
          { ...source.samples[0]!, observation: observation(roles[0], change as never) },
          ...source.samples.slice(1),
        ],
      })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
  })

  it.each(roles.slice(1))('rejects %s when the negative case does not detect a breach', (role) => {
    const source = input()
    const samples = source.samples.map((sample) =>
      sample.role === role
        ? {
            ...sample,
            observation: observation(role, {
              verdict: 'isolated',
              metrics: {
                expectedEntities: 3,
                evaluatedEntities: 3,
                evaluatedSurfaces: 15,
                isolationBreaches: 0,
              },
            }),
          }
        : sample
    )
    expect(() => createFinanceIsolationStagingEvidenceManifest({ ...source, samples })).toThrow(
      'FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects inconsistent surface counts and extra fields', () => {
    const source = input()
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({
        ...source,
        samples: source.samples.map((sample) =>
          sample.role === 'cross_scope_rejected'
            ? {
                ...sample,
                observation: observation(sample.role, {
                  metrics: { ...observation(sample.role).metrics, evaluatedSurfaces: 10 },
                }),
              }
            : sample
        ),
      })
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createFinanceIsolationStagingEvidenceManifest({ ...source, credential: 'secret' } as never)
    ).toThrow('FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    [
      'manifest digest',
      (value: object) => ({ ...value, artifactDigest: `sha256:${'c'.repeat(64)}` }),
    ],
    ['activation', (value: object) => ({ ...value, canActivate: true })],
    [
      'case digest',
      (value: ReturnType<typeof createFinanceIsolationStagingEvidenceManifest>) => ({
        ...value,
        cases: [
          { ...value.cases[0]!, observationDigest: `sha256:${'d'.repeat(64)}` },
          ...value.cases.slice(1),
        ],
      }),
    ],
  ])('rejects forged sealed evidence: %s', (_label, forge) => {
    const manifest = createFinanceIsolationStagingEvidenceManifest(input())
    expect(() => assertFinanceIsolationStagingEvidenceManifest(forge(manifest) as never)).toThrow(
      'FINANCE_ISOLATION_STAGING_EVIDENCE_INVALID'
    )
  })

  it('exports no execution, binding, activation or permission mutation function', async () => {
    const module = await import('../src/isolation-staging-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /execute|apply|activate|write|bind|markVerified|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
