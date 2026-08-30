import { describe, expect, it } from 'vitest'
import {
  ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
  assertAccountingImportStagingEvidenceArtifact,
  createAccountingImportStagingEvidenceArtifact,
  serializeAccountingImportStagingEvidenceArtifact,
  type AccountingImportStagingEvidenceInput,
  type AccountingImportStagingObservation,
} from '../src'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`

function observation(
  change: Partial<AccountingImportStagingObservation> = {}
): AccountingImportStagingObservation {
  return {
    schemaVersion: 1,
    mode: 'three_entity_accounting_import_staging',
    verdict: 'completed',
    canReadProvider: true,
    canWriteProvider: false,
    canWriteLocal: true,
    canApply: false,
    metrics: {
      expectedEntities: 3,
      attemptedEntities: 3,
      completedEntities: 3,
      failedEntities: 0,
      pilotCandidates: 1,
    },
    ...change,
  }
}

function input(
  change: Partial<AccountingImportStagingEvidenceInput> = {}
): AccountingImportStagingEvidenceInput {
  return {
    executionEnvironment: 'staging',
    runnerFlag: ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
    runnerFlagValue: true,
    runReviewReference: 'review://finance/accounting-import/staging-run-001',
    campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v1',
    readinessReviewReference: 'review://staging/readiness/v1',
    sourceDigest,
    targetTenantDigest,
    observation: observation(),
    ...change,
  }
}

describe('accounting import staging evidence artifact', () => {
  it('creates deterministic content-addressed evidence from a complete three-entity run', () => {
    const artifact = createAccountingImportStagingEvidenceArtifact(input())

    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_accounting_import_staging_evidence',
      mode: 'content_addressed_observation',
      verdict: 'eligible_for_manual_staging_binding',
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      metrics: {
        expectedEntities: 3,
        attemptedEntities: 3,
        completedEntities: 3,
        failedEntities: 0,
        pilotCandidates: 1,
      },
    })
    expect(artifact.reviewReferenceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.campaignReviewReferenceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.readinessReviewReferenceDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.observationDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.evidenceReference).toBe(
      `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}`
    )
    expect(Object.isFrozen(artifact)).toBe(true)
    expect(Object.isFrozen(artifact.metrics)).toBe(true)
    expect(() => assertAccountingImportStagingEvidenceArtifact(artifact)).not.toThrow()
  })

  it('serializes equivalent input identically without raw review or operational data', () => {
    const first = serializeAccountingImportStagingEvidenceArtifact(input())
    const second = serializeAccountingImportStagingEvidenceArtifact(input())

    expect(first).toBe(second)
    for (const secret of [
      'review://finance/accounting-import/staging-run-001',
      'review://campaign/cep-multi-entity/staging-v1',
      'review://staging/readiness/v1',
      'tenant-cep',
      'entity-sur',
      'company-1',
      'sync-1',
      '100.00',
    ]) {
      expect(first).not.toContain(secret)
    }
    expect(first).not.toContain('generatedAt')
    expect(first).not.toContain('signature')
  })

  it('canonicalizes observation and metric property order before hashing', () => {
    const baseline = createAccountingImportStagingEvidenceArtifact(input())
    const reorderedObservation = {
      metrics: {
        pilotCandidates: 1,
        failedEntities: 0,
        completedEntities: 3,
        attemptedEntities: 3,
        expectedEntities: 3,
      },
      canApply: false,
      canWriteLocal: true,
      canWriteProvider: false,
      canReadProvider: true,
      verdict: 'completed',
      mode: 'three_entity_accounting_import_staging',
      schemaVersion: 1,
    } as AccountingImportStagingObservation
    const reordered = createAccountingImportStagingEvidenceArtifact(
      input({ observation: reorderedObservation })
    )

    expect(reordered).toEqual(baseline)
  })

  it('changes the artifact binding when source, tenant or review changes', () => {
    const baseline = createAccountingImportStagingEvidenceArtifact(input())
    const variants = [
      input({ sourceDigest: `sha256:${'c'.repeat(64)}` }),
      input({ targetTenantDigest: `sha256:${'d'.repeat(64)}` }),
      input({ runReviewReference: 'review://finance/accounting-import/staging-run-002' }),
      input({ campaignReviewReference: 'review://campaign/cep-multi-entity/staging-v2' }),
      input({ readinessReviewReference: 'review://staging/readiness/v2' }),
    ]

    for (const variant of variants) {
      const artifact = createAccountingImportStagingEvidenceArtifact(variant)
      expect(artifact.artifactDigest).not.toBe(baseline.artifactDigest)
      expect(artifact.evidenceReference).not.toBe(baseline.evidenceReference)
    }
  })

  it.each([
    ['non-staging environment', { executionEnvironment: 'production' }],
    ['disabled runner flag', { runnerFlagValue: false }],
    ['unknown runner flag', { runnerFlag: 'AKADEMATE_UNKNOWN' }],
    ['invalid review reference', { runReviewReference: 'ticket-1' }],
    ['invalid campaign review', { campaignReviewReference: 'campaign-1' }],
    ['invalid readiness review', { readinessReviewReference: 'readiness-1' }],
    [
      'reused campaign and readiness review',
      { readinessReviewReference: 'review://campaign/cep-multi-entity/staging-v1' },
    ],
    ['invalid source digest', { sourceDigest: 'main' }],
    ['same source and tenant digest', { targetTenantDigest: sourceDigest }],
  ])('rejects %s', (_label, change) => {
    expect(() => createAccountingImportStagingEvidenceArtifact(input(change as never))).toThrow(
      'ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID'
    )
  })

  it.each([
    ['partial result', { verdict: 'partial_failure' }],
    ['failed result', { verdict: 'failed' }],
    ['provider write capability', { canWriteProvider: true }],
    ['local write hidden', { canWriteLocal: false }],
    ['provider read hidden', { canReadProvider: false }],
    ['apply capability', { canApply: true }],
  ])('rejects a forged or incomplete observation: %s', (_label, change) => {
    expect(() =>
      createAccountingImportStagingEvidenceArtifact(
        input({ observation: observation(change as never) })
      )
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    { completedEntities: 2, failedEntities: 1 },
    { attemptedEntities: 2 },
    { expectedEntities: 4 },
    { pilotCandidates: 0 },
  ])('rejects manipulated metrics: %o', (change) => {
    expect(() =>
      createAccountingImportStagingEvidenceArtifact(
        input({
          observation: observation({
            metrics: { ...observation().metrics, ...change },
          }),
        })
      )
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
  })

  it('rejects extra fields instead of hashing secrets into evidence', () => {
    expect(() =>
      createAccountingImportStagingEvidenceArtifact({
        ...input(),
        credential: 'must-not-leak',
      } as never)
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createAccountingImportStagingEvidenceArtifact(
        input({ observation: { ...observation(), externalCompanyId: 'company-secret' } as never })
      )
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
    expect(() =>
      createAccountingImportStagingEvidenceArtifact(
        input({
          observation: observation({
            metrics: { ...observation().metrics, amount: '100.00' } as never,
          }),
        })
      )
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
  })

  it.each([
    ['artifact digest', { artifactDigest: `sha256:${'c'.repeat(64)}` }],
    ['evidence reference', { evidenceReference: `evidence://sha256/${'d'.repeat(64)}` }],
    ['source digest', { sourceDigest: `sha256:${'e'.repeat(64)}` }],
    ['observation digest', { observationDigest: `sha256:${'f'.repeat(64)}` }],
    ['campaign digest', { campaignReviewReferenceDigest: `sha256:${'1'.repeat(64)}` }],
    ['readiness digest', { readinessReviewReferenceDigest: `sha256:${'2'.repeat(64)}` }],
    ['verdict', { verdict: 'verified' }],
    ['activation capability', { canActivate: true }],
  ])('rejects a forged sealed artifact field: %s', (_label, change) => {
    const artifact = createAccountingImportStagingEvidenceArtifact(input())
    expect(() => assertAccountingImportStagingEvidenceArtifact({ ...artifact, ...change })).toThrow(
      'ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID'
    )
  })

  it('rejects extra artifact and metric properties after sealing', () => {
    const artifact = createAccountingImportStagingEvidenceArtifact(input())
    expect(() =>
      assertAccountingImportStagingEvidenceArtifact({ ...artifact, credential: 'must-not-leak' })
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
    expect(() =>
      assertAccountingImportStagingEvidenceArtifact({
        ...artifact,
        metrics: { ...artifact.metrics, amount: '100.00' },
      })
    ).toThrow('ACCOUNTING_IMPORT_STAGING_EVIDENCE_INVALID')
  })
})
