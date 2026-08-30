import { describe, expect, it } from 'vitest'

import {
  ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
  createAccountingImportStagingEvidenceArtifact,
  type AccountingImportStagingEvidenceArtifact,
} from '../../../../../packages/finance/src'
import {
  ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
  AccountingImportEvidenceBindingError,
  createAccountingImportEvidenceBindingProposal,
} from '../finance-accounting-import-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const runReviewReference = 'review://finance/accounting-import/staging-run-001'

function artifact(): AccountingImportStagingEvidenceArtifact {
  return createAccountingImportStagingEvidenceArtifact({
    executionEnvironment: 'staging',
    runnerFlag: ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
    runnerFlagValue: true,
    runReviewReference,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest: `sha256:${'a'.repeat(64)}`,
    targetTenantDigest: `sha256:${'b'.repeat(64)}`,
    observation: {
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
    },
  })
}

describe('accounting import staging evidence binding proposal', () => {
  it('proposes the exact global gate binding without marking it verified', () => {
    const source = artifact()
    const proposal = createAccountingImportEvidenceBindingProposal({
      artifact: source,
      campaignReviewReference,
      readinessReviewReference,
    })

    expect(proposal).toEqual({
      schemaVersion: 1,
      mode: 'manual_staging_evidence_binding_proposal',
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
        reviewReference: readinessReviewReference,
        evidenceReference: source.evidenceReference,
        campaignReviewReference,
        sourceDigest: source.sourceDigest,
        targetTenantDigest: source.targetTenantDigest,
        artifactKind: 'cep_accounting_import_staging_evidence',
        artifactDigest: source.artifactDigest,
      },
    })
    expect(Object.isFrozen(proposal)).toBe(true)
    expect(Object.isFrozen(proposal.binding)).toBe(true)
    expect(JSON.stringify(proposal)).not.toContain(runReviewReference)
    expect(JSON.stringify(proposal)).not.toContain('observationDigest')
  })

  it.each([
    ['campaign', 'review://campaign/other/staging-v1', readinessReviewReference],
    ['readiness', campaignReviewReference, 'review://staging/readiness/other'],
  ])('rejects an artifact reused for another %s review', (_label, campaign, readiness) => {
    expect(() =>
      createAccountingImportEvidenceBindingProposal({
        artifact: artifact(),
        campaignReviewReference: campaign,
        readinessReviewReference: readiness,
      })
    ).toThrowError(
      expect.objectContaining<Partial<AccountingImportEvidenceBindingError>>({
        code: 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_CAMPAIGN_MISMATCH',
      })
    )
  })

  it.each([
    { artifactDigest: `sha256:${'c'.repeat(64)}` },
    { evidenceReference: `evidence://sha256/${'d'.repeat(64)}` },
    { canActivate: true },
    { metrics: { ...artifact().metrics, failedEntities: 1 } },
  ])('rejects a forged artifact before proposing a binding: %o', (change) => {
    expect(() =>
      createAccountingImportEvidenceBindingProposal({
        artifact: { ...artifact(), ...change } as never,
        campaignReviewReference,
        readinessReviewReference,
      })
    ).toThrowError(
      expect.objectContaining<Partial<AccountingImportEvidenceBindingError>>({
        code: 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_ARTIFACT_INVALID',
      })
    )
  })

  it.each([
    { campaignReviewReference: 'campaign-1' },
    { readinessReviewReference: 'readiness-1' },
    { readinessReviewReference: campaignReviewReference },
  ])('rejects an invalid proposal envelope: %o', (change) => {
    expect(() =>
      createAccountingImportEvidenceBindingProposal({
        artifact: artifact(),
        campaignReviewReference,
        readinessReviewReference,
        ...change,
      })
    ).toThrowError(
      expect.objectContaining<Partial<AccountingImportEvidenceBindingError>>({
        code: 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_BINDING_INPUT_INVALID',
      })
    )
  })

  it('rejects extra proposal input instead of accepting implicit automation metadata', () => {
    expect(() =>
      createAccountingImportEvidenceBindingProposal({
        artifact: artifact(),
        campaignReviewReference,
        readinessReviewReference,
        status: 'verified',
      } as never)
    ).toThrowError(
      expect.objectContaining<Partial<AccountingImportEvidenceBindingError>>({
        code: 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_BINDING_INPUT_INVALID',
      })
    )
  })
})
